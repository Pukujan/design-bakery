import { ensureSocialOgImageInSeo } from '../blog/publishKit/ensureSocialOgImage.js';
import { DbError, dbDelete, dbInsert, dbQueryAll, dbQueryOne, dbUpdate } from '../db.js';

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
  /** Public callers hide drafts; the admin editor shows them. */
  publishedOnly?: boolean;
};

export async function listBlogPosts(options: ListBlogPostsOptions = {}): Promise<BlogPostDto[]> {
  const includeContent = options.includeContent === true;
  const columns = includeContent ? '*' : BLOG_LIST_COLUMNS;
  // publishedOnly is an explicit WHERE, not an RLS policy: the backend runs as the
  // table owner, so octo's policies are inert and the draft filter must be stated.
  const where = options.publishedOnly ? 'where published_at is not null' : '';
  const rows = await dbQueryAll<BlogPostRow>(
    `select ${columns} from public.blog_posts ${where}
      order by published_at desc nulls last, numeric_id desc`,
  );
  return rows.map((row) => rowToDto(includeContent ? row : { ...row, content: '' }));
}

export async function findBlogByNumericId(
  numericId: number,
): Promise<{ docId: string; blog: BlogPostDto } | null> {
  const row = await dbQueryOne<BlogPostRow>(
    'select * from public.blog_posts where numeric_id = $1 limit 1',
    [numericId],
  );
  if (!row) return null;

  return { docId: row.legacy_doc_id ?? row.id, blog: rowToDto(row) };
}

export async function getBlogByNumericId(numericId: number): Promise<{ docId: string; blog: BlogPostDto }> {
  const found = await findBlogByNumericId(numericId);
  if (!found) throw new Error(`Blog ${numericId} not found`);
  return found;
}

/** Next free numeric id. Unique-index collisions are retried by createBlogPost. */
export async function nextBlogNumericId(): Promise<number> {
  const row = await dbQueryOne<{ numeric_id: number }>(
    'select numeric_id from public.blog_posts order by numeric_id desc limit 1',
  );
  return (row?.numeric_id ?? 0) + 1;
}

export type CreateBlogPostOptions = {
  /** Null or omitted creates a draft; an ISO string publishes immediately. */
  publishedAt?: string | null;
  /** Doc id; defaults to `agent-<numericId>`. */
  docId?: string;
};

/**
 * Insert a new post, draft by default. The admin upsert auto-publishes on insert
 * to keep the hand-authored flow unchanged, so agent creation gets its own path
 * that can hold published_at null.
 */
export async function createBlogPost(
  post: Omit<BlogPostDto, 'id' | 'numericId'>,
  options: CreateBlogPostOptions = {},
): Promise<{ docId: string; numericId: number }> {
  const publishedAt = normalizePublishedAt(options.publishedAt) ?? null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const numericId = await nextBlogNumericId();
    const docId = options.docId ?? `agent-${numericId}`;
    const seo = post.seo
      ? await ensureSocialOgImageInSeo(post.seo as Record<string, unknown>, numericId)
      : post.seo;
    const row = dtoToRow({ ...post, numericId, seo }, docId);

    try {
      const inserted = await dbInsert<{ legacy_doc_id: string | null; id: string; numeric_id: number }>(
        'blog_posts',
        {
          ...row,
          legacy_doc_id: docId,
          published_at: publishedAt,
          updated_at: new Date().toISOString(),
        },
        'legacy_doc_id, id, numeric_id',
      );
      return { docId: inserted.legacy_doc_id ?? inserted.id, numericId: inserted.numeric_id };
    } catch (err) {
      // 23505 = unique_violation: another create took the id; retry with the next.
      if (err instanceof DbError && err.code === '23505') continue;
      throw new Error(`Blog insert failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  throw new Error('Blog insert failed: could not allocate a unique numeric id.');
}

export type UpsertBlogPostOptions = {
  /** Force published_at to null on update, moving the post back to draft. */
  unpublish?: boolean;
};

export async function upsertBlogPost(
  post: BlogPostDto,
  options: UpsertBlogPostOptions = {},
): Promise<string> {
  const legacyId = post.id?.trim();
  const numericId = post.numericId ?? 0;
  const seo =
    numericId > 0 && post.seo
      ? await ensureSocialOgImageInSeo(post.seo as Record<string, unknown>, numericId)
      : post.seo;
  const row = dtoToRow({ ...post, seo }, legacyId);

  // Resolve the target row: by legacy doc id, or by numeric id when the row has
  // no legacy id (otherwise the update would fall through to a duplicate insert).
  let targetRowId: string | undefined;
  if (legacyId) {
    const found = await dbQueryOne<{ id: string }>(
      'select id from public.blog_posts where legacy_doc_id = $1 limit 1',
      [legacyId],
    );
    targetRowId = found?.id;
  }
  if (!targetRowId && numericId > 0) {
    const found = await dbQueryOne<{ id: string }>(
      'select id from public.blog_posts where numeric_id = $1 limit 1',
      [numericId],
    );
    targetRowId = found?.id;
  }

  if (targetRowId) {
    const updateRow: Record<string, unknown> = { ...row, updated_at: new Date().toISOString() };
    if (options.unpublish) {
      updateRow.published_at = null;
    } else if (!normalizePublishedAt(post.publishedAt)) {
      delete updateRow.published_at;
    }
    await dbUpdate('blog_posts', updateRow, { id: targetRowId });
    return legacyId ?? targetRowId;
  }

  const inserted = await dbInsert<{ legacy_doc_id: string | null; id: string }>(
    'blog_posts',
    {
      ...row,
      published_at: normalizePublishedAt(post.publishedAt) ?? new Date().toISOString(),
      legacy_doc_id: legacyId ?? `seed-${row.numeric_id}`,
      updated_at: new Date().toISOString(),
    },
    'legacy_doc_id, id',
  );
  return inserted.legacy_doc_id ?? inserted.id;
}

export async function deleteBlogPost(docId: string): Promise<void> {
  await dbDelete('blog_posts', { legacy_doc_id: docId });

  if (/^[0-9a-f-]{36}$/i.test(docId)) {
    await dbDelete('blog_posts', { id: docId });
  }
}
