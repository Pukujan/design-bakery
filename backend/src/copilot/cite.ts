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

export type CiteAction = { kind: 'cite'; path: string; anchor: string; heading: string; quote?: string; mode?: 'swipe' | 'perch' };

const STOP = new Set(
  'about above after again also been before being below between both could does doing down during each from further have having here into itself just more most much need only other over same should some such than that their theirs them then there these they this those through under until very want what when where which while whom with would your yours mine ours really thing things like well yeah sure into onto using used uses make makes made built build work works worked page post paper project site want hello hiya thanks thank please okay cool great nice morning evening afternoon cheers'.split(' '),
);

/** The content words of a text: lower case, four letters or more, no stop words. */
export function contentWords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
      .split(/[\s-]+/)
      .filter((w) => w.length >= 4 && !STOP.has(w)),
  );
}

/** Lists and counts are answered from the catalog or the index, not from one section, so they move the page nowhere. */
const LIST_QUESTION = /\b(how many|list|latest|newest|most recent|which (projects|papers|posts|ones|roles)|what (projects|papers|posts|roles))\b/i;

/** A message with no content words that still asks about the thing being discussed. */
const FOLLOW_UP = /\b(it|its|this|that|these|those|they|them|more|else)\b/i;

const shared = (a: Set<string>, b: Set<string>) => [...a].filter((w) => b.has(w)).length;

/** A reply drew on a passage when it shares at least this many content words with it, and this share of its own. */
export const MIN_SHARED = 3;
export const MIN_SHARE = 0.25;

/** The passage the reply drew on most, or null when none clearly did. Ties go to the better-retrieved passage. */
export function sourceOf(reply: string, passages: Passage[]): Passage | null {
  const words = contentWords(reply);
  if (!words.size) return null;
  let best: { passage: Passage; n: number } | null = null;
  for (const passage of passages) {
    if (!passage.anchor) continue;
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
    .split(/\n+/)
    .filter((line) => !/^\s*\|/.test(line))
    .flatMap((line) => line.replace(/\s+/g, ' ').split(/(?<=[.!?])\s+(?=[A-Z0-9"“(])/))
    .map((s) => s.trim())
    .filter((s) => s.length >= 20)
    .map((s) => (s.length > QUOTE_MAX ? s.slice(0, QUOTE_MAX).replace(/\s+\S*$/, '') : s));
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
 * The cite for this reply, or null: none when the model already pointed at something, when the visitor's message
 * asks about nothing ("how are you", "thanks": a reply that talks about my work anyway is not a reason to move the
 * page; "what is it?" points back at the conversation, so it counts), when it asks for a list or a count (answered
 * from the catalog, not a section), when no passage clearly sourced the reply, or when its section is not on the page any more. Records it in
 * the turn's citation log.
 */
export async function groundCite(reply: string, passages: Passage[], citations: Citations, question?: string, load = sectionsForPath): Promise<CiteAction | null> {
  if (citations.log().some((c) => c.ok)) return null;
  if (question !== undefined && ((!contentWords(question).size && !FOLLOW_UP.test(question)) || LIST_QUESTION.test(question))) return null;
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
