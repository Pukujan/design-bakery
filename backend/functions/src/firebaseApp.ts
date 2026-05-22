import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';

const functionsDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const backendDir = resolve(functionsDir, '..');
const repoRoot = resolve(backendDir, '..');

function readFirebaseProjectId(): string {
  try {
    const rc = JSON.parse(readFileSync(resolve(repoRoot, '.firebaserc'), 'utf8'));
    return rc.projects?.default ?? 'auth-system-be464';
  } catch {
    return 'auth-system-be464';
  }
}

function readEnvFile(path: string): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    for (const line of readFileSync(path, 'utf8').split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const i = t.indexOf('=');
      if (i <= 0) continue;
      out[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
    }
  } catch {
    /* missing file */
  }
  return out;
}

export function resolveStorageBucket(): string {
  const fromEnv =
    process.env.FIREBASE_STORAGE_BUCKET?.trim() ||
    process.env.VITE_FIREBASE_STORAGE_BUCKET?.trim() ||
    process.env.STORAGE_BUCKET?.trim();
  if (fromEnv) return fromEnv;

  const merged = {
    ...readEnvFile(resolve(backendDir, '.env')),
    ...readEnvFile(resolve(backendDir, '.env.local')),
    ...readEnvFile(resolve(repoRoot, 'frontend', '.env')),
    ...readEnvFile(resolve(repoRoot, 'server', '.env')),
    ...readEnvFile(resolve(repoRoot, '.env')),
    ...readEnvFile(resolve(functionsDir, '.env')),
  };
  const fromFiles =
    merged.FIREBASE_STORAGE_BUCKET ||
    merged.VITE_FIREBASE_STORAGE_BUCKET ||
    merged.STORAGE_BUCKET;
  if (fromFiles) return fromFiles;

  return `${readFirebaseProjectId()}.firebasestorage.app`;
}

/** Single admin app with explicit Storage bucket (required outside Cloud Functions runtime). */
export function ensureFirebaseAdminApp(): App {
  const storageBucket = resolveStorageBucket();
  const existing = getApps()[0];
  if (existing) return existing;

  const json = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON?.trim();
  if (json) {
    const credential = cert(JSON.parse(json) as Parameters<typeof cert>[0]);
    return initializeApp({ credential, storageBucket });
  }

  return initializeApp({ storageBucket });
}
