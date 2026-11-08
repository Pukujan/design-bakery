#!/usr/bin/env node
/**
 * Index the site's content in Octo's RAG for the copilot (TASK-DB-0142).
 *
 * One Octo document per page section (projects, research papers, published blog posts, the home page's About and
 * roles, and Contact), titled with the section's address `site:<path>#<anchor>` (e.g. `site:/work/precedent#built-with`)
 * so a title-prefix filter can scope a search (`site:`, `site:/research/`). Each section also has a row in the
 * workspace table `site_sections` (supabase/migrations/013_site_sections.sql): path, anchor, heading, kind, item
 * title, content hash and Octo document id. The sync diffs the site against those rows:
 *   - a section whose hash and document are unchanged costs no Octo call;
 *   - a new or changed one is ingested (Octo keeps the document id and makes a new version) and its row upserted;
 *   - a section no longer on the site has its document and row deleted;
 *   - a `site:` document with no section (an older layout) is deleted.
 * A kind that loaded nothing this run is left alone (loadBlogs answers [] when the database is away). Documents
 * without the `site:` prefix are never touched.
 *
 * Usage: node scripts/sync-copilot-rag.mjs [--dry-run] [--only home,contact]   (pnpm run sync:copilot-rag)
 * --only limits the run (ingest and deletes) to those kinds of page: project, paper, blog, home, contact.
 * Needs OCTO_WORKSPACE_ID and OCTO_API_KEY (backend/.env), the table, and the compiled backend
 * (pnpm --dir backend run build). Not run by the deploy yet: run it after content changes (docs/self-hosting.md §5).
 */
import { createHash } from 'node:crypto';
import { loadBackendEnv } from './load-backend-env.mjs';

loadBackendEnv();
const dryRun = process.argv.includes('--dry-run');
const onlyAt = process.argv.indexOf('--only');
const only = onlyAt > 0 ? new Set(process.argv[onlyAt + 1].split(',')) : null;

let search;
let db;
try {
  search = await import(new URL('../backend/lib/copilot/siteSearch.js', import.meta.url).href);
  db = await import(new URL('../backend/services/lib/db.js', import.meta.url).href);
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
const removeDocument = (id) => octo('DELETE', `/api/rag/documents/${encodeURIComponent(id)}?workspaceId=${ws}`);

// The few pages most questions land on first, the long tail of blog sections last.
const ORDER = ['home', 'contact', 'project', 'paper', 'blog'];
const docs = (await siteDocuments()).filter((d) => !only || only.has(d.kind)).sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind));
const counts = { project: 0, paper: 0, blog: 0, home: 0, contact: 0 };
for (const doc of docs) counts[doc.kind] += 1;
console.log(`site sections: ${counts.project} project, ${counts.paper} paper, ${counts.blog} blog, ${counts.home} home, ${counts.contact} contact (${docs.length} in all)`);

const inScope = (path) => !only || only.has(kindOf(path) ?? '');
const keyOf = (path, anchor) => `${path}#${anchor ?? ''}`;

let rows;
try {
  rows = (await db.dbQueryAll('select path, anchor, heading, kind, item_title, content_hash, octo_document_id from public.site_sections')).filter((r) => inScope(r.path));
} catch (err) {
  console.error(`sync-copilot-rag: cannot read site_sections (apply supabase/migrations/013_site_sections.sql): ${err.message}`);
  process.exit(2);
}
const rowByKey = new Map(rows.map((r) => [keyOf(r.path, r.anchor), r]));

const existing = (await octo('GET', `/api/rag/documents?workspaceId=${ws}`)) ?? [];
const indexed = existing.filter((d) => d.title?.startsWith(SITE_PREFIX) && inScope(parseTitle(d.title)?.path ?? ''));
const byId = new Map(indexed.map((d) => [d.documentId, d]));
const byTitle = new Map(indexed.map((d) => [d.title, d]));
const others = existing.filter((d) => !d.title?.startsWith(SITE_PREFIX)).length;
console.log(`indexed: ${rows.length} rows, ${indexed.length} site documents${only ? ` of ${[...only].join(', ')}` : ''} (${others} other documents left alone)`);

let created = 0;
let unchanged = 0;
let deleted = 0;
let failed = 0;

