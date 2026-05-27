/** Client-side slug + tags until VL agent persists them in CMS (#24). */
export function slugifyGalleryText(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function humanizeFilename(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim();
  if (!base) return 'Untitled';
  return base.replace(/\b\w/g, (c) => c.toUpperCase());
}

const STOP_WORDS = new Set(['the', 'a', 'an', 'and', 'or', 'of', 'in', 'on', 'at', 'to', 'for', 'img', 'image']);

export function deriveMetaTags(parts: (string | null | undefined)[]): string[] {
  const tokens = new Set<string>();
  for (const part of parts) {
    if (!part?.trim()) continue;
    for (const word of part.toLowerCase().split(/[^a-z0-9]+/)) {
      if (word.length >= 3 && !STOP_WORDS.has(word)) tokens.add(word);
    }
  }
  return [...tokens].slice(0, 12);
}

export function matchesGalleryQuery(photo: { slug: string; title: string; filename: string; altText: string; metaTags: string[] }, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    photo.slug,
    photo.title,
    photo.filename,
    photo.altText,
    ...photo.metaTags,
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(q);
}
