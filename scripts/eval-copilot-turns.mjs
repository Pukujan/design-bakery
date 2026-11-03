#!/usr/bin/env node
/**
 * Replays the trace conversations against a running copilot API and prints each turn: reply, actions (with any cite's
 * section and whether its quote is on the page), model, tokens and time (TASK-DB-0142). For before/after comparisons:
 * start the API with COPILOT_EVAL=1 (tokens on the `done` event), no Turnstile secret, and the local address in
 * COPILOT_RATE_EXEMPT_IPS. Needs the compiled backend for the quote check.
 *
 * Usage: node scripts/eval-copilot-turns.mjs <api base, e.g. http://localhost:8787> [--voice] [--json out.json]
 */
import { writeFile } from 'node:fs/promises';

const [base = 'http://localhost:8787', ...flags] = process.argv.slice(2);
const voice = flags.includes('--voice');
const jsonOut = flags.includes('--json') ? flags[flags.indexOf('--json') + 1] : null;
const { sectionsForPath } = await import(new URL('../backend/lib/copilot/knowledge.js', import.meta.url).href);
const { checkQuote } = await import(new URL('../backend/lib/copilot/sections.js', import.meta.url).href);

/** The questions from the traces, as the conversations they came in. `page` is where the visitor was, `title` its title. */
export const CONVERSATIONS = [
  { page: '/', turns: ['What stack is Precedent built with?', 'what was the first project we talked about?', 'what else does he have?'] },
  { page: '/work/precedent', title: 'Precedent', turns: ['What did Arise have to do with this project?'] },
  { page: '/', turns: ["what's the President project?"] },
  { page: '/', turns: ['How do I reach you?'] },
  { page: '/', turns: ['What experience do you have?'] },
  { page: '/', turns: ['hello', 'how are you'] },
  { page: '/', turns: ['President'] },
  // Lists and counts (site_catalog), not search.
  { page: '/', turns: ['How many research papers do you have?', 'Which projects are shipped?', "What's your latest blog post?"] },
];

const pass = await fetch(`${base}/api/copilot/pass`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"token":"local"}' }).then((r) => r.json());
if (!pass.pass) throw new Error(`no pass: ${JSON.stringify(pass)}`);

async function turn(messages, page, title = 'Home') {
  const started = Date.now();
  const res = await fetch(`${base}/api/copilot/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-copilot-pass': pass.pass },
    body: JSON.stringify({ messages, page: { path: page, title }, voice }),
  });
  if (!res.ok) return { error: `HTTP ${res.status}`, ms: Date.now() - started };
  let text = '';
  let first = 0;
  const actions = [];
  const tools = [];
  let done = null;
  for (const line of (await res.text()).split('\n').filter(Boolean)) {
    const event = JSON.parse(line);
    if (event.type === 'text') {
      first ||= Date.now() - started;
      text = event.replace ? event.text : text + event.text;
    } else if (event.type === 'action') actions.push(event.action);
    else if (event.type === 'step' && event.status === 'start') tools.push(event.name);
    else if (event.type === 'done') done = event;
    else if (event.type === 'error') text ||= `[error] ${event.message}`;
  }
  for (const action of actions.filter((a) => a.kind === 'cite')) {
    const section = (await sectionsForPath(action.path))?.find((s) => s.id === action.anchor);
    action.headingOk = Boolean(section && section.heading === action.heading);
    action.quoteOk = action.quote ? Boolean(section && checkQuote(section, action.quote) === action.quote) : null;
  }
  return { text, actions, tools, model: done?.model, eval: done?.eval, ms: Date.now() - started, firstTextMs: first };
}

const results = [];
for (const conversation of CONVERSATIONS) {
  const messages = [];
  for (const question of conversation.turns) {
    messages.push({ role: 'user', content: question });
    const out = await turn(messages, conversation.page, conversation.title);
    results.push({ question, page: conversation.page, ...out });
    if (out.text) messages.push({ role: 'assistant', content: out.text });
    const cites = out.actions?.filter((a) => a.kind === 'cite').map((a) => `${a.path}#${a.anchor} heading:${a.headingOk ? 'ok' : 'NO'} quote:${a.quoteOk === null ? 'none' : a.quoteOk ? 'ok' : 'NO'}${a.quote ? ` "${a.quote.slice(0, 60)}"` : ''}`);
    const other = out.actions?.filter((a) => a.kind !== 'cite').map((a) => (a.kind === 'navigate' ? `navigate:${a.path}` : a.kind === 'projects' ? `projects:${a.slugs.join(',')}` : a.kind));
    if (out.tools?.length) other.push(`tools:${out.tools.join(',')}`);
    console.log(`\n> ${question}${voice ? ' (voice)' : ''}`);
    console.log(`  ${out.text ?? out.error}`);
    console.log(`  model=${out.model} ms=${out.ms} in=${out.eval?.inputTokens ?? '-'} out=${out.eval?.outputTokens ?? '-'} ctx=${out.eval?.contextTokens ?? '-'}${out.eval?.retrieval ? ` retrieval=${out.eval.retrieval} ${out.eval.retrievalMs}ms` : ''}`);
    if (out.eval?.retrieved?.length) console.log(`  retrieved: ${out.eval.retrieved.slice(0, 4).join('  ')}`);
    if (cites?.length) console.log(`  cite: ${cites.join(' | ')}`);
    if (other?.length) console.log(`  actions: ${other.join(' ')}`);
  }
}
if (jsonOut) await writeFile(jsonOut, JSON.stringify(results, null, 2));
process.exit(0);
