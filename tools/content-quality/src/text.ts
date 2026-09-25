/**
 * Text preparation: mask everything that is not prose (code, frontmatter, HTML
 * tags and attributes, URLs) while keeping every character offset intact, so a
 * match position can be mapped back to a line and column in the original file.
 */

import { isMethodsSection } from './rules.js';

const HTML_COMMENT = /<!--[\s\S]*?-->/g;const HTML_TAG = /<\/?[A-Za-z][^>]*>/g;
const AUTOLINK = /<[^<>\s]+@[^<>\s]+>|<(?:https?|mailto):[^<>]*>/g;
const INLINE_CODE = /`+[^`]*`+/g;
const URL = /\b(?:https?:\/\/|www\.)[^\s<>()[\]]+/g;
const MD_LINK_DEST = /\]\((?:[^()\s]+)(?:\s+"[^"]*")?\)/g;
const MD_REF_DEF = /^\s{0,3}\[[^\]]+\]:\s*\S.*$/gm;
const IMAGE_DEST = /!\[[^\]]*\]\([^)]*\)/g;
const FOOTNOTE_MARKER = /\[\^[^\]]*\]/g;

/** Replace every non-newline character of `text` with a space. */
export function blank(text: string): string {
  return text.replace(/[^\n]/g, ' ');
}

/** Blank a single span inside a line, keeping length. */
function blankMatch(line: string, match: RegExpMatchArray): string {
  const start = match.index ?? 0;
  return line.slice(0, start) + blank(match[0]) + line.slice(start + match[0].length);
}

function blankAll(line: string, pattern: RegExp): string {
  let out = line;
  for (const match of out.matchAll(new RegExp(pattern.source, pattern.flags))) {
    out = blankMatch(out, match as unknown as RegExpMatchArray);
  }
  return out;
}

export interface MaskState {
  inFence: boolean;
  fenceMarker: string;
  inFrontmatter: boolean;
  frontmatterDone: boolean;
  /** Inside `<script>` or `<style>`, whose contents are not prose. */
  rawBlock: 'script' | 'style' | null;
}

export function newMaskState(): MaskState {
  return { inFence: false, fenceMarker: '', inFrontmatter: false, frontmatterDone: false, rawBlock: null };
}

const FENCE = /^\s{0,3}(`{3,}|~{3,})/;

/**
 * Mask one raw line. Returns the line with non-prose spans blanked out, and
 * updates the fence/frontmatter state.
 */
export function maskLine(raw: string, state: MaskState, lineIndex: number): string {
  if (state.rawBlock) {
    if (new RegExp(`</${state.rawBlock}\\s*>`, 'i').test(raw)) state.rawBlock = null;
    return blank(raw);
  }
  const rawOpen = /<(script|style)\b[^>]*>/i.exec(raw);
  if (rawOpen) {
    const tag = (rawOpen[1] ?? 'script').toLowerCase() as 'script' | 'style';
    const closedOnSameLine = new RegExp(`</${tag}\\s*>`, 'i').test(raw.slice((rawOpen.index ?? 0) + rawOpen[0].length));
    if (!closedOnSameLine) state.rawBlock = tag;
    return blank(raw);
  }

  const fence = FENCE.exec(raw);
  if (state.inFence) {
    if (fence && raw.trimStart().startsWith(state.fenceMarker)) {
      state.inFence = false;
      state.fenceMarker = '';
    }
    return blank(raw);
  }
  if (fence) {
    state.inFence = true;
    state.fenceMarker = fence[1] ?? '```';
    return blank(raw);
  }

  if (!state.frontmatterDone) {
    if (lineIndex === 0 && raw.trim() === '---') {
      state.inFrontmatter = true;
      return blank(raw);
    }
    if (state.inFrontmatter) {
      if (raw.trim() === '---' || raw.trim() === '...') {
        state.inFrontmatter = false;
        state.frontmatterDone = true;
      }
      return blank(raw);
    }
    if (lineIndex === 0) state.frontmatterDone = true;
  }

  let out = raw;
  out = blankAll(out, HTML_COMMENT);
  out = blankAll(out, HTML_TAG);
  out = blankAll(out, AUTOLINK);
  out = blankAll(out, IMAGE_DEST);
  out = blankAll(out, MD_LINK_DEST);
  out = blankAll(out, INLINE_CODE);
  out = blankAll(out, URL);
  out = blankAll(out, MD_REF_DEF);
  out = blankAll(out, FOOTNOTE_MARKER);
  return out;
}

export function maskDocument(lines: string[]): string[] {
  const state = newMaskState();
  return lines.map((line, index) => maskLine(line, state, index));
}

/* ------------------------------------------------------------------ */
/* Word counting and sentence splitting                                */
/* ------------------------------------------------------------------ */

export interface WordToken {
  word: string;
  /** Index of the token in the source text. */
  index: number;
}

