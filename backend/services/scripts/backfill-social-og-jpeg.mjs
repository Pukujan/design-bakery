#!/usr/bin/env node
/**
 * Create seo.socialOgImageUrl (JPEG) for posts that only have large PNG og images.
 *   pnpm --dir backend/services run backfill:social-og-jpeg
 *   node backend/services/scripts/backfill-social-og-jpeg.mjs --id 12
 */
import { config } from 'dotenv';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
config({ path: join(repoRoot, 'backend/.env') });

const { createClient } = await import('@supabase/supabase-js');
const { ensureSocialOgImageInSeo } = await import('../lib/blog/publishKit/ensureSocialOgImage.js');

const url = process.env.SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });
const onlyId = process.argv.includes('--id')
  ? Number(process.argv[process.argv.indexOf('--id') + 1])
  : null;

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
    const nextSeo = await ensureSocialOgImageInSeo(seo, row.numeric_id);
    if (!nextSeo?.socialOgImageUrl || nextSeo.socialOgImageUrl === seo.socialOgImageUrl) {
      console.log(`skip ${row.numeric_id} — no ogImageUrl to convert`);
      continue;
    }

    const { error: patchErr } = await supabase
      .from('blog_posts')
      .update({ seo: nextSeo, updated_at: new Date().toISOString() })
      .eq('numeric_id', row.numeric_id);
    if (patchErr) throw patchErr;

    console.log(`ok ${row.numeric_id} ${row.title?.slice(0, 40)}… → ${nextSeo.socialOgImageUrl}`);
    updated += 1;
  }

  console.log(`\nDone. Updated ${updated} post(s).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
