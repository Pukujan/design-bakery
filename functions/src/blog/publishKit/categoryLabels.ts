/** Mirrors src/app/modules/blog/data/blog-categories.json defaults. */
const CATEGORY_LABELS: Record<string, string> = {
  'ai-ml': 'AI & ML',
  systems: 'Systems Design',
  product: 'Product Engineering',
  'product-design': 'Product Engineering',
  architecture: 'Architecture',
  engineering: 'Engineering',
  default: 'Engineering',
};

export function resolveCategoryLabel(categoryId: string, override?: string): string {
  const custom = override?.trim();
  if (custom) return custom;
  const key = categoryId.trim().toLowerCase().replace(/\s+/g, '-');
  if (!key) return 'Blog';
  return CATEGORY_LABELS[key] ?? titleCaseFromSlug(key);
}

function titleCaseFromSlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
