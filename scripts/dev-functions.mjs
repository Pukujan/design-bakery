#!/usr/bin/env node
/**
 * Build functions once, then start the emulator with minimal CLI noise.
 * Verbose: node scripts/dev-functions.mjs --verbose
 */
import { spawn, spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadBackendEnv } from './load-backend-env.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
loadBackendEnv();
const verbose = process.argv.includes('--verbose');

function log(msg) {
  console.log(`[functions] ${msg}`);
}

/** Firebase CLI noise we hide in quiet mode (errors still pass through). */
function isQuietNoise(line) {
  return (
    /^[⚠i]/.test(line) ||
    /^[┌│└├═]/.test(line) ||
    /Serving at port \d+/.test(line) ||
    /Issues\? Report/.test(line) ||
    /injected env/.test(line) ||
    /firebase-functions@/.test(line) ||
    /firebase login/.test(line) ||
    /http function initialized/.test(line) ||
    /Watching .* for Cloud Functions/.test(line)
  );
}

const free = spawnSync('node', ['scripts/free-emulator-port.mjs'], {
  cwd: root,
  stdio: verbose ? 'inherit' : 'pipe',
  encoding: 'utf8',
});
if (free.status !== 0) process.exit(free.status ?? 1);

if (verbose) log('building…');
const build = spawnSync('pnpm', ['--dir', 'backend/services', 'run', 'build'], {
  cwd: root,
  stdio: verbose ? 'inherit' : 'pipe',
  encoding: 'utf8',
});
if (build.status !== 0) {
  if (!verbose && build.stderr) process.stderr.write(build.stderr);
  process.exit(build.status ?? 1);
}

log('starting (functions :5001, proxied via Vite — images upload to project Storage)');

const emuArgs = [
  'exec',
  'firebase',
  'emulators:start',
  '--config',
  'firebase/firebase.json',
  '--only',
  'functions',
  '--log-verbosity',
  verbose ? 'INFO' : 'QUIET',
];
const child = spawn('pnpm', emuArgs, {
  cwd: root,
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: process.platform === 'win32',
  env: process.env,
});

let announcedReady = false;
function onLine(line) {
  const t = line.trim();
  if (!t) return;

  if (verbose) {
    console.log(`[functions] ${t}`);
    return;
  }

  if (isQuietNoise(t)) {
    if (!announcedReady && /All emulators ready/i.test(t)) {
      announcedReady = true;
      log('ready — invokeBlogAgent, invokeBlogPublishKit');
    }
    return;
  }

  if (!announcedReady && /Loaded functions definitions/i.test(t)) {
    announcedReady = true;
    log('ready — invokeBlogAgent, invokeBlogPublishKit');
    return;
  }

  if (/error|Error:|Could not start|failed with exit/i.test(t)) {
    console.log(`[functions] ${t}`);
  }
}

child.stdout?.on('data', (buf) => {
  for (const line of buf.toString().split('\n')) onLine(line);
});
child.stderr?.on('data', (buf) => {
  for (const line of buf.toString().split('\n')) onLine(line);
});

child.on('exit', (code) => process.exit(code ?? 1));
