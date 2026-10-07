/**
 * Shared Open Graph + Twitter Card tags for link previews:
 * Facebook, LinkedIn, Slack, Discord, X, WhatsApp, Telegram, etc.
 * Discord reads og:title / og:description / og:image (no discord:* namespace).
 *
 * Pure and DOM-free on purpose, and it exists twice, byte-identical:
 * `frontend/src/og/blogSocialMeta.ts` (browser, via the `@og` alias) and
 * `backend/src/og/blogSocialMeta.ts` (the link-preview router). The backend's
 * tsconfig `rootDir` is what forces a copy instead of a shared import.
 * `scripts/test-og-contract.mjs` fails CI if the two drift.
 *
 * Browser-only helpers (`document`, `import.meta.env`) live in
 * `frontend/src/og/blogSocialMetaClient.ts`; the server-side env reader lives in
 * `backend/src/og/blogShareHtml.ts`.
 */

export const SITE_NAME = 'Design Baker';
/** Publish kit OG output size */
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

export type SocialMetaTag = {
  attribute: 'name' | 'property';
  key: string;
  content: string;
};

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export type BlogSocialMetaInput = {
  pageTitle: string;
  description: string;
  canonicalUrl: string;
  ogImage?: string;
  /** Accessibility + Facebook og:image:alt */
  imageAlt?: string;
  author?: string;
  publishedTime?: string;
  siteName?: string;
  fbAppId?: string;
  /** X handle, e.g. @designbaker (stored without @ in env is ok) */
  twitterSite?: string;
  ogType?: 'website' | 'article';
  robots?: string;
};

export type PageSocialMetaInput = BlogSocialMetaInput;

function normalizeTwitterSite(handle: string | undefined): string | undefined {
  const h = handle?.trim();
  if (!h) return undefined;
  return h.startsWith('@') ? h : `@${h}`;
}

function isoPublishedTime(date: string | undefined): string | undefined {
  const raw = date?.trim();
  if (!raw) return undefined;
  const ts = Date.parse(raw);
  if (Number.isNaN(ts)) return undefined;
  return new Date(ts).toISOString();
}

/** All tags LinkedIn, Slack, Facebook, and X read from this set. */
export function collectPageSocialMetaTags(input: PageSocialMetaInput): SocialMetaTag[] {
  const site = input.siteName ?? SITE_NAME;
  const image = input.ogImage?.trim();
  const imageAlt = (input.imageAlt ?? input.pageTitle).trim();
  const twitterCard = image ? 'summary_large_image' : 'summary';
  const twitterSite = normalizeTwitterSite(input.twitterSite);
  const published = isoPublishedTime(input.publishedTime);
  const ogType = input.ogType ?? 'website';
  const robots = input.robots ?? 'index, follow';

  const tags: SocialMetaTag[] = [
    { attribute: 'name', key: 'description', content: input.description },
    { attribute: 'name', key: 'robots', content: robots },
    { attribute: 'property', key: 'og:type', content: ogType },
    { attribute: 'property', key: 'og:site_name', content: site },
    { attribute: 'property', key: 'og:locale', content: 'en_US' },
    { attribute: 'property', key: 'og:title', content: input.pageTitle },
    { attribute: 'property', key: 'og:description', content: input.description },
    { attribute: 'property', key: 'og:url', content: input.canonicalUrl },
    { attribute: 'name', key: 'twitter:card', content: twitterCard },
    { attribute: 'name', key: 'twitter:title', content: input.pageTitle },
    { attribute: 'name', key: 'twitter:description', content: input.description },
  ];

  if (input.fbAppId?.trim()) {
    tags.push({ attribute: 'property', key: 'fb:app_id', content: input.fbAppId.trim() });
  }
  if (twitterSite) {
    tags.push({ attribute: 'name', key: 'twitter:site', content: twitterSite });
  }
  if (input.author?.trim()) {
    tags.push({ attribute: 'property', key: 'article:author', content: input.author.trim() });
  }
  if (published) {
    tags.push({ attribute: 'property', key: 'article:published_time', content: published });
  }

  if (image) {
    const imageType = /\.jpe?g($|\?)/i.test(image) ? 'image/jpeg' : 'image/png';
    tags.push(
      { attribute: 'property', key: 'og:image', content: image },
      { attribute: 'property', key: 'og:image:secure_url', content: image },
      { attribute: 'property', key: 'og:image:type', content: imageType },
      {
        attribute: 'property',
        key: 'og:image:width',
        content: String(OG_IMAGE_WIDTH),
      },
      {
        attribute: 'property',
        key: 'og:image:height',
        content: String(OG_IMAGE_HEIGHT),
      },
      { attribute: 'property', key: 'og:image:alt', content: imageAlt },
      { attribute: 'name', key: 'twitter:image', content: image },
      { attribute: 'name', key: 'twitter:image:alt', content: imageAlt },
    );
  }

  return tags;
}

/** Blog posts use article Open Graph type. */
export function collectBlogSocialMetaTags(input: BlogSocialMetaInput): SocialMetaTag[] {
  return collectPageSocialMetaTags({ ...input, ogType: input.ogType ?? 'article' });
}

export function socialMetaTagsToHtml(tags: SocialMetaTag[]): string {
  return tags
    .map(
      (t) =>
        `    <meta ${t.attribute}="${t.key}" content="${escapeHtml(t.content)}" />`,
    )
    .join('\n');
}
