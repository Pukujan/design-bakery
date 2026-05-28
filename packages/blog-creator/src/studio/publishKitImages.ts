import { invokeBlogPublishKit } from './publishKitClient';
import type { BlogPost } from '@design-bakery/blog-core/admin';
import { resolveBlogNumericId } from '@design-bakery/blog-core';
import { isOversizedDataImageUrl } from '@design-bakery/blog-core/lib/parseBlogTags';

export function isDataImageUrl(url: string | undefined): boolean {
  return Boolean(url?.trim().startsWith('data:image/'));
}

export function isPublicImageUrl(url: string | undefined): boolean {
  const u = url?.trim() ?? '';
  return u.startsWith('https://') || u.startsWith('http://');
}

export function isStorableImageUrl(url: string | undefined): boolean {
  const u = url?.trim() ?? '';
  if (!u || isDataImageUrl(u)) return false;
  return u.startsWith('https://') || (u.startsWith('http://') && !isDataImageUrl(u));
}

export type CommitVisualUploadResult = {
  ogImageUrl: string;
  coverImageUrl: string;
  thumbnailImageUrl: string;
  ogImageThumbUrl: string;
  socialOgImageUrl: string;
};

function productionUploadHelp(): string {
  return (
    'Server upload failed. On Railway set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_STORAGE_BUCKET, ' +
    'then redeploy the API. Local: pnpm run dev:stack and confirm http://localhost:8787/health.'
  );
}

/** Block CMS writes that still carry huge preview data URLs. */
export function assertImagesReadyForSave(og: string, cover: string): void {
  if (!isStorableImageUrl(og) || !isStorableImageUrl(cover)) {
    throw new Error(
      'Images were not converted to https:// Storage URLs. Use Save post after Generate + Apply; ' +
        productionUploadHelp(),
    );
  }
  if (isOversizedDataImageUrl(og) || isOversizedDataImageUrl(cover)) {
    throw new Error(
      'Image URLs are too large for CMS (over ~100k characters). Save must upload to Storage first.',
    );
  }
}

async function uploadViaServer(params: {
  blogId: number;
  post: BlogPost;
  ogDataUrl: string;
  coverDataUrl: string;
  mirrorCoverToOg: boolean;
}): Promise<CommitVisualUploadResult> {
  const res = await invokeBlogPublishKit({
    action: 'commit_visual',
    blogId: params.blogId,
    blogSnapshot: {
      title: params.post.title,
      excerpt: params.post.excerpt,
      content: params.post.content,
      category: params.post.category,
      author: params.post.author,
      color: params.post.color || '#6366f1',
      numericId: params.post.numericId,
      tags: params.post.tags,
    },
    visualCommit: {
      ogPreviewDataUrl: params.ogDataUrl,
      coverPreviewDataUrl: params.coverDataUrl,
      sameImageForCoverAndOg: params.mirrorCoverToOg,
    },
  });
  const v = res.visual;
  if (
    !v?.ogImageUrl ||
    !v.coverImageUrl ||
    !isStorableImageUrl(v.ogImageUrl) ||
    !isStorableImageUrl(v.coverImageUrl)
  ) {
    throw new Error(productionUploadHelp());
  }
  return {
    ogImageUrl: v.ogImageUrl,
    coverImageUrl: v.coverImageUrl,
    thumbnailImageUrl: v.thumbnailImageUrl ?? v.coverImageUrl,
    ogImageThumbUrl: v.ogImageThumbUrl ?? v.ogImageUrl,
    socialOgImageUrl: v.socialOgImageUrl ?? v.ogImageUrl,
  };
}

/** On Save: turn publish-kit data: previews into public Storage URLs in CMS. */
export async function commitPublishKitImagesForSave(params: {
  post: BlogPost;
  mirrorCoverToOg: boolean;
}): Promise<CommitVisualUploadResult | null> {
  const blogId = resolveBlogNumericId(params.post);
  if (blogId <= 0) return null;

  const og = (params.post.seo?.ogImageUrl ?? params.post.seo?.ogImage ?? '').trim();
  const cover = (params.mirrorCoverToOg ? og : params.post.coverImageUrl?.trim()) || og;
  if (!isDataImageUrl(og) && !isDataImageUrl(cover)) return null;

  try {
    return await uploadViaServer({
      blogId,
      post: params.post,
      ogDataUrl: og,
      coverDataUrl: cover,
      mirrorCoverToOg: params.mirrorCoverToOg,
    });
  } catch (serverErr) {
    const serverMsg = serverErr instanceof Error ? serverErr.message : 'Server upload failed';
    throw new Error(`${serverMsg} — ${productionUploadHelp()}`);
  }
}
