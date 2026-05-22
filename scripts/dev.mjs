#!/usr/bin/env node
/**
 * Starts Vite and (when enabled) the Firebase Functions emulator in one terminal.
 * Reads root `.env` for VITE_USE_FUNCTIONS_EMULATOR / blog feature flags.
 *
 * Quiet by default. Full Firebase logs: `pnpm run dev:verbose`
 */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadRootEnv } from './load-root-env.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
loadRootEnv();
const verbose = process.argv.includes('--verbose');

function readRootEnvFlag(name) {
  if (process.env[name] === 'true' || process.env[name] === '1') return true;
  const envPath = resolve(root, '.env');
  if (!existsSync(envPath)) return false;
  const line = readFileSync(envPath, 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.startsWith(`${name}=`) && !l.startsWith('#'));
  if (!line) return false;
  const value = line.slice(name.length + 1).trim().replace(/^["']|["']$/g, '');
  return value === 'true' || value === '1';
}

function shouldStartFunctionsEmulator() {
  return (
    readRootEnvFlag('VITE_USE_FUNCTIONS_EMULATOR') ||
    readRootEnvFlag('VITE_ENABLE_BLOG_AGENTS') ||
    readRootEnvFlag('VITE_ENABLE_BLOG_PUBLISH_KIT')
  );
}

const useFunctions = shouldStartFunctionsEmulator();

// Stale Vite on 5300 breaks the Functions proxy → 404 on callables when dev bumps to 5301.
const freeVite = spawnSync('node', ['scripts/free-dev-port.mjs'], {
  cwd: root,
  stdio: 'inherit',
  encoding: 'utf8',
});
if (freeVite.status !== 0) process.exit(freeVite.status ?? 1);

if (!useFunctions) {
  console.log('[dev] Vite only — set VITE_USE_FUNCTIONS_EMULATOR=true for callables.');
  const child = spawn('pnpm', ['exec', 'vite'], {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: process.env,
  });
  child.on('exit', (code) => process.exit(code ?? 1));
} else {
  console.log(
    verbose
      ? '[dev] Vite + Functions (verbose emulator logs)'
      : '[dev] Vite + Functions — quiet mode (pnpm run dev:verbose for full logs)',
  );
  const concurrentlyArgs = [
    'exec',
    'concurrently',
    '--kill-others-on-fail',
    '-n',
    'vite,fn',
    '-c',
    'cyan,magenta',
    'pnpm exec vite',
    verbose ? 'node scripts/dev-functions.mjs --verbose' : 'node scripts/dev-functions.mjs',
  ];

  const child = spawn('pnpm', concurrentlyArgs, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: process.env,
  });
  child.on('exit', (code) => process.exit(code ?? 1));
}
