/**
 * Where a citation sits in the site and in the spoken answer (TASK-DB-0129). Pure, so it can be tested on its own.
 * A cited section is a node in the site: from where the visitor is, the way there is the page (through its list and
 * card, which journey() in store.ts plays with the cursor) and then the heading.
 */

export type RouteStep = { kind: 'page'; path: string; via?: string } | { kind: 'heading'; anchor: string };

/** The list page a post, project or paper is reached through, as store.ts's detailParent. */
function listFor(path: string): string | undefined {
  if (/^\/blogs\/[^/]+$/.test(path)) return '/blogs';
  if (/^\/work\/[^/]+$/.test(path)) return '/#work';
  if (/^\/research\/papers\/[^/]+$/.test(path)) return '/research';
  return undefined;
}

/** The ordered steps from the current page to a cited page and, if given, a heading on it. */
export function planRoute(current: string, target: string, anchor?: string): RouteStep[] {
  const steps: RouteStep[] = [];
  if (current !== target.split('#')[0]) steps.push({ kind: 'page', path: target.split('#')[0], via: listFor(target.split('#')[0]) });
  if (anchor) steps.push({ kind: 'heading', anchor });
  return steps;
}

/**
 * Where in the answer text a citation is spoken, as a character position: where its heading (without the section
 * number) is named, else its quote's first words, else its even share of the answer. Never earlier than `after`, so
 * several citations run in the order they are spoken.
 */
export function citeAt(answer: string, cite: { heading: string; quote?: string }, index: number, total: number, after = 0): number {
  const text = answer.toLowerCase();
  const heading = cite.heading.toLowerCase().replace(/^(\d+(\.\d+)*|[a-z])\.?\s+/, '').trim();
  const quote = (cite.quote ?? '').toLowerCase().split(/\s+/).slice(0, 4).join(' ');
  let at = heading.length >= 4 ? text.indexOf(heading) : -1;
  if (at < 0 && quote.length >= 8) at = text.indexOf(quote);
  if (at < 0) at = Math.floor((answer.length * index) / Math.max(1, total));
  return Math.max(after, at);
}

/** At most this many moves in one answer. */
export const MAX_CITES = 4;
/** The fewest characters of speech a passage gets before the next move (about five seconds). */
export const MIN_DWELL_CHARS = 70;

/** The start of the sentence that contains `at` (a move never begins in the middle of one). */
export function sentenceStart(text: string, at: number): number {
  let start = 0;
  const ends = /[.!?]["')\]]*\s+/g;
  for (let m = ends.exec(text); m && m.index + m[0].length <= at; m = ends.exec(text)) start = m.index + m[0].length;
  return start;
}

/** The start of the first sentence at or after `at`, or -1 when there is none. */
function nextSentenceStart(text: string, at: number): number {
  const ends = /[.!?]["')\]]*\s+/g;
  for (let m = ends.exec(text); m; m = ends.exec(text)) if (m.index + m[0].length >= at) return m.index + m[0].length;
  return -1;
}

export type PassageCite = { path: string; anchor: string; heading: string; quote?: string };

/**
 * When each later citation of a spoken answer is walked to. The first is made before he speaks (at 0). Each lands on a
 * sentence start, in the order spoken, at least MIN_DWELL_CHARS after the one before so he stays long enough to say the
 * passage; one that does not fit is dropped. `hold` is how many characters of speech the passage lasts.
 */
export function passageSchedule<T extends PassageCite>(answer: string, cites: T[], opts: { after?: number; seen?: Set<string> } = {}): Array<{ cite: T; at: number; hold: number }> {
  const seen = new Set(opts.seen ?? []);
  const out: Array<{ cite: T; at: number }> = [];
  let prev = opts.after ?? 0;
  const total = cites.length + 1;
  for (const [index, cite] of cites.entries()) {
    const key = `${cite.path}#${cite.anchor}`;
    if (seen.has(key) || out.length + 1 >= MAX_CITES) continue;
    const raw = citeAt(answer, cite, index + 1, total, prev + MIN_DWELL_CHARS);
    let at = Math.max(sentenceStart(answer, raw), 0);
    if (at < prev + MIN_DWELL_CHARS) at = nextSentenceStart(answer, prev + MIN_DWELL_CHARS);
    if (at < 0 || at > answer.length - 20) continue;
    seen.add(key);
    out.push({ cite, at });
    prev = at;
  }
  return out.map((item, i) => ({ ...item, hold: (out[i + 1]?.at ?? answer.length) - item.at }));
}

/**
 * Where the moon perches next to a heading: in the margin on the side with room, or above the heading on a phone, and
 * level with its first line. It is recomputed from the heading's live rect as the page settles.
 */
export function perchSpot(rect: { left: number; right: number; top: number; height: number }, view: { width: number; height: number }): { x: number; y: number } {
  const clampY = (y: number) => Math.min(view.height - 60, Math.max(70, y));
  if (view.width < 640) return { x: Math.min(view.width - 50, Math.max(40, rect.left + 24)), y: clampY(rect.top - 34) };
  const y = clampY(rect.top + Math.min(rect.height / 2, 24));
  if (rect.left >= 90) return { x: rect.left - 46, y };
  if (view.width - rect.right >= 90) return { x: rect.right + 46, y };
  return { x: Math.min(view.width - 50, Math.max(40, rect.left + 24)), y: clampY(rect.top - 34) };
}
