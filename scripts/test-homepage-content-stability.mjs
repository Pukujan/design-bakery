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
const insightsSource = await readFile(
  new URL('./frontend/src/app/modules/engineering/EngineeringInsights/EngineeringInsights.tsx', root),
  'utf8',
);

assert.equal(
  about.roleTitle,
  'I build AI agents that improve through data, testing, and human feedback.',
);
// Every project keeps a start date as evidence. The carousel does not sort by it:
// the default All view leads with Ekagajpatra, Eval Lab, and Agent Custom Setup,
// then the remaining shipped products and system features.
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
    'Ekagajpatra',
    'Eval Lab',
    'Agent Custom Setup',
    'Study OS',
    'Cortex',
    'Project Continuity Modules',
    'ONI vs My Agent Ready Architecture',
    'Legal Workflow Research',
    'Inference Recommendation Engine',
    'FOSSIL',
    'Orbitgraph',
    'Fluffy V4',
    'Voidfeed',
    'SaaS Dashboard Systems',
  ],
  'All should lead with the named trio, then shipped and systems',
);
assert.deepEqual(
  orderProjectsForShowcase(projects, 'shipped').map((project) => project.title),
  ['Ekagajpatra', 'Study OS'],
);
assert.deepEqual(
  orderProjectsForShowcase(projects, 'systems').map((project) => project.title),
  ['Agent Custom Setup', 'Cortex', 'Project Continuity Modules', 'ONI vs My Agent Ready Architecture'],
);
assert.equal(orderProjectsForShowcase(projects, 'client')[0].title, 'SaaS Dashboard Systems');
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
const projectsCarouselSource = await readFile(
  new URL('./frontend/src/app/modules/engineering/EngineeringProjects/EngineeringProjects.tsx', root),
  'utf8',
);
assert.ok(
  projectsCarouselSource.includes('orderProjectsForShowcase(rawProjects, category)'),
  'the projects carousel should render the curated showcase order',
);
assert.ok(
  projectsCarouselSource.includes('useState<ShowcaseFilter>(\'all\')'),
  'the project filter should default to All',
);
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
assert.ok(
  studyOs.links.some((link) => link.label === 'Live App' && link.url === STUDY_OS_LIVE_APP),
  'Study OS card should have a Live App link to study.design-bakery.com',
);
const vercelConfig = await readJson('./vercel.json');
for (const [source, destination] of [
  ['/studyos', STUDY_OS_LIVE_APP],
  ['/studyos/:path*', `${STUDY_OS_LIVE_APP}:path*`],
]) {
  assert.ok(
    vercelConfig.redirects.some(
      (r) => r.source === source && r.destination === destination && r.permanent === false,
    ),
    `vercel.json should redirect ${source} to the Study OS live app (non-permanent)`,
  );
}
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
assert.equal(rendered[0].title, 'Ekagajpatra', 'the default All view features Ekagajpatra');
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
assert.equal(relevantExperience.experiences[0].company, 'Nepasoft LLC');
assert.equal(skillMeta.headingRight, 'SYSTEMS');
assert.ok(
  communitySource.includes('AI workflow mentorship'),
  'community content should stay aligned with the current AI/ML portfolio',
);
assert.ok(
  insightsSource.includes('useBlogData'),
  'homepage blog section should read from the live blog store',
);
assert.ok(
  insightsSource.includes('useBlogCategories'),
  'homepage blog section should read live blog categories',
);
assert.ok(
  !insightsSource.includes('blogData, categories'),
  'homepage blog section should not import the static blog JSON directly',
);

console.log('Homepage content stability checks passed.');
