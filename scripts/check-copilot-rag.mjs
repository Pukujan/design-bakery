#!/usr/bin/env node
/**
 * Live check for the copilot's retrieval on Octo RAG (TASK-DB-0142): asks real questions, with and without the reranker
 * (text and voice), and prints the sections that come back. Needs OCTO_WORKSPACE_ID and OCTO_API_KEY (backend/.env),
 * the compiled backend, and the content indexed (pnpm run sync:copilot-rag). Exits 1 if Octo did not answer or an
 * expected section is not the top passage of the reranked run.
 *
 * Usage: node scripts/check-copilot-rag.mjs ["another question" ...]
 */
import { loadBackendEnv } from './load-backend-env.mjs';

loadBackendEnv();
const { retrieve } = await import(new URL('../backend/lib/copilot/siteSearch.js', import.meta.url).href);

/** Question → the start of the section address that should come first (null: just print). Compared with startsWith, no regex. */
const QUESTIONS = [
  ['What stack is Precedent built with?', '/work/precedent#built-with'],
  // Misheard: no section matches the word; names.ts adds "Precedent" to the turn's second query (route.ts).
  ["what's the President project?", null],
  ['What did Arize have to do with Precedent?', '/work/precedent#'],
  ['How do I reach you?', '/contact'],
  ['What experience do you have?', '/#'],
  ['which paper is about judges skipping questions', '/research/papers/'],
  ['the voice call that fills in forms', '/work/website-copilot#'],
  ['hello', null],
];
const asked = process.argv.slice(2);
const questions = asked.length ? asked.map((q) => [q, null]) : QUESTIONS;
/** Chat and voice are both reranked (voice with its shorter timeout); the vector-only run is the fallback both retry with. */
const MODES = [
  ['chat', { rerank: true, timeoutMs: 10_000 }],
  ['voice', { rerank: true, voice: true }],
  ['no rerank', { rerank: false, timeoutMs: 10_000 }],
];

let failed = 0;
for (const [question, expected] of questions) {
  for (const [mode, options] of MODES) {
    const started = Date.now();
    let passages = [];
    let error = '';
    try {
      passages = await retrieve([question], options);
    } catch (err) {
      error = err.message;
    }
    const ms = Date.now() - started;
    const ok = !error && (!expected || !options.rerank || (passages[0]?.ref ?? '').startsWith(expected));
    if (!ok) failed += 1;
    console.log(`${ok ? 'ok  ' : 'FAIL'} "${question}" (${mode}, ${ms} ms)${error ? ` ${error}` : ''}`);
    for (const p of passages.slice(0, 3)) console.log(`       ${p.score.toFixed(2).padStart(7)}  ${p.ref}`);
  }
}
process.exit(failed ? 1 : 0);