const upsertRow = (doc, hash, documentId) =>
  db.dbExec(
    `insert into public.site_sections (path, anchor, heading, kind, item_title, content_hash, octo_document_id, updated_at)
     values ($1, $2, $3, $4, $5, $6, $7, now())
     on conflict (path, anchor) do update set heading = excluded.heading, kind = excluded.kind, item_title = excluded.item_title,
       content_hash = excluded.content_hash, octo_document_id = excluded.octo_document_id, updated_at = now()`,
    [doc.path, doc.anchor ?? '', doc.heading ?? '', doc.sectionKind, doc.itemTitle, hash, documentId],
  );

// A few at a time: each new version is chunked and embedded on Octo's side.
const queue = [...docs];
async function worker() {
  for (let doc = queue.shift(); doc; doc = queue.shift()) {
    const hash = createHash('sha256').update(doc.text).digest('hex');
    const row = rowByKey.get(keyOf(doc.path, doc.anchor));
    const current = (row?.octo_document_id && byId.get(row.octo_document_id)) || byTitle.get(doc.title);
    const same = row && row.content_hash === hash && current && current.documentId === row.octo_document_id && current.chunkCount > 0;
    if (same && row.heading === (doc.heading ?? '') && row.kind === doc.sectionKind && row.item_title === doc.itemTitle) {
      unchanged += 1;
      continue;
    }
    if (dryRun) {
      console.log(`  would ${same ? 'update the row of' : 'ingest'} ${doc.title} (${doc.text.length} chars)`);
      continue;
    }
    try {
      let documentId = current?.documentId;
      if (!same) {
        // An ingest cut off after Octo stored the version but before its chunks were written leaves a document with
        // no chunks, and re-sending the same text is then a no-op: delete it so it is indexed again.
        if (current && current.chunkCount === 0) await removeDocument(current.documentId);
        const out = await octo('POST', '/api/rag/documents', { workspaceId: config.workspaceId, title: doc.title, text: doc.text, mimeType: 'text/markdown' });
        documentId = out.documentId;
        if (out.created) {
          created += 1;
          console.log(`  indexed  ${doc.title} (${out.chunks ?? '?'} chunks)`);
        } else unchanged += 1;
      } else unchanged += 1;
      await upsertRow(doc, hash, documentId);
    } catch (err) {
      failed += 1;
      console.error(`  FAILED   ${doc.title}: ${err.message}`);
    }
  }
}
await Promise.all([worker(), worker(), worker(), worker()]);

// Remove what is no longer on the site: rows (with their documents), then `site:` documents with no section.
const wanted = new Set(docs.map((d) => keyOf(d.path, d.anchor)));
const wantedTitles = new Set(docs.map((d) => d.title));
const skipped = (path) => {
  const kind = kindOf(path);
  return kind && counts[kind] === 0;
};
for (const row of rows) {
  if (wanted.has(keyOf(row.path, row.anchor))) continue;
  if (skipped(row.path)) {
    console.warn(`  kept     ${keyOf(row.path, row.anchor)}: no ${kindOf(row.path)}s were loaded this run`);
    continue;
  }
  if (dryRun) {
    console.log(`  would delete ${keyOf(row.path, row.anchor)}`);
    continue;
  }
  try {
    if (row.octo_document_id && byId.has(row.octo_document_id)) await removeDocument(row.octo_document_id);
    await db.dbExec('delete from public.site_sections where path = $1 and anchor = $2', [row.path, row.anchor]);
    byId.delete(row.octo_document_id);
    deleted += 1;
    console.log(`  deleted  ${keyOf(row.path, row.anchor)}`);
  } catch (err) {
    failed += 1;
    console.error(`  FAILED   delete ${keyOf(row.path, row.anchor)}: ${err.message}`);
  }
}
for (const doc of byId.values()) {
  if (wantedTitles.has(doc.title)) continue;
  const address = parseTitle(doc.title);
  if (address && skipped(address.path)) continue;
  if (dryRun) {
    console.log(`  would delete ${doc.title}`);
    continue;
  }
  try {
    await removeDocument(doc.documentId);
    deleted += 1;
    console.log(`  deleted  ${doc.title}`);
  } catch (err) {
    failed += 1;
    console.error(`  FAILED   delete ${doc.title}: ${err.message}`);
  }
}

console.log(`done: ${created} new or changed, ${unchanged} unchanged, ${deleted} deleted, ${failed} failed${dryRun ? ' (dry run)' : ''}`);
process.exitCode = failed ? 1 : 0;
