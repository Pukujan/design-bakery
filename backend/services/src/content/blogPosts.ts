import { ensureSocialOgImageInSeo } from '../blog/publishKit/ensureSocialOgImage.js';
import { supabaseAdmin } from '../supabaseClient.js';

export type BlogPostRow = {
  id: string;
  legacy_doc_id: string | null;
  numeric_id: number;
  title: string;
  excerpt: string;
  content: string;
  tags: string[] | unknown;
  category: string;
  author: string;
  color: string | null;
  date: string | null;
  read_time: string | null;
  cover_image_url: string | null;
  thumbnail_image_url: string | null;
  seo: Record<string, unknown> | null;
  updated_at?: string;
  published_at?: string | null;
};

export type BlogPostDto = {
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
  seo?: Record<string, unknown>;
  updatedAt?: string;
  publishedAt?: string;
};

function normalizePublishedAt(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function rowToDto(row: BlogPostRow): BlogPostDto {
  return {
    id: row.legacy_doc_id ?? row.id,
    numericId: row.numeric_id,
    title: row.title,
    excerpt: row.excerpt,
    date: row.date ?? '',
    readTime: row.read_time ?? '',
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    category: row.category,
    color: row.color ?? '',
    author: row.author,
    content: row.content,
    coverImageUrl: row.cover_image_url ?? undefined,
    thumbnailImageUrl: row.thumbnail_image_url ?? undefined,
    seo: row.seo ?? undefined,
    updatedAt: row.updated_at ?? undefined,
    publishedAt: row.published_at ?? undefined,
  };
}

function dtoToRow(data: Omit<BlogPostDto, 'id'>, legacyDocId?: string): Omit<BlogPostRow, 'id'> {
  const row: Omit<BlogPostRow, 'id'> = {
    legacy_doc_id: legacyDocId ?? null,
    numeric_id: data.numericId ?? 0,
    title: data.title,
    excerpt: data.excerpt,
    content: data.content,
    tags: data.tags ?? [],
    category: data.category,
    author: data.author,
    color: data.color || null,
    date: data.date || null,
    read_time: data.readTime || null,
    cover_image_url: data.coverImageUrl?.trim() || null,
    thumbnail_image_url: data.thumbnailImageUrl?.trim() || null,
    seo: data.seo ?? null,
  };
  const publishedAt = normalizePublishedAt(data.publishedAt);
  if (publishedAt) {
    row.published_at = publishedAt;
  }
  return row;
}

/** List columns without markdown body — public index + cards only. */
const BLOG_LIST_COLUMNS =
  'id, legacy_doc_id, numeric_id, title, excerpt, tags, category, author, color, date, read_time, cover_image_url, thumbnail_image_url, seo, updated_at, published_at';

export type ListBlogPostsOptions = {
  /** Admin editor needs full markdown; public list omits body for speed. */
  includeContent?: boolean;
};

export async function listBlogPosts(options: ListBlogPostsOptions = {}): Promise<BlogPostDto[]> {
  const includeContent = options.includeContent === true;
  const base = supabaseAdmin().from('blog_posts');
  const { data, error } = includeContent
    ? await base
        .select('*')
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('numeric_id', { ascending: false })
    : await base
        .select(BLOG_LIST_COLUMNS)
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('numeric_id', { ascending: false });

  if (error) throw new Error(`Blog list failed: ${error.message}`);
  const rows = (data ?? []) as BlogPostRow[];
  return rows.map((row) => rowToDto(includeContent ? row : { ...row, content: '' }));
}

export async function getBlogByNumericId(numericId: number): Promise<{ docId: string; blog: BlogPostDto }> {
  const { data, error } = await supabaseAdmin()
    .from('blog_posts')
    .select('*')
    .eq('numeric_id', numericId)
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Blog read failed: ${error.message}`);
  if (!data) throw new Error(`Blog ${numericId} not found`);

  const row = data as BlogPostRow;
  return { docId: row.legacy_doc_id ?? row.id, blog: rowToDto(row) };
}

export async function upsertBlogPost(post: BlogPostDto): Promise<string> {
  const legacyId = post.id?.trim();
  const numericId = post.numericId ?? 0;
  const seo =
    numericId > 0 && post.seo
      ? await ensureSocialOgImageInSeo(post.seo as Record<string, unknown>, numericId)
      : post.seo;
  const row = dtoToRow({ ...post, seo }, legacyId);

  if (legacyId) {
    const { data: existing } = await supabaseAdmin()
      .from('blog_posts')
      .select('id')
      .eq('legacy_doc_id', legacyId)
      .maybeSingle();

    if (existing?.id) {
      const updateRow = { ...row, updated_at: new Date().toISOString() };
      if (!normalizePublishedAt(post.publishedAt)) {
        delete (updateRow as { published_at?: string | null }).published_at;
      }
      const { error } = await supabaseAdmin()
        .from('blog_posts')
        .update(updateRow)
        .eq('id', existing.id);
      if (error) throw new Error(`Blog update failed: ${error.message}`);
      return legacyId;
    }
  }

  const { data, error } = await supabaseAdmin()
    .from('blog_posts')
    .insert({
      ...row,
      published_at: normalizePublishedAt(post.publishedAt) ?? new Date().toISOString(),
      legacy_doc_id: legacyId ?? `seed-${row.numeric_id}`,
      updated_at: new Date().toISOString(),
    })
    .select('legacy_doc_id, id')
    .single();

  if (error) throw new Error(`Blog insert failed: ${error.message}`);
  const inserted = data as { legacy_doc_id: string | null; id: string };
  return inserted.legacy_doc_id ?? inserted.id;
}

export async function deleteBlogPost(docId: string): Promise<void> {
  let query = supabaseAdmin().from('blog_posts').delete().eq('legacy_doc_id', docId);
  let { error } = await query;
  if (error) throw new Error(`Blog delete failed: ${error.message}`);

  if (/^[0-9a-f-]{36}$/i.test(docId)) {
    ({ error } = await supabaseAdmin().from('blog_posts').delete().eq('id', docId));
    if (error) throw new Error(`Blog delete failed: ${error.message}`);
  }
}
