/** Crawler-facing Open Graph HTML for blog detail URLs (Vercel Edge middleware). */

export type BlogSharePayload = {
  id: number;
  title: string;
  excerpt?: string;
  coverImageUrl?: string;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    ogImageUrl?: string;
    ogImage?: string;
  };
};

const SITE_NAME = 'Design Baker';

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function resolveShareMeta(blog: BlogSharePayload, canonicalUrl: string) {
  const metaTitle = blog.seo?.metaTitle?.trim();
  const metaDescription = blog.seo?.metaDescription?.trim();
  const ogImage = (blog.seo?.ogImageUrl ?? blog.seo?.ogImage)?.trim() || blog.coverImageUrl?.trim();
  const title = metaTitle || blog.title;
  const description = metaDescription || blog.excerpt?.trim() || blog.title;
  const pageTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  return { pageTitle, description, ogImage, canonicalUrl };
}

export function buildBlogShareHtml(meta: {
  pageTitle: string;
  description: string;
  ogImage?: string;
  canonicalUrl: string;
}): string {
  const title = escapeHtml(meta.pageTitle);
  const description = escapeHtml(meta.description);
  const url = escapeHtml(meta.canonicalUrl);
  const image = meta.ogImage?.trim();
  const imageTag = image
    ? `\n    <meta property="og:image" content="${escapeHtml(image)}" />\n    <meta name="twitter:image" content="${escapeHtml(image)}" />`
    : '';
  const twitterCard = image ? 'summary_large_image' : 'summary';

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="${SITE_NAME}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${url}" />${imageTag}
    <meta name="twitter:card" content="${twitterCard}" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <link rel="canonical" href="${url}" />
  </head>
  <body>
    <p><a href="${url}">${title}</a></p>
  </body>
</html>`;
}
