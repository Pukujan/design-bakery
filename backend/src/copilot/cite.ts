/**
 * Moving the page to where an answer came from (TASK-DB-0142). After a reply, the server picks the retrieved section
 * the reply drew on and emits a cite for it: path, anchor, the heading as the page shows it, and a quote taken from
 * that section's own chunk. Plain code, no model choice:
 *
 * - the section is chosen by how much of the reply's wording it holds, so a section the reply did not use is never
 *   pointed at (a model asked to name its source can name one it did not use);
 * - the heading and the quote are checked against the live section (sections.ts, the same text the page renders), so
 *   the cursor finds the heading and the highlight finds the quote, or the quote is left out;
 * - it was retrieved this turn, so the citation guard accepts it.
 */
import type { Citations } from './citations.js';
import { sectionsForPath } from './knowledge.js';
import { checkQuote, QUOTE_MAX, type Section } from './sections.js';
import type { Passage } from './siteSearch.js';
import { cutAtWord, splitSentences, squash, wordsOf } from './words.js';

export type CiteAction = { kind: 'cite'; path: string; anchor: string; heading: string; quote?: string; mode?: 'swipe' | 'perch' };

const STOP = new Set(
  'about above after again also been before being below between both could does doing down during each from further have having here into itself just more most much need only other over same should some such than that their theirs them then there these they this those through under until very want what when where which while whom with would your yours mine ours really thing things like well yeah sure into onto using used uses make makes made built build work works worked page post paper project site want hello hiya thanks thank please okay cool great nice morning evening afternoon cheers'.split(' '),
);

/** The content words of a text: lower case, four letters or more, no stop words. */
export function contentWords(text: string): Set<string> {
  return new Set(wordsOf(text.toLowerCase().normalize('NFKD')).filter((w) => w.length >= 4 && !STOP.has(w)));
}

const shared = (a: Set<string>, b: Set<string>) => [...a].filter((w) => b.has(w)).length;

/** A reply drew on a passage when it shares at least this many content words with it, and this share of its own. */
export const MIN_SHARED = 3;
export const MIN_SHARE = 0.25;

/**
 * Whether the reply names the page a passage is on: its title in full, or two of its title's content words (all of
 * them when it has fewer). Shared wording alone is not enough: "the latest post is number 34, dated June" shares
 * three words with an unrelated post's section. Home sections (About, the roles) and Contact are exempt: their page
 * titles are generic, and the reply names a company or role instead.
 */
export function namesPage(reply: string, passage: Passage): boolean {
  if (passage.kind === 'home' || passage.kind === 'contact') return true;
  if (reply.toLowerCase().includes(passage.pageTitle.toLowerCase())) return true;
  const title = contentWords(passage.pageTitle);
  return title.size > 0 && shared(contentWords(reply), title) >= Math.min(2, title.size);
}

/** The passage the reply drew on most, or null when none clearly did. Ties go to the better-retrieved passage. */
export function sourceOf(reply: string, passages: Passage[]): Passage | null {
  const words = contentWords(reply);
  if (!words.size) return null;
  let best: { passage: Passage; n: number } | null = null;
  for (const passage of passages) {
    if (!passage.anchor || !namesPage(reply, passage)) continue;
    const n = shared(words, contentWords(passage.text));
    if (n >= MIN_SHARED && n / words.size >= MIN_SHARE && (!best || n > best.n)) best = { passage, n };
  }
  return best?.passage ?? null;
}

/** Sentences of a chunk, each cut to a quotable length at a word boundary. A line break ends one: blocks on the page
 *  are separate elements, and a quote that ran across two would not be found there. Table rows are skipped: the page
 *  shows them as cells, without the pipes. */
function sentences(text: string): string[] {
  return text
    .split('\n')
    .filter((line) => line.trim() && !line.trimStart().startsWith('|'))
    .flatMap((line) => splitSentences(squash(line)))
    .map((s) => s.trim())
    .filter((s) => s.length >= 20)
    .map((s) => cutAtWord(s, QUOTE_MAX));
}

/** The chunk's sentence closest to the reply that the page really shows under this heading, or none. */
export function quoteFor(reply: string, chunk: string, section: Section): string | undefined {
  const words = contentWords(reply);
  let best: { quote: string; n: number } | undefined;
  for (const sentence of sentences(chunk)) {
    const quote = checkQuote(section, sentence);
    if (!quote) continue;
    const n = shared(words, contentWords(quote));
    if (!best || n > best.n) best = { quote, n };
  }
  return best?.quote;
}

/**
 * The cite for this reply, or null: none when the model already pointed at something, when no passage clearly sourced
 * the reply (small talk shares no content words with a section), or when its section is not on the page any more.
 * The visitor's wording is never read here (copilot-spec.md P-2); a list or a count is left out by the route, from the
 * tool the model called. Records the cite in the turn's citation log.
 */
export async function groundCite(reply: string, passages: Passage[], citations: Citations, load = sectionsForPath): Promise<CiteAction | null> {
  if (citations.log().some((c) => c.ok)) return null;
  const source = sourceOf(reply, passages);
  if (!source?.anchor) return null;
  const sections = await load(source.path);
  const section = sections?.find((s) => s.id === source.anchor);
  if (!section) return null;
  const quote = quoteFor(reply, source.text, section);
  citations.retrieve(source.path);
  citations.record({ path: source.path, anchor: section.id, quote, ok: true });
  return { kind: 'cite', path: source.path, anchor: section.id, heading: section.heading, ...(quote ? { quote } : {}), mode: 'perch' };
}
