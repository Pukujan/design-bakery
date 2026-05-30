/** Crawler-facing Open Graph HTML for blog URLs (Vercel Edge middleware). */

import {
  collectPageSocialMetaTags,
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
  content?: string;
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
    socialOgImageUrl?: string;
  };
};

export type BlogListShareItem = {
  id: number;
  title: string;
  excerpt?: string;
  date?: string;
  href: string;
};

export { escapeHtml, SITE_NAME };

export function stripMarkdownForCrawlers(markdown: string, maxLen = 12_000): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]+`/g, ' ')
    .replace(/!\[[^\]]*]\([^)]+\)/g, ' ')
    .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_~>|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

export async function resolveShareMeta(
  blog: BlogSharePayload,
  canonicalUrl: string,
): Promise<BlogSocialMetaInput> {
  const { resolveSocialPreviewImage } = await import('./resolveSocialPreviewImage.js');
  const metaTitle = blog.seo?.metaTitle?.trim();
  const metaDescription = blog.seo?.metaDescription?.trim();
  const ogImage = await resolveSocialPreviewImage(blog);
  const rawTitle = metaTitle || blog.title.trim();
  const description = metaDescription || blog.excerpt?.trim() || blog.title.trim();
  const pageTitle = metaTitle || rawTitle;
  const env = readEdgeSocialEnv();

  return {
    pageTitle,
    description,
    canonicalUrl,
    ogImage,
    imageAlt: rawTitle,
    author: blog.author,
    publishedTime: blog.date,
    siteName: SITE_NAME,
    fbAppId: env.fbAppId,
    twitterSite: env.twitterSite,
  };
}

export function buildBlogShareHtml(
  meta: BlogSocialMetaInput,
  options?: { bodyText?: string; excerpt?: string },
): string {
  const title = escapeHtml(meta.pageTitle);
  const url = escapeHtml(meta.canonicalUrl);
  const tagsHtml = socialMetaTagsToHtml(
    collectBlogSocialMetaTags({ ...meta, ogType: meta.ogType ?? 'article' }),
  );
  const imageSrcLink = meta.ogImage
    ? `\n    <link rel="image_src" href="${escapeHtml(meta.ogImage)}" />`
    : '';

  const excerptBlock = options?.excerpt
    ? `\n    <p>${escapeHtml(options.excerpt)}</p>`
    : '';
  const bodyBlock = options?.bodyText
    ? `\n    <article>${escapeHtml(options.bodyText)}</article>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
${tagsHtml}${imageSrcLink}
    <link rel="canonical" href="${url}" />
  </head>
  <body>
    <h1><a href="${url}">${title}</a></h1>${excerptBlock}${bodyBlock}
  </body>
</html>`;
}

export function buildBlogListShareHtml(params: {
  pageTitle: string;
  canonicalUrl: string;
  description: string;
  posts: BlogListShareItem[];
}): string {
  const title = escapeHtml(params.pageTitle);
  const url = escapeHtml(params.canonicalUrl);
  const desc = escapeHtml(params.description);
  const env = readEdgeSocialEnv();
  const tagsHtml = socialMetaTagsToHtml(
    collectBlogSocialMetaTags({
      pageTitle: params.pageTitle,
      description: params.description,
      canonicalUrl: params.canonicalUrl,
      siteName: SITE_NAME,
      fbAppId: env.fbAppId,
      twitterSite: env.twitterSite,
    }),
  );

  const listItems = params.posts
    .map((post) => {
      const href = escapeHtml(post.href);
      const postTitle = escapeHtml(post.title);
      const excerpt = post.excerpt ? `<p>${escapeHtml(post.excerpt)}</p>` : '';
      return `<li><a href="${href}">${postTitle}</a>${excerpt}</li>`;
    })
    .join('\n      ');

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <meta name="description" content="${desc}" />
${tagsHtml}
    <link rel="canonical" href="${url}" />
  </head>
  <body>
    <h1><a href="${url}">${title}</a></h1>
    <p>${desc}</p>
    <ul>
      ${listItems}
    </ul>
  </body>
</html>`;
}

/** Replace homepage SEO tags in the built SPA shell — keeps Vite asset scripts intact. */
export function injectSocialMetaIntoHtmlHead(
  html: string,
  meta: BlogSocialMetaInput & { ogType?: 'website' | 'article' },
): string {
  const title = escapeHtml(meta.pageTitle);
  const tagsHtml = socialMetaTagsToHtml(
    collectBlogSocialMetaTags({
      ...meta,
      ogType: meta.ogType ?? 'article',
    }),
  );
  const canonical = escapeHtml(meta.canonicalUrl);
  const imageSrcLink = meta.ogImage
    ? `\n    <link rel="image_src" href="${escapeHtml(meta.ogImage)}" />`
    : '';

  let out = html
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`)
    .replace(/<meta\s+name="description"[^>]*>/gi, '')
    .replace(/<meta\s+name="robots"[^>]*>/gi, '')
    .replace(/<link\s+rel="canonical"[^>]*>/gi, '')
    .replace(/<link\s+rel="image_src"[^>]*>/gi, '')
    .replace(/<meta\s+(?:name|property)="(?:og:|twitter:|fb:)[^"]+"[^>]*>/gi, '');

  const injection = `
    <link rel="canonical" href="${canonical}" />${imageSrcLink}
${tagsHtml}`;

  return out.replace('</head>', `${injection}\n  </head>`);
}

export async function fetchSpaIndexHtml(origin: string): Promise<string | null> {
  try {
    const res = await fetch(new URL('/index.html', origin), {
      headers: { Accept: 'text/html' },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export function resolveEdgeSiteOrigin(requestUrl: URL): string {
  const fromEnv = process.env.VITE_SITE_URL?.trim() || process.env.SITE_URL?.trim();
  return (fromEnv || requestUrl.origin).replace(/\/$/, '');
}
