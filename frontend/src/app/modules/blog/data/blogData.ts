import { useEffect, useMemo, useState } from 'react';
import blogDataJson from './blog-data.json';
import categoriesJson from './blog-categories.json';
import { fetchPublic } from '@/lib/contentApi';
import { getAuthApiBaseUrl } from '@/lib/adminToken';
import { isPublicBlogSourceEnabled, isSupabaseDirectReadEnabled } from '@/lib/blogSource';
import {
  fetchBlogCategoriesFromSupabase,
  fetchBlogListFromSupabase,
  fetchBlogPostFromSupabase,
  type RemoteBlogDto,
} from './blogSupabase.js';
import { normalizeBlogSeo, type BlogSeo } from '@/modules/blog/seo/blogMeta';
import {
  clearPersistedBlogCache,
  findPersistedSummary,
  readPersistedCategories,
  readPersistedPost,
  readPersistedSummaries,
  summaryToBlogShell,
  writePersistedCategories,
  writePersistedPost,
  writePersistedSummaries,
} from './blogLocalCache.js';

export type { BlogSeo };

export interface Blog {
  id: number;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  tags: string[];
  category: string;
  color: string;
  author: string;
  content: string;
  /** Hero image below the title on blog detail */
  coverImageUrl?: string;
  /** 640×360 list card image (from publish kit commit) */
  thumbnailImageUrl?: string;
  seo?: BlogSeo;
  /** CMS revision time — used to invalidate stale localStorage (#23). */
  updatedAt?: string;
}

/** List / nav / similar-articles — no markdown body (smaller React trees). */
export type BlogSummary = Omit<Blog, 'content'>;

export interface BlogCategory {
  id: string;
  label: string;
  color: string;
}

const BLOG_CACHE_MS = 5 * 60 * 1000;

type BlogCache = {
  full: Blog[];
  summaries: BlogSummary[];
  fetchedAt: number;
};

let blogCache: BlogCache | null = null;
let blogCachePromise: Promise<BlogCache> | null = null;

export function invalidateBlogCache(): void {
  blogCache = null;
  blogCachePromise = null;
  clearPersistedBlogCache();
}

function parseBlogDate(date: string): number {
  const ts = Date.parse(date.trim());
  return Number.isNaN(ts) ? 0 : ts;
}

type BlogSortable = { date: string; id?: number; numericId?: number };

/** Canonical numeric id for routes and merge. */
export function resolveBlogNumericId(post: {
  numericId?: number;
  id?: number | string;
}): number {
  if (typeof post.numericId === 'number' && post.numericId > 0) return post.numericId;
  if (typeof post.id === 'number' && post.id > 0) return post.id;
  return 0;
}

/** Stable key for merging JSON seed rows with CMS docs (admin + public site). */
export function blogPostMergeKey(post: {
  numericId?: number;
  id?: number | string;
  title?: string;
}): string {
  return `n:${resolveBlogNumericId(post)}`;
}

/** Next unused numeric id (JSON seeds + merged CMS rows). */
export function nextBlogNumericId(posts: { numericId?: number; id?: number | string }[]): number {
  const used = new Set(posts.map(resolveBlogNumericId).filter((n) => n > 0));
  const jsonMax = (blogDataJson as { id?: number }[]).reduce(
    (max, row) => Math.max(max, typeof row.id === 'number' ? row.id : 0),
    0,
  );
  let candidate = Math.max(jsonMax, ...used, 0) + 1;
  while (used.has(candidate)) candidate += 1;
  return candidate;
}

/** Route lookup — if legacy data has duplicate ids, prefer the newest post. */
export function findBlogByNumericId(blogs: Blog[], routeId: number): Blog | undefined {
  const matches = blogs.filter((b) => b.id === routeId);
  if (matches.length === 0) return undefined;
  if (matches.length === 1) return matches[0];
  return matches.reduce((best, cur) => (compareBlogsByDateDesc(cur, best) < 0 ? cur : best));
}

export function toBlogSummary(post: Blog): BlogSummary {
  const { content: _content, ...summary } = post;
  return summary;
}

