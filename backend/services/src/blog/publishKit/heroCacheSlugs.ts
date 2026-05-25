/** Normalize tags/category for hero cache lookup (lowercase slug tokens). */
export function slugifyHeroToken(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function buildHeroMatchSlugs(tags: string[], category: string): string[] {
  const out = new Set<string>();
  for (const tag of tags) {
    const s = slugifyHeroToken(tag);
    if (s.length >= 2) out.add(s);
  }
  const cat = slugifyHeroToken(category);
  if (cat.length >= 2) out.add(cat);
  return [...out];
}

/** Jaccard similarity on slug sets (0–1). */
export function heroSlugMatchScore(requestSlugs: string[], candidateSlugs: string[]): number {
  if (requestSlugs.length === 0 || candidateSlugs.length === 0) return 0;
  const a = new Set(requestSlugs);
  const b = new Set(candidateSlugs);
  let intersection = 0;
  for (const s of a) {
    if (b.has(s)) intersection += 1;
  }
  const union = a.size + b.size - intersection;
  return union > 0 ? intersection / union : 0;
}

export function heroSlugOverlapCount(requestSlugs: string[], candidateSlugs: string[]): number {
  const b = new Set(candidateSlugs);
  return requestSlugs.filter((s) => b.has(s)).length;
}
