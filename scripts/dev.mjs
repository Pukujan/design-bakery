#!/usr/bin/env node
/**
 * Starts Vite and (when enabled) the Firebase Functions emulator in one terminal.
 * Frontend: `frontend/`. Backend secrets: `backend/.env` (Functions only).
 */
import { spawn, spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadBackendEnv } from './load-backend-env.mjs';
import { loadFrontendEnv, readFrontendEnvFlag } from './load-frontend-env.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const frontendDir = resolve(root, 'frontend');

loadFrontendEnv();
const viteEnv = { ...process.env };
const verbose = process.argv.includes('--verbose');

function shouldStartFunctionsEmulator() {
  if (readFrontendEnvFlag('VITE_DEV_WEB_ONLY')) return false;
  if (readFrontendEnvFlag('VITE_BLOG_API_URL') || viteEnv.VITE_BLOG_API_URL?.trim()) {
    return false;
  }
  loadBackendEnv();
  const hasOpenRouter = process.env.OPENROUTER_API_KEY?.trim().startsWith('sk-');
  if (hasOpenRouter) return true;
  return (
    readFrontendEnvFlag('VITE_USE_FUNCTIONS_EMULATOR') ||
    readFrontendEnvFlag('VITE_ENABLE_BLOG_AGENTS') ||
    readFrontendEnvFlag('VITE_ENABLE_BLOG_PUBLISH_KIT')
  );
}

const useFunctions = shouldStartFunctionsEmulator();

const freeVite = spawnSync('node', ['scripts/free-dev-port.mjs'], {
  cwd: root,
  stdio: 'inherit',
  encoding: 'utf8',
  env: viteEnv,
});
if (freeVite.status !== 0) process.exit(freeVite.status ?? 1);

if (!useFunctions) {
  console.log(
    '[dev] Vite only — set VITE_BLOG_API_URL in frontend/.env or OPENROUTER_API_KEY in backend/.env.',
  );
  const child = spawn('pnpm', ['run', 'dev'], {
    cwd: frontendDir,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: viteEnv,
  });
  child.on('exit', (code) => process.exit(code ?? 1));
} else {
  console.log(
    verbose
      ? '[dev] Vite + Functions emulator (verbose) — open the URL Vite prints'
      : '[dev] Vite + Functions emulator — one terminal (pnpm run dev:verbose for Firebase logs)',
  );
  const concurrentlyArgs = [
    'exec',
    'concurrently',
    '--kill-others-on-fail',
    '-n',
    'vite,fn',
    '-c',
    'cyan,magenta',
    'pnpm --dir frontend run dev',
    verbose ? 'node scripts/dev-functions.mjs --verbose' : 'node scripts/dev-functions.mjs',
  ];

  const child = spawn('pnpm', concurrentlyArgs, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...viteEnv, ...process.env },
  });
  child.on('exit', (code) => process.exit(code ?? 1));
}
