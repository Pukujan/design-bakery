#!/usr/bin/env node
/**
 * Frees the Functions emulator port before `pnpm run dev` starts a new instance.
 * Stale `firebase emulators` from a prior terminal commonly block :5001.
 */
import { execSync } from 'node:child_process';

const port = Number(process.env.FUNCTIONS_EMULATOR_PORT || 5001);

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

const pids = pidsOnPort(port);
if (pids.length === 0) {
  process.exit(0);
}

console.log(`[dev] Port ${port} in use — stopping ${pids.length} stale process(es)…`);
for (const pid of pids) {
  if (stopPid(pid)) console.log(`[dev]   SIGTERM pid ${pid}`);
}

// Give graceful shutdown a moment, then force-kill stragglers.
execSync('sleep 0.4');
for (const pid of pidsOnPort(port)) {
  console.log(`[dev]   SIGKILL pid ${pid}`);
  forceKill(pid);
}

if (pidsOnPort(port).length > 0) {
  console.warn(`[dev] Could not free port ${port}. Run: lsof -ti:${port} | xargs kill -9`);
  process.exit(1);
}

console.log(`[dev] Port ${port} is free.`);
