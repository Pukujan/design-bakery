/**
 * Load repo root `.env` into process.env (for dev scripts and test runners).
 * Mirrors functions/src/loadEnv.ts — keep in sync.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const functionsDir = resolve(root, 'functions');

function applyEnvFile(path, { override = true } = {}) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i <= 0) continue;
    const key = t.slice(0, i).trim();
    const value = t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
    if (!override && process.env[key] !== undefined) continue;
    process.env[key] = value;
  }
}

export function loadRootEnv() {
  applyEnvFile(resolve(root, '.env'), { override: true });
  applyEnvFile(resolve(root, '.env.local'), { override: true });
  applyEnvFile(resolve(functionsDir, '.env'), { override: false });
}
