import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  PROJECT_CATEGORIES,
  STARTED_AT_PATTERN,
  orderProjectsForShowcase,
  sortProjectsByStartedAtDesc,
} from '../frontend/src/app/lib/projectOrder.ts';

const root = new URL('..', import.meta.url);

async function readJson(pathname) {
  const text = await readFile(new URL(pathname, root), 'utf8');
  return JSON.parse(text);
}

const contentHooksSource = await readFile(
  new URL('./frontend/src/app/lib/contentHooks.ts', root),
  'utf8',
);

assert.ok(
  contentHooksSource.includes('useStaticContent'),
  'public content hooks should be static',
);
assert.ok(
  !contentHooksSource.includes('fetchPublicContentObject'),
  'public content hooks should not fetch CMS objects',
);
assert.ok(
  !contentHooksSource.includes('fetchPublicContentArray'),
  'public content hooks should not fetch CMS arrays',
);
assert.ok(
  !contentHooksSource.includes('PORTFOLIO_CONTENT_PUSH_EVENT'),
  'public content hooks should not subscribe to admin push events',
);

const about = await readJson('./frontend/src/app/portfolios/endtoend-engineer/engineering/about.json');
const projects = await readJson('./frontend/src/app/portfolios/endtoend-engineer/engineering/projects.json');
const relevantExperience = await readJson(
  './frontend/src/app/portfolios/endtoend-engineer/engineering/relevant-experience.json',
);
const skillMeta = await readJson(
  './frontend/src/app/portfolios/endtoend-engineer/engineering/skills-meta.json',
);
const communitySource = await readFile(
  new URL('./frontend/src/app/lib/adminContentService.ts', root),
  'utf8',
);

