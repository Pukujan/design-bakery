#!/usr/bin/env node
/**
 * Live check for search_site on Octo RAG (TASK-DB-0142): asks real questions and prints the pages that come back.
 * Needs OCTO_WORKSPACE_ID and OCTO_API_KEY (backend/.env), the compiled backend, and the content indexed
 * (pnpm run sync:copilot-rag). Exits 1 if Octo did not answer or an expected page is missing.
 *
 * Usage: node scripts/check-copilot-rag.mjs ["another question" ...]
 */
import { loadBackendEnv } from './load-backend-env.mjs';

loadBackendEnv();
const { searchSite } = await import(new URL('../backend/lib/copilot/siteSearch.js', import.meta.url).href);

/** Question → a page that should be among the hits (null: just print). */
const QUESTIONS = [
  ['which paper is about judges skipping questions', /^\/research\/papers\//],
  ['what uses a citation graph', /\/work\/precedent|\/research\/papers\//],
  ['the voice call that fills in forms', /^\/work\/website-copilot$/],
  ['how do you deploy on a home server with a Cloudflare tunnel', null],
];
const asked = process.argv.slice(2);
const questions = asked.length ? asked.map((q) => [q, null]) : QUESTIONS;

let failed = 0;
for (const [question, expected] of questions) {
  const started = Date.now();
  const { hits, source } = await searchSite(question);
  const ms = Date.now() - started;
  const ok = source === 'rag' && (!expected || hits.some((h) => expected.test(h.ref)));
  if (!ok) failed += 1;
  console.log(`${ok ? 'ok  ' : 'FAIL'} "${question}" (${source}, ${ms} ms)`);
  for (const hit of hits) console.log(`       ${hit.ref.padEnd(32)} ${hit.title}`);
}
process.exit(failed ? 1 : 0);
