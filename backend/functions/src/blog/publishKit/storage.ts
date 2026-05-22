import { getStorage } from 'firebase-admin/storage';
import { ensureFirebaseAdminApp, resolveStorageBucket } from '../../firebaseApp.js';
import { isFunctionsEmulator } from '../../emulator.js';

function storageEmulatorHost(): string | undefined {
  return process.env.FIREBASE_STORAGE_EMULATOR_HOST?.trim() || undefined;
}

function skipProductionStorageUpload(): boolean {
  const v = (process.env.PUBLISH_KIT_SKIP_PRODUCTION_STORAGE ?? '').trim().toLowerCase();
  return v === 'true' || v === '1';
}

/** Media URL for objects saved to the Storage emulator (only if Java + storage emulator are running). */
export function buildStorageEmulatorMediaUrl(bucketName: string, objectPath: string): string {
  const host = storageEmulatorHost() ?? '127.0.0.1:9199';
  const encoded = encodeURIComponent(objectPath);
  return `http://${host}/v0/b/${bucketName}/o/${encoded}?alt=media`;
}

export async function uploadBlogImage(params: {
  numericId: number;
  kind: 'og' | 'cover' | 'thumbnail' | 'og_thumb';
  png: Buffer;
}): Promise<{ url: string; path: string } | null> {
  const inFunctionsEmu = isFunctionsEmulator();
  const storageEmu = storageEmulatorHost();

  if (inFunctionsEmu && !storageEmu && skipProductionStorageUpload()) {
    console.warn(
      '[publishKit] Storage upload skipped (PUBLISH_KIT_SKIP_PRODUCTION_STORAGE=true). Remove it from backend/.env to upload on save.',
    );
    return null;
  }

  try {
    ensureFirebaseAdminApp();
    const bucket = getStorage().bucket(resolveStorageBucket());
    const ts = Date.now();
    const path = `blog-publish/${params.numericId}/${params.kind}-${ts}.png`;
    const file = bucket.file(path);
    await file.save(params.png, {
      metadata: { contentType: 'image/png', cacheControl: 'public, max-age=31536000' },
    });

    if (inFunctionsEmu && storageEmu) {
      return { url: buildStorageEmulatorMediaUrl(bucket.name, path), path };
    }

    await file.makePublic();
    const url = `https://storage.googleapis.com/${bucket.name}/${path}`;
    return { url, path };
  } catch (err) {
    console.warn('[publishKit] Storage upload failed:', err);
    return null;
  }
}
