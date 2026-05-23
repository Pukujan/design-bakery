#!/usr/bin/env node
/** Starts Vite dev server. Use dev:stack for Vite + Express API. */
import { spawn, spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadFrontendEnv } from './load-frontend-env.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const frontendDir = resolve(root, 'frontend');

loadFrontendEnv();
const viteEnv = { ...process.env };

const freeVite = spawnSync('node', ['scripts/free-dev-port.mjs'], {
  cwd: root,
  stdio: 'inherit',
  encoding: 'utf8',
  env: viteEnv,
});
if (freeVite.status !== 0) process.exit(freeVite.status ?? 1);

console.log('[dev] Vite only — for publish kit + CMS run pnpm run dev:stack');

const child = spawn('pnpm', ['run', 'dev'], {
  cwd: frontendDir,
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: viteEnv,
});
child.on('exit', (code) => process.exit(code ?? 1));
