/**
 * The copilot's request router (backend/src/copilot/routines.ts, TASK-DB-0130).
 *
 * Guards three things: common requests are answered by a routine with no model call and land on a page that
 * exists; a follow-up that depends on the conversation, a long question or a request for reasoning is never
 * claimed (it reaches the model); and every routine answer is labelled so the traces can count it.
 *
 * Runs against the compiled backend (pnpm --dir backend run build). Blog cases are skipped when the database
 * that holds the posts cannot be read (no OCTO/DB env locally).
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('..', import.meta.url);
let routeRequest;
let loadBlogs;
try {
  ({ routeRequest } = await import(new URL('./backend/lib/copilot/routines.js', root).href));
  ({ loadBlogs } = await import(new URL('./backend/lib/copilot/knowledge.js', root).href));
} catch {
  throw new Error('copilot router: build the backend first (pnpm --dir backend run build)');
}
const projects = JSON.parse(await readFile(new URL('./frontend/src/app/portfolios/endtoend-engineer/engineering/projects.json', root), 'utf8'));
const projectPaths = new Set(projects.map((p) => `/work/${p.slug}`));
const blogs = await loadBlogs();
const nav = (answer) => answer.actions.find((a) => a.kind === 'navigate');

// Open a specific project or paper by name or topic: the page moves (go), on a chat and on a call.
for (const voice of [false, true]) {
  const cortex = await routeRequest('open the Cortex project', true, voice);
  assert.equal(cortex?.routine, 'open');
  assert.equal(nav(cortex)?.path, '/work/cortex');
  assert.equal(cortex.go, true, 'an explicit "open" moves the page');
}
const voidfeed = await routeRequest('show me Voidfeed', false);
assert.equal(voidfeed?.routine, 'open');
assert.equal(nav(voidfeed)?.path, '/work/voidfeed');
const paper = await routeRequest('open the paper about deny-by-default authorization', true);
assert.equal(paper?.routine, 'open');
assert.equal(nav(paper)?.path, '/research/papers/db-r-2026-002');
assert.ok(paper.text.includes('Deny-by-default'), 'the reply names the paper it opens');

// Which projects used <tech>: from the project records, no invented names.
const react = await routeRequest('which projects used React?', true);
assert.equal(react?.routine, 'tech');
const slugs = react.actions.find((a) => a.kind === 'projects').slugs;
assert.deepEqual(
  [...slugs].sort(),
  projects.filter((p) => p.tech.some((t) => t.toLowerCase() === 'react')).map((p) => p.slug).slice(0, 4).sort(),
);
assert.notEqual((await routeRequest('which projects used Fortran?', true))?.routine, 'tech', 'an unknown technology is not guessed');

// What did you do at <company>: the real role and period, a chip to the experience section.
const role = await routeRequest('what did you do at Nepasoft?', true);
assert.equal(role?.routine, 'role');
assert.ok(role.text.includes('Nepasoft') && role.text.includes('AI/ML Engineer'));
assert.equal(nav(role).path, '/#experience');
assert.notEqual((await routeRequest('what did you do at Initech?', true))?.routine, 'role', 'an employer I never had is not invented');

// The latest paper.
const latestPaper = await routeRequest("what's your latest paper", true);
assert.equal(latestPaper?.routine, 'latest');
assert.ok(/^\/research\/papers\/db-r-\d{4}-\d{3}$/.test(nav(latestPaper).path));
if (blogs.length) {
  const post = await routeRequest('open the latest post', true);
  assert.equal(post?.routine, 'latest');
  assert.ok(/^\/blogs\/\d+$/.test(nav(post).path));
  const first = blogs[0];
  const named = await routeRequest(`open the post about ${first.title}`, true);
  assert.equal(nav(named)?.path, `/blogs/${first.id}`);
} else console.log('copilot router: no blog posts readable here, blog cases skipped');

// The saved intents still answer, labelled as such: tour, book a call, contact.
for (const [question, routine] of [['give me a tour', 'intent:tour'], ['book a call', 'intent:book'], ['how do i contact pujan', 'intent:contact'], ['hi', 'intent:greeting']]) {
  assert.equal((await routeRequest(question, true))?.routine, routine, `"${question}" should be ${routine}`);
}
// A call's tour keeps its scroll steps.
assert.ok((await routeRequest('give me a tour', true, true)).steps?.length, 'the voice tour keeps its steps');

// "Show me your projects / research / work" is a list request, not "open the project called ...".
for (const q of ['show me your projects', 'show me your research', 'show me your work', 'show me around']) {
  const answer = await routeRequest(q, true);
  assert.notEqual(answer?.routine, 'open', `"${q}" must not be an open request`);
}

// The routine folders (backend/src/copilot/skills/<name>/examples/inputs/cases.json) are the regression cases.
import { readdir } from 'node:fs/promises';
const skillsDir = new URL('./backend/src/copilot/skills/', root);
let caseCount = 0;
for (const name of await readdir(skillsDir)) {
  const cases = JSON.parse(await readFile(new URL(`${name}/examples/inputs/cases.json`, skillsDir), 'utf8'));
  for (const c of cases) {
    if (c.needs === 'blogs' && !blogs.length) continue;
    const answer = await routeRequest(c.utterance, c.firstTurn ?? false, false, c.previous);
    const label = `${name}: "${c.utterance}"`;
    if ('routine' in c) assert.equal(c.routine === null ? (answer && ['open', 'latest', 'tech', 'role'].includes(answer.routine) ? answer.routine : null) : answer?.routine, c.routine, label);
    if (c.routine_not) assert.notEqual(answer?.routine, c.routine_not, label);
    if (c.navigate) assert.equal(nav(answer)?.path, c.navigate, label);
    if (c.navigate_prefix) assert.ok(nav(answer)?.path.startsWith(c.navigate_prefix), label);
    if (c.go) assert.equal(answer.go, true, label);
    caseCount += 1;
  }
}
assert.ok(caseCount >= 10, 'the routine folders hold the regression cases');

// Every offer the call's idle nudges make is known to the router (drift guard against holdAudio.ts NUDGES).
const nudges = [...(await readFile(new URL('./frontend/src/app/modules/copilot/holdAudio.ts', root), 'utf8')).matchAll(/src: '\/voice\/nudge-\d\.m4a', text: ("[^"]+"|'[^']+')/g)].map((m) => m[1].slice(1, -1));
assert.ok(nudges.length >= 4, 'found the nudge lines');
for (const line of nudges) {
  const reply = await routeRequest('no', false, false, line);
  assert.equal(reply?.routine, 'offer:decline', `the nudge "${line}" is not in the router's OFFERS`);
}
// "yes" after a model question, or with no offer, is not the router's.
assert.ok(!(await routeRequest('yes', false, false, 'Which project would you like?'))?.routine?.startsWith('offer'));

// A question that points back at the conversation goes to the model after the first turn, never to a routine or a
// saved intent (found in a live test: "the first project we talked about" was answered by the projects reply).
const backRefs = [
  'And what was the first project we talked about?', 'What did I say I do for work?', 'you mentioned a paper earlier, open that one',
  'what did we discuss about Cortex', 'which post did I ask about before', 'show me the last one again', 'what was the project you told me about',
];
for (const q of backRefs) assert.equal(await routeRequest(q, false), null, `"${q}" refers to the conversation and must reach the model`);
// The same words as a first message have no conversation to refer to: unchanged.
assert.ok(await routeRequest('Tell me about your projects', true), 'a first-turn projects question stays instant');
assert.ok(await routeRequest('Tell me about your projects', false), 'a plain projects question later stays instant');

// Never hijack a follow-up, a long or a reasoning question: these reach the model.
const toModel = [
  'open it', 'open the second one', 'show me more', 'show me that again', 'open the other paper', 'which one uses React',
  'why did you choose Cortex over Orbitgraph', 'compare Cortex and Precedent', 'what is the difference between Cortex and FOSSIL',
  'open the Cortex project and explain how the reference monitor decides what an agent may do and why that matters for legal workflows',
  'which projects used React and which of them would you recommend I read first',
];
for (const q of toModel) {
  for (const firstTurn of [true, false]) {
    const answer = await routeRequest(q, firstTurn);
    assert.ok(!answer || !['open', 'latest', 'tech', 'role'].includes(answer.routine), `"${q}" must not be claimed by a routine (got ${answer?.routine})`);
  }
}
assert.equal(await routeRequest('', true), null);

// Every navigate lands on a page that exists.
for (const answer of [voidfeed, paper, role, latestPaper]) {
  const move = nav(answer);
  const path = move.path.split('#')[0] || '/';
  assert.ok(projectPaths.has(path) || path === '/' || /^\/(research\/papers|blogs)\//.test(path), `${move.path} is not a page on this site`);
}

console.log('copilot router: open, tech, role, latest and saved intents routed; follow-ups and reasoning left to the model');
