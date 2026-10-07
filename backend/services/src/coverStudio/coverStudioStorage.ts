import { isOctoFileId, deleteOctoFile, uploadOctoPublicFile } from '../octoFiles.js';
import { isSupabaseStorageConfigured, supabaseAdmin, supabaseStorageBucket } from '../supabaseClient.js';

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
  const logicalPath = coverStudioObjectPath(params.assetId, params.filename, params.ext);
  const stored = await uploadOctoPublicFile({
    logicalPath,
    buffer: params.buffer,
    contentType: params.contentType,
  });
  return { url: stored.url, path: stored.fileId };
}

export async function deleteCoverStudioStoragePath(storagePath: string): Promise<void> {
  if (isOctoFileId(storagePath)) {
    await deleteOctoFile(storagePath);
    return;
  }
  if (!isSupabaseStorageConfigured()) {
    throw new Error(
      `Cannot delete legacy storage object "${storagePath}": Supabase Storage is not configured, and the path is not an octo file id.`,
    );
  }
  const bucket = supabaseStorageBucket();
  const { error } = await supabaseAdmin().storage.from(bucket).remove([storagePath]);
  if (error) throw new Error(`Cover Studio storage delete failed: ${error.message}`);
}
