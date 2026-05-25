import type { BlogSharePayload } from './blogShareHtml.js';

/** Slack often skips og:image assets larger than ~512KB. */
export const SOCIAL_PREVIEW_MAX_BYTES = 512_000;

export function ogImageMimeType(url: string): 'image/jpeg' | 'image/png' {
  return /\.jpe?g($|\?)/i.test(url) ? 'image/jpeg' : 'image/png';
}

function candidatePreviewUrls(blog: BlogSharePayload): string[] {
  const seo = blog.seo;
  return [
    seo?.socialOgImageUrl,
    seo?.ogImageThumbUrl,
    blog.thumbnailImageUrl,
    seo?.ogImageUrl ?? seo?.ogImage,
    blog.coverImageUrl,
  ]
    .map((u) => u?.trim())
    .filter((u): u is string => Boolean(u && u.startsWith('http')));
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

/** Prefer a JPEG/small asset so Slack, Discord, and LinkedIn show the image. */
export async function resolveSocialPreviewImage(
  blog: BlogSharePayload,
): Promise<string | undefined> {
  const candidates = candidatePreviewUrls(blog);
  if (candidates.length === 0) return undefined;

  let smallest: { url: string; bytes: number } | null = null;

  for (const url of candidates) {
    const bytes = await fetchContentLength(url);
    if (bytes === null) continue;
    if (bytes <= SOCIAL_PREVIEW_MAX_BYTES) return url;
    if (!smallest || bytes < smallest.bytes) smallest = { url, bytes };
  }

  return smallest?.url ?? candidates[0];
}
