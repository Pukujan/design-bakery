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

export const blogData = blogDataJson as Blog[];
export const categories = categoriesJson as BlogCategory[];

type FirestoreBlog = Omit<Blog, 'id'> & { numericId?: number };

export async function getBlogDataLive(): Promise<Blog[]> {
  const fallback = blogDataJson as Blog[];
  if (!firestore) return fallback;

  try {
    const q = query(collection(firestore, 'blog_posts'), orderBy('numericId', 'asc'));
    const snap = await getDocs(q);
    if (snap.empty) return fallback;

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

export function useBlogData() {
  const [liveBlogs, setLiveBlogs] = useState<Blog[]>(blogData);

  useEffect(() => {
    let active = true;
    void getBlogDataLive().then((items) => {
      if (active) setLiveBlogs(items);
    });
    return () => {
      active = false;
    };
  }, []);

  return liveBlogs;
}
