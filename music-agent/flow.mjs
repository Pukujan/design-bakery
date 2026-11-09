// Flow Music (www.flowmusic.app) driver. A song is one chat message in a new session: Flow Music's own producer writes the
// lyrics and the sound, then makes two takes (about 50 s, 2026-11-09). Each take's status comes back from
// /__api/audio-create-song-status/<op> and its details (length, lyrics) from /__api/clips; the audio is a public m4a.
import fs from 'node:fs';
import path from 'node:path';

export const HOME = 'https://www.flowmusic.app/';

export async function page(b) {
  const ctx = b.contexts()[0];
  const p = ctx.pages().find(x => x.url().includes('flowmusic.app')) || ctx.pages()[0] || await ctx.newPage();
  if (!p.url().includes('flowmusic.app')) await p.goto(HOME);
  await p.waitForLoadState('domcontentloaded');
  return p;
}

const FRESH_MS = 20_000;
export const CLIP_URL = id => `https://storage.googleapis.com/producer-app-public/clips/${id}.m4a`;

// Signed in: the page shows the account menu, and no "Log in" button.
export async function signedIn(p) {
  await p.waitForTimeout(3000);
  const menu = await p.getByRole('button', { name: 'Settings menu' }).count();
  const login = await p.getByRole('button', { name: 'Log in', exact: true }).filter({ visible: true }).count();
  return menu > 0 && login === 0;
}

async function dismissCookies(p) {
  const no = p.getByRole('button', { name: 'No thanks', exact: true }).filter({ visible: true });
  if (await no.count()) await no.first().click().catch(() => {});
}

// Make a song from `prompt` (and lyrics, when given), save the first take to `<dest>.m4a`.
// Returns {title, seconds, lyrics, type, clips}.
export async function makeSong(p, { prompt, lyrics, instrumental }, dest) {
  const clips = new Map(); // clip id -> {seconds, lyrics}
  const failed = [];
  const old = new Set(); // takes of earlier songs
  let sentAt = 0;
  p.on('response', async r => {
    const u = r.url();
    try {
      // The page also loads songs it made before, already `complete`, and a take reports only once, when it is done
      // (about 50 s). So a take counts when it was not seen before the request and finishes FRESH_MS after it.
      if (u.includes('/__api/audio-create-song-status/')) {
        const j = await r.json();
        if (!j?.operation_id) return;
        if (!sentAt || Date.now() - sentAt < FRESH_MS) { old.add(j.operation_id); return; }
        if (old.has(j.operation_id)) return;
        if (j.status === 'complete' && j.clip_id && !clips.has(j.clip_id)) clips.set(j.clip_id, {});
        if (j.error_message || /fail|error/i.test(j.status || '')) failed.push(j.error_message || j.status);
      } else if (u.endsWith('/__api/clips') && r.request().method() === 'POST') {
        const j = await r.json();
        for (const [id, c] of Object.entries(j?.clips || {})) {
          if (!clips.has(id)) continue;
          clips.set(id, { seconds: Number(c.duration?.value) || null, lyrics: c.lyrics?.value?.text || null });
        }
      }
    } catch { /* a response without a body */ }
  });
  await p.goto(HOME);
  await p.waitForTimeout(4000);
  await dismissCookies(p);
  // A fresh session, so the page has no earlier song of its own to load.
  await p.getByRole('button', { name: 'New session', exact: true }).filter({ visible: true }).first().click({ timeout: 10000 }).catch(() => {});
  await p.waitForTimeout(2500);
  let text = prompt;
  if (instrumental) text += '\nInstrumental only, no vocals.';
  else if (lyrics) text += `\nUse these lyrics as written:\n${lyrics}`;
  const box = p.getByRole('textbox', { name: 'Chat message' }).first();
  await box.waitFor({ timeout: 20000 });
  await box.click();
  await box.fill(text);
  await p.getByRole('button', { name: 'Send message' }).first().click();
  sentAt = Date.now();
  // Wait for the first finished take, then a few seconds more for the second and both takes' details.
  const end = Date.now() + 4 * 60_000;
  while (!clips.size && Date.now() < end) {
    if (failed.length) throw new Error(`Flow Music: ${failed[0]}`);
    await p.waitForTimeout(2000);
  }
  if (!clips.size) throw new Error('no song from Flow Music within 4 minutes');
  for (let i = 0; i < 10 && ![...clips.values()].every(c => c.seconds); i++) await p.waitForTimeout(1000);
  // The session's name (Flow Music names it after the song) is its link in the sidebar.
  const session = (p.url().match(/\/session\/([0-9a-f-]{36})/) || [])[1];
  const title = session ? (await p.locator(`a[href="/session/${session}"]`).first().innerText({ timeout: 3000 }).catch(() => '')).trim() : '';
  const [id, first] = [...clips.entries()][0];
  const res = await fetch(CLIP_URL(id));
  if (!res.ok) throw new Error(`audio download failed (${res.status})`);
  fs.writeFileSync(`${dest}.m4a`, Buffer.from(await res.arrayBuffer()));
  // Until Flow Music names the session it reads like "Today at 7:20 AM".
  const name = title.split('\n')[0];
  return { title: name && !/^(today|yesterday)\b|^\d+\/\d+/i.test(name) ? name : null, seconds: first.seconds, lyrics: first.lyrics, type: 'm4a', clips: [...clips.keys()] };
}

// A look at the page without spending credits: a screenshot, its visible controls and the API calls it makes.
export async function probe(p, dir) {
  fs.mkdirSync(dir, { recursive: true });
  const calls = [];
  p.on('request', r => { if (/flowmusic|googleapis/.test(r.url()) && r.resourceType() !== 'image') calls.push(`${r.method()} ${r.url().slice(0, 200)}`); });
  await p.goto(HOME);
  await p.waitForTimeout(6000);
  const signed = await signedIn(p);
  await p.screenshot({ path: path.join(dir, 'home.png') });
  const controls = await p.evaluate(() => [...document.querySelectorAll('button, a, input, textarea, [role=button], [contenteditable=true], [role=textbox]')]
    .filter(e => { const r = e.getBoundingClientRect(); return r.width && r.height; })
    .map(e => [e.tagName.toLowerCase(), e.getAttribute('aria-label') || '', (e.innerText || e.placeholder || '').trim().slice(0, 60), e.getAttribute('href') || ''].join(' | ')));
  const out = { url: p.url(), signedIn: signed, controls, calls: [...new Set(calls)].slice(0, 80) };
  fs.writeFileSync(path.join(dir, 'probe.json'), JSON.stringify(out, null, 2));
  return out;
}
