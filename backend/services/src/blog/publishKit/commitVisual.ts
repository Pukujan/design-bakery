import { HttpsError } from 'firebase-functions/v2/https';
import { dataUrlToBuffer, isDataImageUrl } from './dataUrl.js';
import { resizeCoverThumbnail, resizeOgThumbnail } from './imageDerivatives.js';
import { uploadBlogImage } from './storage.js';

export type CommitVisualUrls = {
  ogImageUrl: string;
  coverImageUrl: string;
  thumbnailImageUrl: string;
  ogImageThumbUrl: string;
};

export async function commitVisualImages(params: {
  numericId: number;
  ogPreviewDataUrl: string;
  coverPreviewDataUrl?: string;
  sameImageForCoverAndOg?: boolean;
}): Promise<CommitVisualUrls> {
  const ogUrl = params.ogPreviewDataUrl.trim();
  if (!isDataImageUrl(ogUrl)) {
    throw new HttpsError('invalid-argument', 'ogPreviewDataUrl must be a data:image URL.', {
      code: 'VALIDATION',
    });
  }

  const same = params.sameImageForCoverAndOg !== false;
  const coverUrl = (same ? ogUrl : params.coverPreviewDataUrl?.trim()) || ogUrl;
  if (!same && !isDataImageUrl(coverUrl)) {
    throw new HttpsError('invalid-argument', 'coverPreviewDataUrl must be a data:image URL.', {
      code: 'VALIDATION',
    });
  }

  const ogPng = dataUrlToBuffer(ogUrl);
  const coverPng = same ? ogPng : dataUrlToBuffer(coverUrl);
  const [thumbPng, ogThumbPng] = await Promise.all([
    resizeCoverThumbnail(coverPng),
    resizeOgThumbnail(ogPng),
  ]);

  const [ogUpload, coverUpload, thumbUpload, ogThumbUpload] = await Promise.all([
    uploadBlogImage({ numericId: params.numericId, kind: 'og', png: ogPng }),
    same ? Promise.resolve(null) : uploadBlogImage({ numericId: params.numericId, kind: 'cover', png: coverPng }),
    uploadBlogImage({ numericId: params.numericId, kind: 'thumbnail', png: thumbPng }),
    uploadBlogImage({ numericId: params.numericId, kind: 'og_thumb', png: ogThumbPng }),
  ]);

  if (!ogUpload?.url) {
    throw new HttpsError(
      'failed-precondition',
      'Could not upload OG image to Storage. Check GOOGLE_APPLICATION_CREDENTIALS_JSON and FIREBASE_STORAGE_BUCKET on the API.',
      { code: 'STORAGE' },
    );
  }
  const ogHttps = ogUpload.url;
  const coverHttps = same ? ogHttps : (coverUpload?.url ?? null);
  if (!coverHttps) {
    throw new HttpsError('failed-precondition', 'Could not upload cover image to Storage.', {
      code: 'STORAGE',
    });
  }
  const thumbHttps = thumbUpload?.url ?? coverHttps;
  const ogThumbHttps = ogThumbUpload?.url ?? ogHttps;

  return {
    ogImageUrl: ogHttps,
    coverImageUrl: coverHttps,
    thumbnailImageUrl: thumbHttps,
    ogImageThumbUrl: ogThumbHttps,
  };
}