export function tokenize(text: string): WordToken[] {
  const tokens: WordToken[] = [];
  const re = /[\p{L}\p{N}][\p{L}\p{N}'’.-]*/gu;
  for (const match of text.matchAll(re)) {
    tokens.push({ word: match[0], index: match.index ?? 0 });
  }
  return tokens;
}

export function countWords(text: string): number {
  return tokenize(text).length;
}

const ABBREVIATIONS = new Set([
  'e.g', 'i.e', 'vs', 'etc', 'cf', 'al', 'approx', 'fig', 'figs', 'no', 'nos',
  'dr', 'mr', 'mrs', 'ms', 'prof', 'st', 'jr', 'sr', 'inc', 'ltd', 'co',
  'jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep', 'sept', 'oct', 'nov', 'dec',
]);

export interface Sentence {
  text: string;
  /** Offset of the sentence inside the block text. */
  start: number;
}

/**
 * Split prose into sentences. Decimals, common abbreviations and initials are
 * not treated as sentence ends.
 */
export function splitSentences(text: string): Sentence[] {
  const sentences: Sentence[] = [];
  let start = 0;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char !== '.' && char !== '!' && char !== '?') continue;
    // Consume runs like "?!"
    let end = i;
    while (end + 1 < text.length && /[.!?]/.test(text[end + 1] ?? '')) end += 1;
    if (char === '.' && isProtectedPeriod(text, i)) {
      i = end;
      continue;
    }
    const next = text.slice(end + 1).match(/^(\s+)(\S)/);
    const rest = text.slice(end + 1);
    if (rest.trim().length > 0) {
      if (!next) continue;
      const following = next[2] ?? '';
      if (!/["'“”‘’(\[]?[A-Z0-9*_`<]/.test(following)) {
        i = end;
        continue;
      }
    }
    push(sentences, text, start, end + 1);
    start = end + 1;
    i = end;
  }
  push(sentences, text, start, text.length);
  return sentences.filter((sentence) => sentence.text.trim().length > 0);
}

function push(list: Sentence[], text: string, start: number, end: number): void {
  const raw = text.slice(start, end);
  if (raw.trim().length === 0) return;
  list.push({ text: raw, start });
}

