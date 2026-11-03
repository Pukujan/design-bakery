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
