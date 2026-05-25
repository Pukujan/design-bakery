import type { BlogSharePayload } from './blogShareHtml.js';

/** Ideal size for Slack (stricter). */
export const SOCIAL_PREVIEW_IDEAL_BYTES = 512_000;
/** Upper bound for Telegram, Discord, WhatsApp, Facebook, LinkedIn, etc. */
export const SOCIAL_PREVIEW_MAX_BYTES = 1_000_000;

export function ogImageMimeType(url: string): 'image/jpeg' | 'image/png' {
  return /\.jpe?g($|\?)/i.test(url) ? 'image/jpeg' : 'image/png';
}

function isHttpsUrl(url: string | undefined): url is string {
  const u = url?.trim();
  return Boolean(u && (u.startsWith('https://') || u.startsWith('http://')));
}

function candidatePreviewUrls(blog: BlogSharePayload): string[] {
  const seo = blog.seo;
  const seen = new Set<string>();
  const out: string[] = [];
  const add = (url: string | undefined) => {
    const u = url?.trim();
    if (!isHttpsUrl(u) || seen.has(u)) return;
    seen.add(u);
    out.push(u);
  };
  add(seo?.socialOgImageUrl);
  add(seo?.ogImageThumbUrl);
  add(blog.thumbnailImageUrl);
  add(seo?.ogImageUrl ?? seo?.ogImage);
  add(blog.coverImageUrl);
  return out;
}

export async function fetchContentLength(url: string): Promise<number | null> {
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    if (!res.ok) return null;
    const raw = res.headers.get('content-length');
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

/**
 * Pick og:image for messaging/social unfurls.
 * Prefers publish-kit `socialOgImageUrl` (JPEG), then smallest asset under platform limits.
 */
export async function resolveSocialPreviewImage(
  blog: BlogSharePayload,
): Promise<string | undefined> {
  const candidates = candidatePreviewUrls(blog);
  if (candidates.length === 0) return undefined;

  const social = blog.seo?.socialOgImageUrl?.trim();
  if (isHttpsUrl(social)) return social;

  const jpegFirst = candidates.find((u) => ogImageMimeType(u) === 'image/jpeg');
  if (jpegFirst) {
    const bytes = await fetchContentLength(jpegFirst);
    if (bytes === null || bytes <= SOCIAL_PREVIEW_MAX_BYTES) return jpegFirst;
  }

  let bestIdeal: { url: string; bytes: number } | null = null;
  let bestMax: { url: string; bytes: number } | null = null;

  for (const url of candidates) {
    const bytes = await fetchContentLength(url);
    if (bytes === null) continue;
    if (bytes <= SOCIAL_PREVIEW_IDEAL_BYTES) return url;
    if (bytes <= SOCIAL_PREVIEW_MAX_BYTES && (!bestMax || bytes < bestMax.bytes)) {
      bestMax = { url, bytes };
    }
    if (!bestIdeal || bytes < bestIdeal.bytes) bestIdeal = { url, bytes };
  }

  if (bestMax) return bestMax.url;
  if (bestIdeal) return bestIdeal.url;
  return jpegFirst ?? candidates[0];
}
