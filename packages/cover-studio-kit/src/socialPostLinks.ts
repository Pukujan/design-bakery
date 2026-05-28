/** Best-effort composer URLs — open in a new tab so users can upload the downloaded PNG. */
export type SocialPostLink = {
  label: string;
  url: string;
};

export const SOCIAL_POST_LINKS: Record<string, SocialPostLink> = {
  'instagram-post': {
    label: 'Post on Instagram',
    url: 'https://www.instagram.com/',
  },
  'instagram-portrait': {
    label: 'Post on Instagram',
    url: 'https://www.instagram.com/',
  },
  'instagram-story': {
    label: 'Share to Instagram Stories',
    url: 'https://www.instagram.com/',
  },
  'linkedin-post': {
    label: 'Create LinkedIn post',
    url: 'https://www.linkedin.com/post/new/',
  },
  'linkedin-cover': {
    label: 'Update LinkedIn cover',
    url: 'https://www.linkedin.com/profile/photo/',
  },
  'facebook-post': {
    label: 'Create Facebook post',
    url: 'https://www.facebook.com/',
  },
  'facebook-cover': {
    label: 'Update Facebook cover',
    url: 'https://www.facebook.com/pages/creation/',
  },
  'tiktok-video': {
    label: 'Upload on TikTok',
    url: 'https://www.tiktok.com/tiktokstudio/upload',
  },
  'x-post': {
    label: 'Compose on X',
    url: 'https://x.com/compose/post',
  },
};

export function socialPostLinkForFormat(formatId: string | null | undefined): SocialPostLink | null {
  if (!formatId) return null;
  return SOCIAL_POST_LINKS[formatId] ?? null;
}
