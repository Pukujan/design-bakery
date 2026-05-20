import type { BlogSeo } from '@/modules/engineering/blogSeo';

export type SeoChangeAction = 'added' | 'updated' | 'removed' | 'unchanged';

export type SeoFieldChange = {
  field: keyof BlogSeo;
  label: string;
  action: SeoChangeAction;
  /** Human-readable prior value (or fallback note). */
  before: string;
  /** Human-readable new value. */
  after: string;
};

function norm(value: string | undefined): string {
  return value?.trim() ?? '';
}

function actionFor(before: string, after: string): SeoChangeAction {
  if (before === after) return 'unchanged';
  if (!before && after) return 'added';
  if (before && !after) return 'removed';
  return 'updated';
}

function displayMetaTitle(value: string, postTitle: string): string {
  if (!value) return `(empty — live site uses post title: “${postTitle}”)`;
  return value;
}

function displayMetaDescription(value: string, excerpt: string): string {
  if (!value) return `(empty — live site uses excerpt: “${excerpt.slice(0, 120)}${excerpt.length > 120 ? '…' : ''}”)`;
  return value;
}

function displayOgImage(value: string): string {
  if (!value) return '(none)';
  return value;
}

/** Compare two SEO drafts (or saved vs new) for a clear change log. */
export function buildSeoFieldChanges(
  before: BlogSeo,
  after: BlogSeo,
  post: { title: string; excerpt: string }
): SeoFieldChange[] {
  const bTitle = norm(before.metaTitle);
  const aTitle = norm(after.metaTitle);
  const bDesc = norm(before.metaDescription);
  const aDesc = norm(after.metaDescription);
  const bOg = norm(before.ogImage);
  const aOg = norm(after.ogImage);

  const rows: SeoFieldChange[] = [
    {
      field: 'metaTitle',
      label: 'Meta title',
      action: actionFor(bTitle, aTitle),
      before: displayMetaTitle(bTitle, post.title),
      after: displayMetaTitle(aTitle, post.title),
    },
    {
      field: 'metaDescription',
      label: 'Meta description',
      action: actionFor(bDesc, aDesc),
      before: displayMetaDescription(bDesc, post.excerpt),
      after: displayMetaDescription(aDesc, post.excerpt),
    },
    {
      field: 'ogImage',
      label: 'Share image (OG)',
      action: actionFor(bOg, aOg),
      before: displayOgImage(bOg),
      after: displayOgImage(aOg),
    },
  ];

  return rows.filter((r) => r.action !== 'unchanged');
}

/** When save matches prior values — still show what is stored / effective. */
export function buildSeoEffectiveSnapshot(
  seo: BlogSeo,
  post: { title: string; excerpt: string }
): SeoFieldChange[] {
  return [
    {
      field: 'metaTitle',
      label: 'Meta title (effective)',
      action: 'added',
      before: '—',
      after: displayMetaTitle(norm(seo.metaTitle), post.title),
    },
    {
      field: 'metaDescription',
      label: 'Meta description (effective)',
      action: 'added',
      before: '—',
      after: displayMetaDescription(norm(seo.metaDescription), post.excerpt),
    },
    {
      field: 'ogImage',
      label: 'Share image (OG)',
      action: 'added',
      before: '—',
      after: displayOgImage(norm(seo.ogImage)),
    },
  ];
}
