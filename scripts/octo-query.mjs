#!/usr/bin/env node
// Post a .sql file to Octo's workspace query endpoint (POST /api/workspaces/:id/query).
// Usage: node scripts/octo-query.mjs <file.sql> [--read]
// Reads OCTO_WS_KEY and OCTO_WORKSPACE_ID from the environment.
import { readFileSync } from 'node:fs';

const [, , file, ...flags] = process.argv;
if (!file) {
  console.error('usage: node scripts/octo-query.mjs <file.sql> [--read]');
  process.exit(2);
}

const base = (process.env.OCTO_API_BASE || 'https://octodb.design-bakery.com').replace(/\/$/, '');
const workspace = process.env.OCTO_WORKSPACE_ID;
const key = process.env.OCTO_WS_KEY;
if (!workspace || !key) {
  console.error('OCTO_WORKSPACE_ID and OCTO_WS_KEY must be set');
  process.exit(2);
}

const sql = readFileSync(file, 'utf8');
const res = await fetch(`${base}/api/workspaces/${workspace}/query`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ sql, ...(flags.includes('--read') ? { readOnly: true } : {}) }),
});

const text = await res.text();
console.log(`HTTP ${res.status}`);
try {
  console.log(JSON.stringify(JSON.parse(text), null, 2));
} catch {
  console.log(text);
}
process.exitCode = res.ok ? 0 : 1;
