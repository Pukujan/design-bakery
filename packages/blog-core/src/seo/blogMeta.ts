import type { Blog } from '@design-bakery/blog-core';

export interface BlogSeo {
  metaTitle?: string;
  metaDescription?: string;
  /** Social / Open Graph image URL (full size for og:image) */
  ogImageUrl?: string;
  /** Smaller OG variant (admin preview). */
  ogImageThumbUrl?: string;
  /** JPEG ~1200×630 for Slack/Discord/LinkedIn link previews. */
  socialOgImageUrl?: string;
  /** Legacy field name from early agent SEO slice */
  ogImage?: string;
}

export function normalizeBlogSeo(seo?: BlogSeo | null): BlogSeo | undefined {
  if (!seo) return undefined;
  const metaTitle = seo.metaTitle?.trim();
  const metaDescription = seo.metaDescription?.trim();
  const ogImageUrl = (seo.ogImageUrl ?? seo.ogImage)?.trim();
  const ogImageThumbUrl = seo.ogImageThumbUrl?.trim();
  const socialOgImageUrl = seo.socialOgImageUrl?.trim();
  if (!metaTitle && !metaDescription && !ogImageUrl && !ogImageThumbUrl && !socialOgImageUrl) {
    return undefined;
  }
  return {
    ...(metaTitle ? { metaTitle } : {}),
    ...(metaDescription ? { metaDescription } : {}),
    ...(ogImageUrl ? { ogImageUrl } : {}),
    ...(ogImageThumbUrl ? { ogImageThumbUrl } : {}),
    ...(socialOgImageUrl ? { socialOgImageUrl } : {}),
  };
}

/** Best image for link previews (prefer small JPEG for Slack). */
export function resolveBlogSocialImageUrl(
  blog: Pick<Blog, 'coverImageUrl' | 'thumbnailImageUrl' | 'seo'>,
): string | undefined {
  const seo = normalizeBlogSeo(blog.seo);
  const chain = [
    seo?.socialOgImageUrl,
    seo?.ogImageThumbUrl,
    blog.thumbnailImageUrl,
    seo?.ogImageUrl,
    blog.coverImageUrl,
  ];
  for (const u of chain) {
    const t = u?.trim();
    if (t?.startsWith('http')) return t;
  }
  return undefined;
}

export function resolveBlogCoverUrl(
  blog: Pick<Blog, 'coverImageUrl' | 'thumbnailImageUrl' | 'seo'>,
): string | undefined {
  const cover = blog.coverImageUrl?.trim();
  if (cover) return cover;
  return normalizeBlogSeo(blog.seo)?.ogImageUrl;
}

/** List cards — prefer dedicated thumbnail, then hero cover. */
export function resolveBlogThumbnailUrl(
  blog: Pick<Blog, 'thumbnailImageUrl' | 'coverImageUrl' | 'seo'>,
): string | undefined {
  const thumb = blog.thumbnailImageUrl?.trim();
  if (thumb) return thumb;
  return resolveBlogCoverUrl(blog);
}

/** Admin / in-app social preview — smaller OG when available. */
export function resolveBlogOgPreviewUrl(
  blog: Pick<Blog, 'coverImageUrl' | 'seo'>,
): string | undefined {
  const seo = normalizeBlogSeo(blog.seo);
  return seo?.ogImageThumbUrl || seo?.ogImageUrl || blog.coverImageUrl?.trim();
}

function toAbsoluteImageUrl(url: string | undefined): string | undefined {
  const u = url?.trim();
  if (!u) return undefined;
  if (u.startsWith('http://') || u.startsWith('https://') || u.startsWith('data:')) return u;
  if (typeof window !== 'undefined' && u.startsWith('/')) {
    return `${window.location.origin}${u}`;
  }
  return u;
}

export function resolveBlogMeta(blog: Blog, siteName = 'Design Baker') {
  const seo = normalizeBlogSeo(blog.seo);
  const title = seo?.metaTitle || blog.title;
  const description = seo?.metaDescription || blog.excerpt || blog.title;
  const imageUrl = toAbsoluteImageUrl(resolveBlogSocialImageUrl(blog));
  return {
    title: title.includes(siteName) ? title : `${title} | ${siteName}`,
    description,
    imageUrl,
    ogImageUrl: seo?.ogImageUrl,
  };
}
