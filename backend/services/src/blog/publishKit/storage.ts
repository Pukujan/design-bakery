/** Blog image uploads — Supabase Storage (preferred) or legacy Firebase. See guidelines/agent-devlog-supabase-migration.md */
import { adminStorage, ensureFirebaseAdminApp, resolveStorageBucket } from '../../firebaseApp.js';
import { isFunctionsEmulator } from '../../emulator.js';
import {
  resolveImageStorageBackend,
  supabaseAdmin,
  supabaseStorageBucket,
} from '../../supabaseClient.js';

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

function objectPath(params: { numericId: number; kind: string }): string {
  const ts = Date.now();
  return `blog-publish/${params.numericId}/${params.kind}-${ts}.png`;
}

async function assertSupabaseBucketIsPublic(): Promise<void> {
  const bucket = supabaseStorageBucket();
  const { data, error } = await supabaseAdmin().storage.listBuckets();
  if (error) {
    throw new Error(`Supabase Storage list failed: ${error.message}`);
  }
  const match = data?.find((b) => b.name === bucket);
  if (!match) {
    throw new Error(
      `Supabase bucket "${bucket}" not found. Create it in Supabase Dashboard → Storage (name must match SUPABASE_STORAGE_BUCKET).`,
    );
  }
  if (!match.public) {
    throw new Error(
      `Supabase bucket "${bucket}" is private. Open Storage → ${bucket} → Settings → enable Public bucket so OG/cover previews and social cards work.`,
    );
  }
}

async function uploadBlogImageSupabase(params: {
  numericId: number;
  kind: 'og' | 'cover' | 'thumbnail' | 'og_thumb';
  png: Buffer;
}): Promise<{ url: string; path: string }> {
  await assertSupabaseBucketIsPublic();
  const path = objectPath(params);
  const bucket = supabaseStorageBucket();
  const supabase = supabaseAdmin();
  const { error } = await supabase.storage.from(bucket).upload(path, params.png, {
    contentType: 'image/png',
    cacheControl: '31536000',
    upsert: false,
  });
  if (error) {
    throw new Error(`Supabase Storage upload failed: ${error.message}`);
  }
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  if (!data.publicUrl) {
    throw new Error('Supabase Storage did not return a public URL. Make the bucket public in Supabase → Storage.');
  }
  return { url: data.publicUrl, path };
}

async function uploadBlogImageFirebase(params: {
  numericId: number;
  kind: 'og' | 'cover' | 'thumbnail' | 'og_thumb';
  png: Buffer;
}): Promise<{ url: string; path: string }> {
  ensureFirebaseAdminApp();
  const bucket = adminStorage().bucket(resolveStorageBucket());
  const path = objectPath(params);
  const file = bucket.file(path);
  await file.save(params.png, {
    metadata: { contentType: 'image/png', cacheControl: 'public, max-age=31536000' },
  });

  const inFunctionsEmu = isFunctionsEmulator();
  const storageEmu = storageEmulatorHost();
  if (inFunctionsEmu && storageEmu) {
    return { url: buildStorageEmulatorMediaUrl(bucket.name, path), path };
  }

  const encoded = encodeURIComponent(path);
  const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encoded}?alt=media`;
  try {
    await file.makePublic();
  } catch {
    /* optional — public URL above works when storage.rules allow read */
  }
  return { url, path };
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
    const backend = resolveImageStorageBackend();
    if (backend === 'supabase') {
      return await uploadBlogImageSupabase(params);
    }
    return await uploadBlogImageFirebase(params);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[publishKit] Storage upload failed:', message);
    if (/bucket does not exist|notFound/i.test(message)) {
      throw new Error(
        'Firebase Storage bucket not found. Enable Storage in Firebase Console or switch to Supabase: ' +
          'set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_STORAGE_BUCKET in backend/.env.',
      );
    }
    if (/Supabase Storage/i.test(message)) {
      throw err;
    }
    throw new Error(`Storage upload failed: ${message}`);
  }
}
