/**
 * Recommended export dimensions (2024–2025 platform specs).
 * @see Meta, LinkedIn, TikTok, and X business help centers
 */

export type SocialPreviewFrame =
  | 'instagram-feed'
  | 'instagram-portrait'
  | 'instagram-story'
  | 'linkedin-feed'
  | 'linkedin-cover'
  | 'facebook-feed'
  | 'facebook-cover'
  | 'tiktok'
  | 'x-feed';

export type SocialFormatDef = {
  id: string;
  label: string;
  platform: string;
  width: number;
  height: number;
  previewFrame: SocialPreviewFrame;
  /** Layout variant tuned for aspect ratio (publish kit overlay). */
  layoutHint: 'square' | 'portrait' | 'landscape' | 'banner' | 'story';
};

/** Nine distinct social export sizes for Cover Studio. */
export const COVER_STUDIO_SOCIAL_FORMATS: readonly SocialFormatDef[] = [
  {
    id: 'instagram-post',
    label: 'Instagram post',
    platform: 'Instagram',
    width: 1080,
    height: 1080,
    previewFrame: 'instagram-feed',
    layoutHint: 'square',
  },
  {
    id: 'instagram-portrait',
    label: 'Instagram portrait (4:5)',
    platform: 'Instagram',
    width: 1080,
    height: 1350,
    previewFrame: 'instagram-portrait',
    layoutHint: 'portrait',
  },
  {
    id: 'instagram-story',
    label: 'Instagram Story / Reels',
    platform: 'Instagram',
    width: 1080,
    height: 1920,
    previewFrame: 'instagram-story',
    layoutHint: 'story',
  },
  {
    id: 'linkedin-post',
    label: 'LinkedIn post',
    platform: 'LinkedIn',
    width: 1200,
    height: 627,
    previewFrame: 'linkedin-feed',
    layoutHint: 'landscape',
  },
  {
    id: 'linkedin-cover',
    label: 'LinkedIn cover',
    platform: 'LinkedIn',
    width: 1584,
    height: 396,
    previewFrame: 'linkedin-cover',
    layoutHint: 'banner',
  },
  {
    id: 'facebook-post',
    label: 'Facebook post',
    platform: 'Facebook',
    width: 1200,
    height: 630,
    previewFrame: 'facebook-feed',
    layoutHint: 'landscape',
  },
  {
    id: 'facebook-cover',
    label: 'Facebook cover',
    platform: 'Facebook',
    width: 820,
    height: 312,
    previewFrame: 'facebook-cover',
    layoutHint: 'banner',
  },
  {
    id: 'tiktok-video',
    label: 'TikTok video cover',
    platform: 'TikTok',
    width: 1080,
    height: 1920,
    previewFrame: 'tiktok',
    layoutHint: 'story',
  },
  {
    id: 'x-post',
    label: 'X (Twitter) post',
    platform: 'X',
    width: 1200,
    height: 675,
    previewFrame: 'x-feed',
    layoutHint: 'landscape',
  },
] as const;

export function layoutForSocialHint(
  baseLayout: string,
  hint: SocialFormatDef['layoutHint'],
): string {
  const map: Record<SocialFormatDef['layoutHint'], string[]> = {
    square: ['a', 'b', 'f'],
    portrait: ['a', 'g', 'i'],
    /** Right-weighted layouts — text/scrim on the right, subject stays visible on the left. */
    landscape: ['e', 'i', 'j'],
    banner: ['e', 'j', 'f'],
    story: ['a', 'g', 'b'],
  };
  const pool = map[hint];
  const idx = pool.indexOf(baseLayout) >= 0 ? pool.indexOf(baseLayout) : 0;
  return pool[idx % pool.length] ?? baseLayout;
}
