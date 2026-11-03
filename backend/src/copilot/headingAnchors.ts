/**
 * Heading anchors (TASK-DB-0129). A heading's anchor is made from its own text, so it needs no hand tagging, survives
 * edits to anything else on the page, and follows content added or deleted in the database. A second heading with the
 * same text gets -2, -3 and so on in reading order.
 *
 * This file exists twice, byte for byte below this comment: backend/src/copilot/headingAnchors.ts and
 * frontend/src/app/lib/headingAnchors.ts. The server uses it to name a section in a cite action, the page uses it to
 * give the rendered headings their ids. scripts/test-copilot-cite.mjs fails if the two copies drift.
 */

export type HeadingAnchor = { level: number; text: string; id: string };

/** Markdown inline syntax a heading may carry, reduced to the words a reader sees. */
export function plainHeading(text: string): string {
  return text
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/[*_`~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** "4. What we found" → "what-we-found" when `stripNumber` is set (research papers number their sections). */
export function slugifyHeading(text: string, options: { stripNumber?: boolean } = {}): string {
  let words = plainHeading(text).normalize('NFC').toLowerCase();
  if (options.stripNumber) words = words.replace(/^(\d+|[a-z])\.\s+/, '');
  return (
    words
      .replace(/[^\p{L}\p{N}\s-]/gu, '')
      .trim()
      .replace(/[\s-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'section'
  );
}

/** Hands out anchors in reading order, suffixing repeats: heading, heading-2, heading-3. */
export function anchorAllocator(options: { stripNumber?: boolean } = {}) {
  const used = new Set<string>();
  const counts = new Map<string, number>();
  return (text: string): string => {
    const base = slugifyHeading(text, options);
    let n = counts.get(base) ?? 0;
    let id = base;
    do {
      n += 1;
      id = n === 1 ? base : `${base}-${n}`;
    } while (used.has(id));
    counts.set(base, n);
    used.add(id);
    return id;
  };
}

/** The headings of a markdown document at the given levels, with their anchors, skipping fenced code. */
export function headingAnchors(markdown: string, options: { levels?: number[]; stripNumber?: boolean } = {}): HeadingAnchor[] {
  const levels = options.levels ?? [1, 2, 3];
  const next = anchorAllocator(options);
  const out: HeadingAnchor[] = [];
  let fence: string | null = null;
  for (const line of markdown.split('\n')) {
    const marker = /^\s*(```|~~~)/.exec(line)?.[1];
    if (marker) {
      fence = fence === null ? marker : fence === marker ? null : fence;
      continue;
    }
    if (fence) continue;
    const match = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!match || !levels.includes(match[1].length)) continue;
    const text = plainHeading(match[2]);
    out.push({ level: match[1].length, text, id: next(text) });
  }
  return out;
}
