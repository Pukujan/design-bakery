/** Shared blog SEO fields — used by admin, public head, and agent adapter. */
export type BlogSeo = {
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
};

export function resolveBlogMetaTitle(title: string, seo?: BlogSeo): string {
  const custom = seo?.metaTitle?.trim();
  return custom && custom.length > 0 ? custom : title.trim();
}

export function resolveBlogMetaDescription(excerpt: string, seo?: BlogSeo): string {
  const custom = seo?.metaDescription?.trim();
  return custom && custom.length > 0 ? custom : excerpt.trim();
}
