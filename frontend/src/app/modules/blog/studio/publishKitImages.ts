import { isBlogApiEnabled } from '@/lib/blogApi';
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

function isLocalDevHost(): boolean {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname;
  return h === 'localhost' || h === '127.0.0.1';
}

function productionUploadHelp(): string {
  if (isBlogApiEnabled()) {
    return (
      'Server upload failed. On Railway set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_STORAGE_BUCKET ' +
      '(or legacy FIREBASE_STORAGE_BUCKET + GOOGLE_APPLICATION_CREDENTIALS_JSON), then redeploy the API.'
    );
  }
  return (
    'Set VITE_BLOG_API_URL on Vercel to your Railway API URL (see doc/deploy-vercel-railway.md), redeploy, ' +
    'and configure Supabase Storage env vars on Railway. Production uploads go through the API, not the browser.'
  );
}

/** Block Firestore writes that still carry huge preview data URLs. */
export function assertImagesReadyForFirestore(og: string, cover: string): void {
  if (!isStorableImageUrl(og) || !isStorableImageUrl(cover)) {
    throw new Error(
      'Images were not converted to https:// Storage URLs. Use Save post after Generate + Apply; ' +
        productionUploadHelp(),
    );
  }
  if (isOversizedDataImageUrl(og) || isOversizedDataImageUrl(cover)) {
    throw new Error(
      'Image URLs are too large for Firestore (over ~100k characters). ' +
        'Save must upload to Storage first — do not keep data: previews in the post.',
    );
  }
}

/** Server-side upload (Express API or Firebase callable) — no browser Storage CORS. */
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
  };
}

/** Browser → Firebase Storage (localhost only; needs bucket CORS). */
async function uploadViaBrowser(params: {
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

/**
 * On Save: turn publish-kit data: previews into public https:// Storage URLs in Firestore.
 * Production always uses server upload (Railway/callable). Browser upload is localhost-only fallback.
 */
export async function commitPublishKitImagesForSave(params: {
  post: BlogPost;
  mirrorCoverToOg: boolean;
}): Promise<CommitVisualUploadResult | null> {
  const blogId = resolveBlogNumericId(params.post);
  if (blogId <= 0) return null;

  const og = (params.post.seo?.ogImageUrl ?? params.post.seo?.ogImage ?? '').trim();
  const cover = (params.mirrorCoverToOg ? og : params.post.coverImageUrl?.trim()) || og;
  if (!isDataImageUrl(og) && !isDataImageUrl(cover)) return null;

  const uploadParams = {
    blogId,
    post: params.post,
    ogDataUrl: og,
    coverDataUrl: cover,
    mirrorCoverToOg: params.mirrorCoverToOg,
  };

  try {
    return await uploadViaServer(uploadParams);
  } catch (serverErr) {
    const serverMsg = serverErr instanceof Error ? serverErr.message : 'Server upload failed';

    // With VITE_BLOG_API_URL, always upload via Express — never fall back to browser (Storage CORS).
    if (isBlogApiEnabled()) {
      throw new Error(
        `${serverMsg} — Backend upload only. Confirm pnpm run dev:stack, ` +
          'http://localhost:8787/health, GOOGLE_APPLICATION_CREDENTIALS_PATH in backend/.env, then Save again.',
      );
    }

    if (!isLocalDevHost()) {
      throw new Error(`${serverMsg} ${productionUploadHelp()}`);
    }

    try {
      return await uploadViaBrowser({ blogId, ogDataUrl: og, coverDataUrl: cover });
    } catch (browserErr) {
      const browserMsg = browserErr instanceof Error ? browserErr.message : 'Browser upload failed';
      throw new Error(
        `${serverMsg} ${browserMsg} — Prefer VITE_BLOG_API_URL + dev:stack, or run pnpm run storage:cors for browser uploads.`,
      );
    }
  }
}
