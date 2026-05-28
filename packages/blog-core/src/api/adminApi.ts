import blogSeedJson from '../data/blog-data.json' with { type: 'json' };
import categoriesSeedJson from '../data/blog-categories.json' with { type: 'json' };
import {
  blogPostMergeKey,
  invalidateBlogCache,
  mergeBlogPostsWithFallback,
  nextBlogNumericId,
  resolveBlogNumericId,
  type BlogSeo,
} from '../data/blogData.js';
import { normalizeBlogSeo } from '../seo/blogMeta.js';
import {
  deleteAdminBlog,
  fetchAdminBlogs,
  fetchContentArray,
  isSupabaseContentEnabled,
  saveAdminBlog,
  saveContentArray,
} from './adminCmsApi.js';

export type { BlogSeo };

export interface BlogPost {
  id?: string;
  numericId?: number;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  tags: string[];
  category: string;
  color: string;
  author: string;
  content: string;
  coverImageUrl?: string;
  thumbnailImageUrl?: string;
  seo?: BlogSeo;
  publishedAt?: string;
}

export interface BlogCategory {
  id: string;
  label: string;
  color: string;
}

function stripUndefinedShallow<T extends Record<string, unknown>>(obj: T): T {
  const out = { ...obj };
  for (const key of Object.keys(out)) {
    if (out[key] === undefined) delete out[key];
  }
  return out;
}

function normalizeBlogPostForSave(post: BlogPost): Omit<BlogPost, 'id'> {
  const {
    id: _id,
    coverImageUrl: _cover,
    thumbnailImageUrl: _thumb,
    seo: _seo,
    ...data
  } = post;
  const tags = (data.tags ?? []).filter(Boolean).slice(0, 5);
  const coverImageUrl = post.coverImageUrl?.trim();
  const thumbnailImageUrl = post.thumbnailImageUrl?.trim();
  const seo = normalizeBlogSeo(post.seo);

  return stripUndefinedShallow({
    ...data,
    tags,
    ...(coverImageUrl ? { coverImageUrl } : {}),
    ...(thumbnailImageUrl ? { thumbnailImageUrl } : {}),
    ...(seo ? { seo } : {}),
  }) as Omit<BlogPost, 'id'>;
}

const fallbackBlogs = (): BlogPost[] =>
  (blogSeedJson as unknown as BlogPost[]).map((p, i) => ({
    ...p,
    numericId: p.numericId ?? (p as { id?: number }).id ?? i + 1,
  }));

export async function getBlogs(): Promise<BlogPost[]> {
  const fallback = fallbackBlogs();
  if (!isSupabaseContentEnabled()) return fallback;
  try {
    const remote = (await fetchAdminBlogs()) as BlogPost[];
    return mergeBlogPostsWithFallback(fallback, remote);
  } catch {
    return fallback;
  }
}

export async function syncBlogPostsFromSeed(): Promise<number> {
  if (!isSupabaseContentEnabled()) return 0;
  const existing = await getBlogs();
  const existingKeys = new Set(existing.map((p) => blogPostMergeKey(p)));
  const missing = fallbackBlogs().filter((post) => !existingKeys.has(blogPostMergeKey(post)));
  if (missing.length === 0) return 0;
  await Promise.all(
    missing.map(async (post) => {
      const seedId =
        typeof post.id === 'string' && post.id.length > 0
          ? `seed-${post.id}`
          : `seed-${post.numericId}`;
      const { id, ...data } = post;
      await saveAdminBlog({ ...data, id: seedId });
    }),
  );
  return missing.length;
}

async function ensureUniqueNumericId(data: Omit<BlogPost, 'id'>, excludeDocId?: string): Promise<void> {
  const existing = await getBlogs();
  const usedByOthers = new Set(
    existing
      .filter((p) => p.id !== excludeDocId)
      .map((p) => resolveBlogNumericId(p))
      .filter((n) => n > 0),
  );
  const current = resolveBlogNumericId(data);
  if (current <= 0 || usedByOthers.has(current)) {
    data.numericId = nextBlogNumericId(existing);
  } else {
    data.numericId = current;
  }
}

export async function saveBlog(post: BlogPost): Promise<string> {
  if (!isSupabaseContentEnabled()) {
    throw new Error('CMS API is not configured. Set VITE_BLOG_API_URL.');
  }
  await syncBlogPostsFromSeed();
  invalidateBlogCache();
  const data = normalizeBlogPostForSave(post);
  await ensureUniqueNumericId(data, post.id);
  const payload = post.id ? { ...data, id: post.id } : data;
  return saveAdminBlog(payload);
}

export async function deleteBlog(id: string): Promise<void> {
  if (!isSupabaseContentEnabled()) {
    throw new Error('CMS API is not configured.');
  }
  await deleteAdminBlog(id);
  invalidateBlogCache();
}

export async function getBlogCategories(): Promise<BlogCategory[]> {
  const fallback = categoriesSeedJson as BlogCategory[];
  if (!isSupabaseContentEnabled()) return fallback;
  try {
    const items = await fetchContentArray<BlogCategory>('blog_categories');
    return items.length > 0 ? items : fallback;
  } catch {
    return fallback;
  }
}

export async function setBlogCategories(items: BlogCategory[]): Promise<void> {
  if (!isSupabaseContentEnabled()) {
    throw new Error('CMS API is not configured.');
  }
  await saveContentArray('blog_categories', items);
}