/** JSON fallback first; CMS wins on the same numericId. */
export function mergeBlogPostsWithFallback<T extends BlogSortable & { title: string }>(
  fallbackPosts: T[],
  remotePosts: T[],
): T[] {
  const byKey = new Map<string, T>();
  for (const post of fallbackPosts) {
    byKey.set(blogPostMergeKey(post), post);
  }
  for (const post of remotePosts) {
    byKey.set(blogPostMergeKey(post), post);
  }
  return sortBlogsByDateDesc([...byKey.values()]);
}

function fallbackBlogsFromJson(): Blog[] {
  return (blogDataJson as Blog[]).map((p, i) => ({
    ...p,
    id: p.id ?? i + 1,
    numericId: p.id ?? i + 1,
  }));
}

export function compareBlogsByDateDesc(a: BlogSortable, b: BlogSortable): number {
  const byDate = parseBlogDate(b.date) - parseBlogDate(a.date);
  if (byDate !== 0) return byDate;
  return (b.id ?? b.numericId ?? 0) - (a.id ?? a.numericId ?? 0);
}

/** Newest first (by `date` string, then `id` as tiebreaker). */
export function sortBlogsByDateDesc<T extends BlogSortable>(blogs: T[]): T[] {
  return [...blogs].sort(compareBlogsByDateDesc);
}

export const blogData = sortBlogsByDateDesc(blogDataJson as Blog[]);
export const categories = categoriesJson as BlogCategory[];

function mapRemoteBlog(row: RemoteBlogDto): Blog {
  const numericId = typeof row.numericId === 'number' ? row.numericId : Number(row.id) || 0;
  return {
    id: numericId,
    title: row.title,
    excerpt: row.excerpt,
    date: row.date,
    readTime: row.readTime,
    tags: row.tags ?? [],
    category: row.category,
    color: row.color,
    author: row.author,
    content: row.content ?? '',
    coverImageUrl: row.coverImageUrl?.trim() || undefined,
    thumbnailImageUrl: row.thumbnailImageUrl?.trim() || undefined,
    seo: normalizeBlogSeo(row.seo as BlogSeo | undefined),
    updatedAt: row.updatedAt,
  };
}

async function fetchBlogPostRemote(numericId: number): Promise<Blog | null> {
  let dto: RemoteBlogDto | null = null;
  if (isSupabaseDirectReadEnabled()) {
    try {
      dto = await fetchBlogPostFromSupabase(numericId);
    } catch {
      // fall through to Railway API
    }
  }
  if (!dto && getAuthApiBaseUrl()) {
    const data = await fetchPublic<{ blog: RemoteBlogDto }>(`/api/public/blogs/${numericId}`);
    dto = data.blog;
  }
  if (!dto) return null;
  return mapRemoteBlog(dto);
}

function persistBlogCacheEntry(entry: BlogCache): void {
  writePersistedSummaries(entry.summaries);
  for (const post of entry.full) {
    if (post.content?.trim()) writePersistedPost(post);
  }
}

function blogFromMemoryCache(numericId: number): Blog | undefined {
  const cached = blogCache?.full;
  if (!cached) return undefined;
  return findBlogByNumericId(cached, numericId);
}

function initialListState(hasLiveSource: boolean): { blogs: BlogSummary[]; isLoading: boolean } {
  if (!hasLiveSource) {
    return { blogs: blogData.map(toBlogSummary), isLoading: false };
  }
  const persisted = readPersistedSummaries();
  const memory = blogCache?.summaries;
  const blogs = memory ?? persisted?.summaries ?? [];
  return { blogs, isLoading: blogs.length === 0 };
}

function initialPostState(
  hasLiveSource: boolean,
  numericId: number | undefined,
): { blog: Blog | undefined; isLoading: boolean } {
  if (!numericId) return { blog: undefined, isLoading: false };
  if (!hasLiveSource) {
    return { blog: findFallbackBlog(numericId), isLoading: false };
  }
  const full =
    readPersistedPost(numericId) ??
    blogFromMemoryCache(numericId) ??
    (() => {
      const summary = findPersistedSummary(numericId);
      return summary ? summaryToBlogShell(summary) : undefined;
    })();
  const needsFetch = !full?.content?.trim();
  return { blog: full, isLoading: needsFetch };
}

