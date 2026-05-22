import { invokeBlogPublishKit } from './publishKitClient';
import type { BlogPost } from '@/lib/adminContentService';
import { resolveBlogNumericId } from '@/modules/blog/data/blogData';
import { isOversizedDataImageUrl } from '@/modules/blog/lib/parseBlogTags';
import {
  uploadBlogImageDataUrl,
  uploadBlogImageDerivative,
} from '@/modules/blog/lib/uploadBlogImageClient';

export function isDataImageUrl(url: string | undefined): boolean {
  return Boolean(url?.trim().startsWith('data:image/'));
}

export function isPublicImageUrl(url: string | undefined): boolean {
  const u = url?.trim() ?? '';
  return u.startsWith('https://') || u.startsWith('http://');
}

/** HTTPS, or Storage emulator media URLs from commit_visual. */
export function isStorableImageUrl(url: string | undefined): boolean {
  const u = url?.trim() ?? '';
  if (!u || isDataImageUrl(u)) return false;
  if (u.startsWith('https://')) return true;
  if (/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?\/v0\/b\//i.test(u)) return true;
  return u.startsWith('http://') && !isDataImageUrl(u);
}

export type CommitVisualUploadResult = {
  ogImageUrl: string;
  coverImageUrl: string;
  thumbnailImageUrl: string;
  ogImageThumbUrl: string;
};

/** Block Firestore writes that still carry huge preview data URLs. */
export function assertImagesReadyForFirestore(og: string, cover: string): void {
  if (!isStorableImageUrl(og) || !isStorableImageUrl(cover)) {
    throw new Error(
      'Images could not be uploaded to Storage. Sign in to admin, restart pnpm run dev, and try Save again. ' +
        'Or paste public https:// image URLs manually.',
    );
  }
  if (isOversizedDataImageUrl(og) || isOversizedDataImageUrl(cover)) {
    throw new Error(
      'Image URLs are too large for Firestore (over ~100k characters). ' +
        'Use https:// Storage URLs after upload, not embedded data: previews.',
    );
  }
}

async function uploadViaClient(params: {
  blogId: number;
  ogDataUrl: string;
  coverDataUrl: string;
}): Promise<CommitVisualUploadResult> {
  const [ogImageUrl, coverImageUrl] = await Promise.all([
    uploadBlogImageDataUrl({ numericId: params.blogId, kind: 'og', dataUrl: params.ogDataUrl }),
    uploadBlogImageDataUrl({
      numericId: params.blogId,
      kind: 'cover',
      dataUrl: params.coverDataUrl,
    }),
  ]);

  const [thumbnailImageUrl, ogImageThumbUrl] = await Promise.all([
    uploadBlogImageDerivative({
      numericId: params.blogId,
      kind: 'thumbnail',
      sourceDataUrl: params.coverDataUrl,
      width: 640,
      height: 640,
    }),
    uploadBlogImageDerivative({
      numericId: params.blogId,
      kind: 'og_thumb',
      sourceDataUrl: params.ogDataUrl,
      width: 800,
      height: 800,
    }),
  ]);

  return { ogImageUrl, coverImageUrl, thumbnailImageUrl, ogImageThumbUrl };
}

/** Upload staged data: URLs to Storage when saving a post (not at generate time). */
export async function commitPublishKitImagesForSave(params: {
  post: BlogPost;
  mirrorCoverToOg: boolean;
}): Promise<CommitVisualUploadResult | null> {
  const blogId = resolveBlogNumericId(params.post);
  if (blogId <= 0) return null;

  const og = (params.post.seo?.ogImageUrl ?? params.post.seo?.ogImage ?? '').trim();
  const cover = (params.mirrorCoverToOg ? og : params.post.coverImageUrl?.trim()) || og;
  if (!isDataImageUrl(og) && !isDataImageUrl(cover)) return null;

  let result: CommitVisualUploadResult | null = null;

  try {
    result = await uploadViaClient({ blogId, ogDataUrl: og, coverDataUrl: cover });
  } catch (clientErr) {
    const hint = clientErr instanceof Error ? clientErr.message : 'Client upload failed';
    try {
      const res = await invokeBlogPublishKit({
        action: 'commit_visual',
        blogId,
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
          ogPreviewDataUrl: og,
          coverPreviewDataUrl: cover,
          sameImageForCoverAndOg: params.mirrorCoverToOg,
        },
      });
      const v = res.visual;
      if (
        v?.ogImageUrl &&
        v.coverImageUrl &&
        isStorableImageUrl(v.ogImageUrl) &&
        isStorableImageUrl(v.coverImageUrl)
      ) {
        result = {
          ogImageUrl: v.ogImageUrl,
          coverImageUrl: v.coverImageUrl,
          thumbnailImageUrl: v.thumbnailImageUrl ?? v.coverImageUrl,
          ogImageThumbUrl: v.ogImageThumbUrl ?? v.ogImageUrl,
        };
      } else if (v?.ogImageUrl?.startsWith('data:')) {
        throw new Error(
          'Functions could not upload images (missing GCP credentials in the emulator). ' +
            'Stay signed in to admin so the browser can upload directly, then Save again.',
        );
      }
    } catch (fnErr) {
      const fnMsg = fnErr instanceof Error ? fnErr.message : String(fnErr);
      throw new Error(
        `${hint} ${fnMsg} — Sign in to admin, keep pnpm run dev running, then Save again.`,
      );
    }
  }

  if (!result) {
    throw new Error(
      'Could not upload images. Sign in to admin, click Apply to post after Generate, then Save again.',
    );
  }

  assertImagesReadyForFirestore(result.ogImageUrl, result.coverImageUrl);
  return result;
}
