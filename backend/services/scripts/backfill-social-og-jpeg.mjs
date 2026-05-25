#!/usr/bin/env node
/**
 * Create seo.socialOgImageUrl (JPEG) for posts that only have large PNG og images.
 * Run from repo root with backend/.env loaded:
 *   node backend/services/scripts/backfill-social-og-jpeg.mjs
 *   node backend/services/scripts/backfill-social-og-jpeg.mjs --id 12
 */
import 'dotenv/config';
import { config } from 'dotenv';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
config({ path: join(repoRoot, 'backend/.env') });

const { createClient } = await import('@supabase/supabase-js');
const sharp = (await import('../lib/blog/publishKit/sharpWithFonts.js')).default;
const { OG_SIZE } = await import('../lib/blog/publishKit/visualFormats.js');

const url = process.env.SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const bucket = process.env.SUPABASE_STORAGE_BUCKET?.trim();
if (!url || !key || !bucket) {
  console.error('Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_STORAGE_BUCKET in backend/.env');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });
const onlyId = process.argv.includes('--id')
  ? Number(process.argv[process.argv.indexOf('--id') + 1])
  : null;

async function fetchPng(ogUrl) {
  const res = await fetch(ogUrl);
  if (!res.ok) throw new Error(`fetch ${ogUrl} → ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  let q = supabase.from('blog_posts').select('numeric_id,title,seo').order('numeric_id');
  if (Number.isFinite(onlyId)) q = q.eq('numeric_id', onlyId);

  const { data: rows, error } = await q;
  if (error) throw error;

  let updated = 0;
  for (const row of rows ?? []) {
    const seo = row.seo && typeof row.seo === 'object' ? row.seo : {};
    if (seo.socialOgImageUrl?.trim()) {
      console.log(`skip ${row.numeric_id} — already has socialOgImageUrl`);
      continue;
    }
    const ogUrl = (seo.ogImageUrl ?? seo.ogImage)?.trim();
    if (!ogUrl?.startsWith('http')) {
      console.log(`skip ${row.numeric_id} — no ogImageUrl`);
      continue;
    }

    const png = await fetchPng(ogUrl);
    const jpeg = await sharp(png)
      .resize(OG_SIZE.width, OG_SIZE.height, { fit: 'cover', position: 'centre' })
      .jpeg({ quality: 78, mozjpeg: true })
      .toBuffer();

    const path = `blog-publish/${row.numeric_id}/og_social-${Date.now()}.jpg`;
    const { error: upErr } = await supabase.storage.from(bucket).upload(path, jpeg, {
      contentType: 'image/jpeg',
      cacheControl: '31536000',
      upsert: false,
    });
    if (upErr) throw upErr;

    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
    const publicUrl = pub.publicUrl;
    if (!publicUrl) throw new Error('no public URL');

    const nextSeo = { ...seo, socialOgImageUrl: publicUrl };
    const { error: patchErr } = await supabase
      .from('blog_posts')
      .update({ seo: nextSeo })
      .eq('numeric_id', row.numeric_id);
    if (patchErr) throw patchErr;

    console.log(
      `ok ${row.numeric_id} ${row.title?.slice(0, 40)}… → ${(jpeg.length / 1024).toFixed(0)}KB ${publicUrl}`,
    );
    updated += 1;
  }

  console.log(`\nDone. Updated ${updated} post(s).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
