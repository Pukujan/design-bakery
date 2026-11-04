#!/usr/bin/env node
// Exercises the public voice gateway without creating a real voice room.
import assert from 'node:assert/strict';
import express from '../backend/node_modules/express/index.js';
import { copilotRouter } from '../backend/lib/copilot/route.js';
import { issuePass } from '../backend/lib/copilot/guard.js';

delete process.env.TURNSTILE_SECRET_KEY;
const app = express();
app.use(express.json());
app.use('/api/copilot', copilotRouter);
const server = app.listen(0, '127.0.0.1');
await new Promise((resolve) => server.once('listening', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const realFetch = globalThis.fetch;
let grant = { url: 'wss://copilot.design-bakery.com', token: 'test-grant' };
// How many of the next token requests fail, as a voice service that is still waking up does.
let failures = 0;
let tokenCalls = 0;
let wakeCalls = 0;
globalThis.fetch = (input, init) => {
  if (String(input) === 'https://copilot.design-bakery.com/api/voice/options' && init?.method === 'POST') {
    wakeCalls += 1;
    return Promise.resolve(Response.json({}));
  }
  if (String(input) !== 'https://copilot.design-bakery.com/api/voice/token') return realFetch(input, init);
  tokenCalls += 1;
  if (failures > 0) {
    failures -= 1;
    return Promise.reject(new Error('timed out'));
  }
  return Promise.resolve(Response.json(grant));
};
try {
  assert.equal((await fetch(`${base}/api/copilot/voice`, { method: 'POST' })).status, 401);
  const pass = (await issuePass('', '127.0.0.1')).pass;
  const headers = { 'x-copilot-pass': pass };
  const ok = await fetch(`${base}/api/copilot/voice`, { method: 'POST', headers });
  assert.equal(ok.status, 200);
  const body = await ok.json();
  assert.deepEqual({ url: body.url, token: body.token }, grant);
  assert.equal(typeof body.call, 'string');
  // A sleeping service: the first try fails, the retry gets the grant.
  failures = 1;
  tokenCalls = 0;
  assert.equal((await fetch(`${base}/api/copilot/voice`, { method: 'POST', headers })).status, 200);
  assert.equal(tokenCalls, 2);
  // Two failures in a row: the visitor is told voice is unavailable.
  failures = 2;
  assert.equal((await fetch(`${base}/api/copilot/voice`, { method: 'POST', headers })).status, 503);
  // The warm-up needs no pass, answers at once and wakes the agent (voice/options), once a minute at most.
  assert.equal((await fetch(`${base}/api/copilot/voice/warm`, { method: 'POST' })).status, 204);
  assert.equal((await fetch(`${base}/api/copilot/voice/warm`, { method: 'POST' })).status, 204);
  assert.equal(wakeCalls, 1);
  grant = { url: 'wss://untrusted.example', token: 'bad' };
  assert.equal((await fetch(`${base}/api/copilot/voice`, { method: 'POST', headers })).status, 503);
  console.log('voice gateway: pass required, valid grant accepted, one retry, warm-up wakes the agent, untrusted origin rejected');
} finally {
  globalThis.fetch = realFetch;
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}