export async function getBlogDataLive(): Promise<Blog[]> {
  const cache = await loadBlogCache();
  return cache.full;
}

async function fetchRemoteBlogList(): Promise<RemoteBlogDto[]> {
  if (isSupabaseDirectReadEnabled()) {
    try {
      const rows = await fetchBlogListFromSupabase();
      if (rows.length) return rows;
    } catch {
      // fall through to Railway API
    }
  }
  if (getAuthApiBaseUrl()) {
    const data = await fetchPublic<{ blogs: RemoteBlogDto[] }>('/api/public/blogs');
    return data.blogs ?? [];
  }
  return [];
}

async function fetchAllBlogsUncached(): Promise<Blog[]> {
  const fallback = sortBlogsByDateDesc(fallbackBlogsFromJson());

  if (!isPublicBlogSourceEnabled()) return fallback;

  try {
    const remote = (await fetchRemoteBlogList()).map(mapRemoteBlog).map((b) => ({ ...b, numericId: b.id }));
    if (remote.length === 0) {
      const persisted = readPersistedSummaries();
      if (persisted?.summaries.length) {
        return persisted.summaries.map((s) => summaryToBlogShell(s));
      }
      return fallback;
    }
    return mergeBlogPostsWithFallback(fallback, remote);
  } catch {
    const persisted = readPersistedSummaries();
    if (persisted?.summaries.length) {
      return persisted.summaries.map((s) => summaryToBlogShell(s));
    }
    return fallback;
  }
}

async function loadBlogCache(): Promise<BlogCache> {
  if (blogCache && Date.now() - blogCache.fetchedAt < BLOG_CACHE_MS) {
    return blogCache;
  }
  if (!blogCachePromise) {
    blogCachePromise = fetchAllBlogsUncached().then((full) => {
      const entry: BlogCache = {
        full,
        summaries: full.map(toBlogSummary),
        fetchedAt: Date.now(),
      };
      blogCache = entry;
      blogCachePromise = null;
      if (isPublicBlogSourceEnabled()) persistBlogCacheEntry(entry);
      return entry;
    });
  }
  return blogCachePromise;
}

/** Warm list cache on app load when CMS API is configured. */
export function primeBlogCache(): void {
  if (!isPublicBlogSourceEnabled() || typeof window === 'undefined') return;
  void loadBlogCache();
}

export async function getBlogSummariesLive(): Promise<BlogSummary[]> {
  const cache = await loadBlogCache();
  return cache.summaries;
}

function findFallbackBlog(numericId: number): Blog | undefined {
  return fallbackBlogsFromJson().find((b) => b.id === numericId);
}

export async function getBlogByNumericIdLive(numericId: number): Promise<Blog | undefined> {
  const fallback = findFallbackBlog(numericId);

  if (!isPublicBlogSourceEnabled()) return fallback;

  const persisted = readPersistedPost(numericId);
  const memoryHit = blogFromMemoryCache(numericId);
  const memoryFresh =
    Boolean(blogCache && Date.now() - blogCache.fetchedAt < BLOG_CACHE_MS);

  try {
    const remote = await fetchBlogPostRemote(numericId);
    if (!remote) throw new Error('Blog not found');
    writePersistedPost(remote);
    if (!fallback) return remote;
    return mergeBlogPostsWithFallback([fallback], [{ ...remote, numericId: remote.id }])[0];
  } catch {
    if (memoryHit?.content?.trim() && memoryFresh) return memoryHit;
    if (persisted?.content?.trim()) return persisted;
    const summary = findPersistedSummary(numericId);
    if (summary) return summaryToBlogShell(summary);
    return fallback;
  }
}

export async function getBlogCategoriesLive(): Promise<BlogCategory[]> {
  const fallback = categoriesJson as BlogCategory[];

  if (!isPublicBlogSourceEnabled()) return fallback;

  try {
    let items: BlogCategory[] | undefined;
    if (isSupabaseDirectReadEnabled()) {
      try {
        const direct = await fetchBlogCategoriesFromSupabase();
        if (direct.length) items = direct;
      } catch {
        // fall through
      }
    }
    if (!items?.length && getAuthApiBaseUrl()) {
      const data = await fetchPublic<{ items: BlogCategory[] }>('/api/public/blog-categories');
      items = data.items?.length ? data.items : undefined;
    }
    const resolved = items?.length ? items : fallback;
    writePersistedCategories(resolved);
    return resolved;
  } catch {
    return readPersistedCategories()?.items ?? fallback;
  }
}

