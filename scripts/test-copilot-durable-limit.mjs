#!/usr/bin/env node
// Unit-test the API boundary without touching a live workspace database.
import assert from 'node:assert/strict';
import { DurableLimitUnavailable, takeDurableCopilotLimit } from '../backend/lib/copilot/durableLimit.js';

const secret = 'stable-test-secret-with-at-least-32-bytes';
let captured;
const allow = async (sql, params) => {
  captured = { sql, params };
  return { allowed: true, retry_at: null };
};
assert.deepEqual(await takeDurableCopilotLimit('192.0.2.123', 'visitor-42', { secret, query: allow }), { ok: true });
assert.match(captured.sql, /copilot_take_rate_slot\(\$1, \$2\)/);
assert.equal(captured.params.length, 2);
assert.ok(captured.params.every((value) => /^[0-9a-f]{64}$/.test(value)));
assert.notEqual(captured.params[0], captured.params[1]);
assert.ok(!JSON.stringify(captured.params).includes('192.0.2.123'));
const first = [...captured.params];
await takeDurableCopilotLimit('192.0.2.123', 'visitor-42', { secret, query: allow });
assert.deepEqual(captured.params, first);
await takeDurableCopilotLimit('visitor-42', 'visitor-42', { secret, query: allow });
assert.notEqual(captured.params[0], captured.params[1], 'identity domains must be separated');
const retry = '2026-11-03T00:00:00.000Z';
assert.deepEqual(await takeDurableCopilotLimit('ip', 'visitor', {
  secret, query: async () => ({ allowed: false, retry_at: retry }),
}), { ok: false, retryAt: Date.parse(retry) });
for (const query of [async () => null, async () => ({ allowed: false, retry_at: 'bad' }), async () => { throw new Error('db unavailable'); }]) {
  await assert.rejects(takeDurableCopilotLimit('ip', 'visitor', { secret, query }), DurableLimitUnavailable);
}
await assert.rejects(takeDurableCopilotLimit('ip', 'visitor', { secret: 'too-short', query: allow }), DurableLimitUnavailable);
await assert.rejects(takeDurableCopilotLimit('ip', ' ', { secret, query: allow }), DurableLimitUnavailable);
console.log('durable limiter: domain-separated HMACs, retry time, and fail-closed behavior passed');
