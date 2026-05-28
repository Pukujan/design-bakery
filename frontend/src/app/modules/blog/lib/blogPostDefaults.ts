/** Default author for new blog posts (admin editor). */
export const DEFAULT_BLOG_AUTHOR = 'design-bakery';

const MONTH_ABBREV = [
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
] as const;

/** Display date for blog cards/detail — e.g. `may - 27 - 2026`. */
export function formatBlogDisplayDate(date = new Date()): string {
  const month = MONTH_ABBREV[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} - ${day} - ${year}`;
}

export function parseBlogDisplayDate(date: string): number {
  const trimmed = date.trim();
  const m = trimmed.match(
    /^([a-z]{3})\s*-\s*(\d{1,2})\s*-\s*(\d{4})$/i,
  );
  if (m) {
    const monthIdx = MONTH_ABBREV.indexOf(m[1].toLowerCase() as (typeof MONTH_ABBREV)[number]);
    if (monthIdx >= 0) {
      const ts = Date.UTC(Number(m[3]), monthIdx, Number(m[2]));
      if (!Number.isNaN(ts)) return ts;
    }
  }
  const fallback = Date.parse(trimmed);
  return Number.isNaN(fallback) ? 0 : fallback;
}

/** Hidden sort key — prefers ISO `publishedAt`, then display `date`. */
export function blogSortTimestamp(post: { publishedAt?: string; date: string }): number {
  if (post.publishedAt) {
    const t = Date.parse(post.publishedAt);
    if (!Number.isNaN(t)) return t;
  }
  return parseBlogDisplayDate(post.date);
}

export type NewBlogPostDraft = {
  numericId: number;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  tags: string[];
  category: string;
  color: string;
  author: string;
  content: string;
  publishedAt: string;
};

export function createNewBlogPostDraft(category: string): NewBlogPostDraft {
  const now = new Date();
  return {
    numericId: 0,
    title: '',
    excerpt: '',
    date: formatBlogDisplayDate(now),
    readTime: '',
    tags: [],
    category,
    color: '#6366f1',
    author: DEFAULT_BLOG_AUTHOR,
    content: '',
    publishedAt: now.toISOString(),
  };
}

export function prepareBlogPostForSave<
  T extends {
    id?: string;
    author: string;
    date: string;
    publishedAt?: string;
  },
>(post: T): T {
  const author = post.author.trim() || DEFAULT_BLOG_AUTHOR;
  const isNew = !post.id;
  const publishedAt =
    post.publishedAt ?? (isNew ? new Date().toISOString() : post.publishedAt);
  let date = post.date.trim();
  if (!date) {
    date = formatBlogDisplayDate(
      publishedAt ? new Date(publishedAt) : new Date(),
    );
  }
  return {
    ...post,
    author,
    date,
    ...(publishedAt ? { publishedAt } : {}),
  };
}