assert.equal(
  about.roleTitle,
  'I take a product from the first question to running in production.',
);
// Every project keeps a start date as evidence. The carousel does not sort by it:
// the default All view leads with the live products (Maybe, Maybe Home, Riley, NYC Map Agent), then Octo,
// Ekagajpatra, Study OS, Agent Custom Setup, Eval Lab and Precedent, then the remaining shipped
// products and system features.
for (const project of projects) {
  assert.match(
    project.startedAt ?? '',
    STARTED_AT_PATTERN,
    `${project.title} needs startedAt as YYYY-MM-DD or YYYY-MM`,
  );
  assert.ok(project.startedAtSource, `${project.title} needs startedAtSource (evidence for startedAt)`);
  assert.ok(
    PROJECT_CATEGORIES.includes(project.category),
    `${project.title} needs a showcase category`,
  );
}
const rendered = orderProjectsForShowcase(projects, 'all');
assert.deepEqual(
  rendered.map((project) => project.title),
  [
    'Maybe',
    'Maybe Home',
    'Riley',
    'NYC Map Agent',
    'Octo',
    'Ekagajpatra',
    'Study OS',
    'Agent Custom Setup',
    'Eval Lab',
    'Precedent',
    'Cortex',
    'Project Continuity Modules',
    'ONI vs My Agent Ready Architecture',
    'Inference Recommendation Engine',
    'FOSSIL',
    'Orbitgraph',
    'Fluffy V4',
    'Voidfeed',
  ],
  'All should lead with the live products, then the platform and tools, then shipped and systems',
);
assert.deepEqual(
  orderProjectsForShowcase(projects, 'shipped').map((project) => project.title),
  ['Maybe', 'Maybe Home', 'Riley', 'NYC Map Agent', 'Ekagajpatra', 'Study OS', 'Precedent'],
);
assert.deepEqual(
  orderProjectsForShowcase(projects, 'systems').map((project) => project.title),
  ['Octo', 'Agent Custom Setup', 'Cortex', 'Project Continuity Modules', 'ONI vs My Agent Ready Architecture'],
);
assert.equal(orderProjectsForShowcase(projects, 'research')[0].title, 'Eval Lab');
assert.deepEqual(
  orderProjectsForShowcase(projects, 'experiments').map((project) => project.title),
  ['Orbitgraph', 'Fluffy V4', 'Voidfeed'],
);
// Date sort stays available and stable; it is no longer the showcase order.
const tie = sortProjectsByStartedAtDesc([
  { title: 'a', startedAt: '2026-01' },
  { title: 'b', startedAt: '2026-01' },
]);
assert.deepEqual(tie.map((p) => p.title), ['a', 'b'], 'ties must keep data order');
assert.ok(projects.some((p) => p.title === 'Study OS'), 'Study OS should stay in the showcase');
// Project cards: unique ids, exactly 3 stats (the card grid and icon assume it), and a
// known status value. Case-study links to static pages must point at a real file.
assert.equal(new Set(projects.map((p) => p.id)).size, projects.length, 'project ids must be unique');
for (const project of projects) {
  assert.equal(project.stats.length, 3, `${project.title} should have exactly 3 stats`);
  assert.ok(
    project.status === undefined || project.status === 'ongoing',
    `${project.title} has an unknown status: ${project.status}`,
  );
}
// Study OS live web app (TASK-DB-0052): served by Study OS itself at study.design-bakery.com
// (Study-os decision D018, Vite base '/'), so design-bakery links/redirects to it rather
// than proxying it under a sub-path.
const STUDY_OS_LIVE_APP = 'https://study.design-bakery.com/';
const studyOs = projects.find((p) => p.title === 'Study OS');
// study.design-bakery.com is not deployed (Cloudflare answers 530), so the card must not link it until it is.
assert.ok(
  !studyOs.links.some((link) => link.url === STUDY_OS_LIVE_APP),
  'Study OS card must not link study.design-bakery.com while that host is not served',
);
const caddyfile = await readFile(new URL('./deploy/vps/Caddyfile', root), 'utf8');
// Non-permanent: a 307 with the Study OS host as the Location.
assert.match(
  caddyfile,
  /@studyosExact path \/studyos\n\s*handle @studyosExact \{\n\s*header Location https:\/\/study\.design-bakery\.com\/\n[\s\S]*?BODY 307/,
  'Caddyfile should redirect /studyos to the Study OS live app (non-permanent)',
);
assert.match(
  caddyfile,
  /handle_path \/studyos\/\* \{\n\s*header Location https:\/\/study\.design-bakery\.com\{http\.request\.uri\}\n[\s\S]*?BODY 307/,
  'Caddyfile should redirect /studyos/* to the Study OS live app, keeping the path (non-permanent)',
);
const fluffy = projects.find((p) => p.title === 'Fluffy V4');
assert.ok(fluffy, 'Fluffy V4 should be in the showcase');
assert.ok(
  fluffy.links.some((link) => link.url === '/case-studies/fluffy-v4'),
  'Fluffy V4 should link to its case study',
);
await readFile(new URL('./frontend/public/case-studies/fluffy-v4/index.html', root), 'utf8');
for (const title of ['Eval Lab', 'Project Continuity Modules', 'Inference Recommendation Engine']) {
  const project = projects.find((p) => p.title === title);
  assert.ok(project, `${title} should be in the showcase`);
  assert.equal(project.status, 'ongoing', `${title} should be marked ongoing`);
}
// Orbitgraph is served by its own container through the tunnel, not by this SPA, so its
// card must use the absolute URL — a relative path would render as an in-app <Link>.
const orbitgraph = projects.find((p) => p.title === 'Orbitgraph');
assert.ok(orbitgraph, 'Orbitgraph should be in the showcase');
assert.equal(orbitgraph.startedAt, '2026-10-11', 'Orbitgraph startedAt is its repo creation date');
assert.ok(
  orbitgraph.links.some(
    (link) => link.label === 'Live App' && link.url === 'https://www.design-bakery.com/github-planets',
  ),
  'Orbitgraph should link to the absolute design-bakery URL of its live app',
);
// Voidfeed is served by its own container through the tunnel, not by this SPA, so its
// card must use the absolute URL — a relative path would render as an in-app <Link>.
const voidfeed = projects.find((p) => p.title === 'Voidfeed');
assert.ok(voidfeed, 'Voidfeed should be in the showcase');
assert.equal(voidfeed.id, 14, 'Voidfeed takes the next free project id');
assert.equal(voidfeed.startedAt, '2026-10-13', 'Voidfeed startedAt is its repo creation date');
assert.ok(
  voidfeed.links.some(
    (link) => link.label === 'Live App' && link.url === 'https://voidfeed.design-bakery.com',
  ),
  'Voidfeed should link to the absolute URL of its live app',
);
assert.equal(rendered[0].title, 'Maybe', 'the default All view features Maybe');
const copilot = projects.find((p) => p.title === 'Maybe');
assert.ok(copilot, 'Maybe (formerly Website Copilot) should be in the showcase');
assert.equal(copilot.id, 16, 'Maybe keeps the Website Copilot id');
assert.equal(copilot.slug, 'website-copilot', 'Maybe keeps its /work/website-copilot address');
assert.equal(copilot.startedAt, '2026-10-28', 'Maybe startedAt is its repo creation date');
assert.equal(copilot.category, 'shipped', 'Maybe is a live product');
assert.ok(
  copilot.links.every((link) => link.url.startsWith('https://maybe.design-bakery.com')),
  'Maybe links its own site only',
);
assert.ok(
  !copilot.links.some((link) => link.url.includes('github.com')),
  'Maybe must not link a GitHub repo (owner decision)',
);
for (const [title, id, site] of [
  ['Maybe Home', 19, 'https://home.design-bakery.com'],
  ['Riley', 20, 'https://riley.design-bakery.com'],
]) {
  const project = projects.find((p) => p.title === title);
  assert.ok(project, `${title} should be in the showcase`);
  assert.equal(project.id, id, `${title} takes the next free project id`);
  assert.equal(project.category, 'shipped', `${title} is a live product`);
  assert.ok(
    project.links.some((link) => link.label === 'Live Site' && link.url === site),
    `${title} should link its live site`,
  );
}
assert.ok(
  !projects.find((p) => p.title === 'Maybe Home').links.some((link) => link.url.includes('github.com')),
  'Maybe Home must not link its private repo',
);
const precedent = projects.find((p) => p.title === 'Precedent');
assert.ok(precedent, 'Precedent should be in the showcase');
assert.equal(precedent.id, 15, 'Precedent takes the next free project id');
assert.equal(precedent.startedAt, '2026-10-16', 'Precedent startedAt is its repo creation date');
assert.equal(precedent.category, 'shipped', 'Precedent is a live product');
assert.ok(
  precedent.links.some(
    (link) => link.label === 'Live App' && link.url === 'https://arize.design-bakery.com',
  ),
  'Precedent should link to the absolute URL of its live app',
);
assert.ok(
  precedent.links.some((link) => link.url === 'https://github.com/pukujan-lab-2/arize-ai-hackersprint'),
  'Precedent should link to its public GitHub repo',
);
assert.equal(voidfeed.category, 'experiments', 'Voidfeed is an experiment, not the default feature');
assert.ok(
  rendered.findIndex((project) => project.title === 'Voidfeed') >
    rendered.findIndex((project) => project.title === 'Agent Custom Setup'),
  'system features stay ahead of experiments in the default view',
);
// github-planets and voidfeed are private repos; linking them would 404 for every visitor.
for (const project of projects) {
  assert.ok(
    !project.links.some((link) => link.url.includes('github.com/Pukujan/github-planets')),
    `${project.title} must not link to the private github-planets repo`,
  );
  assert.ok(
    !project.links.some((link) => link.url.includes('github.com/Pukujan/voidfeed')),
    `${project.title} must not link to the private voidfeed repo`,
  );
}
const acs = projects.find((p) => p.title === 'Agent Custom Setup');
assert.ok(acs, 'Agent Custom Setup should be in the showcase');
assert.equal(acs.startedAt, '2026-09-25', 'Agent Custom Setup startedAt is its repo creation date');
assert.ok(
  acs.links.some((link) => link.label === 'Live Site' && link.url === 'https://acs.design-bakery.com'),
  'Agent Custom Setup should link to its live site',
);
assert.ok(
  acs.links.some((link) => link.url === 'https://github.com/Pukujan/agent-custom-setup'),
  'Agent Custom Setup should link to its public GitHub repo',
);
assert.equal(relevantExperience.experiences[0].company, 'Design Bakery', 'the studio role leads the work history');
assert.equal(
  relevantExperience.experiences.at(-1).company,
  'The Fitzgerald Law Firm',
  'the one past legal role sits at the bottom, not in the lead',
);
for (const title of ['NYC Map Agent', 'Octo']) {
  const project = projects.find((p) => p.title === title);
  assert.ok(project, `${title} should be in the showcase`);
}
assert.ok(
  !projects.some((p) => p.title === 'Legal Workflow Research'),
  'Legal Workflow Research leaves the showcase; Precedent is the one legal project',
);
assert.equal(skillMeta.headingRight, 'SYSTEMS');
assert.ok(
  communitySource.includes('AI workflow mentorship'),
  'community content should stay aligned with the current AI/ML portfolio',
);

console.log('Homepage content stability checks passed.');
