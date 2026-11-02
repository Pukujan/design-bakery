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
globalThis.fetch = (input, init) => String(input) === 'https://copilot.design-bakery.com/api/voice/token'
  ? Promise.resolve(Response.json(grant)) : realFetch(input, init);
try {
  assert.equal((await fetch(`${base}/api/copilot/voice`, { method: 'POST' })).status, 401);
  const pass = (await issuePass('', '127.0.0.1')).pass;
  const headers = { 'x-copilot-pass': pass };
  const ok = await fetch(`${base}/api/copilot/voice`, { method: 'POST', headers });
  assert.equal(ok.status, 200);
  assert.deepEqual(await ok.json(), grant);
  grant = { url: 'wss://untrusted.example', token: 'bad' };
  assert.equal((await fetch(`${base}/api/copilot/voice`, { method: 'POST', headers })).status, 503);
  console.log('voice gateway: pass required, valid grant accepted, untrusted origin rejected');
} finally {
  globalThis.fetch = realFetch;
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}
