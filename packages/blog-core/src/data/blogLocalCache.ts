import type { Blog, BlogCategory, BlogSummary } from './blogData.js';

const SUMMARIES_KEY = 'design-bakery:blog-summaries:v2';
const CATEGORIES_KEY = 'design-bakery:blog-categories:v2';
const POST_KEY_PREFIX = 'design-bakery:blog-post:v2:';
const LEGACY_SUMMARIES_KEY = 'design-bakery:blog-summaries:v1';
const LEGACY_CATEGORIES_KEY = 'design-bakery:blog-categories:v1';
const LEGACY_POST_PREFIX = 'design-bakery:blog-post:v1:';

/** Persisted cache TTL — aligned with in-memory blog cache (issue #23). */
export const BLOG_LOCAL_CACHE_MS = 5 * 60 * 1000;

type SummariesPayload = {
  fetchedAt: number;
  summaries: BlogSummary[];
};

type CategoriesPayload = {
  fetchedAt: number;
  items: BlogCategory[];
};

type PersistedPostPayload = Blog & {
  fetchedAt: number;
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

function parseUpdatedAt(value: string | undefined): number {
  if (!value?.trim()) return 0;
  const ts = Date.parse(value);
  return Number.isNaN(ts) ? 0 : ts;
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

function readPersistedPostPayload(numericId: number): PersistedPostPayload | null {
  if (typeof window === 'undefined' || !numericId) return null;
  const parsed = safeParse<PersistedPostPayload>(
    localStorage.getItem(`${POST_KEY_PREFIX}${numericId}`),
  );
  if (!parsed?.title || !parsed.fetchedAt || !isFresh(parsed.fetchedAt)) return null;
  return parsed;
}

/** True when list cache has a newer CMS revision than the stored full post. */
export function isPersistedPostStaleVsSummary(numericId: number): boolean {
  const post = readPersistedPostPayload(numericId);
  const summary = findPersistedSummary(numericId);
  if (!post?.content?.trim() || !summary?.updatedAt) return false;
  const postTs = parseUpdatedAt(post.updatedAt);
  const summaryTs = parseUpdatedAt(summary.updatedAt);
  return summaryTs > postTs;
}

export function readPersistedPost(numericId: number): Blog | null {
  const parsed = readPersistedPostPayload(numericId);
  if (!parsed) return null;
  if (isPersistedPostStaleVsSummary(numericId)) return null;
  const { fetchedAt: _fetchedAt, ...blog } = parsed;
  return blog;
}

export function writePersistedPost(blog: Blog): void {
  if (!blog.id) return;
  safeSet(`${POST_KEY_PREFIX}${blog.id}`, { ...blog, fetchedAt: Date.now() });
}

export function clearPersistedBlogPost(numericId: number): void {
  if (typeof window === 'undefined' || !numericId) return;
  try {
    localStorage.removeItem(`${POST_KEY_PREFIX}${numericId}`);
  } catch {
    // ignore
  }
}

/** Summary row from list cache — used for detail shell before full post loads. */
export function summaryToBlogShell(summary: BlogSummary): Blog {
  return { ...summary, content: '' };
}

export function findPersistedSummary(numericId: number): BlogSummary | undefined {
  return readPersistedSummaries()?.summaries.find((s) => s.id === numericId);
}

function evictLegacyV1Cache(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(LEGACY_SUMMARIES_KEY);
    localStorage.removeItem(LEGACY_CATEGORIES_KEY);
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(LEGACY_POST_PREFIX)) keysToRemove.push(key);
    }
    for (const key of keysToRemove) localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function clearPersistedBlogCache(): void {
  if (typeof window === 'undefined') return;
  try {
    evictLegacyV1Cache();
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

if (typeof window !== 'undefined') {
  evictLegacyV1Cache();
}
