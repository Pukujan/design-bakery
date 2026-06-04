import {
  buildBlogListShareHtml,
  buildBlogShareHtml,
  fetchSpaIndexHtml,
  injectSocialMetaIntoHtmlHead,
  resolveEdgeSiteOrigin,
  resolveShareMeta,
  stripMarkdownForCrawlers,
  SITE_NAME,
  type BlogListShareItem,
  type BlogSharePayload,
} from './frontend/src/og/blogShareHtml.js';
import { isLinkPreviewCrawler } from './frontend/src/og/linkPreviewCrawlers.js';
import { resolveCaseStudyShareMeta } from './frontend/src/og/caseStudyShareMeta.js';

const PORTFOLIO_PREFIX =
  '(?:endtoend-engineer|legal-workflow-engineer|ai-engineer|forward-deployed-engineer)';

const BLOG_DETAIL_RE = new RegExp(
  `^\\/(?:${PORTFOLIO_PREFIX}\\/)?blogs\\/(\\d+)\\/?$`,
);

const BLOG_LIST_RE = new RegExp(`^\\/(?:${PORTFOLIO_PREFIX}\\/)?blogs\\/?$`);

export const config = {
  matcher: [
    '/blogs',
    '/blogs/:blogId',
    '/endtoend-engineer/blogs',
    '/endtoend-engineer/blogs/:blogId',
    '/legal-workflow-engineer/blogs',
    '/legal-workflow-engineer/blogs/:blogId',
    '/ai-engineer/blogs',
    '/ai-engineer/blogs/:blogId',
    '/forward-deployed-engineer/blogs',
    '/forward-deployed-engineer/blogs/:blogId',
    '/case-studies/:path*',
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
    content: typeof raw.content === 'string' ? raw.content : undefined,
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

function blogPathPrefix(pathname: string): string {
  return pathname.replace(/\/blogs(?:\/\d+)?\/?$/, '');
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
      select:
        'numeric_id,title,excerpt,content,author,date,cover_image_url,thumbnail_image_url,seo',
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

async function fetchBlogListFromApi(): Promise<BlogSharePayload[]> {
  const base = apiBase();
  if (!base) return [];
  try {
    const res = await fetch(`${base}/api/public/blogs`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { blogs?: Record<string, unknown>[] };
    return (data.blogs ?? [])
      .map((row) => toSharePayload(row))
      .filter((row): row is BlogSharePayload => row !== null);
  } catch {
    return [];
  }
}

async function fetchBlogListFromSupabase(): Promise<BlogSharePayload[]> {
  const cfg = supabaseConfig();
  if (!cfg) return [];
  try {
    const params = new URLSearchParams({
      select: 'numeric_id,title,excerpt,author,date,cover_image_url,thumbnail_image_url,seo',
      order: 'published_at.desc.nullslast,updated_at.desc',
    });
    const res = await fetch(`${cfg.url}/rest/v1/blog_posts?${params}`, {
      headers: {
        Accept: 'application/json',
        apikey: cfg.key,
        Authorization: `Bearer ${cfg.key}`,
      },
    });
    if (!res.ok) return [];
    const rows = (await res.json()) as Record<string, unknown>[];
    return rows
      .map((row) => toSharePayload(row))
      .filter((row): row is BlogSharePayload => row !== null);
  } catch {
    return [];
  }
}

async function fetchBlog(numericId: number): Promise<BlogSharePayload | null> {
  return (await fetchBlogFromApi(numericId)) ?? (await fetchBlogFromSupabase(numericId));
}

async function fetchBlogList(): Promise<BlogSharePayload[]> {
  const fromApi = await fetchBlogListFromApi();
  if (fromApi.length > 0) return fromApi;
  return fetchBlogListFromSupabase();
}

function htmlResponse(html: string): Response {
  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
    },
  });
}

async function injectBlogDetailSpaShell(
  request: Request,
  pathname: string,
  numericId: number,
): Promise<Response | null> {
  const blog = await fetchBlog(numericId);
  if (!blog) return null;

  const url = new URL(request.url);
  const siteOrigin = resolveEdgeSiteOrigin(url);
  const canonicalUrl = `${siteOrigin}${pathname}`;
  const meta = await resolveShareMeta(blog, canonicalUrl);
  const spaHtml = await fetchSpaIndexHtml(url.origin);
  if (!spaHtml) return null;

  const html = injectSocialMetaIntoHtmlHead(spaHtml, { ...meta, ogType: 'article' });
  return htmlResponse(html);
}

async function injectBlogListSpaShell(
  request: Request,
  pathname: string,
): Promise<Response | null> {
  const url = new URL(request.url);
  const siteOrigin = resolveEdgeSiteOrigin(url);
  const canonicalUrl = `${siteOrigin}${pathname}`;
  const spaHtml = await fetchSpaIndexHtml(url.origin);
  if (!spaHtml) return null;

  const html = injectSocialMetaIntoHtmlHead(spaHtml, {
    pageTitle: `Engineering Blog | ${SITE_NAME}`,
    description:
      'Engineering blog on systems design, AI workflows, document intelligence, legal-tech product engineering, and agent architecture.',
    canonicalUrl,
    ogType: 'website',
    siteName: SITE_NAME,
  });
  return htmlResponse(html);
}

function isStaticCaseStudyAsset(pathname: string): boolean {
  return /\.html$/i.test(pathname);
}

async function injectCaseStudySpaShell(
  request: Request,
  pathname: string,
): Promise<Response | null> {
  const url = new URL(request.url);
  const siteOrigin = resolveEdgeSiteOrigin(url);
  const meta = resolveCaseStudyShareMeta(pathname, siteOrigin);
  if (!meta) return null;

  const spaHtml = await fetchSpaIndexHtml(url.origin);
  if (!spaHtml) return null;

  const html = injectSocialMetaIntoHtmlHead(spaHtml, meta);
  return htmlResponse(html);
}

export default async function middleware(request: Request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const ua = request.headers.get('user-agent') ?? '';
  const isCrawler = isLinkPreviewCrawler(ua);

  if (!isStaticCaseStudyAsset(pathname)) {
    const caseStudyInjected = await injectCaseStudySpaShell(request, pathname);
    if (caseStudyInjected) return caseStudyInjected;
  }

  const detailMatch = pathname.match(BLOG_DETAIL_RE);
  if (detailMatch) {
    const numericId = Number(detailMatch[1]);
    if (Number.isFinite(numericId)) {
      const injected = await injectBlogDetailSpaShell(request, pathname, numericId);
      if (injected) return injected;
    }
  }

  if (BLOG_LIST_RE.test(pathname)) {
    const injected = await injectBlogListSpaShell(request, pathname);
    if (injected) return injected;
  }

  // Crawler-only static HTML fallback when SPA shell injection fails (no index.html fetch).
  if (!isCrawler) return;

  if (BLOG_LIST_RE.test(pathname)) {
    const posts = await fetchBlogList();
    const prefix = blogPathPrefix(pathname);
    const siteOrigin = resolveEdgeSiteOrigin(url);
    const canonicalUrl = `${siteOrigin}${pathname}`;
    const items: BlogListShareItem[] = posts.map((post) => ({
      id: post.id,
      title: post.title,
      excerpt: post.excerpt,
      date: post.date,
      href: `${siteOrigin}${prefix}/blogs/${post.id}`,
    }));
    const html = buildBlogListShareHtml({
      pageTitle: `Engineering Blog | ${SITE_NAME}`,
      canonicalUrl,
      description:
        'Engineering blog posts on systems design, AI workflows, and product engineering.',
      posts: items,
    });
    return htmlResponse(html);
  }

  if (detailMatch) {
    const numericId = Number(detailMatch[1]);
    if (!Number.isFinite(numericId)) return;

    const blog = await fetchBlog(numericId);
    if (!blog) return;

    const siteOrigin = resolveEdgeSiteOrigin(url);
    const canonicalUrl = `${siteOrigin}${pathname}`;
    const meta = await resolveShareMeta(blog, canonicalUrl);
    const bodyText = blog.content ? stripMarkdownForCrawlers(blog.content) : undefined;
    const html = buildBlogShareHtml(
      { ...meta, ogType: 'article' },
      {
        excerpt: meta.description,
        bodyText,
      },
    );

    return htmlResponse(html);
  }
}
