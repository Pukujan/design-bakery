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

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
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
 * The page's scroll position `t` seconds into the speech: from where it started to the first heading (the given target
 * y), on to each next one, then a slow drift on through the last passage until the speech ends. Each leg to a heading
 * eases out, so the page slows as the heading settles into place; the final drift is even. `targets` are the live scroll
 * positions that put each heading in the upper third, so the page is followed as it settles.
 */
export function swipeY(t: number, plan: { times: number[]; end: number }, targets: number[], startY: number, drift = 240): number {
  const points: Array<{ t: number; y: number; ease: (x: number) => number }> = [{ t: 0, y: startY, ease: easeInOut }];
  plan.times.forEach((time, i) => points.push({ t: time, y: targets[i], ease: easeOutCubic }));
  const last = points.at(-1)!;
  points.push({ t: plan.end, y: last.y + drift, ease: easeInOut });
  if (t <= 0) return startY;
  for (let i = 1; i < points.length; i += 1) {
    if (t <= points[i].t) {
      const from = points[i - 1];
      const span = points[i].t - from.t;
      const x = span > 0 ? (t - from.t) / span : 1;
      return from.y + (points[i].y - from.y) * points[i].ease(x);
    }
  }
  return points.at(-1)!.y;
}
