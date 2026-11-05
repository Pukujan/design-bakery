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

async function turn(token, messages, page, toMe = false, flow = null) {
  const t = Date.now();
  const r = await fetch(`${base}/api/copilot/chat`, {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-copilot-pass': token },
    // The page's own client sends only the latest turns (a summary stands for the rest): the API takes at most 24.
    // toMe stays false, as for a line heard on a real call: the addressee check runs on it, and a line it drops is a failure below.
    body: JSON.stringify({ messages: messages.slice(-24), voice: true, ...(toMe ? { toMe: true } : {}), ...(flow ? { flow } : {}), ...(page ? { page } : {}) }),
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
  // A `replace` event retracts what was streamed so far (a leaked reasoning block, a cut closing offer): the reply is what is left.
  const text = got.events.filter((x) => x.type === 'text').reduce((acc, x) => (x.replace ? x.text : acc + x.text), '');
  const actions = got.events.filter((x) => x.type === 'action').map((x) => x.action);
  const kinds = actions.map((a) => a.kind);
  // Every tool the model started this turn, in order: each is a model round trip, so the count is the turn's cost.
  const steps = got.events.filter((x) => x.type === 'step' && x.status === 'start').map((x) => x.name);
  if (got.status !== 200) fails.push(`HTTP ${got.status}`);
  for (const ev of got.events) if (ev.type === 'error') fails.push(`error event: ${ev.message}`);
  if (got.events.some((ev) => ev.type === 'ignored') && !step.expectIgnored) fails.push(`the line was dropped as said to someone else: ${JSON.stringify(got.events.find((ev) => ev.type === 'ignored'))}`);
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
  if (e.maxSteps !== undefined && steps.length > e.maxSteps) fails.push(`${steps.length} tool steps, over ${e.maxSteps}: [${steps}]`);
  for (const t of e.noTools ?? []) if (steps.includes(t)) fails.push(`must not use the ${t} tool, steps [${steps}]`);
  for (const [t, max] of Object.entries(e.maxTool ?? {})) if (steps.filter((x) => x === t).length > max) fails.push(`${t} used more than ${max} time(s): [${steps}]`);
  if (e.textMatch && !new RegExp(e.textMatch, 'i').test(text)) fails.push(`reply should match /${e.textMatch}/`);
  if (e.minChars && text.trim().length < e.minChars) fails.push(`reply too short (${text.trim().length} chars, wanted ${e.minChars}): "${text.trim()}"`);
  if (e.textNotMatch && new RegExp(e.textNotMatch, 'i').test(text)) fails.push(`reply must not match /${e.textNotMatch}/: "${text.slice(0, 120)}"`);
  if (e.spells) for (const w of e.spells) if (!spelled(text, w)) fails.push(`reply should spell "${w}" letter by letter: "${text.slice(0, 140)}"`);
  if (e.asksToConfirm && !endsWithQuestion(text) && !/\b(right|correct|confirm)\b/i.test(text)) fails.push(`reply should ask the caller to confirm: "${text.slice(0, 140)}"`);
  if (e.noQuestionEnd && endsWithQuestion(text)) fails.push(`reply should not end with a question: "${text.slice(-100)}"`);
  if (e.maxMs && got.ms > e.maxMs) fails.push(`took ${got.ms} ms, over ${e.maxMs}`);
  if (e.pageAfter && page.path !== e.pageAfter) fails.push(`page after the turn should be ${e.pageAfter}, is ${page.path}`);
  return { fails, text, actions, steps };
}

let failedRuns = 0;
// One pass serves every run: it lasts two hours, and /pass has its own rate limit.
const token = await pass();
for (let run = 1; run <= runs; run += 1) {
  const messages = [];
  // The booking flow's state, kept by the page between turns: the reply's `flow` event replaces it.
  let flow = null;
  let page = scenario.startPage ?? { path: '/', title: 'Home' };
  const results = [];
  for (const [i, step] of scenario.steps.entries()) {
    if (step.page) page = step.page;
    messages.push({ role: 'user', content: step.say });
    const got = await turn(token, messages, page, step.toMe === true, flow);
    for (const ev of got.events) if (ev.type === 'flow') flow = ev.flow;
    // The page moves when a reply moves it (the call's browser takes the move before the speech): the next turn is told so.
    for (const ev of got.events) {
      if (ev.type !== 'action') continue;
      const a = ev.action;
      if (a.kind === 'navigate' && a.go) page = { path: a.path, title: a.label };
      if (a.kind === 'cite') page = { path: a.path, title: page.title };
    }
    const { fails, text, actions, steps } = check(step, got, page);
    messages.push({ role: 'assistant', content: text || '(no reply)' });
    results.push({ i: i + 1, say: step.say, fails, text, actions, steps, ms: got.ms, page: page.path });
  }
  // The scenario's rubric judges the whole visit, not one turn: how a person who knows nothing about the site would rate it.
  const rubric = scenario.rubric ?? {};
  const visit = [];
  const questionTurns = results.filter((r) => /\?\s*$/.test(r.text.trim())).length;
  if (rubric.maxQuestionTurns !== undefined && questionTurns > rubric.maxQuestionTurns) visit.push(`${questionTurns} replies ended in a question, over ${rubric.maxQuestionTurns}`);
  if (rubric.proofWithin) {
    const at = results.findIndex((r) => r.actions.some((a) => ['navigate', 'cite', 'projects', 'book'].includes(a.kind)));
    if (at < 0 || at + 1 > rubric.proofWithin) visit.push(`nothing shown (a page, cards or a passage) within the first ${rubric.proofWithin} turns${at >= 0 ? ` (first at turn ${at + 1})` : ''}`);
  }
  if (rubric.firstReplyMatches && !new RegExp(rubric.firstReplyMatches, 'i').test(results[0]?.text ?? '')) visit.push(`the first reply should match /${rubric.firstReplyMatches}/: "${(results[0]?.text ?? '').slice(0, 120)}"`);
  if (rubric.maxTurnMs) for (const r of results) if (r.ms > rubric.maxTurnMs) visit.push(`turn ${r.i} took ${r.ms} ms, over ${rubric.maxTurnMs}`);
  if (rubric.noRepeatedReplies) {
    const texts = results.map((r) => r.text.trim().toLowerCase());
    texts.forEach((t, i) => { if (t.length > 25 && texts.indexOf(t) !== i) visit.push(`turn ${i + 1} repeats an earlier reply word for word`); });
  }
  const bad = results.filter((r) => r.fails.length);
  if (visit.length) bad.push({ visit });
  if (bad.length) failedRuns += 1;
  console.log(`\n== ${scenario.name} · run ${run}/${runs}: ${bad.length ? `${results.filter((r) => r.fails.length).length} of ${results.length} turns FAILED${visit.length ? `, ${visit.length} visit check(s) failed` : ''}` : 'all turns ok, visit ok'}`);
  for (const v of visit) console.log(`   VISIT: ${v}`);
  for (const r of results) {
    console.log(`${r.fails.length ? '✗' : '✓'} ${r.i}. "${r.say}"  [${r.ms} ms, page ${r.page}]`);
    if (verbose || r.fails.length) {
      console.log(`     said:    ${r.text.replace(/\s+/g, ' ').slice(0, 170)}`);
      console.log(`     actions: ${r.actions.map((a) => a.kind + (a.path ? `(${a.path})` : '')).join(', ') || '-'}   tools: ${r.steps.join(', ') || '-'}`);
    }
    for (const f of r.fails) console.log(`     FAIL: ${f}`);
  }
}
console.log(`\n${failedRuns ? `FAILED: ${failedRuns} of ${runs} run(s)` : `OK: ${runs} run(s)`}`);
process.exit(failedRuns ? 1 : 0);
