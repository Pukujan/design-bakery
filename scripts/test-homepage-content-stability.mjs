import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  STARTED_AT_PATTERN,
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
// Showcase order: every project has a start date (plus its evidence) and the carousel
// renders newest first. The sort is done in code, so the JSON order does not matter.
for (const project of projects) {
  assert.match(
    project.startedAt ?? '',
    STARTED_AT_PATTERN,
    `${project.title} needs startedAt as YYYY-MM-DD or YYYY-MM`,
  );
  assert.ok(project.startedAtSource, `${project.title} needs startedAtSource (evidence for startedAt)`);
}
const rendered = sortProjectsByStartedAtDesc(projects);
for (let i = 1; i < rendered.length; i += 1) {
  assert.ok(
    rendered[i - 1].startedAt >= rendered[i].startedAt,
    `showcase must be newest first: ${rendered[i - 1].title} (${rendered[i - 1].startedAt}) before ${rendered[i].title} (${rendered[i].startedAt})`,
  );
}
const newestStart = projects.map((p) => p.startedAt).sort().at(-1);
assert.equal(rendered[0].startedAt, newestStart, 'the newest project should be first');
// Ties keep data order (stable sort).
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
  projectsCarouselSource.includes('sortProjectsByStartedAtDesc(rawProjects)'),
  'the projects carousel should render projects sorted by startedAt (newest first)',
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
