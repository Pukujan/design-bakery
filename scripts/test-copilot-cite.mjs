/**
 * "Cite a section" (TASK-DB-0129): heading anchors and the cite_section tool.
 *
 * Anchors are made from heading text so nothing needs hand tagging; the server and the page must agree on them, so the
 * two copies of headingAnchors.ts are compared, and the tool must only ever cite a heading that is really on the page.
 *
 * Runs against the compiled backend (pnpm --dir backend run build).
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('..', import.meta.url);

let anchors, sections, tools;
try {
  anchors = await import(new URL('./backend/lib/copilot/headingAnchors.js', root).href);
  sections = await import(new URL('./backend/lib/copilot/sections.js', root).href);
  tools = await import(new URL('./backend/lib/copilot/tools.js', root).href);
} catch {
  throw new Error('copilot cite: build the backend first (pnpm --dir backend run build)');
}
const { slugifyHeading, headingAnchors, anchorAllocator } = anchors;
const { sectionsOfMarkdown, sectionsOfProject, findSection, checkQuote } = sections;

// 1. The server's copy and the page's copy are the same file.
const server = await readFile(new URL('./backend/src/copilot/headingAnchors.ts', root), 'utf8');
const page = await readFile(new URL('./frontend/src/app/lib/headingAnchors.ts', root), 'utf8');
assert.equal(page, server, 'frontend/src/app/lib/headingAnchors.ts must be a byte-for-byte copy of the backend one');

// 2. Slugs: punctuation, case, markdown, unicode, numbering, empties.
assert.equal(slugifyHeading('Why it works'), 'why-it-works');
assert.equal(slugifyHeading("What's next? (And why!)"), 'whats-next-and-why');
assert.equal(slugifyHeading('**Bold** and `code` and [a link](https://x.y)'), 'bold-and-code-and-a-link');
assert.equal(slugifyHeading('Café déjà vu'), 'café-déjà-vu');
assert.equal(slugifyHeading('数据 与 模型'), '数据-与-模型');
assert.equal(slugifyHeading('  Spaced   out -- text  '), 'spaced-out-text');
assert.equal(slugifyHeading('???'), 'section');
assert.equal(slugifyHeading('4. What we found', { stripNumber: true }), 'what-we-found');
assert.equal(slugifyHeading('4. What we found'), '4-what-we-found');

// 3. Duplicates get -2, -3 in reading order; an edit elsewhere does not move the others.
const next = anchorAllocator();
assert.deepEqual(['Results', 'Notes', 'Results', 'Results'].map(next), ['results', 'notes', 'results-2', 'results-3']);
const doc = `# Title\n\nIntro\n\n## Results\n\ntext\n\n## Notes\n\n\`\`\`\n## not a heading\n\`\`\`\n\n## Results\n\nsecond\n\n#### deep\n`;
assert.deepEqual(headingAnchors(doc).map((h) => h.id), ['title', 'results', 'notes', 'results-2']);
const edited = doc.replace('text', 'completely different text').replace('Intro', 'A new intro paragraph');
assert.deepEqual(headingAnchors(edited).map((h) => h.id), headingAnchors(doc).map((h) => h.id), 'body edits must not change anchors');
// A heading added later only shifts the ones that repeat after it.
assert.deepEqual(headingAnchors(`## A\n\n## B\n\n## A\n`).map((h) => h.id), ['a', 'b', 'a-2']);
assert.deepEqual(headingAnchors(`## Z\n\n## A\n\n## B\n\n## A\n`).map((h) => h.id), ['z', 'a', 'b', 'a-2']);

// 4. Sections: text under each heading, citing only what exists.
const post = `# Building agents\n\nIntro paragraph about agents.\n\n## What went wrong\n\nThe agent **looped** forever on a [bad tool](https://x.y) result.\n\n- It retried the same call\n- It never gave up\n\n## What went wrong\n\nSecond time it was the prompt.\n\n### Fixes\n\nCap the retries at three.\n`;
const found = sectionsOfMarkdown(post, { levels: [1, 2, 3] });
assert.deepEqual(found.map((s) => s.id), ['building-agents', 'what-went-wrong', 'what-went-wrong-2', 'fixes']);
assert.equal(findSection(found, 'What went wrong').id, 'what-went-wrong');
assert.equal(findSection(found, 'what-went-wrong-2').id, 'what-went-wrong-2');
assert.equal(findSection(found, 'building').id, 'building-agents', 'a unique partial match is allowed');
assert.equal(findSection(found, 'Pricing'), null, 'a heading that is not there is never invented');
assert.equal(findSection(found, 'what'), null, 'an ambiguous partial match is not guessed');
assert.equal(findSection(found, ''), null);
const wrong = found[1];
assert.equal(checkQuote(wrong, 'looped forever on a bad tool result'), 'looped forever on a bad tool result', 'quotes match the words a reader sees');
assert.equal(checkQuote(wrong, 'It retried the same call'), 'It retried the same call');
assert.equal(checkQuote(wrong, 'it NEVER gave up'), 'It never gave up', 'case is ignored; the page text is returned');
assert.equal(checkQuote(wrong, 'Second time it was the prompt.'), undefined, 'a quote from another section is dropped');
assert.equal(checkQuote(wrong, 'invented sentence that is nowhere'), undefined);
assert.equal(checkQuote(wrong, 'short'), undefined, 'too short to be a quote');
assert.equal(checkQuote(wrong, 'x'.repeat(200)), undefined, 'too long to be a quote');
// Papers and posts render through the same Article, so numbered headings keep their numbers in the anchor.
const paper = sectionsOfMarkdown('# T\n\n## 1. Intro\n\nHello world again.\n\n### 2.1 Method\n\nWe ran it.\n', { levels: [1, 2, 3] });
assert.deepEqual(paper.map((s) => s.id), ['t', '1-intro', '21-method']);
assert.equal(findSection(paper, 'Intro').id, '1-intro', 'the number may be left off when asking');
const project = sectionsOfProject({ id: 1, slug: 'x', title: 'X', tagline: '', description: 'A thing that does stuff.', tech: ['A', 'B'], stats: [{ label: 'Fast' }], links: [{ label: 'Repo', url: 'https://g.co' }, { label: 'None', url: '#' }] });
assert.deepEqual(project.map((s) => s.id), ['what-it-is', 'highlights', 'built-with', 'go-deeper']);
assert.deepEqual(sectionsOfProject({ id: 1, slug: 'x', title: 'X', tagline: '', description: 'd', tech: [] }).map((s) => s.id), ['what-it-is', 'built-with']);

// 5. The tool, against the real site content that needs no database (papers and projects).
const emitted = [];
const { cite_section } = tools.makeTools((action) => emitted.push(action), { canNavigate: false });
const run = (input) => cite_section.execute(input, { toolCallId: 't', messages: [] });
const projects = JSON.parse(await readFile(new URL('./frontend/src/app/portfolios/endtoend-engineer/engineering/projects.json', root), 'utf8'));
const slug = projects[0].slug;
const ok = await run({ path: `/work/${slug}`, heading: 'what it is', quote: projects[0].description.slice(0, 30) });
assert.equal(ok.ok, true);
assert.equal(emitted.at(-1).kind, 'cite');
assert.equal(emitted.at(-1).anchor, 'what-it-is');
assert.equal(emitted.at(-1).quote, projects[0].description.slice(0, 30).trim());
const before = emitted.length;
assert.equal((await run({ path: `/work/${slug}`, heading: 'Pricing' })).ok, false, 'unknown heading');
assert.equal((await run({ path: '/work/not-a-project', heading: 'What it is' })).ok, false, 'unknown page');
assert.equal((await run({ path: '/contact', heading: 'What it is' })).ok, false, 'page without sections');
assert.equal((await run({ path: 'https://evil.example/', heading: 'What it is' })).ok, false, 'foreign url');
const noQuote = await run({ path: `/work/${slug}`, heading: 'Built with', quote: 'made up words that are not on the page' });
assert.equal(noQuote.ok, true);
assert.equal(noQuote.quoteShown, false, 'an invented quote still scrolls but is not highlighted');
assert.equal('quote' in emitted.at(-1), false);
assert.equal(emitted.length, before + 1, 'refusals emit nothing');

// 6. The citation record (TASK-DB-0153): cite_section reads the page itself, so a paper not read by another tool this turn
//    (read in the same step, or a turn earlier, as on the 2026-11-08 call) is pointed at too; headings are still checked.
const { createCitations } = await import(new URL('./backend/lib/copilot/citations.js', root).href);
const guarded = createCitations();
const emittedG = [];
const g = tools.makeTools((action) => emittedG.push(action), { canNavigate: false, citations: guarded });
const runG = (input) => g.cite_section.execute(input, { toolCallId: 't', messages: [] });
const papers = (await import(new URL('./backend/lib/copilot/knowledge.js', root).href)).loadPapers;
const paperId = (await papers())[0].id;
const unread = await runG({ path: `/research/papers/${paperId}`, heading: 'Abstract' });
assert.equal(unread.ok, true, 'a paper no other tool read this turn is still pointed at: the tool reads its sections');
assert.equal(emittedG.at(-1).kind, 'cite');
assert.equal(guarded.wasRetrieved(`/research/papers/${paperId}`), true);
assert.equal((await runG({ path: `/research/papers/${paperId}`, heading: 'Abstract' })).ok, false, 'never the same section twice');
assert.equal((await runG({ path: `/work/${slug}`, heading: 'What it is' })).ok, true, 'projects too');
assert.equal((await runG({ path: `/research/papers/${paperId}`, heading: 'Pricing' })).ok, false, 'an invented heading is still refused');
const trace = guarded.summary();
assert.equal(trace.length, 3);
assert.match(trace[0], new RegExp(`^/research/papers/${paperId}#`));
assert.match(trace[2], /!no such section/);

// 6b. outline_passages points the page at its passages itself (the model left them unpointed in four of five walks).
const walked = createCitations();
const emittedW = [];
const w = tools.makeTools((action) => emittedW.push(action), { canNavigate: false, citations: walked });
const outline = await w.outline_passages.execute({ path: `/research/papers/${paperId}`, depth: 'full' }, { toolCallId: 't', messages: [] });
assert.equal(outline.ok, true, 'no read needed first');
assert.ok(outline.passages.length > 0);
assert.deepEqual(emittedW.map((a) => a.anchor), outline.passages.map((p) => p.anchor), 'one cite per passage, in order');
assert.ok(emittedW.every((a) => a.kind === 'cite' && a.mode === 'perch'), 'the whole-paper walk perches');

// 6c. read_paper with a section reads that part whole: a long paper's References sit past the 8000-character read.
const allPapers = await papers();
const sectionsOf = (await import(new URL('./backend/lib/copilot/knowledge.js', root).href)).sectionsForPath;
let withRefs = null;
for (const p of allPapers) {
  const found = await sectionsOf(`/research/papers/${p.id}`);
  const refs = found?.find((s) => s.heading.toLowerCase() === 'references');
  if (refs && refs.blocks.join('').length > 0) { withRefs = { id: p.id, refs }; break; }
}
if (withRefs) {
  const part = await g.read_paper.execute({ id: withRefs.id, section: 'References' }, { toolCallId: 't', messages: [] });
  assert.equal(part.heading, 'References');
  assert.ok(part.text.length > 0 && part.text.startsWith(withRefs.refs.blocks[0].slice(0, 40)), 'the section text, from its start');
  assert.equal(emittedG.at(-1).anchor, withRefs.refs.id, 'and the page is pointed at the part being read out');
  assert.equal((await g.read_paper.execute({ id: withRefs.id, section: 'Pricing' }, { toolCallId: 't', messages: [] })).error, 'no such section');
}

// 7. The passage builder: a whole-post summary is at most four headings, in order, no repeats, each quotable.
const { buildPassages, MAX_PASSAGES, SUMMARY_PASSAGES } = sections;
assert.equal(SUMMARY_PASSAGES, 3);
assert.equal(MAX_PASSAGES, 4);
const longPost = ['# Big post', '', 'Intro words here that are long enough to quote. More.', '', '## Table of Contents', '', '- a'];
for (let i = 1; i <= 9; i += 1) longPost.push('', `## Part ${i < 3 ? 'same' : i}`, '', `This is the opening sentence of part ${i}, long enough to quote. And a second one.`);
longPost.push('', '## References', '', 'A list of sources that we skip entirely.');
const longSections = sectionsOfMarkdown(longPost.join('\n'), { levels: [1, 2, 3] });
assert.equal(buildPassages(longSections).length, 3, 'a normal summary is three passages');
assert.equal(buildPassages(longSections, 99).length, 4, 'the whole-post walk is capped at four');
const passages = buildPassages(longSections, MAX_PASSAGES);
assert.equal(new Set(passages.map((p) => p.anchor)).size, passages.length, 'no repeats (two headings share a name and still differ)');
assert.ok(!passages.some((p) => /references|table of contents/i.test(p.heading)), 'contents and references are skipped');
const order = sectionsOfMarkdown(longPost.join('\n'), { levels: [1, 2, 3] }).map((s) => s.id);
assert.deepEqual(passages.map((p) => order.indexOf(p.anchor)), [...passages.map((p) => order.indexOf(p.anchor))].sort((a, b) => a - b), 'in reading order');
assert.ok(passages.every((p) => p.quote && p.quote.length <= 160), 'each has a quotable first sentence');
assert.equal(buildPassages(sectionsOfMarkdown('## Only\n\nOne section with a sentence long enough.', { levels: [2] })).length, 1);
assert.equal(buildPassages([]).length, 0);
// outline_passages: three by default, four only for depth full; cite_section follows that limit.
const lim = createCitations();
const lt = tools.makeTools(() => {}, { canNavigate: false, citations: lim });
const call = (t, input) => t.execute(input, { toolCallId: 't', messages: [] });
const outlined = await call(lt.outline_passages, { path: `/work/${slug}` });
assert.ok(outlined.ok && outlined.passages.length <= 3);
assert.equal(lim.limit(), 3);
await call(lt.outline_passages, { path: `/work/${slug}`, depth: 'full' });
assert.equal(lim.limit(), 4);
// The tool refuses a repeat and a move past the limit.
const capped = createCitations();
const cap = tools.makeTools(() => {}, { canNavigate: false, citations: capped }).cite_section;
const runCap = (heading) => cap.execute({ path: `/work/${slug}`, heading }, { toolCallId: 't', messages: [] });
assert.equal((await runCap('What it is')).ok, true);
assert.equal((await runCap('What it is')).ok, false, 'a section is never pointed at twice in one answer');
assert.equal((await runCap('Built with')).ok, true);
assert.equal((await runCap('Highlights')).ok, true);
assert.equal((await runCap('Go deeper')).ok, false, 'a fourth move is refused unless the whole post was asked for');

// Charts and diagrams are sections of a paper (TASK-DB-0146): ids the page gives them, and a summary shows one.
{
  const md = [
    '# A paper', '', 'Opening words that set the scene for the paper.', '',
    '## 1. Results', '', 'The results are long enough to quote here.', '',
    '<figure class="research-figure" data-figure="score_gap">', '  <picture><img src="/x.light.wide.svg" alt="Chart" /></picture>',
    '  <figcaption>Figure 1. Scores drop when skips count. Hollow dot: answered only.</figcaption>', '</figure>', '',
    '## 2. Method', '', 'The method section has words as well.', '',
    '```mermaid', 'flowchart LR', '  a --> b', '```', '',
    '## 3. Next', '', 'What comes next is written here too.', '',
  ].join('\n');
  const plain = sections.sectionsOfMarkdown(md, { levels: [1, 2, 3] });
  assert.equal(plain.some((s) => s.id.startsWith('figure-') || s.id.startsWith('diagram-')), false, 'blog posts keep headings only');
  const all = sections.sectionsOfMarkdown(md, { levels: [1, 2, 3], visuals: true });
  const fig = all.find((s) => s.id === 'figure-score_gap');
  assert.equal(fig?.heading, 'Figure 1. Scores drop when skips count.');
  assert.equal(all.find((s) => s.id === 'diagram-1')?.heading, 'Diagram: 2. Method');
  assert.ok(sections.checkQuote(fig, 'Scores drop when skips count'), 'a caption can be quoted at its figure');
  assert.ok(all.find((s) => s.id === '1-results').blocks.some((b) => b.includes('Scores drop')), 'the section around it keeps the caption');
  const passages = sections.buildPassages(all).map((p) => p.anchor);
  assert.ok(passages.includes('figure-score_gap'), JSON.stringify(passages));
  assert.deepEqual(passages, [...passages].sort((a, b) => all.findIndex((s) => s.id === a) - all.findIndex((s) => s.id === b)), 'still in reading order');
}

console.log('copilot cite: ok');
