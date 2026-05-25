import { buildBlogShareHtml, resolveShareMeta, type BlogSharePayload } from './frontend/src/og/blogShareHtml';

/** Blog detail paths across portfolio prefixes (SPA routes). */
const BLOG_DETAIL_RE =
  /^\/(?:endtoend-engineer|legal-workflow-engineer|ai-engineer|forward-deployed-engineer)?\/blogs\/(\d+)\/?$/;

const CRAWLER_UA_RE =
  /bot|facebookexternalhit|twitterbot|linkedinbot|slackbot|discordbot|whatsapp|telegrambot|pinterest|embedly|quora link preview/i;

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

async function fetchBlog(numericId: number): Promise<BlogSharePayload | null> {
  const base = apiBase();
  if (!base) return null;
  try {
    const res = await fetch(`${base}/api/public/blogs/${numericId}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { blog?: BlogSharePayload };
    return data.blog ?? null;
  } catch {
    return null;
  }
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
  const meta = resolveShareMeta(blog, canonicalUrl);
  const html = buildBlogShareHtml(meta);

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
    },
  });
}
