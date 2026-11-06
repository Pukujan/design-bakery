/**
 * A scenario step's own expectations: what this line should do, on top of the invariants that hold for every line.
 * All of them read actions, tools, thread state, timing or length. Wording is checked only by the exact booking line (EX-1,
 * in invariants.mjs) or by the judge (`judge`), never by a pattern: the old regex keys are refused (copilot-spec.md §7).
 */
import { bookingStep, endsWithQuestion } from './spec.mjs';

const REFUSED = ['textMatch', 'textNotMatch', 'spells', 'asksToConfirm', 'firstReplyMatches'];

/** Refuses a scenario that still carries a regex wording check, so a check is never silently skipped. */
export function validateScenario(scenario, file = scenario.name) {
  const bad = [];
  for (const [i, step] of (scenario.steps ?? []).entries()) {
    for (const k of Object.keys(step.expect ?? {})) if (REFUSED.includes(k)) bad.push(`step ${i + 1}: ${k}`);
  }
  for (const k of Object.keys(scenario.rubric ?? {})) if (REFUSED.includes(k)) bad.push(`rubric: ${k}`);
  if (bad.length) throw new Error(`${file} matches reply wording (${bad.join(', ')}); use state checks, the exact booking line or the judge instead (copilot-spec.md §7)`);
}

/** The judge ids a step asks for, with any detail for this turn: `["J-1"]` or `{ "J-4": "names Precedent" }`. */
export function judgeAsks(step) {
  const j = step.expect?.judge;
  if (!j) return {};
  if (Array.isArray(j)) return Object.fromEntries(j.map((id) => [id, '']));
  return { ...j };
}

const fail = (turn, msg) => ({ id: 'STEP', turn: turn.i, msg });

/** Checks one recorded turn against its step's `expect`. */
export function checkStep(step, t) {
  const e = step.expect ?? {};
  const out = [];
  for (const m of t.errors) out.push({ id: 'RUN', turn: t.i, msg: m });
  if (t.ignored && !step.expectIgnored) out.push(fail(t, 'the line was dropped as said to someone else'));
  if (step.expectIgnored && !t.ignored) out.push(fail(t, 'the line should have been taken as said to someone else'));
  const kinds = t.actions.map((a) => a.kind);
  if (e.actions) {
    let i = 0;
    for (const k of kinds) if (k === e.actions[i]) i += 1;
    if (i < e.actions.length) out.push(fail(t, `expected actions in order [${e.actions}], got [${kinds}]`));
  }
  for (const k of e.noActions ?? []) if (kinds.includes(k)) out.push(fail(t, `must not emit a ${k} action, got [${kinds}]`));
  for (const [k, max] of Object.entries(e.maxActions ?? {})) if (kinds.filter((x) => x === k).length > max) out.push(fail(t, `more than ${max} ${k} action(s): [${kinds}]`));
  if (e.navigatesTo && !t.actions.some((a) => a.kind === 'navigate' && a.path === e.navigatesTo && a.go)) {
    out.push(fail(t, `expected a moving navigate to ${e.navigatesTo}, got ${JSON.stringify(t.actions.filter((a) => a.kind === 'navigate').map((a) => [a.path, a.go]))}`));
  }
  if (e.book) {
    const b = t.actions.find((a) => a.kind === 'book');
    if (!b) out.push(fail(t, 'expected a book action'));
    // INV-4: heard as said. The booking's fields are what the caller said or spelled, with the last correction winning.
    else for (const [k, v] of Object.entries(e.book)) if (String(b[k] ?? '').toLowerCase() !== String(v).toLowerCase()) out.push({ id: 'INV-4', turn: t.i, msg: `book.${k} should be ${v}, got ${b[k]}` });
  }
  if (e.booking) {
    const now = t.flowAfter ? bookingStep(t.flowAfter) : 'closed';
    if (e.booking.step && now !== e.booking.step) out.push(fail(t, `the booking should be at ${e.booking.step}, is at ${now}`));
    for (const [k, v] of Object.entries(e.booking.has ?? {})) {
      const got = t.flowAfter?.data?.[k];
      if (String(got ?? '').toLowerCase() !== String(v).toLowerCase()) out.push({ id: 'INV-4', turn: t.i, msg: `the booking's ${k} should be ${v}, is ${got ?? 'unset'}` });
    }
  }
  if (e.maxSteps !== undefined && t.steps.length > e.maxSteps) out.push(fail(t, `${t.steps.length} tool steps, over ${e.maxSteps}: [${t.steps}]`));
  for (const name of e.tools ?? []) if (!t.steps.includes(name)) out.push(fail(t, `expected the ${name} tool, steps [${t.steps}]`));
  for (const name of e.noTools ?? []) if (t.steps.includes(name)) out.push(fail(t, `must not use the ${name} tool, steps [${t.steps}]`));
  // A tool that went through (ok), as opposed to one the code refused: a refused send is not a sent message.
  const went = (name) => t.results.some((r) => r.name === name && r.ok === true);
  for (const name of e.done ?? []) if (!went(name)) out.push(fail(t, `expected ${name} to go through, results ${JSON.stringify(t.results)}`));
  for (const name of e.notDone ?? []) if (went(name)) out.push(fail(t, `${name} must not go through on this turn`));
  for (const [name, max] of Object.entries(e.maxTool ?? {})) if (t.steps.filter((x) => x === name).length > max) out.push(fail(t, `${name} used more than ${max} time(s): [${t.steps}]`));
  if (e.minChars && t.text.trim().length < e.minChars) out.push(fail(t, `reply too short (${t.text.trim().length} chars, wanted ${e.minChars}): "${t.text.trim()}"`));
  if (e.noQuestionEnd && endsWithQuestion(t.text)) out.push(fail(t, `reply should not end with a question: "${t.text.slice(-100)}"`));
  if (e.maxMs && t.ms > e.maxMs) out.push(fail(t, `took ${t.ms} ms, over ${e.maxMs}`));
  if (e.pageAfter && t.pageAfter.path !== e.pageAfter) out.push(fail(t, `page after the turn should be ${e.pageAfter}, is ${t.pageAfter.path}`));
  return out;
}

/** The scenario's visit checks that are not invariants: proof shown early, time per turn, no reply repeated word for word. */
export function checkRubric(rubric = {}, turns) {
  const out = [];
  const visit = (msg) => out.push({ id: 'VISIT', turn: null, msg });
  if (rubric.proofWithin) {
    const at = turns.findIndex((t) => t.actions.some((a) => ['navigate', 'cite', 'projects', 'book'].includes(a.kind)));
    if (at < 0 || at + 1 > rubric.proofWithin) visit(`nothing shown (a page, cards or a passage) within the first ${rubric.proofWithin} turns${at >= 0 ? ` (first at turn ${at + 1})` : ''}`);
  }
  if (rubric.maxTurnMs) for (const t of turns) if (t.ms > rubric.maxTurnMs) visit(`turn ${t.i} took ${t.ms} ms, over ${rubric.maxTurnMs}`);
  if (rubric.noRepeatedReplies) {
    const texts = turns.map((t) => t.text.trim().toLowerCase());
    texts.forEach((x, i) => { if (x.length > 25 && texts.indexOf(x) !== i) visit(`turn ${i + 1} repeats an earlier reply word for word`); });
  }
  return out;
}
