/**
 * Frontend env: `frontend/.env` + `frontend/.env.local` (Vite envDir matches).
 */
import { resolve } from 'node:path';
import { applyEnvFile, frontendDir, readEnvFileFlag, repoRoot } from './env-utils.mjs';

export const frontendEnvPaths = {
  env: resolve(frontendDir, '.env'),
  local: resolve(frontendDir, '.env.local'),
};

export function loadFrontendEnv() {
  applyEnvFile(frontendEnvPaths.env);
  applyEnvFile(frontendEnvPaths.local, { override: true });
  // Legacy repo root (pre frontend/ folder)
  applyEnvFile(resolve(repoRoot, '.env'), { override: false, filterKey: (k) => k.startsWith('VITE_') });
  applyEnvFile(resolve(repoRoot, '.env.local'), {
    override: true,
    filterKey: (k) => k.startsWith('VITE_'),
  });
}

export function readFrontendEnvFlag(name) {
  if (process.env[name] === 'true' || process.env[name] === '1') return true;
  return (
    readEnvFileFlag(frontendEnvPaths.env, name) ||
    readEnvFileFlag(frontendEnvPaths.local, name) ||
    readEnvFileFlag(resolve(repoRoot, '.env'), name)
  );
}
