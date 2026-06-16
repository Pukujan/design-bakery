import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

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
assert.equal(projects[0].title, 'ONI vs My Agent Ready Architecture');
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
