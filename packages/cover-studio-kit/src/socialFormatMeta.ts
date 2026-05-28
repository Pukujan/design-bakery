import type { SocialPreviewFrame } from './socialFormats.js';

export type SocialFormatMeta = {
  id: string;
  label: string;
  platform: string;
  width: number;
  height: number;
  previewFrame: SocialPreviewFrame;
};

/** Mirrors backend COVER_STUDIO_SOCIAL_FORMATS for gallery pack previews. */
export const COVER_STUDIO_FORMAT_META: readonly SocialFormatMeta[] = [
  {
    id: 'instagram-post',
    label: 'Instagram post',
    platform: 'Instagram',
    width: 1080,
    height: 1080,
    previewFrame: 'instagram-feed',
  },
  {
    id: 'instagram-portrait',
    label: 'Instagram portrait (4:5)',
    platform: 'Instagram',
    width: 1080,
    height: 1350,
    previewFrame: 'instagram-portrait',
  },
  {
    id: 'instagram-story',
    label: 'Instagram Story / Reels',
    platform: 'Instagram',
    width: 1080,
    height: 1920,
    previewFrame: 'instagram-story',
  },
  {
    id: 'linkedin-post',
    label: 'LinkedIn post',
    platform: 'LinkedIn',
    width: 1200,
    height: 627,
    previewFrame: 'linkedin-feed',
  },
  {
    id: 'linkedin-cover',
    label: 'LinkedIn cover',
    platform: 'LinkedIn',
    width: 1584,
    height: 396,
    previewFrame: 'linkedin-cover',
  },
  {
    id: 'facebook-post',
    label: 'Facebook post',
    platform: 'Facebook',
    width: 1200,
    height: 630,
    previewFrame: 'facebook-feed',
  },
  {
    id: 'facebook-cover',
    label: 'Facebook cover',
    platform: 'Facebook',
    width: 820,
    height: 312,
    previewFrame: 'facebook-cover',
  },
  {
    id: 'tiktok-video',
    label: 'TikTok video cover',
    platform: 'TikTok',
    width: 1080,
    height: 1920,
    previewFrame: 'tiktok',
  },
  {
    id: 'x-post',
    label: 'X (Twitter) post',
    platform: 'X',
    width: 1200,
    height: 675,
    previewFrame: 'x-feed',
  },
] as const;

const FORMAT_BY_ID = new Map(COVER_STUDIO_FORMAT_META.map((f) => [f.id, f]));

export const EXPORT_FORMAT_ORDER = COVER_STUDIO_FORMAT_META.map((f) => f.id);

export function formatMetaForId(formatId: string | null | undefined): SocialFormatMeta | null {
  if (!formatId) return null;
  return FORMAT_BY_ID.get(formatId) ?? null;
}
