/**
 * The spec's invariants (copilot-spec.md §6), checked on recorded turns from events, thread state and the debug event.
 * None of them reads the reply's wording. Each failure is { id, turn, msg }.
 */
import {
  ACTION_SOURCES, BOOKING_TOOLS, BUTTON_SOURCES, CHAT_ONLY, EMITS_ON_OK, PAGE_MOVERS, VOICE_ONLY,
  bookingStep, bookingToolsFor, countQuestions, endsWholeSentence, endsWithQuestion, same, says,
} from './spec.mjs';

const fail = (id, turn, msg) => ({ id, turn: turn?.i ?? null, msg });

/** The non-booking tools a turn offered, which O-1 says no state may change. not_for_me is left out: O-4 moves it with toMe. */
const steady = (offered) => offered.filter((t) => !BOOKING_TOOLS.includes(t) && t !== 'not_for_me').sort();

/** Checks one turn. `first` is the conversation's first turn with a debug event, whose offer is the baseline for O-1. */
export function checkTurn(t, first) {
  const out = [];
  const offered = t.offered;
  // INV-1: nothing traps the person (O-1 to O-4).
  if (offered) {
    if (first?.offered && !same(steady(offered), steady(first.offered))) {
      const a = steady(first.offered);
      const b = steady(offered);
      out.push(fail('INV-1', t, `the non-booking tools changed with the state: missing [${a.filter((x) => !b.includes(x))}], added [${b.filter((x) => !a.includes(x))}]`));
    }
    const off = t.voice ? CHAT_ONLY : VOICE_ONLY;
    const wrong = offered.filter((x) => off.includes(x));
    if (wrong.length) out.push(fail('INV-1', t, `offered on the wrong channel: [${wrong}]`));
    if (t.voice) {
      const allowed = bookingToolsFor(t.flowBefore);
      const booking = offered.filter((x) => BOOKING_TOOLS.includes(x)).sort();
      // A lane may leave booking out altogether; when it has booking, the offer is exactly O-2's.
      if (booking.length && !same(booking, [...allowed].sort())) {
        out.push(fail('INV-1', t, `booking tools offered [${booking}], O-2 allows [${allowed}] at step ${bookingStep(t.flowBefore) ?? 'none'}`));
      }
      if (t.toMe && offered.includes('not_for_me')) out.push(fail('INV-1', t, 'not_for_me offered on a line the visitor marked "Answer this" (O-4)'));
    }
  }
  // INV-2: a thread whose tools were not called is unchanged.
  if (!t.steps.some((s) => BOOKING_TOOLS.includes(s)) && !same(t.flowBefore, t.flowAfter)) {
    out.push(fail('INV-2', t, `the booking changed without a booking tool: ${JSON.stringify(t.flowBefore)} -> ${JSON.stringify(t.flowAfter)}`));
  }
  if (!t.steps.some((s) => PAGE_MOVERS.includes(s)) && t.pageBefore?.path !== t.pageAfter?.path) {
    out.push(fail('INV-2', t, `the page moved from ${t.pageBefore?.path} to ${t.pageAfter?.path} without a tool that moves it`));
  }
  // INV-3: only tools act.
  for (const a of t.actions) {
    if (!ACTION_SOURCES[a.kind]) continue;
    const sources = [...ACTION_SOURCES[a.kind], ...(a.go ? [] : BUTTON_SOURCES[a.kind] ?? [])];
    if (!t.steps.some((s) => sources.includes(s))) out.push(fail('INV-3', t, `a ${a.kind} action with no tool that makes one (tools [${t.steps}])`));
  }
  // A tool that told the model it acted, acted: otherwise the reply describes a link or a move the page never got.
  for (const r of t.results) {
    const kind = EMITS_ON_OK[r.name];
    if (kind && r.ok === true && !t.actions.some((a) => a.kind === kind)) out.push(fail('INV-3', t, `${r.name} returned ok but no ${kind} action reached the page`));
  }
  const book = t.actions.find((a) => a.kind === 'book');
  if (book && t.voice) {
    const d = t.flowBefore?.data;
    if (!d || !d.name || !d.nameOk || !d.say || !d.email) out.push(fail('INV-3', t, `the booking button came before the name, its spelling, how it is said and the email were all confirmed: ${JSON.stringify(d ?? null)}`));
    else if (t.flowAfter) out.push(fail('INV-3', t, 'the booking button came but the booking stayed open'));
    for (const k of ['name', 'email', 'topic']) if (!book[k]) out.push(fail('INV-3', t, `the booking button has no ${k}`));
  }
  // INV-5: within the lane's step limit.
  if (t.maxSteps !== null && t.steps.length > t.maxSteps) out.push(fail('INV-5', t, `${t.steps.length} tool steps, over the lane's ${t.maxSteps}`));
  // INV-6: a page summary points at each passage it speaks.
  for (const r of t.results) {
    if (r.name !== 'summarize_page' || !r.ok || !r.passages) continue;
    const cites = t.actions.filter((a) => a.kind === 'cite').length;
    if (cites < r.passages) out.push(fail('INV-6', t, `summarize_page returned ${r.passages} passages but ${cites} were pointed at`));
  }
  // INV-7: quiet when not addressed, and only through not_for_me.
  if (t.ignored && t.text.trim()) out.push(fail('INV-7', t, `the line was ignored but the reply said "${t.text.slice(0, 80)}"`));
  if (t.ignored && !t.steps.includes('not_for_me')) out.push(fail('INV-7', t, 'the line was ignored without not_for_me'));
  if (t.ignored && t.toMe) out.push(fail('INV-7', t, 'a line the visitor marked "Answer this" was ignored'));
  // INV-8 (per reply): at most one question.
  if (countQuestions(t.text) > 1) out.push(fail('INV-8', t, `${countQuestions(t.text)} questions in one reply: "${t.text.slice(0, 140)}"`));
  // INV-9: a reply cut off by the token limit is pulled back to a whole sentence.
  if (t.truncated && t.text.trim() && !endsWholeSentence(t.text)) out.push(fail('INV-9', t, `cut off and not ended on a whole sentence: "…${t.text.slice(-60)}"`));
  // INV-10: a chat reply leaves something to press. Where the lane offers suggest_followups, every answer has follow-up questions.
  const canButton = !t.offered || t.offered.includes('suggest_followups');
  if (!t.voice && canButton && !t.ignored && t.text.trim() && !t.actions.some((a) => a.kind === 'ask')) {
    out.push(fail('INV-10', t, `a chat reply with no follow-up buttons (tools [${t.steps}], actions [${t.actions.map((a) => a.kind)}])`));
  }
  // §7, exact: a turn that called a booking tool says that tool's line.
  const lines = t.results.filter((r) => BOOKING_TOOLS.includes(r.name) && r.ok !== false && r.say);
  const line = lines.at(-1)?.say;
  if (line && !says(t.text, line)) out.push(fail('EX-1', t, `the booking line was not said as given: wanted "${line}", said "${t.text.slice(0, 160)}"`));
  return out;
}

/** Checks a whole visit (INV-8's share of replies ending in a question). Booking steps must ask, so they do not count. */
export function checkVisit(turns, { maxQuestionTurns } = {}) {
  const counted = turns.filter((t) => !t.ignored && !t.steps.some((s) => BOOKING_TOOLS.includes(s)));
  const asked = counted.filter((t) => endsWithQuestion(t.text)).length;
  const limit = maxQuestionTurns ?? Math.max(1, Math.round(counted.length * 0.3));
  return asked > limit ? [fail('INV-8', null, `${asked} of ${counted.length} replies ended in a question, over ${limit}`)] : [];
}

/** Every invariant over a conversation. */
export function checkConversation(turns, options) {
  const first = turns.find((t) => t.offered);
  return [...turns.flatMap((t) => checkTurn(t, first)), ...checkVisit(turns, options)];
}
