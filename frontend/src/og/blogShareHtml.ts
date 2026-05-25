/** Crawler-facing Open Graph HTML for blog detail URLs (Vercel Edge middleware). */

import {
  collectBlogSocialMetaTags,
  escapeHtml,
  readEdgeSocialEnv,
  SITE_NAME,
  socialMetaTagsToHtml,
  type BlogSocialMetaInput,
} from './blogSocialMeta.js';

export type BlogSharePayload = {
  id: number;
  title: string;
  excerpt?: string;
  coverImageUrl?: string;
  thumbnailImageUrl?: string;
  author?: string;
  date?: string;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    ogImageUrl?: string;
    ogImage?: string;
    ogImageThumbUrl?: string;
    /** JPEG unfurl asset (Slack/Discord) — from publish kit commit. */
    socialOgImageUrl?: string;
  };
};

export { escapeHtml, SITE_NAME };

export async function resolveShareMeta(
  blog: BlogSharePayload,
  canonicalUrl: string,
): Promise<BlogSocialMetaInput> {
  const { resolveSocialPreviewImage } = await import('./resolveSocialPreviewImage.js');
  const metaTitle = blog.seo?.metaTitle?.trim();
  const metaDescription = blog.seo?.metaDescription?.trim();
  const ogImage = await resolveSocialPreviewImage(blog);
  const title = metaTitle || blog.title;
  const description = metaDescription || blog.excerpt?.trim() || blog.title;
  const pageTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const env = readEdgeSocialEnv();

  return {
    pageTitle,
    description,
    canonicalUrl,
    ogImage,
    imageAlt: title,
    author: blog.author,
    publishedTime: blog.date,
    siteName: SITE_NAME,
    fbAppId: env.fbAppId,
    twitterSite: env.twitterSite,
  };
}

export function buildBlogShareHtml(meta: BlogSocialMetaInput): string {
  const title = escapeHtml(meta.pageTitle);
  const url = escapeHtml(meta.canonicalUrl);
  const tagsHtml = socialMetaTagsToHtml(collectBlogSocialMetaTags(meta));

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>${title}</title>
${tagsHtml}
    <link rel="canonical" href="${url}" />
  </head>
  <body>
    <p><a href="${url}">${title}</a></p>
  </body>
</html>`;
}
