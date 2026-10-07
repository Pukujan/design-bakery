/**
 * Server-side Open Graph / link-preview rendering (issue #80, Step E).
 *
 * Reproduces the Vercel Edge middleware that used to live at `middleware.ts` at the
 * repo root. That middleware rewrote the SPA shell for blog and case-study URLs so
 * link-preview bots and crawlers read a real `<title>` / `og:*` instead of the
 * generic app shell. With the site served from gravebuster, nothing reproduced it,
 * so crawler previews regressed to the generic shell — this router is that logic as
 * an Express route, behind Caddy.
 *
 * The pure HTML/meta builders are copied verbatim from `frontend/src/og/` (the
 * frontend keeps the browser-facing ones); `scripts/test-og-contract.mjs` fails CI
 * if the copies drift.
 *
 * Routing: Caddy sends these paths here from *after* its filesystem handlers, so a
 * real file or a static case-study directory is still served from disk and never
 * reaches this router. See `deploy/gravebuster/Caddyfile`.
 *
 * Fragile area: read `additionals/guidelines/agent-devlog-og-previews.md` before
 * changing the matchers, the caching headers, or the shell fallback.
 */

import { Router, type Request, type Response } from 'express';
import {
  getBlogByNumericId,
  listBlogPosts,
  type BlogPostDto,
} from '../../services/lib/content/blogPosts.js';
import {
  buildBlogListShareHtml,
  buildBlogShareHtml,
  fetchSpaIndexHtml,
  injectSocialMetaIntoHtmlHead,
  resolveShareMeta,
  stripMarkdownForCrawlers,
  SITE_NAME,
  type BlogListShareItem,
  type BlogSharePayload,
} from '../og/blogShareHtml.js';
import { resolveCaseStudyShareMeta } from '../og/caseStudyShareMeta.js';
import { isLinkPreviewCrawler } from '../og/linkPreviewCrawlers.js';

const PORTFOLIO_PREFIX =
  '(?:endtoend-engineer|legal-workflow-engineer|ai-engineer|forward-deployed-engineer)';

const BLOG_DETAIL_RE = new RegExp(`^/(?:${PORTFOLIO_PREFIX}/)?blogs/(\\d+)/?$`);
const BLOG_LIST_RE = new RegExp(`^/(?:${PORTFOLIO_PREFIX}/)?blogs/?$`);
const CASE_STUDY_RE = /^\/case-studies\/.+/;

/**
 * Everything this router owns, handled or not. Must stay a superset of the three
 * regexes above and a subset of the Caddy `@ogPreview` matcher — the router serves
 * the plain shell for anything in here it does not recognise, so the two drifting
 * apart shows up as a 404 rather than as a broken page.
 */
const OG_PREFIX_RE = new RegExp(`^/(?:${PORTFOLIO_PREFIX}/)?blogs(?:/|$)|^/case-studies/`);

const BLOG_LIST_DESCRIPTION =
  'Engineering blog on systems design, AI workflows, document intelligence, legal-tech product engineering, and agent architecture.';

/** Where the SPA shell is fetched from — the `web` container over the compose network. */
function shellOrigin(): string {
  const configured = process.env.OG_SHELL_ORIGIN?.trim();
  return (configured || 'http://web:80').replace(/\/$/, '');
}

/**
 * The public origin used for canonical URLs and absolute og:image links. Set from
 * the deploy env; without it the container's own (internal) origin would leak into
 * the tags.
 */
function siteOrigin(): string {
  const configured = process.env.SITE_URL?.trim() || process.env.VITE_SITE_URL?.trim();
  return (configured || 'https://www.design-bakery.com').replace(/\/$/, '');
}

function toSharePayload(blog: BlogPostDto): BlogSharePayload | null {
  const id = Number(blog.numericId);
  if (!Number.isFinite(id) || !blog.title) return null;
  return {
    id,
    title: blog.title,
    excerpt: blog.excerpt,
    content: blog.content,
    coverImageUrl: blog.coverImageUrl,
    thumbnailImageUrl: blog.thumbnailImageUrl,
    author: blog.author,
    date: blog.date,
    seo: blog.seo as BlogSharePayload['seo'],
  };
}

/** Only published posts are shareable — `published_at` is the draft switch. */
async function loadPublishedBlog(numericId: number): Promise<BlogSharePayload | null> {
  try {
    const { blog } = await getBlogByNumericId(numericId);
    if (!blog.publishedAt) return null;
    return toSharePayload(blog);
  } catch {
    return null;
  }
}

async function loadPublishedBlogs(): Promise<BlogSharePayload[]> {
  try {
    const blogs = await listBlogPosts({ includeContent: false, publishedOnly: true });
    return blogs
      .map((blog) => toSharePayload(blog))
      .filter((blog): blog is BlogSharePayload => blog !== null);
  } catch {
    return [];
  }
}

function sendHtml(res: Response, html: string, cacheControl: string): void {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', cacheControl);
  // One URL, two bodies: the crawler variant carries injected og:* tags, the human
  // variant is the untouched shell. A shared cache must key on the user agent.
  res.setHeader('Vary', 'User-Agent');
  res.status(200).send(html);
}

/**
 * Uncacheable, deliberately, and the same for both variants. The plain shell carries
 * the hashed asset names and must not outlive a deploy; the injected variant is a
 * different body for the same URL, so a shared cache that ignores `Vary` (Cloudflare
 * does, apart from Accept-Encoding) would hand a crawler the human shell or the
 * reverse. `max-age=0` stops such a cache storing either. This is exactly what the
 * SPA fallback already served for these paths, so nothing that was cacheable becomes
 * uncacheable — the Edge middleware's 300 s `s-maxage` was Vercel's CDN, which the
 * tunnel does not reproduce.
 */
