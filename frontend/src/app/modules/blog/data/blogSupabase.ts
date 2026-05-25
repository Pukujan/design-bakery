import { getSupabasePublicClient } from '@/lib/supabasePublic';
import type { BlogCategory } from './blogData';

/** List columns — omit markdown body for faster cards. */
const BLOG_LIST_COLUMNS =
  'numeric_id, legacy_doc_id, title, excerpt, tags, category, author, color, date, read_time, cover_image_url, thumbnail_image_url, seo';

export type RemoteBlogDto = {
  numericId?: number;
  id?: number | string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  tags?: string[];
  category: string;
  color: string;
  author: string;
  content?: string;
  coverImageUrl?: string;
  thumbnailImageUrl?: string;
  seo?: Record<string, unknown>;
};

type BlogPostRow = {
  numeric_id: number;
  legacy_doc_id: string | null;
  title: string;
  excerpt: string;
  content?: string;
  tags: unknown;
  category: string;
  author: string;
  color: string | null;
  date: string | null;
  read_time: string | null;
  cover_image_url: string | null;
  thumbnail_image_url: string | null;
  seo: Record<string, unknown> | null;
};

function rowToDto(row: BlogPostRow): RemoteBlogDto {
  return {
    numericId: row.numeric_id,
    id: row.legacy_doc_id ?? row.numeric_id,
    title: row.title,
    excerpt: row.excerpt ?? '',
    date: row.date ?? '',
    readTime: row.read_time ?? '',
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    category: row.category ?? '',
    color: row.color ?? '',
    author: row.author ?? '',
    content: row.content ?? '',
    coverImageUrl: row.cover_image_url ?? undefined,
    thumbnailImageUrl: row.thumbnail_image_url ?? undefined,
    seo: row.seo ?? undefined,
  };
}

export async function fetchBlogListFromSupabase(): Promise<RemoteBlogDto[]> {
  const sb = getSupabasePublicClient();
  if (!sb) return [];

  const { data, error } = await sb
    .from('blog_posts')
    .select(BLOG_LIST_COLUMNS)
    .order('numeric_id', { ascending: false });

  if (error) throw new Error(error.message);
  return (data as BlogPostRow[]).map((row) => ({ ...rowToDto(row), content: '' }));
}

export async function fetchBlogPostFromSupabase(numericId: number): Promise<RemoteBlogDto | null> {
  const sb = getSupabasePublicClient();
  if (!sb) return null;

  const { data, error } = await sb
    .from('blog_posts')
    .select('*')
    .eq('numeric_id', numericId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return rowToDto(data as BlogPostRow);
}

export async function fetchBlogCategoriesFromSupabase(): Promise<BlogCategory[]> {
  const sb = getSupabasePublicClient();
  if (!sb) return [];

  const { data, error } = await sb
    .from('cms_documents')
    .select('payload')
    .eq('portfolio_id', 'default')
    .eq('collection_name', 'blog_categories')
    .eq('document_id', 'data')
    .maybeSingle();

  if (error) throw new Error(error.message);
  const items = (data?.payload as { items?: BlogCategory[] } | null)?.items;
  return Array.isArray(items) ? items : [];
}
