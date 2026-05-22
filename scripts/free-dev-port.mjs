#!/usr/bin/env node
/**
 * Frees the Vite dev port so `pnpm run dev` stays on 5300 with a working Functions proxy.
 * A stale Vite on 5300 (no emulator proxy) causes 404 on invokeBlogPublishKit.
 */
import { execSync } from 'node:child_process';
import { readDevPortBase } from './resolve-dev-port.mjs';

const base = Number(process.env.VITE_DEV_PORT_BASE || process.env.DEV_PORT_BASE) || readDevPortBase();
const span = Number(process.env.VITE_DEV_PORT_FREE_SPAN || 6);

function pidsOnPort(p) {
  try {
    return execSync(`lsof -ti:${p}`, { encoding: 'utf8' })
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((id) => Number(id));
  } catch {
    return [];
  }
}

function stopPid(pid) {
  try {
    process.kill(pid, 'SIGTERM');
    return true;
  } catch {
    return false;
  }
}

function forceKill(pid) {
  try {
    process.kill(pid, 'SIGKILL');
  } catch {
    /* already gone */
  }
}

const seen = new Set();
for (let offset = 0; offset < span; offset++) {
  for (const pid of pidsOnPort(base + offset)) seen.add(pid);
}

if (seen.size === 0) {
  process.exit(0);
}

console.log(
  `[dev] Ports ${base}–${base + span - 1}: stopping ${seen.size} stale Vite/process(es)…`,
);
for (const pid of seen) {
  if (stopPid(pid)) console.log(`[dev]   SIGTERM pid ${pid}`);
}

execSync('sleep 0.4');
for (let offset = 0; offset < span; offset++) {
  for (const pid of pidsOnPort(base + offset)) {
    if (!seen.has(pid)) continue;
    console.log(`[dev]   SIGKILL pid ${pid}`);
    forceKill(pid);
  }
}

for (let offset = 0; offset < span; offset++) {
  if (pidsOnPort(base + offset).length > 0) {
    console.warn(
      `[dev] Could not free port ${base + offset}. Run: lsof -ti:${base + offset} | xargs kill -9`,
    );
    process.exit(1);
  }
}

console.log(`[dev] Port ${base} is free.`);
