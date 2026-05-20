import { useEffect, useState } from 'react';
import blogDataJson from './blog-data.json';
import categoriesJson from './blog-categories.json';
import { collection, doc, getDoc, getDocs, orderBy, query } from 'firebase/firestore';
import { firestore } from '../../lib/firebase';

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
}

export interface BlogCategory {
  id: string;
  label: string;
  color: string;
}

function parseBlogDate(date: string): number {
  const ts = Date.parse(date.trim());
  return Number.isNaN(ts) ? 0 : ts;
}

type BlogSortable = { date: string; id?: number; numericId?: number };

export function compareBlogsByDateDesc(a: BlogSortable, b: BlogSortable): number {
  const byDate = parseBlogDate(b.date) - parseBlogDate(a.date);
  if (byDate !== 0) return byDate;
  return (b.id ?? b.numericId ?? 0) - (a.id ?? a.numericId ?? 0);
}

/** Newest first (by `date` string, then `id` as tiebreaker). */
export function sortBlogsByDateDesc(blogs: Blog[]): Blog[] {
  return [...blogs].sort(compareBlogsByDateDesc);
}

export const blogData = sortBlogsByDateDesc(blogDataJson as Blog[]);
export const categories = categoriesJson as BlogCategory[];

type FirestoreBlog = Omit<Blog, 'id'> & { numericId?: number };

function mapFirestoreBlogs(snap: Awaited<ReturnType<typeof getDocs>>): Blog[] {
  return snap.docs.map((d, idx) => {
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
      content: row.content,
    };
  });
}

export async function getBlogDataLive(): Promise<Blog[]> {
  const fallback = sortBlogsByDateDesc(blogDataJson as Blog[]);
  if (!firestore) return fallback;

  try {
    const q = query(collection(firestore, 'blog_posts'), orderBy('numericId', 'desc'));
    const snap = await getDocs(q);
    if (snap.empty) return fallback;

    return sortBlogsByDateDesc(mapFirestoreBlogs(snap));
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
  blogs: Blog[];
  isLoading: boolean;
};

export function useBlogData(): UseBlogDataResult {
  const hasLiveSource = Boolean(firestore);
  const [liveBlogs, setLiveBlogs] = useState<Blog[]>(blogData);
  const [isLoading, setIsLoading] = useState(hasLiveSource);

  useEffect(() => {
    if (!hasLiveSource) {
      setIsLoading(false);
      return;
    }

    let active = true;
    void getBlogDataLive().then((items) => {
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
