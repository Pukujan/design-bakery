/**
 * Plain text helpers for retrieval and cites (TASK-DB-0142), written as character checks rather than patterns: no
 * regex decides anything in the copilot (copilot-spec.md P-2). They shape text the site wrote; none reads a visitor's
 * wording to decide what it means.
 */

const isSpace = (c: string) => c.trim() === '';
const isDigit = (c: string) => c >= '0' && c <= '9';
/** A letter in any cased script, or a digit. */
export const isWordChar = (c: string) => c.toLowerCase() !== c.toUpperCase() || isDigit(c);
export const isUpper = (c: string) => c !== c.toLowerCase();
export const isLower = (c: string) => c !== c.toUpperCase();

/** Runs of whitespace become one space, and the ends are trimmed. */
export function squash(text: string): string {
  return Array.from(text, (c) => (isSpace(c) ? ' ' : c)).join('').split(' ').filter(Boolean).join(' ');
}

/** The words of a text: runs of letters and digits; every other character separates. */
export function wordsOf(text: string): string[] {
  return Array.from(text, (c) => (isWordChar(c) ? c : ' ')).join('').split(' ').filter(Boolean);
}

/** Only the characters `keep` accepts. */
export function keepOnly(text: string, keep: (c: string) => boolean): string {
  return Array.from(text).filter(keep).join('');
}

/** Cut to at most `max` characters, at the last space when there is one, so no word is cut in half. */
export function cutAtWord(text: string, max: number): string {
  if (text.length <= max) return text;
  const head = text.slice(0, max);
  const space = head.lastIndexOf(' ');
  return space < 0 ? head : head.slice(0, space).trimEnd();
}

/** One line's sentences: a sentence ends at . ! or ? followed by a space and a capital, a digit, a quote or "(". */
export function splitSentences(line: string): string[] {
  const out: string[] = [];
  let start = 0;
  for (let i = 0; i < line.length - 2; i += 1) {
    const next = line[i + 2];
    if ('.!?'.includes(line[i]) && line[i + 1] === ' ' && (isUpper(next) || isDigit(next) || '"“('.includes(next))) {
      out.push(line.slice(start, i + 1));
      start = i + 2;
    }
  }
  out.push(line.slice(start));
  return out;
}
