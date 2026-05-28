import { supabaseAdmin, supabaseStorageBucket } from '../supabaseClient.js';

export function coverStudioObjectPath(assetId: string, filename: string, ext: string): string {
  const base = filename.replace(/\.[^.]+$/, '').replace(/[^\w.-]+/g, '-').slice(0, 60) || 'image';
  return `cover-studio-library/${assetId}/${base}-${Date.now()}.${ext}`;
}

export async function uploadCoverStudioBuffer(params: {
  assetId: string;
  filename: string;
  buffer: Buffer;
  contentType: string;
  ext: string;
}): Promise<{ url: string; path: string }> {
  const bucket = supabaseStorageBucket();
  const path = coverStudioObjectPath(params.assetId, params.filename, params.ext);
  const { error } = await supabaseAdmin().storage.from(bucket).upload(path, params.buffer, {
    contentType: params.contentType,
    cacheControl: '31536000',
    upsert: false,
  });
  if (error) throw new Error(`Cover Studio storage upload failed: ${error.message}`);

  const { data } = supabaseAdmin().storage.from(bucket).getPublicUrl(path);
  if (!data.publicUrl) throw new Error('Storage did not return a public URL');
  return { url: data.publicUrl, path };
}

export async function deleteCoverStudioStoragePath(storagePath: string): Promise<void> {
  const bucket = supabaseStorageBucket();
  const { error } = await supabaseAdmin().storage.from(bucket).remove([storagePath]);
  if (error) throw new Error(`Cover Studio storage delete failed: ${error.message}`);
}
