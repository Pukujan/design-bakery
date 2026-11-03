/**
 * Sections the copilot can point at (TASK-DB-0129). Built from the live content on every call, so a post added,
 * renamed or deleted in the database changes what can be cited with nothing to keep in step. The anchors come from
 * headingAnchors.ts, the same code that gives the rendered headings their ids.
 */
import { headingAnchors, plainHeading, slugifyHeading } from './headingAnchors.js';
import type { Project } from './knowledge.js';

export type Section = { id: string; heading: string; level: number; blocks: string[] };

export const QUOTE_MAX = 160;

const squash = (text: string) => text.replace(/\s+/g, ' ').trim();
const fold = (text: string) => squash(text).normalize('NFC').toLowerCase();

/** A markdown block (paragraph, list item, quote line) as the plain words a reader sees on the page. */
function plainBlock(text: string): string {
  return squash(
    text
      .replace(/^\s{0,3}(?:>\s*)+/, '')
      .replace(/^\s*(?:[-*+]|\d+[.)])\s+/, '')
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/<[^>]+>/g, '')
      .replace(/[*_`~]/g, ''),
  );
}

/** The sections of a markdown document: each heading with the text blocks under it until the next heading. */
export function sectionsOfMarkdown(markdown: string, options: { levels: number[]; stripNumber?: boolean }): Section[] {
  const anchors = headingAnchors(markdown, { levels: options.levels, stripNumber: options.stripNumber });
  const sections: Section[] = [];
  let current: Section | null = null;
  let anchorIndex = 0;
  let fence: string | null = null;
  let paragraph: string[] = [];
  const flush = () => {
    const block = plainBlock(paragraph.join(' '));
    if (current && block) current.blocks.push(block);
    paragraph = [];
  };
  for (const line of markdown.split('\n')) {
    const marker = /^\s*(```|~~~)/.exec(line)?.[1];
    if (marker) {
      flush();
      fence = fence === null ? marker : fence === marker ? null : fence;
      continue;
    }
    if (fence) continue;
    const heading = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (heading) {
      flush();
      const level = heading[1].length;
      const anchor = anchors[anchorIndex];
      if (options.levels.includes(level) && anchor) {
        current = { id: anchor.id, heading: anchor.text, level, blocks: [] };
        sections.push(current);
        anchorIndex += 1;
      } else if (level <= 3) {
        current = null;
      }
      continue;
    }
    if (!line.trim()) flush();
    else if (/^\s*(?:[-*+]|\d+[.)])\s+/.test(line) || /^\s*\|/.test(line)) {
      flush();
      if (!/^\s*\|[\s|:-]*\|?\s*$/.test(line)) paragraph.push(line);
      flush();
    } else paragraph.push(line);
  }
  flush();
  return sections;
}

/** A project page has four fixed sections; the last two exist only when the project has the content. */
export function sectionsOfProject(project: Project & { stats?: Array<{ label: string }> }): Section[] {
  const links = (project.links ?? []).filter((link) => link.url && link.url !== '#');
  const sections: Section[] = [{ id: 'what-it-is', heading: 'What it is', level: 2, blocks: [squash(project.description)] }];
  if (project.stats?.length) sections.push({ id: 'highlights', heading: 'Highlights', level: 2, blocks: project.stats.map((s) => squash(s.label)) });
  sections.push({ id: 'built-with', heading: 'Built with', level: 2, blocks: [squash(project.tech.join(', '))] });
  if (links.length) sections.push({ id: 'go-deeper', heading: 'Go deeper', level: 2, blocks: links.map((l) => squash(l.label)) });
  return sections;
}

/** The section a heading phrase names: its anchor, its exact text, or a unique partial match. Never a guess between two. */
export function findSection(sections: Section[], heading: string): Section | null {
  const wanted = fold(plainHeading(heading));
  if (!wanted) return null;
  const exact = sections.find((s) => fold(s.heading) === wanted) ?? sections.find((s) => s.id === slugifyHeading(heading));
  if (exact) return exact;
  const numberless = (s: Section) => fold(s.heading.replace(/^(\d+|[a-z])\.\s+/i, ''));
  const loose = sections.filter((s) => numberless(s) === wanted || (wanted.length >= 4 && numberless(s).includes(wanted)));
  return loose.length === 1 ? loose[0] : null;
}

/** The quote if it really is on the page in that section (inside one block), trimmed to a short passage; otherwise none. */
export function checkQuote(section: Section, quote: string | undefined): string | undefined {
  const wanted = squash(quote ?? '').replace(/^["“”']+|["“”']+$/g, '');
  if (wanted.length < 8 || wanted.length > QUOTE_MAX) return undefined;
  const folded = fold(wanted);
  const block = section.blocks.find((b) => fold(b).includes(folded));
  if (!block) return undefined;
  const at = fold(block).indexOf(folded);
  return squash(block).slice(at, at + wanted.length);
}
