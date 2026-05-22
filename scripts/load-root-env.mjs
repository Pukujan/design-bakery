/**
 * @deprecated Prefer loadFrontendEnv + loadBackendEnv. Loads both (for tests).
 */
import { loadBackendEnv } from './load-backend-env.mjs';
import { loadFrontendEnv } from './load-frontend-env.mjs';

export function loadRootEnv() {
  loadFrontendEnv();
  loadBackendEnv();
}
