/**
 * Copilot visitor limits (src/copilot/fairUse.ts): 50 per 2 hours, 100 per 10 hours and
 * 200 per 4 days, all at once. Run from backend/: node --import tsx --test test/fairUse.test.ts
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createLimiter, limitConfigFromEnv } from '../src/copilot/fairUse.ts';

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/** A limiter on a manual clock; the burst limit is lifted so only the windows are tested. */
function rig(env: NodeJS.ProcessEnv = {}) {
  let t = 0;
  const config = { ...limitConfigFromEnv(env), burstMax: 1_000 };
  const limiter = createLimiter(config, () => t);
  return {
    at(ms: number) {
      t = ms;
    },
    take: () => limiter.take('ip:test'),
  };
}

test('the defaults are 50 in 2 hours, 100 in 10 hours and 200 in 4 days', () => {
  const config = limitConfigFromEnv({});
  assert.deepEqual(config.windows, [
    { max: 50, ms: 2 * HOUR },
    { max: 100, ms: 10 * HOUR },
    { max: 200, ms: 4 * DAY },
  ]);
});

test('50 in 2 hours blocks the 51st, with retry-after at the first hit plus 2 hours', () => {
  const clock = rig();
  // One request a minute keeps the burst guard out of it; all 50 fall inside 2 hours.
  for (let i = 0; i < 50; i++) {
    clock.at(i * MIN);
    assert.equal(clock.take().ok, true, `request ${i + 1} should pass`);
  }
  clock.at(50 * MIN);
  const refused = clock.take();
  assert.equal(refused.ok, false);
  assert.equal(refused.ok ? 0 : refused.retryAt, 2 * HOUR);

  // Once the first hit leaves the 2-hour window, one more request fits.
  clock.at(2 * HOUR);
  assert.equal(clock.take().ok, true);
});

test('the 4-day window blocks even when the 2-hour and 10-hour windows have room', () => {
  const clock = rig();
  // 200 hits, 25 minutes apart, span 83 hours: at most 5 in any 2 hours, 24 in 10 hours.
  for (let i = 0; i < 200; i++) {
    clock.at(i * 25 * MIN);
    assert.equal(clock.take().ok, true, `request ${i + 1} should pass`);
  }
  clock.at(200 * 25 * MIN);
  const refused = clock.take();
  assert.equal(refused.ok, false, '201st request inside 4 days must be refused');
  // Retry is when the first hit leaves the 4-day window, not a shorter one.
  assert.equal(refused.ok ? 0 : refused.retryAt, 4 * DAY);
});

test('100 in 10 hours blocks the 101st while the 2-hour window still has room', () => {
  const clock = rig();
  // One every 5 minutes: 2 hours holds only 24, 10 hours holds 100.
  for (let i = 0; i < 100; i++) {
    clock.at(i * 5 * MIN);
    assert.equal(clock.take().ok, true, `request ${i + 1} should pass`);
  }
  clock.at(100 * 5 * MIN);
  const refused = clock.take();
  assert.equal(refused.ok, false);
  assert.equal(refused.ok ? 0 : refused.retryAt, 10 * HOUR);
});

test('a configured window of its own keeps the single-window behaviour', () => {
  const t = 0;
  const limiter = createLimiter({ windowMax: 2, windowMs: MIN, burstMax: 100, burstMs: 20_000 }, () => t);
  assert.equal(limiter.take('k').ok, true);
  assert.equal(limiter.take('k').ok, true);
  const refused = limiter.take('k');
  assert.equal(refused.ok, false);
  assert.equal(refused.ok ? 0 : refused.retryAt, MIN);
});
