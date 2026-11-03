/**
 * search_site on Octo RAG (TASK-DB-0142), offline: fetch is mocked, so this checks the mapping from Octo's
 * matches to pages and every fallback to the keyword count, not Octo itself (scripts/check-copilot-rag.mjs does).
 *
 * Runs against the compiled backend (pnpm --dir backend run build). The page lists come from the repo JSON and
 * research markdown; blogs are whatever the database answers (none offline), so the cases use projects and papers.
 */
import assert from 'node:assert/strict';

const root = new URL('..', import.meta.url);
// AbortSignal.timeout's timer does not hold the process open; this does, so the timeout case can fire.
setInterval(() => {}, 1000);
let search, knowledge;
try {
  search = await import(new URL('./backend/lib/copilot/siteSearch.js', root).href);
  knowledge = await import(new URL('./backend/lib/copilot/knowledge.js', root).href);
} catch {
  throw new Error('copilot search: build the backend first (pnpm --dir backend run build)');
}
const { mapMatches, octoConfig, searchSite, keywordSearch, MAX_HITS } = search;

const env = { OCTO_API_KEY: 'test-key', OCTO_WORKSPACE_ID: 'ws-test', OCTO_API_BASE: 'http://octo.test/api/' };
const [projects, papers] = await Promise.all([knowledge.loadProjects(), knowledge.loadPapers()]);
const project = projects[0];
const paper = papers[0];
const projectRef = `/work/${project.slug}`;
const paperRef = `/research/papers/${paper.id}`;

// 1. Config: both values needed, COPILOT_RAG=off turns it off, a trailing /api is dropped from the base.
assert.equal(octoConfig({}), null);
assert.equal(octoConfig({ OCTO_API_KEY: 'k' }), null);
assert.equal(octoConfig({ ...env, COPILOT_RAG: 'off' }), null);
assert.equal(octoConfig(env).base, 'http://octo.test');

// 2. Mapping: only site: documents of pages that exist, best chunk per page, rank order kept, capped.
const titles = new Map([[projectRef, project.title], [paperRef, paper.title]]);
const mapped = mapMatches(
  [
    { title: `site:${paperRef}`, content: 'Judges   skip\nquestions.' },
    { title: 'db-public-ekagajpatra-english-subtitles.vtt', content: 'not a site page' },
    { title: `site:${projectRef}`, content: 'first project chunk' },
    { title: `site:${paperRef}`, content: 'a weaker chunk of the same paper' },
    { title: 'site:/work/deleted-project', content: 'a page that no longer exists' },
    { title: 'site:/somewhere/else', content: 'not a kind we know' },
    { content: 'no title at all' },
  ],
  titles,
);
assert.deepEqual(mapped, [
  { kind: 'paper', ref: paperRef, title: paper.title, summary: 'Judges skip questions.' },
  { kind: 'project', ref: projectRef, title: project.title, summary: 'first project chunk' },
]);
assert.equal(mapMatches([{ title: `site:${paperRef}`, content: 'x'.repeat(400) }], titles)[0].summary.length, 301);
const many = new Map(projects.map((p) => [`/work/${p.slug}`, p.title]));
assert.equal(mapMatches(projects.map((p) => ({ title: `site:/work/${p.slug}`, content: p.title })), many).length, Math.min(MAX_HITS, projects.length));

// 3. The request: the query endpoint, bearer key, site: filter, latest versions only.
let sent;
const okFetch = async (url, init) => {
  sent = { url, init, body: JSON.parse(init.body) };
  return new Response(JSON.stringify({ matches: [{ title: `site:${paperRef}`, content: 'from octo' }] }), { status: 200 });
};
const rag = await searchSite('judges skipping questions', { env, fetch: okFetch });
assert.equal(rag.source, 'rag');
assert.deepEqual(rag.hits.map((h) => h.ref), [paperRef]);
assert.equal(sent.url, 'http://octo.test/api/rag/query');
assert.equal(sent.init.headers.Authorization, 'Bearer test-key');
assert.equal(sent.body.workspaceId, 'ws-test');
assert.equal(sent.body.query, 'judges skipping questions');
assert.deepEqual(sent.body.filter, { titlePrefix: 'site:', latestVersionOnly: true });
assert.ok(sent.init.signal, 'the request carries a timeout signal');

// 4. Fallbacks: an error status, a network failure, a timeout, no site matches, and no config all answer from keywords.
const query = project.title;
const keyword = await keywordSearch(query);
assert.ok(keyword.some((h) => h.ref === projectRef), 'the keyword search finds a project by its title');
const cases = {
  'HTTP 500': async () => new Response('boom', { status: 500 }),
  'network error': async () => {
    throw new TypeError('fetch failed');
  },
  'no site matches': async () => new Response(JSON.stringify({ matches: [{ title: 'other.vtt', content: 'x' }] }), { status: 200 }),
  'bad JSON': async () => new Response('<html>', { status: 200 }),
  timeout: (url, init) =>
    new Promise((_, reject) => init.signal.addEventListener('abort', () => reject(init.signal.reason))),
};
for (const [name, fetchImpl] of Object.entries(cases)) {
  const started = Date.now();
  const out = await searchSite(query, { env, fetch: fetchImpl, timeoutMs: 50 });
  assert.equal(out.source, 'keyword', `${name} falls back`);
  assert.deepEqual(out.hits, keyword, `${name} gives the keyword hits`);
  assert.ok(Date.now() - started < 2000, `${name} does not hang`);
}
let called = false;
const off = await searchSite(query, { env: {}, fetch: async () => ((called = true), new Response('{}')) });
assert.equal(off.source, 'keyword');
assert.equal(called, false, 'without Octo config no request is made');

// 5. The tool still marks every hit as retrieved, so the citation guard lets them be cited.
const { makeTools } = await import(new URL('./backend/lib/copilot/tools.js', root).href);
const { createCitations } = await import(new URL('./backend/lib/copilot/citations.js', root).href);
const citations = createCitations();
const saved = { ...process.env };
Object.assign(process.env, env);
const realFetch = globalThis.fetch;
globalThis.fetch = okFetch;
try {
  const hits = await makeTools(() => {}, { canNavigate: false, citations }).search_site.execute({ query: 'judges' }, {});
  assert.deepEqual(hits.map((h) => h.ref), [paperRef]);
  assert.equal(citations.check(paperRef).ok, true);
} finally {
  globalThis.fetch = realFetch;
  for (const key of Object.keys(env)) if (saved[key] === undefined) delete process.env[key];
  else process.env[key] = saved[key];
}

console.log('copilot search: RAG mapping, request shape and keyword fallbacks ok');
process.exit(0);
