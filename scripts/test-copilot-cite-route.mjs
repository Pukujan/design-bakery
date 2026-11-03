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

// Dwell and anchor: passages land on sentence starts, in order, spaced, capped, never repeated.
const { passageSchedule, perchSpot, sentenceStart, MAX_CITES, MIN_DWELL_CHARS } = await import(new URL('../frontend/src/app/modules/copilot/citeRoute.ts', import.meta.url).href);
const talk = 'Here is the short version. The first part is about recording what you do, and it is quite simple. The second part is about replaying it under supervision, which is where trust is built. The third part moves the whole thing to a cloud worker once it has proved itself. Want me to go deeper into one part?';
const mk = (heading, i) => ({ path: '/blogs/1', anchor: `h${i}`, heading });
const cites = [mk('Recording', 1), mk('Replaying it', 2), mk('Cloud worker', 3), mk('Recording', 1), mk('Fifth', 5), mk('Sixth', 6)];
const plan = passageSchedule(talk, cites, { seen: new Set(['/blogs/1#h0']) });
assert.ok(plan.length <= MAX_CITES - 1, 'the first move is made before speaking, so at most 3 more');
assert.deepEqual(plan.map((p) => p.cite.anchor), [...new Set(plan.map((p) => p.cite.anchor))], 'no section twice');
for (const [i, p] of plan.entries()) {
  assert.ok(p.at > 0 && p.at < talk.length, 'offset inside the text');
  assert.equal(p.at, sentenceStart(talk, p.at), 'a move starts at a sentence start, never mid-sentence');
  if (i) assert.ok(p.at >= plan[i - 1].at + MIN_DWELL_CHARS, 'each passage gets its minimum dwell');
  assert.ok(p.hold >= (i < plan.length - 1 ? MIN_DWELL_CHARS : 1), 'hold covers the passage');
}
assert.equal(plan.at(-1).at + plan.at(-1).hold, talk.length, 'the last passage lasts to the end of the answer');
assert.deepEqual(passageSchedule('Short.', cites), [], 'too short to move twice');
assert.deepEqual(passageSchedule(talk, [mk('Recording', 0)], { seen: new Set(['/blogs/1#h0']) }), [], 'the first cite is not repeated');

// The perch: margin on the side with room, above on a phone.
const rect = { left: 300, right: 700, top: 200, height: 40 };
assert.deepEqual(perchSpot(rect, { width: 1280, height: 800 }), { x: 254, y: 220 });
assert.deepEqual(perchSpot({ ...rect, left: 20, right: 300 }, { width: 1280, height: 800 }), { x: 346, y: 220 }, 'no room on the left: the right margin');
assert.equal(perchSpot({ left: 16, right: 360, top: 200, height: 40 }, { width: 390, height: 800 }).y, 166, 'phone: above the heading');
assert.equal(perchSpot({ left: 300, right: 700, top: 10, height: 40 }, { width: 1280, height: 800 }).y, 70, 'kept below the nav');
console.log('copilot cite dwell: ok');

// Swipe summary: offset to scroll mapping.
const { swipePlan, swipeY } = await import(new URL('../frontend/src/app/modules/copilot/citeRoute.ts', import.meta.url).href);
const CPS = 14;
const sp = swipePlan(280, [0, 98, 196], CPS);
assert.deepEqual(sp.times.map((x) => Math.round(x * 10) / 10), [1.4, 7, 14], 'each heading lands as its sentence starts (the first after a short ease-in)');
assert.equal(sp.end, 280 / CPS, 'the swipe lasts as long as the estimated speech');
assert.ok(swipePlan(280, [0, 5], CPS).times[1] - swipePlan(280, [0, 5], CPS).times[0] >= 1.4, 'headings are never closer than the travel time');
const targets = [600, 1800, 3400];
assert.equal(swipeY(0, sp, targets, 0), 0, 'starts where the page was');
assert.equal(swipeY(sp.times[0], sp, targets, 0), 600);
assert.equal(swipeY(sp.times[1], sp, targets, 0), 1800, 'in place exactly as the sentence starts');
assert.equal(swipeY(sp.times[2], sp, targets, 0), 3400);
assert.equal(Math.round(swipeY(sp.end, sp, targets, 0)), 3640, 'drifts on through the last passage');
assert.equal(swipeY(sp.end + 50, sp, targets, 0), swipeY(sp.end, sp, targets, 0), 'holds after the end');
let prev = -1;
for (let t = 0; t <= sp.end; t += 0.25) {
  const y = swipeY(t, sp, targets, 0);
  assert.ok(y >= prev, 'only ever moves down');
  prev = y;
}
// Ease-out into a heading: the last second of a leg covers less than the first second.
const leg = (a, b) => swipeY(b, sp, targets, 0) - swipeY(a, sp, targets, 0);
assert.ok(leg(sp.times[1] - 1, sp.times[1]) < leg(sp.times[0], sp.times[0] + 1), 'the page slows as the heading settles');
console.log('copilot cite swipe: ok');
