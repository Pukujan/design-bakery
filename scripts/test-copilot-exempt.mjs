/**
 * The owner's rate-limit exemption (TASK-DB-0140): which addresses match COPILOT_RATE_EXEMPT_IPS, and that an
 * exempt request is never refused by the request limiter while the daily token budget still applies.
 * Runs against the compiled backend (pnpm --dir backend run build). Only documentation addresses are used.
 */
import assert from 'node:assert/strict';

const root = new URL('..', import.meta.url);
const { createExemptMatcher, createLimiter, createDailyBudget } = await import(new URL('./backend/lib/copilot/fairUse.js', root).href);

// Matching: exact IPv4, IPv6, CIDR on both families, whitespace tolerated.
const match = createExemptMatcher(' 203.0.113.7 , 198.51.100.0/24,2001:db8::1, 2001:db8:abcd::/48 ');
assert.equal(match('203.0.113.7'), true);
assert.equal(match('203.0.113.8'), false);
assert.equal(match('198.51.100.200'), true);
assert.equal(match('198.51.101.1'), false);
assert.equal(match('2001:db8::1'), true);
assert.equal(match('2001:db8::2'), false);
assert.equal(match('2001:db8:abcd:1::9'), true);
assert.equal(match('2001:db8:abce::1'), false);
assert.equal(match('::ffff:203.0.113.7'), true, 'an IPv4-mapped IPv6 form of a listed address matches');
assert.equal(match(''), false);
assert.equal(match('not-an-ip'), false);

// Malformed entries are ignored and never widen the list.
const bad = createExemptMatcher('garbage, 203.0.113.7/99, 203.0.113.7/x, 203.0.113.7/24/8, 300.1.1.1, /24, 2001:db8::/200, 192.0.2.5');
assert.equal(bad('192.0.2.5'), true, 'a valid entry after malformed ones still works');
assert.equal(bad('203.0.113.7'), false, 'a malformed CIDR does not fall back to the bare address');
assert.equal(bad('1.1.1.1'), false);
assert.equal(bad('2001:db8::1'), false);

// Unset or empty: nobody is exempt (no wildcard behaviour).
for (const list of [undefined, '', ' , ,']) {
  const none = createExemptMatcher(list);
  assert.equal(none('203.0.113.7'), false);
  assert.equal(none('::1'), false);
}

// Limiter bypass, as route.ts uses it: an exempt address never calls take(), a stranger is throttled at the burst.
const limiter = createLimiter({ windowMax: 200, windowMs: 3600_000, burstMax: 4, burstMs: 20_000 });
const admit = (ip) => (match(ip) ? true : limiter.take(`ip:${ip}`).ok);
for (let i = 0; i < 50; i++) assert.equal(admit('203.0.113.7'), true, 'the owner is not throttled');
assert.equal(limiter.take('ip:203.0.113.7').ok, true, 'exempt requests leave no hits behind');
const results = Array.from({ length: 6 }, () => admit('192.0.2.200'));
assert.deepEqual(results, [true, true, true, true, false, false], 'a non-exempt address still hits the burst limit');

// The daily token budget has no exemption.
const budget = createDailyBudget(100);
assert.equal(budget.open(), true);
budget.record(100);
assert.equal(budget.open(), false, 'the budget closes for everyone, exempt or not');

// The owner's network is never shown the human check: a pass is issued with no token when the address is exempt, and
// still refused for everyone else once a Turnstile secret is set.
const { issuePass } = await import(new URL('./backend/lib/copilot/guard.js', root).href);
process.env.TURNSTILE_SECRET_KEY = 'test-secret';
assert.equal(await issuePass('', '203.0.113.9'), null, 'a stranger with no token is refused');
assert.ok(await issuePass('', '203.0.113.9', undefined, true), 'the owner gets a pass with no token');
delete process.env.TURNSTILE_SECRET_KEY;

console.log('copilot exempt tests passed');