function isProtectedPeriod(text: string, index: number): boolean {
  const before = text[index - 1] ?? '';
  const after = text[index + 1] ?? '';
  // Decimal numbers: 99.8, 1.5
  if (/\d/.test(before) && /\d/.test(after)) return true;
  // Initials and known abbreviations: "Gopen & Swan", "e.g."
  const word = (text.slice(0, index).match(/([\p{L}][\p{L}.'’-]*)$/u)?.[1] ?? '').toLowerCase();
  if (word.length === 1) return true;
  if (ABBREVIATIONS.has(word.replace(/\.$/, ''))) return true;
  if (/\b(?:[A-Za-z]\.){2,}$/.test(text.slice(0, index + 1))) return true;
  return false;
}

/* ------------------------------------------------------------------ */
/* Document model                                                      */
/* ------------------------------------------------------------------ */

export type BlockKind = 'heading' | 'paragraph' | 'list' | 'table' | 'figure' | 'code' | 'quote';

export interface Block {
  kind: BlockKind;
  /** 0-based index of the first raw line. */
  startLine: number;
  /** 0-based index of the last raw line (inclusive). */
  endLine: number;
  /** Masked text of the block, lines joined with a space. */
  text: string;
  /** For every character of `text`, its absolute offset in the masked document. */
  map: number[];
  /** Heading level, for `heading` blocks. */
  level?: number;
  /** Whether the block sits under a Methods / Full data / Appendix heading. */
  inMethods: boolean;
  /** Id of the enclosing section, used for per-section limits. */
  sectionId: number;
}

export interface DocumentModel {
  lines: string[];
  maskedLines: string[];
  /** Masked lines joined by "\n" — offsets here map straight to line/column. */
  maskedText: string;
  blocks: Block[];
  /** Offsets (into maskedText) where each line starts. */
  lineStarts: number[];
  wordCount: number;
}

const HEADING = /^(#{1,6})\s+(.*)$/;
const HTML_HEADING = /^\s*<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1\s*>/i;
const LIST_ITEM = /^\s{0,3}(?:[-*+]|\d+[.)])\s+\S/;
const TABLE_ROW = /^\s{0,3}\|/;
const BLOCKQUOTE = /^\s{0,3}>/;

/** Heading text and level, for Markdown (`##`) and HTML (`<h2>`) alike. */
function headingOf(raw: string): { level: number; title: string } | null {
  const markdown = HEADING.exec(raw);
  if (markdown) return { level: (markdown[1] ?? '#').length, title: (markdown[2] ?? '').trim() };
  const html = HTML_HEADING.exec(raw);
  if (html) {
    return {
      level: Number.parseInt(html[1] ?? '1', 10),
      title: stripHtmlTags(html[2] ?? '').trim(),
    };
  }
  return null;
}

function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
}

export function buildDocument(lines: string[], maskedLines: string[]): DocumentModel {
  const lineStarts: number[] = [];
  let maskedText = '';
  for (const line of maskedLines) {
    lineStarts.push(maskedText.length);
    maskedText += `${line}\n`;
  }

  const blocks: Block[] = [];
  const headingStack: { level: number; methods: boolean; id: number }[] = [];
  let sectionCounter = 0;

  let index = 0;
  while (index < lines.length) {
    const raw = lines[index] ?? '';
    const masked = maskedLines[index] ?? '';
    if (raw.trim() === '') {
      index += 1;
      continue;
    }

    const heading = headingOf(raw);
    if (heading) {
      const level = heading.level;
      const title = heading.title;
      while (headingStack.length > 0 && (headingStack[headingStack.length - 1]?.level ?? 0) >= level) {
        headingStack.pop();
      }
      sectionCounter += 1;
      const parentMethods = headingStack.some((entry) => entry.methods);
      const methods = parentMethods || isMethodsSection(title);
      headingStack.push({ level, methods, id: sectionCounter });
      blocks.push(makeBlock('heading', index, index, maskedLines, { level, inMethods: parentMethods, sectionId: sectionCounter }));
      index += 1;
      continue;
    }

    if (FENCE.test(raw)) {
      const start = index;
      const opener = FENCE.exec(raw)?.[1] ?? '```';
      index += 1;
      while (index < lines.length) {
        const line = lines[index] ?? '';
        const closing = FENCE.exec(line);
        const done = Boolean(closing && line.trimStart().startsWith(opener));
        index += 1;
        if (done) break;
      }
      const current = headingStack[headingStack.length - 1];
      blocks.push(makeBlock('code', start, index - 1, maskedLines, {
        inMethods: current?.methods ?? false,
        sectionId: current?.id ?? 0,
      }));
      continue;
    }

    const kind = blockKind(raw);
    const start = index;
    index += 1;
    if (kind === 'figure') {
      while (index < lines.length && !/<\/figure\s*>/i.test(lines[index] ?? '')) index += 1;
      if (index < lines.length) index += 1;
    } else {
      while (index < lines.length) {
        const line = lines[index] ?? '';
        if (line.trim() === '' || headingOf(line) || FENCE.test(line)) break;
        if (blockKind(line) !== kind) break;
        index += 1;
      }
    }
    const current = headingStack[headingStack.length - 1];
    blocks.push(makeBlock(kind, start, index - 1, maskedLines, {
      inMethods: current?.methods ?? false,
      sectionId: current?.id ?? 0,
    }));
  }

  return {
    lines,
    maskedLines,
    maskedText,
    blocks,
    lineStarts,
    wordCount: countWords(maskedText),
  };
}

function blockKind(line: string): BlockKind {
  if (TABLE_ROW.test(line)) return 'table';
  if (LIST_ITEM.test(line)) return 'list';
  if (BLOCKQUOTE.test(line)) return 'quote';
  if (/^\s*<figure\b/i.test(line)) return 'figure';
  return 'paragraph';
}

function makeBlock(
  kind: BlockKind,
  startLine: number,
  endLine: number,
  maskedLines: string[],
  extra: { level?: number; inMethods: boolean; sectionId: number },
): Block {
  const text: string[] = [];
  const map: number[] = [];
  let offset = 0;
  for (let line = startLine; line <= endLine; line += 1) {
    const masked = maskedLines[line] ?? '';
    if (line > startLine) {
      text.push(' ');
      map.push(offset + 1);
      offset += 1;
    }
    for (let column = 0; column < masked.length; column += 1) {
      text.push(masked[column] ?? '');
      map.push(offset + column);
    }
    offset += masked.length;
  }
  const block: Block = {
    kind,
    startLine,
    endLine,
    text: text.join(''),
    map,
    inMethods: extra.inMethods,
    sectionId: extra.sectionId,
  };
  if (extra.level !== undefined) block.level = extra.level;
  return block;
}

/** Convert an absolute offset in `maskedText` to a 1-based line/column. */
export function positionAt(model: DocumentModel, offset: number): { line: number; column: number } {
  let low = 0;
  let high = model.lineStarts.length - 1;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if ((model.lineStarts[mid] ?? 0) <= offset) low = mid;
    else high = mid - 1;
  }
  return { line: low + 1, column: offset - (model.lineStarts[low] ?? 0) + 1 };
}

/** Number tokens such as 99.8, 1,203, 4.5% used by the fixer's guard. */
export function extractNumbers(text: string): string[] {
  return text.match(/\d+(?:[.,]\d+)*/g) ?? [];
}

/** Links (bare URLs and markdown link targets) used by the fixer's guard. */
export function extractLinks(text: string): string[] {
  const links = new Set<string>();
  for (const match of text.matchAll(/\b(?:https?:\/\/|www\.)[^\s<>()[\]]+/g)) links.add(match[0]);
  for (const match of text.matchAll(/\]\(\s*([^)\s]+)/g)) {
    if (match[1]) links.add(match[1]);
  }
  for (const match of text.matchAll(/^\s{0,3}\[[^\]]+\]:\s*(\S+)/gm)) {
    if (match[1]) links.add(match[1]);
  }
  return [...links];
}
