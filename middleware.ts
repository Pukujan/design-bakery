import { buildBlogShareHtml, resolveShareMeta, type BlogSharePayload } from './frontend/src/og/blogShareHtml';

/** Blog detail paths across portfolio prefixes (SPA routes). */
const BLOG_DETAIL_RE =
  /^\/(?:endtoend-engineer|legal-workflow-engineer|ai-engineer|forward-deployed-engineer)?\/blogs\/(\d+)\/?$/;

/** Facebook, LinkedIn, Slack, Discord, X, WhatsApp, Telegram, Pinterest, etc. */
const CRAWLER_UA_RE =
  /bot|facebookexternalhit|Facebot|Twitterbot|LinkedInBot|Slackbot|Slack-ImgProxy|Discordbot|discordbot|whatsapp|telegrambot|pinterest|embedly|quora link preview|Googlebot|bingbot|Applebot/i;

export const config = {
  matcher: [
    '/blogs/:blogId',
    '/endtoend-engineer/blogs/:blogId',
    '/legal-workflow-engineer/blogs/:blogId',
    '/ai-engineer/blogs/:blogId',
    '/forward-deployed-engineer/blogs/:blogId',
  ],
};

function apiBase(): string | undefined {
  const base = process.env.VITE_BLOG_API_URL?.trim() || process.env.BLOG_API_URL?.trim();
  return base?.replace(/\/$/, '');
}

function supabaseConfig(): { url: string; key: string } | null {
  const url = process.env.VITE_SUPABASE_URL?.trim() || process.env.SUPABASE_URL?.trim();
  const key =
    process.env.VITE_SUPABASE_ANON_KEY?.trim() || process.env.SUPABASE_ANON_KEY?.trim();
  if (!url || !key) return null;
  return { url: url.replace(/\/$/, ''), key };
}

function toSharePayload(raw: Record<string, unknown>): BlogSharePayload | null {
  const id = Number(raw.numericId ?? raw.numeric_id ?? raw.id);
  const title = typeof raw.title === 'string' ? raw.title : '';
  if (!Number.isFinite(id) || !title) return null;
  const seo = raw.seo && typeof raw.seo === 'object' ? (raw.seo as BlogSharePayload['seo']) : undefined;
  return {
    id,
    title,
    excerpt: typeof raw.excerpt === 'string' ? raw.excerpt : undefined,
    coverImageUrl:
      typeof raw.coverImageUrl === 'string'
        ? raw.coverImageUrl
        : typeof raw.cover_image_url === 'string'
          ? raw.cover_image_url
          : undefined,
    thumbnailImageUrl:
      typeof raw.thumbnailImageUrl === 'string'
        ? raw.thumbnailImageUrl
        : typeof raw.thumbnail_image_url === 'string'
          ? raw.thumbnail_image_url
          : undefined,
    author: typeof raw.author === 'string' ? raw.author : undefined,
    date: typeof raw.date === 'string' ? raw.date : undefined,
    seo,
  };
}

async function fetchBlogFromApi(numericId: number): Promise<BlogSharePayload | null> {
  const base = apiBase();
  if (!base) return null;
  try {
    const res = await fetch(`${base}/api/public/blogs/${numericId}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { blog?: Record<string, unknown> };
    return data.blog ? toSharePayload(data.blog) : null;
  } catch {
    return null;
  }
}

async function fetchBlogFromSupabase(numericId: number): Promise<BlogSharePayload | null> {
  const cfg = supabaseConfig();
  if (!cfg) return null;
  try {
    const params = new URLSearchParams({
      select: 'numeric_id,title,excerpt,author,date,cover_image_url,thumbnail_image_url,seo',
      numeric_id: `eq.${numericId}`,
      limit: '1',
    });
    const res = await fetch(`${cfg.url}/rest/v1/blog_posts?${params}`, {
      headers: {
        Accept: 'application/json',
        apikey: cfg.key,
        Authorization: `Bearer ${cfg.key}`,
      },
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as Record<string, unknown>[];
    const row = rows[0];
    return row ? toSharePayload(row) : null;
  } catch {
    return null;
  }
}

async function fetchBlog(numericId: number): Promise<BlogSharePayload | null> {
  return (await fetchBlogFromApi(numericId)) ?? (await fetchBlogFromSupabase(numericId));
}

export default async function middleware(request: Request) {
  const ua = request.headers.get('user-agent') ?? '';
  if (!CRAWLER_UA_RE.test(ua)) return;

  const url = new URL(request.url);
  const match = url.pathname.match(BLOG_DETAIL_RE);
  if (!match) return;

  const numericId = Number(match[1]);
  if (!Number.isFinite(numericId)) return;

  const blog = await fetchBlog(numericId);
  if (!blog) return;

  const canonicalUrl = url.origin + url.pathname;
  const meta = await resolveShareMeta(blog, canonicalUrl);
  const html = buildBlogShareHtml(meta);

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
    },
  });
}
