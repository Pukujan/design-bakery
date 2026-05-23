/**
 * Backend env: `backend/.env` + `backend/.env.local`.
 * Legacy fallbacks: repo root `.env`, `backend/services/.env`.
 */
import { resolve } from 'node:path';
import { applyEnvFile, backendDir, servicesDir, repoRoot } from './env-utils.mjs';

export const backendEnvPaths = {
  env: resolve(backendDir, '.env'),
  local: resolve(backendDir, '.env.local'),
};

export function loadBackendEnv() {
  applyEnvFile(backendEnvPaths.env);
  applyEnvFile(backendEnvPaths.local, { override: true });
  applyEnvFile(resolve(repoRoot, '.env'), {
    override: false,
    filterKey: (key) => !key.startsWith('VITE_'),
  });
  applyEnvFile(resolve(repoRoot, '.env.local'), {
    override: false,
    filterKey: (key) => !key.startsWith('VITE_'),
  });
  applyEnvFile(resolve(servicesDir, '.env'), { override: false });
}
