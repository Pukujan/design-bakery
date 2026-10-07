/** Blog image uploads — Octo file API, stored at the stable public file URL. */
import { isAssetStorageConfigured, uploadOctoPublicFile } from '../../octoFiles.js';

export type BlogImageKind = 'og' | 'cover' | 'thumbnail' | 'og_thumb' | 'og_social';

function objectPath(params: { numericId: number; kind: string; ext: string }): string {
  const ts = Date.now();
  return `blog-publish/${params.numericId}/${params.kind}-${ts}.${params.ext}`;
}

async function uploadBlogAssetOcto(params: {
  numericId: number;
  kind: BlogImageKind;
  buffer: Buffer;
  contentType: string;
  ext: string;
}): Promise<{ url: string; path: string }> {
  if (!isAssetStorageConfigured()) {
    throw new Error(
      'Octo file storage is not configured. Set OCTO_WORKSPACE_ID and OCTO_API_KEY in backend/.env.',
    );
  }
  const stored = await uploadOctoPublicFile({
    logicalPath: objectPath(params),
    buffer: params.buffer,
    contentType: params.contentType,
  });
  return { url: stored.url, path: stored.fileId };
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
    return await uploadBlogAssetOcto(params);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[publishKit] Storage upload failed:', message);
    throw err instanceof Error ? err : new Error(`Storage upload failed: ${message}`);
  }
}
