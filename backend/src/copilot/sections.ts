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

/** Level of a chart or diagram section; deeper than any heading, so a summary's main passages stay headings. */
export const VISUAL_LEVEL = 7;

/** The text between `before` and `after` in a line, or '' when either is missing. */
function between(line: string, before: string, after: string): string {
  const start = line.indexOf(before);
  if (start < 0) return '';
  const end = line.indexOf(after, start + before.length);
  return end < 0 ? '' : line.slice(start + before.length, end);
}

/** "Figure 1. A judge's score depends on skips. Hollow dot: …" → "Figure 1. A judge's score depends on skips." */
function captionTitle(caption: string): string {
  const label = caption.indexOf('. ');
  const end = label < 0 ? -1 : caption.indexOf('. ', label + 2);
  const title = end < 0 ? caption : caption.slice(0, end + 1);
  return title.length > QUOTE_MAX ? `${title.slice(0, QUOTE_MAX - 1).trimEnd()}…` : title;
}

/**
 * The sections of a markdown document: each heading with the text blocks under it until the next heading. With
 * `visuals`, a paper's charts and diagrams are sections too (TASK-DB-0146), in page order: a `<figure data-figure="NAME">`
 * is `figure-NAME`, titled by its caption's first sentence, and the Nth ```mermaid block is `diagram-N`. The paper page
 * gives the rendered figures and diagrams the same ids (PaperFigure.tsx, ResearchPaperPage.tsx). The surrounding
 * section keeps its text, so a quote from a caption still works there as before.
 */
export function sectionsOfMarkdown(markdown: string, options: { levels: number[]; stripNumber?: boolean; visuals?: boolean }): Section[] {
  const anchors = headingAnchors(markdown, { levels: options.levels, stripNumber: options.stripNumber });
  const sections: Section[] = [];
  let current: Section | null = null;
  let anchorIndex = 0;
  let fence: string | null = null;
  let paragraph: string[] = [];
  let figure: Section | null = null;
  let diagrams = 0;
  const flush = () => {
    const block = plainBlock(paragraph.join(' '));
    if (current && block) current.blocks.push(block);
    paragraph = [];
  };
  for (const line of markdown.split('\n')) {
    if (options.visuals && !fence) {
      const name = between(line, 'data-figure="', '"');
      if (line.includes('<figure') && name) {
        figure = { id: `figure-${name}`, heading: '', level: VISUAL_LEVEL, blocks: [] };
      }
      const caption = squash(between(line, '<figcaption>', '</figcaption>'));
      if (figure && caption) {
        figure.heading = captionTitle(caption);
        figure.blocks.push(caption);
      }
      if (figure && line.includes('</figure>')) {
        if (!figure.heading) figure.heading = current ? `Figure: ${current.heading}` : 'Figure';
        sections.push(figure);
        figure = null;
      }
    }
    const marker = /^\s*(```|~~~)/.exec(line)?.[1];
    if (marker) {
      flush();
      if (options.visuals && fence === null && line.trim().slice(marker.length).trim().toLowerCase() === 'mermaid') {
        diagrams += 1;
        sections.push({ id: `diagram-${diagrams}`, heading: current ? `Diagram: ${current.heading}` : `Diagram ${diagrams}`, level: VISUAL_LEVEL, blocks: [] });
      }
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

/** A normal summary: 2 to 3 passages, about 15 to 20 seconds of speech. */
export const SUMMARY_PASSAGES = 3;
/** The cap, for "walk me through the whole post" or "go deeper" (about 35 seconds). */
export const MAX_PASSAGES = 4;
const SKIP_HEADINGS = /^(table of contents|contents|references|bibliography|appendix\b.*|acknowledg(e)?ments?)$/i;

export type Passage = { heading: string; anchor: string; quote?: string };

/** The first sentence of a section's first block, as a quote that checkQuote accepts. */
function firstSentence(section: Section): string | undefined {
  const block = section.blocks.find((b) => b.length >= 20);
  if (!block) return undefined;
  const sentence = /^.{20,}?[.!?](?=\s|$)/.exec(block)?.[0] ?? block;
  return checkQuote(section, sentence.length > QUOTE_MAX ? sentence.slice(0, QUOTE_MAX).replace(/\s+\S*$/, '') : sentence);
}

/**
 * The passages of a whole-post summary: SUMMARY_PASSAGES headings by default (MAX_PASSAGES when asked for the whole post), in reading order, never the same one twice, taken
 * evenly across the post (skipping contents and references), each with a quotable first sentence. Built from the live
 * headings, so a post's summary follows its edits.
 */
export function buildPassages(sections: Section[], max = SUMMARY_PASSAGES): Passage[] {
  const limit = Math.min(Math.max(1, max), MAX_PASSAGES);
  const usable: Section[] = [];
  const seen = new Set<string>();
  for (const section of sections) {
    if (seen.has(section.id) || SKIP_HEADINGS.test(plainHeading(section.heading).replace(/^\d+(\.\d+)*\.?\s+/, ''))) continue;
    seen.add(section.id);
    usable.push(section);
  }
  // Prefer the main (shallowest) headings; fall back to all of them when the post has few.
  const top = Math.min(...usable.map((s) => s.level), 6);
  const main = usable.filter((s) => s.level === top || (s.level === top + 1 && usable.filter((u) => u.level === top).length < 2));
  const pool = main.length >= 2 ? main : usable;
  const picked = [...new Set(pool.length <= limit ? pool : Array.from({ length: limit }, (_, i) => pool[Math.round((i * (pool.length - 1)) / (limit - 1))]))];
  // A paper with charts or diagrams shows one in its summary (TASK-DB-0146): the first visual takes the place of the
  // passage nearest it (never the opening one), and the passages stay in reading order.
  const visual = usable.find((s) => s.level === VISUAL_LEVEL);
  if (visual && !picked.some((s) => s.level === VISUAL_LEVEL)) {
    const at = (s: Section) => sections.indexOf(s);
    if (picked.length < limit) picked.push(visual);
    else if (picked.length > 1) {
      const rest = picked.slice(1);
      const nearest = rest.reduce((a, b) => (Math.abs(at(b) - at(visual)) < Math.abs(at(a) - at(visual)) ? b : a));
      picked[picked.indexOf(nearest)] = visual;
    }
    picked.sort((a, b) => at(a) - at(b));
  }
  return picked.map((s) => ({ heading: s.heading, anchor: s.id, quote: firstSentence(s) }));
}
