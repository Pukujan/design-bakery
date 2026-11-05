/**
 * A call simulator: plays a scripted conversation through the copilot's real backend in voice mode (the same /api/copilot/chat
 * the voice agent calls, with the real model chain, tools and site data) and checks each turn against what the owner expects.
 * It keeps what a call keeps: the running messages, and the page the visitor is on, which moves when the reply moves it.
 *
 *   node scripts/sim/call-sim.mjs scripts/sim/scenarios/booking.json [--base http://localhost:8787] [--runs 3] [--verbose]
 *
 * The base is a local backend (the `api-voice` launch config: no Turnstile, traces off) by default. Models vary run to run, so a
 * scenario's checks are about structure (which actions, in which order, how many, what the reply claims), and --runs repeats it.
 * Exit code 1 when any check fails in any run, so it can gate a change.
 */
import { readFile } from 'node:fs/promises';

const args = process.argv.slice(2);
const flag = (name, fallback) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : fallback; };
const file = args.find((a) => a.endsWith('.json'));
if (!file) { console.error('usage: node scripts/sim/call-sim.mjs <scenario.json> [--base URL] [--runs N] [--verbose]'); process.exit(2); }
const base = flag('--base', 'http://localhost:8787').replace(/\/$/, '');
const runs = Number(flag('--runs', 1));
const verbose = args.includes('--verbose');
const scenario = JSON.parse(await readFile(file, 'utf8'));

async function pass() {
  const r = await fetch(`${base}/api/copilot/pass`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"token":""}' });
  const j = await r.json();
  if (!j.pass) throw new Error(`no pass from ${base}: ${JSON.stringify(j)}`);
  return j.pass;
}

async function turn(token, messages, page) {
  const t = Date.now();
  const r = await fetch(`${base}/api/copilot/chat`, {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-copilot-pass': token },
    // The page's own client sends only the latest turns (a summary stands for the rest): the API takes at most 24.
    body: JSON.stringify({ messages: messages.slice(-24), voice: true, toMe: true, ...(page ? { page } : {}) }),
  });
  const body = await r.text();
  const events = body.split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return { type: 'garbled', raw: l }; } });
  return { events, ms: Date.now() - t, status: r.status };
}

const endsWithQuestion = (text) => /\?\s*$/.test(text.trim());
const spelled = (text, word) => new RegExp(word.split('').join('[\\s.,-]*'), 'i').test(text);

/** Checks one turn's result against its `expect`; returns the list of failures. */
function check(step, got, page) {
  const e = step.expect ?? {};
  const fails = [];
  const text = got.events.filter((x) => x.type === 'text').map((x) => x.text).join('');
  const actions = got.events.filter((x) => x.type === 'action').map((x) => x.action);
  const kinds = actions.map((a) => a.kind);
  if (got.status !== 200) fails.push(`HTTP ${got.status}`);
  for (const ev of got.events) if (ev.type === 'error') fails.push(`error event: ${ev.message}`);
  if (e.actions) {
    let i = 0;
    for (const k of kinds) if (k === e.actions[i]) i += 1;
    if (i < e.actions.length) fails.push(`expected actions in order [${e.actions}], got [${kinds}]`);
  }
  for (const k of e.noActions ?? []) if (kinds.includes(k)) fails.push(`must not emit a ${k} action, got [${kinds}]`);
  for (const [k, max] of Object.entries(e.maxActions ?? {})) if (kinds.filter((x) => x === k).length > max) fails.push(`more than ${max} ${k} action(s): [${kinds}]`);
  if (e.navigatesTo && !actions.some((a) => a.kind === 'navigate' && a.path === e.navigatesTo && a.go)) fails.push(`expected a moving navigate to ${e.navigatesTo}, got ${JSON.stringify(actions.filter((a) => a.kind === 'navigate').map((a) => [a.path, a.go]))}`);
  if (e.book) {
    const b = actions.find((a) => a.kind === 'book');
    if (!b) fails.push('expected a book action');
    else {
      for (const [k, v] of Object.entries(e.book)) if (String(b[k] ?? '').toLowerCase() !== String(v).toLowerCase()) fails.push(`book.${k} should be ${v}, got ${b[k]}`);
    }
  }
  if (e.textMatch && !new RegExp(e.textMatch, 'i').test(text)) fails.push(`reply should match /${e.textMatch}/`);
  if (e.textNotMatch && new RegExp(e.textNotMatch, 'i').test(text)) fails.push(`reply must not match /${e.textNotMatch}/: "${text.slice(0, 120)}"`);
  if (e.spells) for (const w of e.spells) if (!spelled(text, w)) fails.push(`reply should spell "${w}" letter by letter: "${text.slice(0, 140)}"`);
  if (e.asksToConfirm && !endsWithQuestion(text) && !/\b(right|correct|confirm)\b/i.test(text)) fails.push(`reply should ask the caller to confirm: "${text.slice(0, 140)}"`);
  if (e.noQuestionEnd && endsWithQuestion(text)) fails.push(`reply should not end with a question: "${text.slice(-100)}"`);
  if (e.maxMs && got.ms > e.maxMs) fails.push(`took ${got.ms} ms, over ${e.maxMs}`);
  if (e.pageAfter && page.path !== e.pageAfter) fails.push(`page after the turn should be ${e.pageAfter}, is ${page.path}`);
  return { fails, text, actions };
}

let failedRuns = 0;
for (let run = 1; run <= runs; run += 1) {
  const token = await pass();
  const messages = [];
  let page = scenario.startPage ?? { path: '/', title: 'Home' };
  const results = [];
  for (const [i, step] of scenario.steps.entries()) {
    if (step.page) page = step.page;
    messages.push({ role: 'user', content: step.say });
    const got = await turn(token, messages, page);
    // The page moves when a reply moves it (the call's browser takes the move before the speech): the next turn is told so.
    for (const ev of got.events) {
      if (ev.type !== 'action') continue;
      const a = ev.action;
      if (a.kind === 'navigate' && a.go) page = { path: a.path, title: a.label };
      if (a.kind === 'cite') page = { path: a.path, title: page.title };
    }
    const { fails, text, actions } = check(step, got, page);
    messages.push({ role: 'assistant', content: text || '(no reply)' });
    results.push({ i: i + 1, say: step.say, fails, text, actions, ms: got.ms, page: page.path });
  }
  const bad = results.filter((r) => r.fails.length);
  if (bad.length) failedRuns += 1;
  console.log(`\n== ${scenario.name} · run ${run}/${runs}: ${bad.length ? `${bad.length} of ${results.length} turns FAILED` : 'all turns ok'}`);
  for (const r of results) {
    console.log(`${r.fails.length ? '✗' : '✓'} ${r.i}. "${r.say}"  [${r.ms} ms, page ${r.page}]`);
    if (verbose || r.fails.length) {
      console.log(`     said:    ${r.text.replace(/\s+/g, ' ').slice(0, 170)}`);
      console.log(`     actions: ${r.actions.map((a) => a.kind + (a.path ? `(${a.path})` : '')).join(', ') || '-'}`);
    }
    for (const f of r.fails) console.log(`     FAIL: ${f}`);
  }
}
console.log(`\n${failedRuns ? `FAILED: ${failedRuns} of ${runs} run(s)` : `OK: ${runs} run(s)`}`);
process.exit(failedRuns ? 1 : 0);
