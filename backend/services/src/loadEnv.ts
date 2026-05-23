import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const servicesDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const backendDir = resolve(servicesDir, '..');
const repoRoot = resolve(backendDir, '..');

/** Backend env: `backend/.env` (+ legacy paths). */
export function loadProjectEnv(): void {
  const serverEnv = resolve(backendDir, '.env');
  const serverLocal = resolve(backendDir, '.env.local');
  const legacyServerEnv = resolve(repoRoot, 'server', '.env');
  const legacyRootEnv = resolve(repoRoot, '.env');
  const legacyRootLocal = resolve(repoRoot, '.env.local');
  const legacyServicesEnv = resolve(servicesDir, '.env');

  if (existsSync(serverEnv)) {
    loadEnv({ path: serverEnv, quiet: true });
  }
  if (existsSync(serverLocal)) {
    loadEnv({ path: serverLocal, override: true, quiet: true });
  }
  if (existsSync(legacyRootEnv)) {
    loadEnv({ path: legacyRootEnv, quiet: true });
  }
  if (existsSync(legacyRootLocal)) {
    loadEnv({ path: legacyRootLocal, override: true, quiet: true });
  }
  if (existsSync(legacyServerEnv)) {
    loadEnv({ path: legacyServerEnv, override: false, quiet: true });
  }
  if (existsSync(legacyServicesEnv)) {
    loadEnv({ path: legacyServicesEnv, override: false, quiet: true });
  }

  // Drop VITE_* from process.env so emulator never treats them as backend overrides.
  for (const key of Object.keys(process.env)) {
    if (key.startsWith('VITE_')) delete process.env[key];
  }
}

export const projectRoot = repoRoot;
