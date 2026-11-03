#!/usr/bin/env node
/**
 * Index the site's content in Octo's RAG for the copilot's search_site (TASK-DB-0142).
 *
 * One document per page section (projects, research papers, published blog posts, the home page's
 * About and roles, and Contact), titled with the section's address `site:<path>#<anchor>`
 * (e.g. `site:/work/precedent#built-with`), so a match maps back to its page and heading. Octo hashes the content, so
 * re-sending an unchanged page creates nothing; a changed page becomes a new version (search
 * reads only the latest). Documents titled `site:` whose page no longer exists are deleted.
 * Documents without the `site:` prefix are never touched.
 *
 * Usage: node scripts/sync-copilot-rag.mjs [--dry-run] [--only home,contact]   (pnpm run sync:copilot-rag)
 * --only limits the run (ingest and deletes) to those kinds of page.
 * Needs OCTO_WORKSPACE_ID and OCTO_API_KEY (backend/.env) and the compiled backend
 * (pnpm --dir backend run build). Runs after every API deploy (deploy/gravebuster/deploy.sh).
 */
import { loadBackendEnv } from './load-backend-env.mjs';

loadBackendEnv();
const dryRun = process.argv.includes('--dry-run');
const onlyAt = process.argv.indexOf('--only');
const only = onlyAt > 0 ? new Set(process.argv[onlyAt + 1].split(',')) : null;

let search;
try {
  search = await import(new URL('../backend/lib/copilot/siteSearch.js', import.meta.url).href);
} catch {
  console.error('sync-copilot-rag: build the backend first (pnpm --dir backend run build)');
  process.exit(2);
}
const { octoConfig, siteDocuments, SITE_PREFIX, parseTitle, kindOf } = search;

const config = octoConfig({ ...process.env, COPILOT_RAG: undefined });
if (!config) {
  console.error('sync-copilot-rag: OCTO_WORKSPACE_ID and OCTO_API_KEY must be set');
  process.exit(2);
}
const headers = { Authorization: `Bearer ${config.key}`, 'Content-Type': 'application/json' };
const ws = encodeURIComponent(config.workspaceId);

async function octo(method, path, body) {
  const res = await fetch(`${config.base}${path}`, { method, headers, ...(body ? { body: JSON.stringify(body) } : {}) });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path.split('?')[0]}: HTTP ${res.status} ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : null;
}

// The few pages most questions land on first, the long tail of blog sections last.
const ORDER = ['home', 'contact', 'project', 'paper', 'blog'];
const docs = (await siteDocuments()).filter((d) => !only || only.has(d.kind)).sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind));
const counts = { project: 0, paper: 0, blog: 0, home: 0, contact: 0 };
for (const doc of docs) counts[doc.kind] += 1;
console.log(`site sections: ${counts.project} project, ${counts.paper} paper, ${counts.blog} blog, ${counts.home} home, ${counts.contact} contact (${docs.length} in all)`);

const existing = (await octo('GET', `/api/rag/documents?workspaceId=${ws}`)) ?? [];
const inScope = (title) => !only || only.has(kindOf(parseTitle(title)?.path ?? ''));
const indexed = existing.filter((d) => d.title?.startsWith(SITE_PREFIX) && inScope(d.title));
const others = existing.filter((d) => !d.title?.startsWith(SITE_PREFIX)).length;
console.log(`indexed in Octo: ${indexed.length} site documents${only ? ` of ${[...only].join(', ')}` : ''} (${others} other documents left alone)`);

let created = 0;
let unchanged = 0;
let failed = 0;

// An ingest cut off after Octo stored the version but before its chunks were written leaves a
// document with no chunks, and re-sending the same text is then a no-op. Delete those first so
// they are indexed again below.
for (const doc of indexed.filter((d) => d.chunkCount === 0)) {
  if (dryRun) {
    console.log(`  would re-index ${doc.title} (no chunks)`);
    continue;
  }
  try {
    await octo('DELETE', `/api/rag/documents/${encodeURIComponent(doc.documentId)}?workspaceId=${ws}`);
    console.log(`  reset    ${doc.title} (had no chunks)`);
  } catch (err) {
    failed += 1;
    console.error(`  FAILED   reset ${doc.title}: ${err.message}`);
  }
}
// A few at a time: each new version is chunked and embedded on Octo's side.
const queue = [...docs];
async function worker() {
  for (let doc = queue.shift(); doc; doc = queue.shift()) {
    if (dryRun) {
      console.log(`  would ingest ${doc.title} (${doc.text.length} chars)`);
      continue;
    }
    try {
      const out = await octo('POST', '/api/rag/documents', { workspaceId: config.workspaceId, title: doc.title, text: doc.text, mimeType: 'text/markdown' });
      if (out?.created) {
        created += 1;
        console.log(`  indexed  ${doc.title} (${out.chunks} chunks)`);
      } else unchanged += 1;
    } catch (err) {
      failed += 1;
      console.error(`  FAILED   ${doc.title}: ${err.message}`);
    }
  }
}
await Promise.all([worker(), worker(), worker(), worker()]);

// Remove pages that no longer exist. A kind that came back empty is skipped: that is far more
// likely a source being unreachable (loadBlogs answers [] when the database is away) than every
// post being deleted, and wiping the index for it would be the wrong call.
const wanted = new Set(docs.map((d) => d.title));
let deleted = 0;
for (const doc of indexed) {
  if (wanted.has(doc.title) || doc.chunkCount === 0) continue;
  const address = parseTitle(doc.title);
  const kind = address && kindOf(address.path);
  if (kind && counts[kind] === 0) {
    console.warn(`  kept     ${doc.title}: no ${kind}s were loaded this run`);
    continue;
  }
  if (dryRun) {
    console.log(`  would delete ${doc.title}`);
    continue;
  }
  try {
    await octo('DELETE', `/api/rag/documents/${encodeURIComponent(doc.documentId)}?workspaceId=${ws}`);
    deleted += 1;
    console.log(`  deleted  ${doc.title}`);
  } catch (err) {
    failed += 1;
    console.error(`  FAILED   delete ${doc.title}: ${err.message}`);
  }
}

console.log(`done: ${created} new or changed, ${unchanged} unchanged, ${deleted} deleted, ${failed} failed${dryRun ? ' (dry run)' : ''}`);
process.exitCode = failed ? 1 : 0;
