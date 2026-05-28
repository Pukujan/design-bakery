import type { BlogCategory } from '@/modules/blog/data/blogData';

export function buildBlogsPathWithCategory(blogsPath: string, categoryId: string): string {
  if (!categoryId || categoryId === 'all') return blogsPath;
  return `${blogsPath}?category=${encodeURIComponent(categoryId)}`;
}

export function resolveCategoryFromSearchParam(
  param: string | null,
  categories: BlogCategory[],
): string {
  if (!param || param === 'all') return 'all';
  return categories.some((c) => c.id === param) ? param : 'all';
}

/** Match CMS category id even when a post stores a label slug by mistake. */
export function resolveBlogCategoryId(
  blogCategory: string,
  categories: BlogCategory[],
): string {
  if (!blogCategory?.trim()) return '';
  const trimmed = blogCategory.trim();
  if (categories.some((c) => c.id === trimmed)) return trimmed;
  const byLabel = categories.find(
    (c) => c.label.localeCompare(trimmed, undefined, { sensitivity: 'accent' }) === 0,
  );
  return byLabel?.id ?? trimmed;
}
