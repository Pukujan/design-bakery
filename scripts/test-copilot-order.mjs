/**
 * "Next" on a project page follows the order the home page shows (backend/src/copilot/projectOrder.ts is a copy of the frontend's
 * orderProjectsForShowcase). This fails when the two disagree, so the copy cannot drift.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('..', import.meta.url);
const frontend = await import(new URL('./frontend/src/app/lib/projectOrder.ts', root).href);
const backend = await import(new URL('./backend/lib/copilot/projectOrder.js', root).href);
const projects = JSON.parse(await readFile(new URL('./frontend/src/app/portfolios/endtoend-engineer/engineering/projects.json', root), 'utf8'));
for (const filter of ['all', 'shipped', 'systems', 'research', 'experiments']) {
  const a = frontend.orderProjectsForShowcase(projects, filter).map((p) => p.slug);
  const b = backend.orderProjectsForShowcase(projects, filter).map((p) => p.slug);
  assert.deepEqual(b, a, `the backend's project order differs from the home page's for "${filter}"`);
}
console.log('copilot order: the backend project order matches the home page');