const OG_CACHE = 'public, max-age=0, must-revalidate';

/**
 * Serve the SPA shell, with `meta` injected when given. Returns false when the
 * shell itself could not be fetched, so the caller can decide whether a crawler
 * fallback or an error is appropriate.
 */
async function serveShell(
  res: Response,
  meta?: Parameters<typeof injectSocialMetaIntoHtmlHead>[1],
): Promise<boolean> {
  const shell = await fetchSpaIndexHtml(shellOrigin());
  if (!shell) return false;
  if (meta) sendHtml(res, injectSocialMetaIntoHtmlHead(shell, meta), OG_CACHE);
  else sendHtml(res, shell, OG_CACHE);
  return true;
}

/** The plain shell, or the 502 that says the shell itself is unavailable. */
async function serveShellOrUnavailable(res: Response): Promise<void> {
  if (!(await serveShell(res))) await serveShellUnavailable(res);
}

async function serveShellUnavailable(res: Response): Promise<void> {
  res.status(502).json({
    ok: false,
    code: 'SHELL_UNAVAILABLE',
    message: 'The site shell is unavailable.',
  });
}

function blogPathPrefix(pathname: string): string {
  return pathname.replace(/\/blogs(?:\/\d+)?\/?$/, '');
}

async function handleBlogList(req: Request, res: Response): Promise<void> {
  const pathname = req.path;
  const site = siteOrigin();
  const canonicalUrl = `${site}${pathname}`;

  if (
    await serveShell(res, {
      pageTitle: `Engineering Blog | ${SITE_NAME}`,
      description: BLOG_LIST_DESCRIPTION,
      canonicalUrl,
      ogType: 'website',
      siteName: SITE_NAME,
    })
  ) {
    return;
  }

  // Crawler-only static fallback when the SPA shell cannot be fetched.
  if (!isLinkPreviewCrawler(req.get('user-agent') ?? '')) {
    await serveShellUnavailable(res);
    return;
  }

  const posts = await loadPublishedBlogs();
  const prefix = blogPathPrefix(pathname);
  const items: BlogListShareItem[] = posts.map((post) => ({
    id: post.id,
    title: post.title,
    excerpt: post.excerpt,
    date: post.date,
    href: `${site}${prefix}/blogs/${post.id}`,
  }));
  sendHtml(
    res,
    buildBlogListShareHtml({
      pageTitle: `Engineering Blog | ${SITE_NAME}`,
      canonicalUrl,
      description: BLOG_LIST_DESCRIPTION,
      posts: items,
    }),
    OG_CACHE,
  );
}

async function handleBlogDetail(
  req: Request,
  res: Response,
  numericId: number,
): Promise<void> {
  const pathname = req.path;
  const site = siteOrigin();
  const canonicalUrl = `${site}${pathname}`;
  const blog = await loadPublishedBlog(numericId);

  if (blog) {
    const meta = await resolveShareMeta(blog, canonicalUrl);
    if (await serveShell(res, { ...meta, ogType: 'article' })) return;
  } else if (await serveShell(res)) {
    // Unknown or unpublished post: the plain shell, exactly as the SPA fallback
    // would serve it (the middleware passed these through untouched).
    return;
  }

  if (!isLinkPreviewCrawler(req.get('user-agent') ?? '')) {
    await serveShellUnavailable(res);
    return;
  }

  if (!blog) {
    await serveShellUnavailable(res);
    return;
  }

  const meta = await resolveShareMeta(blog, canonicalUrl);
  sendHtml(
    res,
    buildBlogShareHtml(
      { ...meta, ogType: 'article' },
      {
        excerpt: meta.description,
        bodyText: blog.content ? stripMarkdownForCrawlers(blog.content) : undefined,
      },
    ),
    OG_CACHE,
  );
}

async function handleCaseStudy(req: Request, res: Response): Promise<void> {
  const meta = resolveCaseStudyShareMeta(req.path, siteOrigin());
  if (meta && (await serveShell(res, meta))) return;
  await serveShellOrUnavailable(res);
}

export const ogPreviewRouter = Router();

/**
 * Matched by hand rather than with Express route patterns: the four portfolio
 * prefixes make a regex clearer than four duplicated route strings, and this keeps
 * the matcher identical to the Edge middleware's.
 *
 * This router is *total* over the paths Caddy sends it (the `@ogPreview` matcher in
 * deploy/gravebuster/Caddyfile): a request under one of those prefixes that matches
 * no handler still gets the plain SPA shell rather than Express's 404, because that
 * is what the SPA fallback served before Caddy started routing these paths here.
 */
ogPreviewRouter.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    next();
    return;
  }

  const pathname = req.path;

  // vercel.json excludes `*.html` from the SPA fallback, so those 404. Caddy answers
  // them before this router; this keeps a direct hit on the API port honest.
  if (/\.html$/i.test(pathname)) {
    next();
    return;
  }

  const detail = pathname.match(BLOG_DETAIL_RE);
  if (detail) {
    void handleBlogDetail(req, res, Number(detail[1]));
    return;
  }
  if (BLOG_LIST_RE.test(pathname)) {
    void handleBlogList(req, res);
    return;
  }
  if (CASE_STUDY_RE.test(pathname)) {
    void handleCaseStudy(req, res);
    return;
  }
  // A path under a blog/case-study prefix this router does not recognise — the SPA
  // fallback's job before, so serve the shell rather than 404.
  if (OG_PREFIX_RE.test(pathname)) {
    void serveShellOrUnavailable(res);
    return;
  }
  next();
});
