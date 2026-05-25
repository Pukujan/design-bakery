import { ApiError } from '../../apiError.js';
import { dataUrlToBuffer, isDataImageUrl } from './dataUrl.js';
import { resizeCoverThumbnail, resizeOgSocialJpeg, resizeOgThumbnail } from './imageDerivatives.js';
import { uploadBlogAsset, uploadBlogImage } from './storage.js';

export type CommitVisualUrls = {
  ogImageUrl: string;
  coverImageUrl: string;
  thumbnailImageUrl: string;
  ogImageThumbUrl: string;
  /** JPEG ~1200×630 for Slack/Discord/LinkedIn (under 500KB). */
  socialOgImageUrl: string;
};

export async function commitVisualImages(params: {
  numericId: number;
  ogPreviewDataUrl: string;
  coverPreviewDataUrl?: string;
  sameImageForCoverAndOg?: boolean;
}): Promise<CommitVisualUrls> {
  const ogUrl = params.ogPreviewDataUrl.trim();
  if (!isDataImageUrl(ogUrl)) {
    throw new ApiError('invalid-argument', 'ogPreviewDataUrl must be a data:image URL.', {
      code: 'VALIDATION',
    });
  }

  const same = params.sameImageForCoverAndOg !== false;
  const coverUrl = (same ? ogUrl : params.coverPreviewDataUrl?.trim()) || ogUrl;
  if (!same && !isDataImageUrl(coverUrl)) {
    throw new ApiError('invalid-argument', 'coverPreviewDataUrl must be a data:image URL.', {
      code: 'VALIDATION',
    });
  }

  const ogPng = dataUrlToBuffer(ogUrl);
  const coverPng = same ? ogPng : dataUrlToBuffer(coverUrl);
  const [thumbPng, ogThumbPng, ogSocialJpeg] = await Promise.all([
    resizeCoverThumbnail(coverPng),
    resizeOgThumbnail(ogPng),
    resizeOgSocialJpeg(ogPng),
  ]);

  const [ogUpload, coverUpload, thumbUpload, ogThumbUpload, ogSocialUpload] = await Promise.all([
    uploadBlogImage({ numericId: params.numericId, kind: 'og', png: ogPng }),
    same ? Promise.resolve(null) : uploadBlogImage({ numericId: params.numericId, kind: 'cover', png: coverPng }),
    uploadBlogImage({ numericId: params.numericId, kind: 'thumbnail', png: thumbPng }),
    uploadBlogImage({ numericId: params.numericId, kind: 'og_thumb', png: ogThumbPng }),
    uploadBlogAsset({
      numericId: params.numericId,
      kind: 'og_social',
      buffer: ogSocialJpeg,
      contentType: 'image/jpeg',
      ext: 'jpg',
    }),
  ]);

  if (!ogUpload?.url) {
    throw new ApiError(
      'failed-precondition',
      'Could not upload OG image to Storage. Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_STORAGE_BUCKET on the API.',
      { code: 'STORAGE' },
    );
  }
  const ogHttps = ogUpload.url;
  const coverHttps = same ? ogHttps : (coverUpload?.url ?? null);
  if (!coverHttps) {
    throw new ApiError('failed-precondition', 'Could not upload cover image to Storage.', {
      code: 'STORAGE',
    });
  }
  const thumbHttps = thumbUpload?.url ?? coverHttps;
  const ogThumbHttps = ogThumbUpload?.url ?? ogHttps;
  const socialOgHttps = ogSocialUpload?.url ?? ogHttps;

  return {
    ogImageUrl: ogHttps,
    coverImageUrl: coverHttps,
    thumbnailImageUrl: thumbHttps,
    ogImageThumbUrl: ogThumbHttps,
    socialOgImageUrl: socialOgHttps,
  };
}
