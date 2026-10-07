#!/usr/bin/env node
// Copy public Supabase Storage objects into Octo files and rewrite the URLs
// stored in the workspace database.
//
// Default is a dry run (counts only). --apply uploads every distinct
// supabase.co URL it can download and replaces those URLs in place.
//
// --apply refuses to run until this workspace key can publish files. Each
// uploaded object is copied to the public bucket and the stored URL becomes
// the stable https://files.design-bakery.com/<fileId> address Octo returns.
// A download or publish that fails leaves that URL unchanged.
//
// Env (backend/.env via scripts/load-backend-env.mjs, or the process env):
//   OCTO_API_BASE, OCTO_WORKSPACE_ID, OCTO_API_KEY (or OCTO_WS_KEY)
//
// Usage:
//   node scripts/migrate-supabase-storage-to-octo.mjs
//   node scripts/migrate-supabase-storage-to-octo.mjs --apply

import { loadBackendEnv } from './load-backend-env.mjs';

loadBackendEnv();

const APPLY = process.argv.includes('--apply');
const OCTO = (process.env.OCTO_API_BASE || 'https://octodb.design-bakery.com').replace(/\/$/, '');
const WS = process.env.OCTO_WORKSPACE_ID?.trim();
const KEY = (process.env.OCTO_API_KEY || process.env.OCTO_WS_KEY || '').trim();

if (!WS || !KEY) {
  console.error('OCTO_WORKSPACE_ID and OCTO_API_KEY must be set');
  process.exit(2);
}

async function octo(sql, params = []) {
  const res = await fetch(`${OCTO}/api/workspaces/${WS}/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql, params }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`octo ${res.status}: ${JSON.stringify(body).slice(0, 400)}`);
  return body.rows ?? [];
}

function collectUrls(value, into) {
  if (typeof value !== 'string') return;
  const matches = value.match(/https:\/\/[a-z0-9]+\.supabase\.co\/storage\/v1\/object\/public\/[^\s"'<>)]+/gi);
  if (!matches) return;
  for (const url of matches) into.add(url);
}

async function assertPublishAvailable() {
  const res = await fetch(`${OCTO}/api/capabilities?workspaceId=${encodeURIComponent(WS)}`, {
    headers: { Authorization: `Bearer ${KEY}` },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Octo capabilities failed (HTTP ${res.status}). Refusing to rewrite image URLs.`);
  }
  const actions = new Set(
    Array.isArray(body.capabilities) ? body.capabilities.map((entry) => entry?.action) : [],
  );
  if (!actions.has('files.publish')) {
    throw new Error(
      'Octo is not advertising files.publish for this workspace. Refusing to rewrite image URLs.',
    );
  }
}

const URL_RE = /https:\/\/[a-z0-9]+\.supabase\.co\/storage\/v1\/object\/public\/[^\s"'<>)]+/gi;

console.log(APPLY ? 'apply' : 'dry-run');

const media = await octo(`select id, url from public.media_assets where url like '%supabase.co/storage%'`);
const covers = await octo(`select id, url from public.cover_studio_assets where url like '%supabase.co/storage%'`);
const heroes = await octo(`select id, public_url from public.publish_kit_hero_cache where public_url like '%supabase.co/storage%'`);
const posts = await octo(
  `select numeric_id, cover_image_url, thumbnail_image_url, content, seo::text as seo
     from public.blog_posts
    where cover_image_url like '%supabase.co/storage%'
       or thumbnail_image_url like '%supabase.co/storage%'
       or content like '%supabase.co/storage%'
       or seo::text like '%supabase.co/storage%'`,
);

const urls = new Set();
for (const row of media) collectUrls(row.url, urls);
for (const row of covers) collectUrls(row.url, urls);
for (const row of heroes) collectUrls(row.public_url, urls);
for (const row of posts) {
  collectUrls(row.cover_image_url, urls);
  collectUrls(row.thumbnail_image_url, urls);
  collectUrls(row.content, urls);
  collectUrls(row.seo, urls);
}

console.log(`media_assets rows: ${media.length}`);
console.log(`cover_studio_assets rows: ${covers.length}`);
console.log(`hero cache rows: ${heroes.length}`);
console.log(`blog_posts rows: ${posts.length}`);
console.log(`distinct supabase storage URLs: ${urls.size}`);

if (!APPLY) {
  console.log('dry-run only. Re-run with --apply to publish each file and rewrite the stored URLs.');
  process.exit(0);
}

await assertPublishAvailable();
process.env.OCTO_API_KEY = KEY;
process.env.OCTO_WORKSPACE_ID = WS;
process.env.OCTO_API_BASE = OCTO;

const { uploadOctoPublicFile } = await import('../backend/services/lib/octoFiles.js');
const replacement = new Map();
let failed = 0;
for (const url of urls) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(120_000) });
    if (!res.ok) throw new Error(`download HTTP ${res.status}`);
    const bytes = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get('content-type') || 'application/octet-stream';
    const ext = (url.split('.').pop() || 'bin').slice(0, 8);
    const stored = await uploadOctoPublicFile({
      logicalPath: `migrated/${Buffer.from(url).toString('base64url').slice(0, 80)}.${ext}`,
      buffer: bytes,
      contentType,
    });
    if (!stored.url.startsWith('https://') || !stored.url.endsWith(`/${stored.fileId}`)) {
      throw new Error(`publish returned a non-public url for ${stored.fileId}`);
    }
    replacement.set(url, stored.url);
    console.log(`uploaded ${replacement.size}/${urls.size} ${bytes.length} bytes → ${stored.fileId}`);
  } catch (err) {
    failed += 1;
    console.error(`skip ${url.slice(0, 96)}: ${err instanceof Error ? err.message : err}`);
  }
}

function swap(value) {
  if (typeof value !== 'string' || !value.includes('supabase.co/storage')) return value;
  return value.replace(URL_RE, (match) => replacement.get(match) ?? match);
}

for (const row of media) {
  const next = swap(row.url);
  if (next === row.url) continue;
  await octo(`update public.media_assets set url = $1, storage_path = $2, updated_at = now() where id = $3`, [
    next,
    next.split('/').pop(),
    row.id,
  ]);
}
for (const row of covers) {
  const next = swap(row.url);
  if (next === row.url) continue;
  await octo(
    `update public.cover_studio_assets set url = $1, storage_path = $2, updated_at = now() where id = $3`,
    [next, next.split('/').pop(), row.id],
  );
}
for (const row of heroes) {
  const next = swap(row.public_url);
  if (next === row.public_url) continue;
  await octo(`update public.publish_kit_hero_cache set public_url = $1, storage_path = $2 where id = $3`, [
    next,
    next.split('/').pop(),
    row.id,
  ]);
}
for (const row of posts) {
  const cover = swap(row.cover_image_url);
  const thumb = swap(row.thumbnail_image_url);
  const content = swap(row.content);
  const seoText = swap(row.seo);
  if (
    cover === row.cover_image_url &&
    thumb === row.thumbnail_image_url &&
    content === row.content &&
    seoText === row.seo
  ) {
    continue;
  }
  await octo(
    `update public.blog_posts
        set cover_image_url = $1,
            thumbnail_image_url = $2,
            content = $3,
            seo = $4::jsonb,
            updated_at = now()
      where numeric_id = $5`,
    [cover, thumb, content, seoText, row.numeric_id],
  );
}

console.log(`rewrote ${replacement.size} URLs; ${failed} downloads failed and were left unchanged`);
process.exitCode = failed > 0 ? 1 : 0;
