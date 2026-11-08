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
 * passage (`minDwell` overrides it; a swipe holds still while speaking, so it needs less); one that does not fit is
 * dropped. `hold` is how many characters of speech the passage lasts.
 */
export function passageSchedule<T extends PassageCite>(answer: string, cites: T[], opts: { after?: number; seen?: Set<string>; minDwell?: number } = {}): Array<{ cite: T; at: number; hold: number }> {
  const dwell = opts.minDwell ?? MIN_DWELL_CHARS;
  const seen = new Set(opts.seen ?? []);
  const out: Array<{ cite: T; at: number }> = [];
  let prev = opts.after ?? 0;
  const total = cites.length + 1;
  for (const [index, cite] of cites.entries()) {
    const key = `${cite.path}#${cite.anchor}`;
    if (seen.has(key) || out.length + 1 >= MAX_CITES) continue;
    const raw = citeAt(answer, cite, index + 1, total, prev + dwell);
    let at = Math.max(sentenceStart(answer, raw), 0);
    if (at < prev + dwell) at = nextSentenceStart(answer, prev + dwell);
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

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * When, in seconds from the start of speech, each heading is to be in place for a swipe summary: just as its sentence
 * starts (`at` characters in, at `cps` characters a second), never sooner than `minGap` after the one before, so the page
 * has time to travel. `end` is the estimated length of the speech.
 */
export function swipePlan(answerLength: number, ats: number[], cps: number, minGap = 1.4): { times: number[]; end: number } {
  const times: number[] = [];
  for (const at of ats) times.push(Math.max(at / cps, (times.at(-1) ?? 0) + (times.length ? minGap : 1.4)));
  const end = Math.max(answerLength / cps, (times.at(-1) ?? 0) + 2);
  return { times, end };
}

/**
 * The page's scroll position `t` seconds into the speech. The page holds still while a passage is spoken, with its heading
 * in the upper third, and travels to the next heading in one quick leg (`leg` seconds, eased in and out) that ends just
 * as that heading's sentence starts. After the last heading it stays put, so the heading being spoken never leaves the
 * screen. `targets` are the live scroll positions that put each heading in place, so the page is followed as it settles.
 */
export function swipeY(t: number, plan: { times: number[]; end: number }, targets: number[], startY: number, leg = 1.1): number {
  let y = startY;
  let free = 0;
  for (const [i, time] of plan.times.entries()) {
    const from = Math.max(free, time - leg);
    if (t <= from) return y;
    if (t < time) return y + (targets[i] - y) * easeInOut((t - from) / (time - from));
    y = targets[i];
    free = time;
  }
  return y;
}

/**
 * Where a guest moon comes in from: just past the screen edge nearest to the spot it is heading for, level with that
 * spot, and the way out is the same rule from wherever it is.
 */
export function nearestEdge(point: { x: number; y: number }, view: { width: number; height: number }, size: number): { x: number; y: number; side: 'left' | 'right' | 'top' | 'bottom' } {
  const gap = size + 24;
  const near = [
    { side: 'left' as const, d: point.x },
    { side: 'right' as const, d: view.width - point.x },
    { side: 'top' as const, d: point.y },
    { side: 'bottom' as const, d: view.height - point.y },
  ].sort((a, b) => a.d - b.d)[0].side;
  if (near === 'left') return { side: near, x: -gap, y: point.y };
  if (near === 'right') return { side: near, x: view.width + gap, y: point.y };
  if (near === 'top') return { side: near, x: point.x, y: -gap };
  return { side: near, x: point.x, y: view.height + gap };
}
