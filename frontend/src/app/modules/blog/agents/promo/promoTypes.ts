export type PromoTheme = 'professional' | 'playful' | 'technical' | 'leadership';

export type PromoAgentData = {
  linkedInPost: string;
  hashtags: string[];
  hooks: string[];
};

export const PROMO_THEMES: { id: PromoTheme; label: string }[] = [
  { id: 'professional', label: 'Professional' },
  { id: 'playful', label: 'Playful' },
  { id: 'technical', label: 'Technical' },
  { id: 'leadership', label: 'Leadership' },
];

export function buildLinkedInShareUrl(postUrl: string): string {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`;
}

export function formatPostWithHashtags(post: string, hashtags: string[]): string {
  const tags = hashtags
    .map((t) => (t.startsWith('#') ? t : `#${t.replace(/\s+/g, '')}`))
    .join(' ');
  return tags ? `${post.trim()}\n\n${tags}` : post.trim();
}
