export const MAX_BLOG_TAGS = 5;

/** Split comma-separated tag input into trimmed, non-empty segments. */
export function parseCommaSeparatedTags(input: string): string[] {
  return input
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

/** Merge existing tags with new ones; dedupe case-insensitively; cap at max. */
export function mergeTags(existing: string[], incoming: string[], max = MAX_BLOG_TAGS): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const tag of [...existing, ...incoming]) {
    const trimmed = tag.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
    if (out.length >= max) break;
  }
  return out;
}

export function isDataImageUrl(url: string | undefined): boolean {
  return Boolean(url?.trim().startsWith('data:image/'));
}

/** Large data URLs may fail Firestore saves or social crawlers. */
export function isOversizedDataImageUrl(url: string | undefined, maxChars = 100_000): boolean {
  const u = url?.trim() ?? '';
  return isDataImageUrl(u) && u.length > maxChars;
}
