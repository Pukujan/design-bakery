import { useEffect, useMemo, useState } from 'react';
import blogDataJson from './blog-data.json';
import categoriesJson from './blog-categories.json';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { normalizeBlogSeo, type BlogSeo } from '@/modules/blog/seo/blogMeta';

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

export function invalidateBlogCache() {
  blogCache = null;
  blogCachePromise = null;
}

function parseBlogDate(date: string): number {
  const ts = Date.parse(date.trim());
  return Number.isNaN(ts) ? 0 : ts;
}

type BlogSortable = { date: string; id?: number; numericId?: number };

/** Canonical numeric id for routes and merge (ignores Firestore string doc ids). */
export function resolveBlogNumericId(post: {
  numericId?: number;
  id?: number | string;
}): number {
  if (typeof post.numericId === 'number' && post.numericId > 0) return post.numericId;
  if (typeof post.id === 'number' && post.id > 0) return post.id;
  return 0;
}

/** Stable key for merging JSON seed rows with Firestore docs (admin + public site). */
export function blogPostMergeKey(post: {
  numericId?: number;
  id?: number | string;
  title?: string;
}): string {
  return `n:${resolveBlogNumericId(post)}`;
}

/** Next unused numeric id (JSON seeds + merged Firestore rows). */
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

/** JSON fallback first; Firestore wins on the same numericId (title changes must not fork rows). */
export function mergeBlogPostsWithFallback<T extends BlogSortable & { title: string }>(
  fallbackPosts: T[],
  firestorePosts: T[],
): T[] {
  const byKey = new Map<string, T>();
  for (const post of fallbackPosts) {
    byKey.set(blogPostMergeKey(post), post);
  }
  for (const post of firestorePosts) {
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

type FirestoreBlog = Omit<Blog, 'id'> & { numericId?: number; seo?: BlogSeo };

function mapFirestoreDoc(d: { data: () => unknown; id: string }, idx: number): Blog {
  const row = d.data() as FirestoreBlog;
  return {
    id: row.numericId ?? idx + 1,
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
    seo: normalizeBlogSeo(row.seo),
  };
}

function mapFirestoreBlogs(snap: Awaited<ReturnType<typeof getDocs>>): Blog[] {
  return snap.docs.map((d, idx) => mapFirestoreDoc(d, idx));
}

export async function getBlogDataLive(): Promise<Blog[]> {
  const cache = await loadBlogCache();
  return cache.full;
}

async function fetchAllBlogsUncached(): Promise<Blog[]> {
  const fallback = sortBlogsByDateDesc(fallbackBlogsFromJson());
  if (!firestore) return fallback;

  try {
    const q = query(collection(firestore, 'blog_posts'), orderBy('numericId', 'desc'));
    const snap = await getDocs(q);
    const firestoreBlogs = mapFirestoreBlogs(snap).map((b) => ({ ...b, numericId: b.id }));
    if (snap.empty) return fallback;

    return mergeBlogPostsWithFallback(fallback, firestoreBlogs);
  } catch {
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
      return entry;
    });
  }
  return blogCachePromise;
}

export async function getBlogSummariesLive(): Promise<BlogSummary[]> {
  const cache = await loadBlogCache();
  return cache.summaries;
}

function findFallbackBlog(numericId: number): Blog | undefined {
  return fallbackBlogsFromJson().find((b) => b.id === numericId);
}

/** Detail page — one Firestore doc by numericId (not the full collection). */
export async function getBlogByNumericIdLive(numericId: number): Promise<Blog | undefined> {
  const fallback = findFallbackBlog(numericId);
  if (!firestore) return fallback;

  try {
    const q = query(
      collection(firestore, 'blog_posts'),
      where('numericId', '==', numericId),
      limit(1),
    );
    const snap = await getDocs(q);
    if (snap.empty) return fallback;

    const firestoreBlog = mapFirestoreDoc(snap.docs[0], 0);
    if (!fallback) return firestoreBlog;

    return mergeBlogPostsWithFallback([fallback], [{ ...firestoreBlog, numericId: firestoreBlog.id }])[0];
  } catch {
    return fallback;
  }
}

export async function getBlogCategoriesLive(): Promise<BlogCategory[]> {
  const fallback = categoriesJson as BlogCategory[];
  if (!firestore) return fallback;

  try {
    const snap = await getDoc(doc(firestore, 'blog_categories', 'data'));
    if (!snap.exists()) return fallback;
    const data = snap.data() as { items?: BlogCategory[] };
    return data.items && data.items.length > 0 ? data.items : fallback;
  } catch {
    return fallback;
  }
}

export function useBlogCategories() {
  const [liveCategories, setLiveCategories] = useState<BlogCategory[]>(categories);

  useEffect(() => {
    let active = true;
    void getBlogCategoriesLive().then((items) => {
      if (active) setLiveCategories(items);
    });
    return () => {
      active = false;
    };
  }, []);

  return liveCategories;
}

export type UseBlogDataResult = {
  blogs: BlogSummary[];
  isLoading: boolean;
};

/** Blog list, insights, nav — summaries only; shared in-memory cache. */
export function useBlogData(): UseBlogDataResult {
  const hasLiveSource = Boolean(firestore);
  const [liveBlogs, setLiveBlogs] = useState<BlogSummary[]>(blogData.map(toBlogSummary));
  const [isLoading, setIsLoading] = useState(hasLiveSource);

  useEffect(() => {
    if (!hasLiveSource) {
      setIsLoading(false);
      return;
    }

    let active = true;
    void getBlogSummariesLive().then((items) => {
      if (active) {
        setLiveBlogs(items);
        setIsLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [hasLiveSource]);

  return { blogs: liveBlogs, isLoading };
}

export type UseBlogPostResult = {
  blog: Blog | undefined;
  isLoading: boolean;
};

/** Blog detail — single post fetch; uses JSON fallback until Firestore returns. */
export function useBlogPost(numericId: number | undefined): UseBlogPostResult {
  const hasLiveSource = Boolean(firestore);
  const validId =
    typeof numericId === 'number' && !Number.isNaN(numericId) && numericId > 0
      ? numericId
      : undefined;

  const jsonFallback = useMemo(
    () => (validId ? findFallbackBlog(validId) : undefined),
    [validId],
  );

  const [blog, setBlog] = useState<Blog | undefined>(jsonFallback);
  const [isLoading, setIsLoading] = useState(hasLiveSource && Boolean(validId));

  useEffect(() => {
    setBlog(jsonFallback);

    if (!validId) {
      setIsLoading(false);
      return;
    }

    if (!hasLiveSource) {
      setIsLoading(false);
      return;
    }

    let active = true;
    setIsLoading(true);
    void getBlogByNumericIdLive(validId).then((item) => {
      if (active) {
        setBlog(item);
        setIsLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [validId, hasLiveSource, jsonFallback]);

  return { blog, isLoading };
}
