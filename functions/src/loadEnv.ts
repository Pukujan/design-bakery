import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const functionsDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(functionsDir, '..');

/**
 * Single source of truth: repo root `.env` (+ optional `.env.local`).
 * Legacy `functions/.env` only fills keys not already set (migrate to root).
 */
export function loadProjectEnv(): void {
  const rootEnv = resolve(repoRoot, '.env');
  const rootLocal = resolve(repoRoot, '.env.local');
  const legacyFunctionsEnv = resolve(functionsDir, '.env');

  if (existsSync(rootEnv)) {
    loadEnv({ path: rootEnv, quiet: true });
  }
  if (existsSync(rootLocal)) {
    loadEnv({ path: rootLocal, override: true, quiet: true });
  }
  if (existsSync(legacyFunctionsEnv)) {
    loadEnv({ path: legacyFunctionsEnv, override: false, quiet: true });
  }
}

export const projectRoot = repoRoot;
