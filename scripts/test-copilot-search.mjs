/**
 * Retrieval and the server's cite (TASK-DB-0142), offline: fetch is mocked, so this checks the mapping from Octo's
 * matches to sections, the turn's queries, every fallback, and that a cite built from a retrieved chunk names a
 * heading and a quote the page really shows. scripts/check-copilot-rag.mjs runs the same against the live index.
 *
 * Runs against the compiled backend (pnpm --dir backend run build). The page lists come from the repo JSON and
 * research markdown; blogs are whatever the database answers (none offline), so the cases use projects and papers.
 */
import assert from 'node:assert/strict';

const root = new URL('..', import.meta.url);
// AbortSignal.timeout's timer does not hold the process open; this does, so the timeout case can fire.
setInterval(() => {}, 1000);
let search, knowledge, cite, citationsMod, sections;
try {
  search = await import(new URL('./backend/lib/copilot/siteSearch.js', root).href);
  knowledge = await import(new URL('./backend/lib/copilot/knowledge.js', root).href);
  cite = await import(new URL('./backend/lib/copilot/cite.js', root).href);
  citationsMod = await import(new URL('./backend/lib/copilot/citations.js', root).href);
  sections = await import(new URL('./backend/lib/copilot/sections.js', root).href);
} catch {
  throw new Error('copilot search: build the backend first (pnpm --dir backend run build)');
}
const { mapMatches, octoConfig, parseTitle, retrieve, searchSite, keywordSearch, turnQueries, passagesBlock, siteDocuments, RERANK_FLOOR } = search;
const { groundCite, sourceOf, quoteFor } = cite;

const env = { OCTO_API_KEY: 'test-key', OCTO_WORKSPACE_ID: 'ws-test', OCTO_API_BASE: 'http://octo.test/api/' };
const [projects, papers] = await Promise.all([knowledge.loadProjects(), knowledge.loadPapers()]);
const project = projects.find((p) => p.slug === 'precedent') ?? projects[0];
const paper = papers[0];
const projectRef = `/work/${project.slug}`;
const paperRef = `/research/papers/${paper.id}`;

// 1. Config and addresses.
assert.equal(octoConfig({}), null);
assert.equal(octoConfig({ ...env, COPILOT_RAG: 'off' }), null);
assert.equal(octoConfig(env).base, 'http://octo.test');
assert.deepEqual(parseTitle('site:/work/precedent#built-with'), { ref: '/work/precedent#built-with', path: '/work/precedent', anchor: 'built-with' });
assert.deepEqual(parseTitle('site:/#story-about'), { ref: '/#story-about', path: '/', anchor: 'story-about' });
assert.deepEqual(parseTitle('site:/contact'), { ref: '/contact', path: '/contact', anchor: undefined });
assert.equal(parseTitle('db-public-ekagajpatra-english-subtitles.vtt'), null);
assert.equal(parseTitle('site:/elsewhere#x'), null);