export function useBlogCategories() {
  const hasLiveSource = isPublicBlogSourceEnabled();
  const persisted = hasLiveSource ? readPersistedCategories()?.items : undefined;
  const [liveCategories, setLiveCategories] = useState<BlogCategory[]>(
    persisted ?? categories,
  );

  useEffect(() => {
    if (!hasLiveSource) return;
    let active = true;
    void getBlogCategoriesLive().then((items) => {
      if (active) setLiveCategories(items);
    });
    return () => {
      active = false;
    };
  }, [hasLiveSource]);

  return liveCategories;
}

export type UseBlogDataResult = {
  blogs: BlogSummary[];
  isLoading: boolean;
  isRefreshing: boolean;
};

/** Blog list, insights, nav — summaries only; stale-while-revalidate from localStorage. */
export function useBlogData(): UseBlogDataResult {
  const hasLiveSource = isPublicBlogSourceEnabled();
  const initial = initialListState(hasLiveSource);
  const [liveBlogs, setLiveBlogs] = useState<BlogSummary[]>(initial.blogs);
  const [isLoading, setIsLoading] = useState(initial.isLoading);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!hasLiveSource) return;

    let active = true;
    const hadData = liveBlogs.length > 0;
    if (hadData) setIsRefreshing(true);

    void getBlogSummariesLive().then((items) => {
      if (!active) return;
      setLiveBlogs(items);
      setIsLoading(false);
      setIsRefreshing(false);
    });

    return () => {
      active = false;
    };
  }, [hasLiveSource]);

  return { blogs: liveBlogs, isLoading, isRefreshing };
}

export type UseBlogPostResult = {
  blog: Blog | undefined;
  isLoading: boolean;
  isContentLoading: boolean;
  isRefreshing: boolean;
};

/** Blog detail — persisted/CMS data only when API enabled (no JSON flash). */
export function useBlogPost(numericId: number | undefined): UseBlogPostResult {
  const hasLiveSource = isPublicBlogSourceEnabled();
  const validId =
    typeof numericId === 'number' && !Number.isNaN(numericId) && numericId > 0
      ? numericId
      : undefined;

  const initial = initialPostState(hasLiveSource, validId);
  const [blog, setBlog] = useState<Blog | undefined>(initial.blog);
  const [isLoading, setIsLoading] = useState(initial.isLoading);
  const [isContentLoading, setIsContentLoading] = useState(
    Boolean(initial.blog && !initial.blog.content?.trim() && hasLiveSource),
  );
  const [isRefreshing, setIsRefreshing] = useState(
    Boolean(initial.blog?.content?.trim() && hasLiveSource),
  );

  useEffect(() => {
    if (!validId) {
      setBlog(undefined);
      setIsLoading(false);
      setIsContentLoading(false);
      setIsRefreshing(false);
      return;
    }

    if (!hasLiveSource) {
      setBlog(findFallbackBlog(validId));
      setIsLoading(false);
      setIsContentLoading(false);
      setIsRefreshing(false);
      return;
    }

    const nextInitial = initialPostState(true, validId);
    setBlog(nextInitial.blog);
    setIsLoading(nextInitial.isLoading);
    setIsContentLoading(Boolean(nextInitial.blog && !nextInitial.blog.content?.trim()));
    setIsRefreshing(Boolean(nextInitial.blog?.content?.trim()));

    let active = true;
    void getBlogByNumericIdLive(validId).then((item) => {
      if (!active) return;
      setBlog(item);
      setIsLoading(false);
      setIsContentLoading(false);
      setIsRefreshing(false);
    });

    return () => {
      active = false;
    };
  }, [validId, hasLiveSource]);

  return { blog, isLoading, isContentLoading, isRefreshing };
}

if (typeof window !== 'undefined') {
  primeBlogCache();
}
