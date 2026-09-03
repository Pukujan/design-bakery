#!/usr/bin/env node
/**
 * Generate public/sitemap.xml before Vite build.
 * Prefers live blog list from Railway API or Supabase; falls back to blog-data.json.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const publicDir = path.join(repoRoot, 'frontend/public');
const blogJsonPath = path.join(
  repoRoot,
  'frontend/src/app/modules/blog/data/blog-data.json',
);

const SITE_ORIGIN = (
  process.env.VITE_SITE_URL ||
  process.env.SITE_URL ||
  'https://www.design-bakery.com'
)
  .trim()
  .replace(/\/$/, '');

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function urlEntry(loc, lastmod) {
  const lastmodTag = lastmod ? `\n    <lastmod>${xmlEscape(lastmod)}</lastmod>` : '';
  return `  <url>\n    <loc>${xmlEscape(loc)}</loc>${lastmodTag}\n  </url>`;
}

function resolveNumericId(row) {
  const id = Number(row.numericId ?? row.numeric_id ?? row.id);
  return Number.isFinite(id) && id > 0 ? id : null;
}

async function fetchBlogsFromApi() {
  const base = (process.env.VITE_BLOG_API_URL || process.env.BLOG_API_URL || '')
    .trim()
    .replace(/\/$/, '');
  if (!base) return null;
  try {
    const res = await fetch(`${base}/api/public/blogs`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data.blogs) ? data.blogs : null;
  } catch {
    return null;
  }
}

async function fetchBlogsFromSupabase() {
  const url = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '')
    .trim()
    .replace(/\/$/, '');
  const key = (
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ''
  ).trim();
  if (!url || !key) return null;
  try {
    const params = new URLSearchParams({
      select: 'numeric_id,updated_at,published_at',
      order: 'published_at.desc.nullslast,updated_at.desc',
    });
    const res = await fetch(`${url}/rest/v1/blog_posts?${params}`, {
      headers: {
        Accept: 'application/json',
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    });
    if (!res.ok) return null;
    const rows = await res.json();
    return Array.isArray(rows) ? rows : null;
  } catch {
    return null;
  }
}

function readFallbackBlogs() {
  if (!fs.existsSync(blogJsonPath)) return [];
  const rows = JSON.parse(fs.readFileSync(blogJsonPath, 'utf8'));
  return Array.isArray(rows) ? rows : [];
}

async function loadBlogRows() {
  const fromApi = await fetchBlogsFromApi();
  if (fromApi?.length) return fromApi;
  const fromSupabase = await fetchBlogsFromSupabase();
  if (fromSupabase?.length) return fromSupabase;
  return readFallbackBlogs();
}

function blogLastmod(row) {
  const raw =
    row.updatedAt ||
    row.updated_at ||
    row.publishedAt ||
    row.published_at ||
    undefined;
  if (typeof raw !== 'string' || !raw.trim()) return undefined;
  const ts = Date.parse(raw);
  if (Number.isNaN(ts)) return undefined;
  return new Date(ts).toISOString().slice(0, 10);
}

async function main() {
  const today = new Date().toISOString().slice(0, 10);
  const staticPaths = [
    '/',
    '/#about',
    '/#projects',
    '/#contact',
    '/blogs',
    '/endtoend-engineer/blogs',
    '/endtoend-engineer',
    '/design',
    '/case-studies/ekagajpatra',
    '/case-studies/invest-ai',
    '/case-studies/ai-agents/v3',
    '/case-studies/ai-agents/v4',
    '/case-studies/legal-workflow-research',
    '/case-studies/cortex',
    '/case-studies/fossil',
    '/case-studies/fossil/presentation',
    '/case-studies/fossil/evidence',
    '/case-studies/study-os',
    '/case-studies/study-os/presentation',
    '/case-studies/study-os/evidence',
  ];

  const blogRows = await loadBlogRows();
  const blogIds = [
    ...new Set(
      blogRows
        .map(resolveNumericId)
        .filter((id) => id !== null),
    ),
  ].sort((a, b) => a - b);

  const entries = [];

  for (const pathname of staticPaths) {
    entries.push(urlEntry(`${SITE_ORIGIN}${pathname}`, today));
  }

  for (const id of blogIds) {
    const row = blogRows.find((item) => resolveNumericId(item) === id);
    const lastmod = row ? blogLastmod(row) : undefined;
    entries.push(urlEntry(`${SITE_ORIGIN}/endtoend-engineer/blogs/${id}`, lastmod ?? today));
    entries.push(urlEntry(`${SITE_ORIGIN}/blogs/${id}`, lastmod ?? today));
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`;

  fs.mkdirSync(publicDir, { recursive: true });
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xml, 'utf8');
  console.log(
    `[sitemap] wrote ${entries.length} URLs to frontend/public/sitemap.xml (${blogIds.length} blog posts)`,
  );
}

main().catch((error) => {
  console.error('[sitemap] generation failed:', error);
  process.exit(1);
});
