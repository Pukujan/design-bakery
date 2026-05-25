import sharp from './sharpWithFonts.js';
import { OG_SIZE } from './visualFormats.js';
import { uploadBlogAsset } from './storage.js';
import { isSupabaseStorageConfigured } from '../../supabaseClient.js';

export type SeoLike = Record<string, unknown> | null | undefined;

function ogSourceUrl(seo: SeoLike): string | undefined {
  if (!seo || typeof seo !== 'object') return undefined;
  const og = (seo.ogImageUrl ?? seo.ogImage) as string | undefined;
  const u = og?.trim();
  return u?.startsWith('http') ? u : undefined;
}

async function fetchImageBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${url} → HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

/**
 * Ensure seo.socialOgImageUrl (JPEG) exists for Telegram/Discord/Slack unfurls.
 * Returns updated seo object, or the original if unchanged / skipped.
 */
export async function ensureSocialOgImageInSeo(
  seo: SeoLike,
  numericId: number,
): Promise<Record<string, unknown> | undefined> {
  if (!isSupabaseStorageConfigured() || !Number.isFinite(numericId) || numericId <= 0) {
    return seo && typeof seo === 'object' ? { ...seo } : undefined;
  }

  const base = seo && typeof seo === 'object' ? { ...seo } : {};
  if (typeof base.socialOgImageUrl === 'string' && base.socialOgImageUrl.trim().startsWith('http')) {
    return base;
  }

  const sourceUrl = ogSourceUrl(base);
  if (!sourceUrl) return Object.keys(base).length ? base : undefined;

  try {
    const input = await fetchImageBuffer(sourceUrl);
    const jpeg = await sharp(input)
      .resize(OG_SIZE.width, OG_SIZE.height, { fit: 'cover', position: 'centre' })
      .jpeg({ quality: 78, mozjpeg: true })
      .toBuffer();

    const upload = await uploadBlogAsset({
      numericId,
      kind: 'og_social',
      buffer: jpeg,
      contentType: 'image/jpeg',
      ext: 'jpg',
    });
    if (!upload?.url) return Object.keys(base).length ? base : undefined;

    console.log(
      `[publishKit] socialOgImageUrl ${numericId} → ${(jpeg.length / 1024).toFixed(0)}KB`,
    );
    return { ...base, socialOgImageUrl: upload.url };
  } catch (err) {
    console.warn(
      `[publishKit] ensureSocialOgImageInSeo failed for blog ${numericId}:`,
      err instanceof Error ? err.message : err,
    );
    return Object.keys(base).length ? base : undefined;
  }
}
