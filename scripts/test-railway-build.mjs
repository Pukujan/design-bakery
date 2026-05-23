#!/usr/bin/env node
/**
 * Simulate Railway/Nixpacks build locally (clean copy, no node_modules).
 * Mirrors nixpacks.toml install + railway.toml build + health check.
 *
 * Usage: node scripts/test-railway-build.mjs
 */
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const buildDir = mkdtempSync(join(tmpdir(), 'design-bakery-railway-'));

function run(cmd, args, opts = {}) {
  console.log(`\n> ${cmd} ${args.join(' ')}`);
  const r = spawnSync(cmd, args, {
    cwd: opts.cwd ?? buildDir,
    stdio: 'inherit',
    env: { ...process.env, ...opts.env },
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

async function main() {
  console.log(`Railway build simulation → ${buildDir}`);
  cpSync(root, buildDir, {
    recursive: true,
    filter: (src) => {
      const rel = src.slice(root.length + 1);
      if (!rel) return true;
      if (rel.startsWith('node_modules')) return false;
      if (rel.startsWith('.git')) return false;
      if (rel === 'frontend/dist') return false;
      if (rel === 'backend/lib' || rel.startsWith('backend/lib/')) return false;
      if (rel === 'backend/services/lib' || rel.startsWith('backend/services/lib/')) return false;
      if (rel === 'deploy') return false;
      return true;
    },
  });

  run('pnpm', ['install', '--frozen-lockfile', '--prod=false']);
  run('pnpm', ['--dir', 'backend/services', 'run', 'build']);
  run('pnpm', ['--dir', 'backend', 'run', 'build']);

  const port = '18787';
  const server = spawn('node', ['backend/lib/server.js'], {
    cwd: buildDir,
    env: { ...process.env, PORT: port },
    stdio: 'pipe',
  });
  await new Promise((r) => setTimeout(r, 2500));
  const health = spawnSync('curl', ['-sf', `http://127.0.0.1:${port}/health`], {
    encoding: 'utf8',
  });
  server.kill('SIGTERM');
  if (health.status !== 0) {
    console.error('Health check failed');
    process.exit(1);
  }
  console.log(`\nHealth: ${health.stdout.trim()}`);
  console.log('\nRailway build simulation OK');
}

try {
  await main();
} finally {
  rmSync(buildDir, { recursive: true, force: true });
}
