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

console.log('copilot cite: ok');
