/**
 * Browser-only Open Graph helpers (React document + Vite env).
 *
 * Split out of `blogSocialMeta.ts` so that file stays a pure, DOM-free contract
 * shared byte-for-byte with the server-side Open Graph preview service
 * (`backend/src/og/blogSocialMeta.ts`). The server copy cannot carry
 * `document` or `import.meta.env`.
 */

import type { SocialMetaTag } from './blogSocialMeta.js';

const SOCIAL_META_MARKER = 'data-design-bakery-social';

/** Apply tags in the browser (SPA blog detail). Returns cleanup. */
export function applyBlogSocialMetaToDocument(tags: SocialMetaTag[]): () => void {
  const nodes: HTMLMetaElement[] = [];

  for (const tag of tags) {
    const el = document.createElement('meta');
    el.setAttribute(tag.attribute, tag.key);
    el.setAttribute('content', tag.content);
    el.setAttribute(SOCIAL_META_MARKER, tag.key);
    document.head.appendChild(el);
    nodes.push(el);
  }

  return () => {
    for (const el of nodes) el.remove();
  };
}

export function upsertCanonicalLink(href: string): () => void {
  const el = document.createElement('link');
  el.setAttribute('rel', 'canonical');
  el.setAttribute('href', href);
  el.setAttribute(SOCIAL_META_MARKER, 'canonical');
  document.head.appendChild(el);
  return () => {
    el.remove();
  };
}

export function readClientSocialEnv(): { fbAppId?: string; twitterSite?: string } {
  const env = import.meta.env as Record<string, string | undefined>;
  return {
    fbAppId: env.VITE_FB_APP_ID?.trim(),
    twitterSite: env.VITE_TWITTER_SITE?.trim(),
  };
}
