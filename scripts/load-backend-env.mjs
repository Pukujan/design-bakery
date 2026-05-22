/**
 * Backend env: `backend/.env` + `backend/.env.local`.
 * Legacy: `server/.env`, non-VITE keys from repo root `.env`, `functions/.env`.
 */
import { resolve } from 'node:path';
import { applyEnvFile, backendDir, functionsDir, repoRoot } from './env-utils.mjs';

export const backendEnvPaths = {
  env: resolve(backendDir, '.env'),
  local: resolve(backendDir, '.env.local'),
};

export function loadBackendEnv() {
  applyEnvFile(backendEnvPaths.env);
  applyEnvFile(backendEnvPaths.local, { override: true });
  applyEnvFile(resolve(repoRoot, 'server', '.env'), { override: false });
  applyEnvFile(resolve(repoRoot, '.env'), {
    override: false,
    filterKey: (key) => !key.startsWith('VITE_'),
  });
  applyEnvFile(resolve(repoRoot, '.env.local'), {
    override: false,
    filterKey: (key) => !key.startsWith('VITE_'),
  });
  applyEnvFile(resolve(functionsDir, '.env'), { override: false });
}
