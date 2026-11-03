/** Headings that the contents lists: the level-2 and level-3 headings of an article, in order. */
export type TocEntry = { id: string; text: string; level: 2 | 3 };

import { headingAnchors } from '../../lib/headingAnchors';

export { slugifyHeading as slugify } from '../../lib/headingAnchors';

/** The main headings of a markdown article (level two only), skipping anything inside a code block. */
export function tocFrom(source: string): TocEntry[] {
  // Anchors are handed out across every heading the article renders with an id (a # renders as a ##), so a repeat gets -2.
  return headingAnchors(source, { levels: [1, 2, 3] })
    .filter((heading) => heading.level === 2)
    .map(({ id, text }) => ({ id, text, level: 2 as const }));
}
