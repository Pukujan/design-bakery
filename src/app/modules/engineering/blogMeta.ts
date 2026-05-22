import type { Blog } from './blogData';

export interface BlogSeo {
  metaTitle?: string;
  metaDescription?: string;
  /** Social / Open Graph image URL */
  ogImageUrl?: string;
  /** Legacy field name from early agent SEO slice */
  ogImage?: string;
}

export function normalizeBlogSeo(seo?: BlogSeo | null): BlogSeo | undefined {
  if (!seo) return undefined;
  const metaTitle = seo.metaTitle?.trim();
  const metaDescription = seo.metaDescription?.trim();
  const ogImageUrl = (seo.ogImageUrl ?? seo.ogImage)?.trim();
  if (!metaTitle && !metaDescription && !ogImageUrl) return undefined;
  return {
    ...(metaTitle ? { metaTitle } : {}),
    ...(metaDescription ? { metaDescription } : {}),
    ...(ogImageUrl ? { ogImageUrl } : {}),
  };
}

export function resolveBlogCoverUrl(blog: Pick<Blog, 'coverImageUrl' | 'seo'>): string | undefined {
  const cover = blog.coverImageUrl?.trim();
  if (cover) return cover;
  return normalizeBlogSeo(blog.seo)?.ogImageUrl;
}

export function resolveBlogMeta(blog: Blog, siteName = 'Design Baker') {
  const seo = normalizeBlogSeo(blog.seo);
  const title = seo?.metaTitle || blog.title;
  const description = seo?.metaDescription || blog.excerpt || blog.title;
  const imageUrl = seo?.ogImageUrl || blog.coverImageUrl?.trim();
  return {
    title: title.includes(siteName) ? title : `${title} | ${siteName}`,
    description,
    imageUrl,
    ogImageUrl: seo?.ogImageUrl,
  };
}