// 2. Mapping: site: sections of pages that exist, above the floor, best chunk per section, heading from the context line.
const titles = new Map([[projectRef, project.title], [paperRef, paper.title]]);
const mapped = mapMatches(
  [
    { title: `site:${projectRef}#built-with`, content: `${project.title}: Built with\n\nTypeScript, Postgres`, rerankScore: 2.1 },
    { title: 'db-public-ekagajpatra-english-subtitles.vtt', content: 'not a site page', rerankScore: 5 },
    { title: `site:${projectRef}#built-with`, content: 'a weaker chunk of the same section', rerankScore: 1 },
    { title: `site:${paperRef}#results`, content: 'a later chunk, no context line', rerankScore: -1 },
    { title: `site:${paperRef}#method`, content: 'below the floor', rerankScore: RERANK_FLOOR - 1 },
    { title: 'site:/work/deleted-project#what-it-is', content: 'a page that no longer exists', rerankScore: 3 },
  ],
  titles,
  true,
);
assert.deepEqual(mapped.map((p) => [p.ref, p.heading, p.text, p.kind]), [
  [`${projectRef}#built-with`, 'Built with', 'TypeScript, Postgres', 'project'],
  [`${paperRef}#results`, undefined, 'a later chunk, no context line', 'paper'],
]);
// Without the reranker, vector similarity is the score.
assert.equal(mapMatches([{ title: `site:${paperRef}#a`, content: 'x', similarity: 0.3 }], titles, false).length, 0);
assert.equal(mapMatches([{ title: `site:${paperRef}#a`, content: 'x', similarity: 0.7 }], titles, false).length, 1);
assert.match(passagesBlock(mapped), /^\[1\] .+ › Built with \(\/work\/[^#]+#built-with\)\nTypeScript, Postgres\n\n\[2\] /);

// 3. The turn's queries: the message, and the message with the conversation before it.
assert.deepEqual(turnQueries([{ role: 'user', content: 'hello' }]), ['hello']);
const follow = turnQueries([
  { role: 'user', content: "what's the Precedent project?" },
  { role: 'assistant', content: 'Precedent drafts legal research memos from a citation graph.' },
  { role: 'user', content: 'how is it built?' },
]);
assert.equal(follow.length, 2);
assert.equal(follow[0], 'how is it built?');
assert.match(follow[1], /^how is it built\? \(context: what's the Precedent project\? Precedent drafts/);

// 4. The request, and the reranker's fallback: a reranked query that fails is asked again without it.
const sent = [];
const answer = (matches, reranked) => new Response(JSON.stringify({ matches, ...(reranked === undefined ? {} : { reranked }) }), { status: 200 });
const okFetch = async (url, init) => {
  sent.push({ url, init, body: JSON.parse(init.body) });
  return answer([{ title: `site:${paperRef}#results`, content: `${paper.title}: Results\n\nJudges skip questions.`, rerankScore: 1.5 }], true);
};
const passages = await retrieve(['judges skipping questions', 'second query'], { env, fetch: okFetch });
assert.equal(sent.length, 2, 'both queries run');
assert.equal(sent[0].url, 'http://octo.test/api/rag/query');
assert.equal(sent[0].init.headers.Authorization, 'Bearer test-key');
assert.deepEqual(sent[0].body.filter, { titlePrefix: 'site:', latestVersionOnly: true });
assert.equal(sent[0].body.rerank, true);
assert.equal(passages.length, 1, 'the same section from two queries is one passage');
sent.length = 0;
const flaky = async (url, init) => {
  const body = JSON.parse(init.body);
  sent.push(body.rerank);
  if (body.rerank) throw new TypeError('reranker cold');
  return answer([{ title: `site:${paperRef}#results`, content: 'x', similarity: 0.8 }]);
};
assert.equal((await retrieve(['q'], { env, fetch: flaky })).length, 1);
assert.deepEqual(sent, [true, false], 'retried without the reranker');
await assert.rejects(retrieve(['q'], { env: {}, fetch: okFetch }), /not configured/);
await assert.rejects(retrieve(['q'], { env, fetch: async () => new Response('boom', { status: 500 }) }), /no query answered/);

// 5. search_site: pages, one per page; every failure falls back to the keyword count.
const pageFetch = async () =>
  answer([
    { title: `site:${paperRef}#results`, content: 'from octo', rerankScore: 2 },
    { title: `site:${paperRef}#method`, content: 'same page again', rerankScore: 1 },
    { title: '/#story-about', content: 'not a site: title', rerankScore: 1 },
  ], true);
const rag = await searchSite('judges', { env, fetch: pageFetch });
assert.equal(rag.source, 'rag');
assert.deepEqual(rag.hits.map((h) => h.ref), [paperRef]);
const query = project.title;
const keyword = await keywordSearch(query);
assert.ok(keyword.some((h) => h.ref === projectRef));
const failures = {
  'HTTP 500': async () => new Response('boom', { status: 500 }),
  'network error': async () => {
    throw new TypeError('fetch failed');
  },
  'no site matches': async () => answer([{ title: 'other.vtt', content: 'x', rerankScore: 3 }], true),
  'bad JSON': async () => new Response('<html>', { status: 200 }),
  timeout: (url, init) => new Promise((_, reject) => init.signal.addEventListener('abort', () => reject(init.signal.reason))),
};
for (const [name, fetchImpl] of Object.entries(failures)) {
  const started = Date.now();
  const out = await searchSite(query, { env, fetch: fetchImpl, timeoutMs: 50 });
  assert.equal(out.source, 'keyword', `${name} falls back`);
  assert.deepEqual(out.hits, keyword, `${name} gives the keyword hits`);
  assert.ok(Date.now() - started < 4000, `${name} does not hang`);
}

// 6. The server's cite: the section the reply drew on, with a quote the page shows under that heading.
const projectSections = sections.sectionsOfProject(project);
const what = projectSections.find((s) => s.id === 'what-it-is');
const chunk = `${project.tagline}\n\n${what.blocks.join('\n\n')}`;
const passageWhat = { ref: `${projectRef}#what-it-is`, path: projectRef, anchor: 'what-it-is', heading: 'What it is', kind: 'project', pageTitle: project.title, text: chunk, score: 2 };
const passageBuilt = { ref: `${projectRef}#built-with`, path: projectRef, anchor: 'built-with', heading: 'Built with', kind: 'project', pageTitle: project.title, text: project.tech.join(', '), score: 3 };
const reply = what.blocks[0].split(/(?<=\.)\s/).slice(0, 2).join(' ');
assert.equal(sourceOf(reply, [passageBuilt, passageWhat]), passageWhat, 'the passage the reply used, not the better-ranked one');
assert.equal(sourceOf('Hi! Doing well, thanks for asking.', [passageWhat, passageBuilt]), null, 'small talk points at nothing');
const quote = quoteFor(reply, chunk, what);
assert.ok(quote && sections.checkQuote(what, quote) === quote, 'the quote is on the page under that heading');
assert.ok(!quoteFor(reply, project.tagline, what), 'a sentence not under this heading is never quoted');

const load = async (path) => (path === projectRef ? projectSections : null);
const citations = citationsMod.createCitations();
const action = await groundCite(reply, [passageBuilt, passageWhat], citations, load);
assert.deepEqual({ ...action, quote: undefined }, { kind: 'cite', path: projectRef, anchor: 'what-it-is', heading: 'What it is', quote: undefined, mode: 'perch' });
assert.equal(action.quote, quote);
assert.equal(citations.check(projectRef).ok, true, 'the citation guard accepts it');
assert.equal(await groundCite(reply, [passageWhat], citations, load), null, 'one move per answer: not when something was already cited');
assert.equal(await groundCite(reply, [{ ...passageWhat, anchor: 'gone' }], citationsMod.createCitations(), load), null, 'a section no longer on the page is not cited');

// 7. Every indexed section of a few real pages resolves to a live section with the same heading, and the quote a
//    reply could get from it is shown under that heading (sections.ts is the render source the page and test-copilot-cite share).
const docs = await siteDocuments();
const sample = docs.filter((d) => [projectRef, `/work/${projects[1].slug}`, paperRef, `/research/papers/${papers.at(-1).id}`, '/'].includes(d.path));
assert.ok(sample.length >= 10, `sample sections: ${sample.length}`);
let quoted = 0;
for (const doc of sample) {
  const live = await knowledge.sectionsForPath(doc.path);
  const section = live?.find((s) => s.id === doc.anchor);
  assert.ok(section, `${doc.title}: anchor is a live section`);
  assert.equal(section.heading, doc.heading, `${doc.title}: heading`);
  const firstLine = doc.text.split('\n')[0];
  assert.equal(firstLine, `${doc.pageTitle}: ${doc.heading}`, `${doc.title}: context line`);
  // A reply that repeats the section's own words gets a quote from it, and that quote is on the page.
  const text = doc.text.slice(firstLine.length);
  const q = quoteFor(text, text, section);
  if (q) {
    assert.equal(sections.checkQuote(section, q), q, `${doc.title}: quote on the page`);
    quoted += 1;
  }
}
assert.ok(quoted >= sample.length * 0.6, `most sections give a quote (${quoted}/${sample.length})`);

console.log(`copilot search: mapping, queries, fallbacks and server cite ok; ${sample.length} real sections, ${quoted} quoted`);
process.exit(0);
