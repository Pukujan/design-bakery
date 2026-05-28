/** Default author for new blog posts (admin editor). */
export const DEFAULT_BLOG_AUTHOR = 'design-bakery';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

/** Display date for blog cards/detail — e.g. `May 27 2026`. */
export function formatBlogDisplayDate(date = new Date()): string {
  const month = MONTH_NAMES[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day} ${year}`;
}

export function parseBlogDisplayDate(date: string): number {
  const trimmed = date.trim();
  const monthNames = MONTH_NAMES.map((month) => month.toLowerCase());
  const monthShort = MONTH_NAMES.map((month) => month.slice(0, 3).toLowerCase());

  // Legacy format support: `may - 27 - 2026`
  const legacy = trimmed.match(/^([a-z]{3})\s*-\s*(\d{1,2})\s*-\s*(\d{4})$/i);
  if (legacy) {
    const monthIdx = monthShort.indexOf(legacy[1].toLowerCase());
    if (monthIdx >= 0) {
      const ts = Date.UTC(Number(legacy[3]), monthIdx, Number(legacy[2]));
      if (!Number.isNaN(ts)) return ts;
    }
  }

  // New format: `May 27 2026` (also accepts short month like `May 27 2026`, `Jun 2 2026`)
  const modern = trimmed.match(/^([a-z]+)\s+(\d{1,2})\s+(\d{4})$/i);
  if (modern) {
    const rawMonth = modern[1].toLowerCase();
    const monthIdx = monthNames.indexOf(rawMonth);
    const resolvedMonth =
      monthIdx >= 0 ? monthIdx : monthShort.indexOf(rawMonth.slice(0, 3));
    if (resolvedMonth >= 0) {
      const ts = Date.UTC(Number(modern[3]), resolvedMonth, Number(modern[2]));
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
  return {
    numericId: 0,
    title: '',
    excerpt: '',
    date: '',
    readTime: '',
    tags: [],
    category,
    color: '#6366f1',
    author: '',
    content: '',
    publishedAt: '',
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
