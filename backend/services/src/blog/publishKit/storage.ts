/** Blog image uploads — Supabase Storage. See guidelines/agent-devlog-supabase-migration.md */
import {
  resolveImageStorageBackend,
  supabaseAdmin,
  supabaseStorageBucket,
} from '../../supabaseClient.js';

export type BlogImageKind = 'og' | 'cover' | 'thumbnail' | 'og_thumb' | 'og_social';

function objectPath(params: { numericId: number; kind: string; ext: string }): string {
  const ts = Date.now();
  return `blog-publish/${params.numericId}/${params.kind}-${ts}.${params.ext}`;
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

async function uploadBlogAssetSupabase(params: {
  numericId: number;
  kind: BlogImageKind;
  buffer: Buffer;
  contentType: string;
  ext: string;
}): Promise<{ url: string; path: string }> {
  await assertSupabaseBucketIsPublic();
  const path = objectPath(params);
  const bucket = supabaseStorageBucket();
  const supabase = supabaseAdmin();
  const { error } = await supabase.storage.from(bucket).upload(path, params.buffer, {
    contentType: params.contentType,
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

export async function uploadBlogImage(params: {
  numericId: number;
  kind: Exclude<BlogImageKind, 'og_social'>;
  png: Buffer;
}): Promise<{ url: string; path: string } | null> {
  return uploadBlogAsset({
    numericId: params.numericId,
    kind: params.kind,
    buffer: params.png,
    contentType: 'image/png',
    ext: 'png',
  });
}

export async function uploadBlogAsset(params: {
  numericId: number;
  kind: BlogImageKind;
  buffer: Buffer;
  contentType: string;
  ext: string;
}): Promise<{ url: string; path: string } | null> {
  try {
    if (resolveImageStorageBackend() !== 'supabase') {
      throw new Error('Only Supabase Storage is supported. Set IMAGE_STORAGE=supabase in backend/.env.');
    }
    return await uploadBlogAssetSupabase(params);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[publishKit] Storage upload failed:', message);
    if (/Supabase Storage/i.test(message)) {
      throw err;
    }
    throw new Error(`Storage upload failed: ${message}`);
  }
}
