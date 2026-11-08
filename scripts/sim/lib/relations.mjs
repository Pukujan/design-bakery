/**
 * Metamorphic relations (copilot-spec.md §8): change a conversation in a way that should not matter, run both, and compare
 * their trajectories. A turn's trajectory is what it did, not what it said: the tools that act (read-only lookups may differ),
 * the actions (kind and path), and the threads after it (the booking's step and which fields it holds, and the page).
 */
import { READ_ONLY, bookingStep, same } from './spec.mjs';

export function trajectory(t) {
  const data = t.flowAfter?.data ?? null;
  return {
    acting: [...new Set(t.steps.filter((s) => !READ_ONLY.includes(s)))].sort(),
    actions: [...new Set(t.actions.map((a) => `${a.kind}${a.path ? ` ${a.path}` : ''}`))].sort(),
    booking: t.flowAfter ? { step: bookingStep(t.flowAfter), fields: Object.keys(data ?? {}).filter((k) => data[k] !== undefined).sort() } : null,
    page: t.pageAfter?.path ?? null,
    ignored: t.ignored,
  };
}

/** How two turns' trajectories differ, as readable lines; empty when they agree. `ignore` lists tools one side cannot have. */
export function diffTurns(a, b, { ignore = [], pages = true } = {}) {
  const x = trajectory(a);
  const y = trajectory(b);
  const drop = (list) => list.filter((s) => !ignore.includes(s));
  const out = [];
  if (!same(drop(x.acting), drop(y.acting))) out.push(`tools [${x.acting}] vs [${y.acting}]`);
  if (!same(x.actions, y.actions)) out.push(`actions [${x.actions}] vs [${y.actions}]`);
  if (!same(x.booking, y.booking)) out.push(`booking ${JSON.stringify(x.booking)} vs ${JSON.stringify(y.booking)}`);
  if (pages && x.page !== y.page) out.push(`page ${x.page} vs ${y.page}`);
  if (x.ignored !== y.ignored) out.push(`ignored ${x.ignored} vs ${y.ignored}`);
  return out;
}

/** The end of a conversation that every relation keeps: the booking button's fields, and where the page ended up. */
export function outcome(turns) {
  const book = turns.flatMap((t) => t.actions).find((a) => a.kind === 'book');
  return {
    book: book ? { name: String(book.name ?? '').toLowerCase(), email: String(book.email ?? '').toLowerCase(), topic: String(book.topic ?? '').toLowerCase() } : null,
    page: turns.at(-1)?.pageAfter?.path ?? null,
    booking: turns.at(-1)?.flowAfter ? bookingStep(turns.at(-1).flowAfter) : null,
  };
}

/**
 * Compares a base run and a variant run. `map[i]` is the variant's index for the base's turn i (inserted turns have none).
 * `compare` says which base turns are compared one to one (default all), `pages` whether page paths must match.
 */
export function compareRuns(base, variant, { map = base.map((_, i) => i), turns = base.map((_, i) => i), pages = true, ignore = [], end = true } = {}) {
  const out = [];
  for (const i of turns) {
    const j = map[i];
    if (j === undefined || !variant[j]) { out.push(`base turn ${i + 1} has no variant turn`); continue; }
    for (const d of diffTurns(base[i], variant[j], { ignore, pages })) out.push(`turn ${i + 1} "${base[i].say}" vs "${variant[j].say}": ${d}`);
  }
  if (end) {
    const a = outcome(base);
    const b = outcome(variant);
    if (!same(a.book, b.book)) out.push(`the booking ended ${JSON.stringify(a.book)} vs ${JSON.stringify(b.book)}`);
    if (!same(a.booking, b.booking)) out.push(`the booking was left at ${a.booking} vs ${b.booking}`);
    if (pages && a.page !== b.page) out.push(`the page ended on ${a.page} vs ${b.page}`);
  }
  return out;
}

/** MR-5: the same lines in another order. Each line is compared with itself, wherever it sits. */
export function compareReordered(base, variant) {
  const out = [];
  for (const t of base) {
    const u = variant.find((v) => v.say === t.say);
    if (!u) { out.push(`"${t.say}" is missing from the reordered run`); continue; }
    for (const d of diffTurns(t, u, { pages: false })) out.push(`"${t.say}": ${d}`);
  }
  return out;
}

/**
 * MR-6: a line said twice. In mode "same" the second time does what the first did; in mode "keeps" (a request repeated in the
 * middle of the thread it started) the second time changes nothing. Neither restarts a thread.
 */
export function compareRepeat(turns, first, second, mode = 'same') {
  const a = turns[first];
  const b = turns[second];
  if (!a || !b) return ['the run is shorter than the case'];
  const out = mode === 'same' ? diffTurns(a, b, { pages: false }).map((d) => `"${a.say}" said again: ${d}`) : [];
  if (b.flowBefore && b.steps.includes('booking_start')) out.push('the repeat started the booking over');
  if (mode === 'keeps' && !same(b.flowBefore, b.flowAfter)) out.push(`the repeat changed the booking: ${JSON.stringify(b.flowBefore)} -> ${JSON.stringify(b.flowAfter)}`);
  return out;
}
