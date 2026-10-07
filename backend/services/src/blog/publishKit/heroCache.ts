import { randomUUID } from 'node:crypto';
import { HERO_IMAGE_PROMPT_VERSION } from './imagePrompt.js';
import {
  buildHeroMatchSlugs,
  heroSlugMatchScore,
  heroSlugOverlapCount,
  slugifyHeroToken,
} from './heroCacheSlugs.js';
import type { LayoutVariant, TemplateFamily } from './templateSelection.js';
import type { VisualStylePreset } from './types.js';
import { dbInsert, dbQueryAll, dbUpdate } from '../../db.js';
import { deleteOctoFile, isAssetStorageConfigured, readOwnPublicAsset, uploadOctoPublicFile } from '../../octoFiles.js';

export type HeroCacheHit = {
  id: string;
  publicUrl: string;
  score: number;
  overlap: number;
};

type HeroCacheRow = {
  id: string;
  storage_path: string;
  public_url: string;
  prompt_version: string;
  category_slug: string;
  tag_slugs: string[];
  family: string;
  style_preset: string;
  layout: string;
  byte_size: number | null;
  use_count: number;
};

function heroCacheEnabled(): boolean {
  const flag = (process.env.PUBLISH_KIT_HERO_CACHE ?? '1').trim().toLowerCase();
  if (flag === '0' || flag === 'false' || flag === 'off') return false;
  return isAssetStorageConfigured();
}

function minMatchScore(): number {
  const raw = Number(process.env.PUBLISH_KIT_HERO_CACHE_MIN_SCORE ?? '0.55');
  return Number.isFinite(raw) ? Math.min(1, Math.max(0, raw)) : 0.55;
}

function minTagOverlap(requestSlugCount: number): number {
  const configured = Number(process.env.PUBLISH_KIT_HERO_CACHE_MIN_TAGS ?? '2');
  const floor = Number.isFinite(configured) ? Math.max(1, Math.floor(configured)) : 2;
  return Math.min(floor, Math.max(1, requestSlugCount));
}

function cacheStoragePath(cacheId: string): string {
  return `blog-publish/hero-cache/${cacheId}.png`;
}

async function downloadPng(url: string): Promise<Buffer> {
  const own = await readOwnPublicAsset(url);
  if (own) return own;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Hero cache download failed: HTTP ${res.status}`);
  }
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

export async function findCachedHeroPng(params: {
  tags: string[];
  category: string;
  family: TemplateFamily;
  stylePreset: VisualStylePreset;
  layout: LayoutVariant;
}): Promise<HeroCacheHit | null> {
  if (!heroCacheEnabled()) return null;

  const matchSlugs = buildHeroMatchSlugs(params.tags, params.category);
  if (matchSlugs.length === 0) return null;

  let data: HeroCacheRow[];
  try {
    data = await dbQueryAll<HeroCacheRow>(
      `select id, storage_path, public_url, prompt_version, category_slug, tag_slugs, family,
              style_preset, layout, byte_size, use_count
         from public.publish_kit_hero_cache
        where prompt_version = $1 and family = $2 and style_preset = $3
          and tag_slugs && $4::text[]
        order by use_count desc, last_used_at desc
        limit 24`,
      [HERO_IMAGE_PROMPT_VERSION, params.family, params.stylePreset, matchSlugs],
    );
  } catch (err) {
    console.warn('[publishKit:heroCache] lookup failed:', err instanceof Error ? err.message : err);
    return null;
  }
  if (data.length === 0) return null;

  const minScore = minMatchScore();
  const minOverlap = minTagOverlap(matchSlugs.length);

  let best: { row: HeroCacheRow; score: number; overlap: number } | null = null;
  for (const row of data as HeroCacheRow[]) {
    const overlap = heroSlugOverlapCount(matchSlugs, row.tag_slugs ?? []);
    if (overlap < minOverlap) continue;
    const score = heroSlugMatchScore(matchSlugs, row.tag_slugs ?? []);
    if (score < minScore) continue;
    if (!best || score > best.score || (score === best.score && overlap > best.overlap)) {
      best = { row, score, overlap };
    }
  }

  if (!best) return null;

  const { row, score, overlap } = best;
  void dbUpdate(
    'publish_kit_hero_cache',
    { last_used_at: new Date().toISOString(), use_count: (row.use_count ?? 0) + 1 },
    { id: row.id },
  ).catch((err) => console.warn('[publishKit:heroCache] touch failed:', err instanceof Error ? err.message : err));

  console.log(
    `[publishKit:heroCache] hit id=${row.id} score=${score.toFixed(2)} overlap=${overlap} slugs=${matchSlugs.join(',')}`,
  );

  return { id: row.id, publicUrl: row.public_url, score, overlap };
}

export async function loadCachedHeroPng(hit: HeroCacheHit): Promise<Buffer> {
  return downloadPng(hit.publicUrl);
}

export async function storeHeroCachePng(params: {
  png: Buffer;
  tags: string[];
  category: string;
  family: TemplateFamily;
  stylePreset: VisualStylePreset;
  layout: LayoutVariant;
}): Promise<string | null> {
  if (!heroCacheEnabled()) return null;

  const matchSlugs = buildHeroMatchSlugs(params.tags, params.category);
  if (matchSlugs.length === 0) return null;

  const cacheId = randomUUID();
  const path = cacheStoragePath(cacheId);
  const stored = await uploadOctoPublicFile({
    logicalPath: path,
    buffer: params.png,
    contentType: 'image/png',
  }).catch((err: unknown) => {
    console.warn(
      '[publishKit:heroCache] upload failed:',
      err instanceof Error ? err.message : err,
    );
    return null;
  });
  if (!stored) return null;

  const insertError = await dbInsert('publish_kit_hero_cache', {
    id: cacheId,
    storage_path: stored.fileId,
    public_url: stored.url,
    prompt_version: HERO_IMAGE_PROMPT_VERSION,
    category_slug: slugifyHeroToken(params.category),
    tag_slugs: matchSlugs,
    family: params.family,
    style_preset: params.stylePreset,
    layout: params.layout,
    byte_size: params.png.length,
    use_count: 0,
  })
    .then(() => null)
    .catch((err: unknown) => (err instanceof Error ? err : new Error(String(err))));

  if (insertError) {
    console.warn('[publishKit:heroCache] insert failed:', insertError.message);
    await deleteOctoFile(stored.fileId).catch(() => undefined);
    return null;
  }

  console.log(
    `[publishKit:heroCache] stored id=${cacheId} slugs=${matchSlugs.join(',')} bytes=${params.png.length}`,
  );
  return cacheId;
}
