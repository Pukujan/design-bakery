import type { Blog, BlogCategory, BlogSummary } from './blogData.js';

const SUMMARIES_KEY = 'design-bakery:blog-summaries:v1';
const CATEGORIES_KEY = 'design-bakery:blog-categories:v1';
const POST_KEY_PREFIX = 'design-bakery:blog-post:v1:';

/** Persisted list cache — longer than in-memory (5m) for instant paint on return visits. */
export const BLOG_LOCAL_CACHE_MS = 24 * 60 * 60 * 1000;

type SummariesPayload = {
  fetchedAt: number;
  summaries: BlogSummary[];
};

type CategoriesPayload = {
  fetchedAt: number;
  items: BlogCategory[];
};

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function isFresh(fetchedAt: number, maxAgeMs = BLOG_LOCAL_CACHE_MS): boolean {
  return Date.now() - fetchedAt < maxAgeMs;
}

function safeSet(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded or private mode — ignore
  }
}

export function readPersistedSummaries(): SummariesPayload | null {
  if (typeof window === 'undefined') return null;
  const parsed = safeParse<SummariesPayload>(localStorage.getItem(SUMMARIES_KEY));
  if (!parsed?.summaries?.length || !isFresh(parsed.fetchedAt)) return null;
  return parsed;
}

export function writePersistedSummaries(summaries: BlogSummary[]): void {
  safeSet(SUMMARIES_KEY, { fetchedAt: Date.now(), summaries } satisfies SummariesPayload);
}

export function readPersistedCategories(): CategoriesPayload | null {
  if (typeof window === 'undefined') return null;
  const parsed = safeParse<CategoriesPayload>(localStorage.getItem(CATEGORIES_KEY));
  if (!parsed?.items?.length || !isFresh(parsed.fetchedAt)) return null;
  return parsed;
}

export function writePersistedCategories(items: BlogCategory[]): void {
  safeSet(CATEGORIES_KEY, { fetchedAt: Date.now(), items } satisfies CategoriesPayload);
}

export function readPersistedPost(numericId: number): Blog | null {
  if (typeof window === 'undefined' || !numericId) return null;
  const parsed = safeParse<Blog & { fetchedAt?: number }>(
    localStorage.getItem(`${POST_KEY_PREFIX}${numericId}`),
  );
  if (!parsed?.title || !parsed.fetchedAt || !isFresh(parsed.fetchedAt)) return null;
  const { fetchedAt: _fetchedAt, ...blog } = parsed;
  return blog;
}

export function writePersistedPost(blog: Blog): void {
  if (!blog.id) return;
  safeSet(`${POST_KEY_PREFIX}${blog.id}`, { ...blog, fetchedAt: Date.now() });
}

/** Summary row from list cache — used for detail shell before full post loads. */
export function summaryToBlogShell(summary: BlogSummary): Blog {
  return { ...summary, content: '' };
}

export function findPersistedSummary(numericId: number): BlogSummary | undefined {
  return readPersistedSummaries()?.summaries.find((s) => s.id === numericId);
}

export function clearPersistedBlogCache(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(SUMMARIES_KEY);
    localStorage.removeItem(CATEGORIES_KEY);
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(POST_KEY_PREFIX)) keysToRemove.push(key);
    }
    for (const key of keysToRemove) localStorage.removeItem(key);
  } catch {
    // ignore
  }
}
