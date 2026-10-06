import { ApiError } from '../apiError.js';

/** Body cap for agent-submitted markdown, in bytes (UTF-8). */
export const AGENT_POST_MAX_CONTENT_BYTES = 256 * 1024;

export type AgentPostPayload = {
  title: string;
  excerpt: string;
  date: string;
  readTime: number;
  tags: string[];
  category: string;
  color?: string;
  author: string;
  content: string;
  coverImageUrl?: string;
  thumbnailImageUrl?: string;
  seo?: Record<string, unknown>;
  publishedAt?: string | null;
};

const ALLOWED_FIELDS = new Set([
  'title',
  'excerpt',
  'date',
  'readTime',
  'tags',
  'category',
  'color',
  'author',
  'content',
  'coverImageUrl',
  'thumbnailImageUrl',
  'seo',
  'publishedAt',
]);

const ISO_DATE = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})?)?$/;
const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

/** SEO keys the server fetches when building a social OG image. */
const SEO_FETCHED_URL_KEYS = ['ogImageUrl', 'ogImage', 'socialOgImageUrl'];

function fail(message: string): never {
  throw new ApiError('invalid-argument', message);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isIsoDate(value: string): boolean {
  return ISO_DATE.test(value) && !Number.isNaN(Date.parse(value));
}

/** Returns the trimmed value, or fails when the field is absent or blank. */
function requiredText(body: Record<string, unknown>, key: string, label: string): string {
  const value = body[key];
  if (typeof value !== 'string' || value.trim().length === 0) {
    fail(`${label} is required.`);
  }
  return value.trim();
}

function optionalText(body: Record<string, unknown>, key: string, label: string): string | undefined {
  const value = body[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') fail(`${label} must be a string.`);
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Validate and normalize an agent post payload.
 *
 * The body must be a JSON object with only the accepted fields; unknown
 * top-level fields are rejected so a typo cannot silently drop content.
 * `publishedAt` stays optional here — the route decides what an omitted value
 * means (draft on create, preserve on update).
 */
export function validateAgentPostPayload(body: unknown): AgentPostPayload {
  if (!isPlainObject(body)) {
    fail('Request body must be a JSON object.');
  }

  for (const key of Object.keys(body)) {
    if (!ALLOWED_FIELDS.has(key)) {
      fail(`Unknown field "${key}".`);
    }
  }

  const title = requiredText(body, 'title', 'title');
  const excerpt = requiredText(body, 'excerpt', 'excerpt');
  const author = requiredText(body, 'author', 'author');
  const category = requiredText(body, 'category', 'category');

  const content = body.content;
  if (typeof content !== 'string' || content.trim().length === 0) {
    fail('content is required.');
  }
  if (content.includes('\u0000')) {
    fail('content must not contain NUL characters.');
  }
  if (Buffer.byteLength(content, 'utf8') > AGENT_POST_MAX_CONTENT_BYTES) {
    fail(`content must be at most ${AGENT_POST_MAX_CONTENT_BYTES} bytes.`);
  }

  const date = requiredText(body, 'date', 'date');
  if (!isIsoDate(date)) {
    fail('date must be a valid ISO date.');
  }

  const readTime = body.readTime;
  if (typeof readTime !== 'number' || !Number.isInteger(readTime) || readTime <= 0) {
    fail('readTime must be a positive integer.');
  }

  const tags = body.tags;
  if (!Array.isArray(tags) || tags.some((tag) => typeof tag !== 'string')) {
    fail('tags must be an array of strings.');
  }

  const seo = body.seo;
  if (seo !== undefined && seo !== null && !isPlainObject(seo)) {
    fail('seo must be an object.');
  }
  // The server fetches these URLs to build a social OG image, so an agent may
  // only point them at a path on this site. Absolute URLs are the admin's call.
  if (isPlainObject(seo)) {
    for (const key of SEO_FETCHED_URL_KEYS) {
      const value = seo[key];
      if (value === undefined || value === null) continue;
      if (typeof value !== 'string' || !value.trim().startsWith('/')) {
        fail(`seo.${key} must be a site-relative path beginning with "/".`);
      }
    }
  }

  const color = optionalText(body, 'color', 'color');
  if (color !== undefined && !HEX_COLOR.test(color)) {
    fail('color must be a hex color like #4F46E5.');
  }

  let publishedAt: string | null | undefined;
  if (body.publishedAt !== undefined) {
    if (body.publishedAt === null) {
      publishedAt = null;
    } else if (typeof body.publishedAt === 'string' && isIsoDate(body.publishedAt.trim())) {
      publishedAt = body.publishedAt.trim();
    } else {
      fail('publishedAt must be null or a valid ISO date.');
    }
  }

  return {
    title,
    excerpt,
    date,
    readTime,
    tags: tags as string[],
    category,
    author,
    content,
    color,
    coverImageUrl: optionalText(body, 'coverImageUrl', 'coverImageUrl'),
    thumbnailImageUrl: optionalText(body, 'thumbnailImageUrl', 'thumbnailImageUrl'),
    seo: (seo ?? undefined) as Record<string, unknown> | undefined,
    publishedAt,
  };
}
