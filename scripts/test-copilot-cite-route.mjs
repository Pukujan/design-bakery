/**
 * Where a citation sits in the site and in the spoken answer (frontend/src/app/modules/copilot/citeRoute.ts).
 * Pure functions, read straight from the source by Node's type stripping.
 */
import assert from 'node:assert/strict';

const { planRoute, citeAt } = await import(new URL('../frontend/src/app/modules/copilot/citeRoute.ts', import.meta.url).href);

assert.deepEqual(planRoute('/', '/blogs/34', 'replay'), [{ kind: 'page', path: '/blogs/34', via: '/blogs' }, { kind: 'heading', anchor: 'replay' }]);
assert.deepEqual(planRoute('/blogs/34', '/blogs/34', 'replay'), [{ kind: 'heading', anchor: 'replay' }], 'already there: just the heading');
assert.deepEqual(planRoute('/blogs', '/work/x', 'what-it-is'), [{ kind: 'page', path: '/work/x', via: '/#work' }, { kind: 'heading', anchor: 'what-it-is' }]);
assert.deepEqual(planRoute('/', '/research/papers/db-r-2026-001'), [{ kind: 'page', path: '/research/papers/db-r-2026-001', via: '/research' }]);

const answer = 'In the first post I found the retries bug. Then in the paper, the evidence boundaries section says it plainly.';
const first = citeAt(answer, { heading: '1. Retries bug' }, 0, 2);
const second = citeAt(answer, { heading: '3. Evidence boundaries' }, 1, 2, first);
assert.equal(first, answer.toLowerCase().indexOf('retries bug'));
assert.equal(second, answer.toLowerCase().indexOf('evidence boundaries'));
assert.ok(second > first, 'citations run in the order they are spoken');
assert.equal(citeAt('short answer here', { heading: 'Nowhere to be found' }, 1, 2), Math.floor(17 / 2), 'unnamed: an even share of the answer');
assert.equal(citeAt(answer, { heading: 'Evidence boundaries' }, 0, 2, 100), 100, 'never before the previous citation');

console.log('copilot cite route: ok');
