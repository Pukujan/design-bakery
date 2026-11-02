/** Headings that the contents lists: the level-2 and level-3 headings of an article, in order. */
export type TocEntry = { id: string; text: string; level: 2 | 3 };

/** The anchor for a heading, the same on the page and in the contents. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-');
}

/** The main headings of a markdown article (level two only), skipping anything inside a code block. */
export function tocFrom(source: string): TocEntry[] {
  const entries: TocEntry[] = [];
  let inFence = false;
  for (const line of source.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const match = /^##\s+(.+?)\s*#*\s*$/.exec(line);
    if (match) {
      const text = match[1].replace(/[*_`]/g, '').trim();
      entries.push({ id: slugify(text), text, level: 2 });
    }
  }
  return entries;
}
