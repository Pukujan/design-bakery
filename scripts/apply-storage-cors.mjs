#!/usr/bin/env node
/**
 * Apply GCS CORS to the Firebase Storage bucket (fixes browser uploadBytes from localhost).
 * Requires: gcloud CLI (or gsutil) authenticated for the Firebase project.
 *
 *   pnpm run storage:cors
 *   FIREBASE_STORAGE_BUCKET=my-bucket.firebasestorage.app pnpm run storage:cors
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const corsFile = resolve(root, 'archive/firebase/storage.cors.json');

function readBucketFromEnvFile(path) {
  if (!existsSync(path)) return '';
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^\s*FIREBASE_STORAGE_BUCKET=(.+)\s*$/);
    if (m) return m[1].trim().replace(/^["']|["']$/g, '');
  }
  return '';
}

const bucket =
  process.env.FIREBASE_STORAGE_BUCKET?.trim() ||
  readBucketFromEnvFile(resolve(root, 'backend/.env')) ||
  readBucketFromEnvFile(resolve(root, 'frontend/.env')) ||
  'auth-system-be464.firebasestorage.app';

const gsUrl = `gs://${bucket}`;

if (!existsSync(corsFile)) {
  console.error('[storage:cors] Missing', corsFile);
  process.exit(1);
}

console.log(`[storage:cors] Applying ${corsFile} → ${gsUrl}`);

const attempts = [
  ['gcloud', ['storage', 'buckets', 'update', gsUrl, `--cors-file=${corsFile}`]],
  ['gsutil', ['cors', 'set', corsFile, gsUrl]],
];

let ok = false;
for (const [cmd, args] of attempts) {
  const r = spawnSync(cmd, args, { stdio: 'inherit' });
  if (r.status === 0) {
    ok = true;
    console.log(`[storage:cors] Done (${cmd}). Retry Save post in admin.`);
    break;
  }
  if (r.error?.code === 'ENOENT') continue;
}

if (!ok) {
  console.error(
    '[storage:cors] Failed. Install Google Cloud SDK, run: gcloud auth login\n' +
      `Then: gcloud storage buckets update ${gsUrl} --cors-file=archive/firebase/storage.cors.json`,
  );
  process.exit(1);
}
