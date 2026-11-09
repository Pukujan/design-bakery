// The song maker's HTTP side (TASK-DB-0160). The API (backend/src/copilot/songs.ts) is its only caller, over the compose
// network; nothing here is published beyond the VPS's loopback. One job at a time: Chrome starts cold for it and closes after.
//
//   GET  /health            always up, no browser
//   GET  /status            busy?, queue length, last sign-in check
//   POST /songs             {prompt, lyrics?, instrumental?} -> {id}; queued
//   GET  /songs/:id         {state: queued|making|done|failed, error?, title?, seconds?}
//   GET  /songs/:id/audio   the song's audio file
//   POST /signin            Chrome + the remote screen (noVNC :6080) for SIGNIN_MIN minutes, for the owner to sign in
//   POST /signin/done       close the sign-in window now
//   POST /probe             open Flow Music, save a screenshot and the page's controls to DATA_DIR/probe (no credits)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import * as browser from './browser.mjs';
import * as flow from './flow.mjs';

const PORT = Number(process.env.PORT || 8790);
const DATA = process.env.DATA_DIR || '/data';
const SONGS = path.join(DATA, 'songs');
const SIGNIN_MIN = Number(process.env.SIGNIN_MIN || 20);
const JOB_MS = Number(process.env.SONG_JOB_MS || 6 * 60_000);
fs.mkdirSync(SONGS, { recursive: true });

const jobs = new Map(); // id -> {id, state, req, error, title, seconds, file, at}
const queue = [];
let busy = null; // what Chrome is open for: 'song' | 'signin' | 'probe'
let signinTimer = null;
let signinBrowser = null;
let lastCheck = null; // {signedIn, at}

const log = (...a) => console.log(new Date().toISOString(), ...a);

function json(res, code, body) {
  res.writeHead(code, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
}

async function body(req) {
  let s = '';
  for await (const c of req) { s += c; if (s.length > 20000) throw new Error('too big'); }
  return s ? JSON.parse(s) : {};
}

// A job with Chrome open for it, closed whatever happens. A job that runs past `ms` is cut.
async function withChrome(kind, opts, fn, ms = JOB_MS) {
  busy = kind;
  let b;
  try {
    b = await browser.start(opts);
    const page = await flow.page(b);
    return await Promise.race([fn(page), new Promise((_, no) => setTimeout(() => no(new Error(`${kind} took over ${ms / 1000}s`)), ms))]);
  } finally {
    await browser.stop(b);
    busy = null;
    setImmediate(next);
  }
}

async function next() {
  if (busy || !queue.length) return;
  const job = queue.shift();
  job.state = 'making';
  log('song', job.id, 'start');
  try {
    await withChrome('song', {}, async page => {
      lastCheck = { signedIn: await flow.signedIn(page), at: new Date().toISOString() };
      if (!lastCheck.signedIn) throw new Error('not signed in to Flow Music');
      const out = await flow.makeSong(page, job.req, path.join(SONGS, job.id));
      Object.assign(job, out, { state: 'done' });
    });
    log('song', job.id, 'done', job.seconds);
  } catch (e) {
    job.state = 'failed';
    job.error = String(e.message || e).slice(0, 300);
    log('song', job.id, 'failed', job.error);
  }
}

async function signin() {
  if (busy === 'signin') return;
  if (busy) throw new Error(`busy (${busy})`);
  busy = 'signin';
  try {
    signinBrowser = await browser.start({ screen: true });
  } catch (e) {
    busy = null;
    throw e;
  }
  signinTimer = setTimeout(signinDone, SIGNIN_MIN * 60_000);
  log('signin window open for', SIGNIN_MIN, 'min');
}

async function signinDone() {
  if (busy !== 'signin') return;
  clearTimeout(signinTimer);
  try {
    const page = await flow.page(signinBrowser);
    lastCheck = { signedIn: await flow.signedIn(page), at: new Date().toISOString() };
  } catch { /* the window may already be gone */ }
  await browser.stop(signinBrowser);
  signinBrowser = null;
  busy = null;
  log('signin window closed', lastCheck);
  setImmediate(next);
}

// Songs older than a day are dropped from memory; their files stay (the API keeps the ones it saved in Octo).
setInterval(() => {
  const old = Date.now() - 24 * 3600_000;
  for (const [id, j] of jobs) if (j.at < old) jobs.delete(id);
}, 3600_000).unref();

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const m = url.pathname.match(/^\/songs\/([0-9a-f]{16})(\/audio)?$/);
  try {
    if (req.method === 'GET' && url.pathname === '/health') return json(res, 200, { ok: true });
    if (req.method === 'GET' && url.pathname === '/status') {
      return json(res, 200, { busy, queued: queue.length, chrome: browser.running(), lastCheck });
    }
    if (req.method === 'POST' && url.pathname === '/songs') {
      const b = await body(req);
      const prompt = String(b.prompt || '').trim().slice(0, 600);
      if (!prompt) return json(res, 400, { error: 'prompt needed' });
      if (queue.length >= 3) return json(res, 429, { error: 'busy' });
      const id = crypto.randomBytes(8).toString('hex');
      const job = {
        id, state: 'queued', at: Date.now(),
        req: { prompt, lyrics: String(b.lyrics || '').slice(0, 3000), instrumental: !!b.instrumental },
      };
      jobs.set(id, job);
      queue.push(job);
      setImmediate(next);
      return json(res, 202, { id, state: job.state, ahead: queue.length - 1 + (busy ? 1 : 0) });
    }
    if (req.method === 'GET' && m && !m[2]) {
      const j = jobs.get(m[1]);
      if (!j) return json(res, 404, { error: 'no such song' });
      return json(res, 200, { id: j.id, state: j.state, error: j.error, title: j.title, seconds: j.seconds, lyrics: j.lyrics, type: j.type });
    }
    if (req.method === 'GET' && m && m[2]) {
      const file = fs.readdirSync(SONGS).find(f => f.startsWith(m[1] + '.'));
      if (!file) return json(res, 404, { error: 'no audio' });
      const full = path.join(SONGS, file);
      res.writeHead(200, { 'content-type': file.endsWith('.mp3') ? 'audio/mpeg' : 'audio/mp4', 'content-length': fs.statSync(full).size });
      return fs.createReadStream(full).pipe(res);
    }
    if (req.method === 'POST' && url.pathname === '/signin') { await signin(); return json(res, 200, { open: true, minutes: SIGNIN_MIN }); }
    if (req.method === 'POST' && url.pathname === '/signin/done') { await signinDone(); return json(res, 200, { open: false, lastCheck }); }
    if (req.method === 'POST' && url.pathname === '/probe') {
      if (busy) return json(res, 409, { error: `busy (${busy})` });
      const out = await withChrome('probe', {}, page => flow.probe(page, path.join(DATA, 'probe')), 90_000);
      return json(res, 200, out);
    }
    json(res, 404, { error: 'not found' });
  } catch (e) {
    json(res, 500, { error: String(e.message || e) });
  }
}).listen(PORT, () => log('song maker on', PORT));
