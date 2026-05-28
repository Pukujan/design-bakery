/** Crawler-facing Open Graph HTML for blog URLs (Vercel Edge middleware). */

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

export function buildBlogShareHtml(
  meta: BlogSocialMetaInput,
  options?: { bodyText?: string; excerpt?: string },
): string {
  const title = escapeHtml(meta.pageTitle);
  const url = escapeHtml(meta.canonicalUrl);
  const tagsHtml = socialMetaTagsToHtml(collectBlogSocialMetaTags(meta));
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
