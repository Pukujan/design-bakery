/**
 * Booking a call by voice, as a guided flow: the code owns the steps and the state, a model reads what the caller said at each one.
 *
 * Why (the call of 2026-11-05, 04:49 to 04:57 UTC): the first version read the caller's lines with regex and rebuilt its place from
 * its own earlier sentences. "That's P-U-J-A-N" counted as a yes, a corrected email given instead of a "no" was refused, a re-prompt
 * lost the place so the next "No." went to the model, "Book the call." started over, and "I just told you the name" became the name
 * "Just Told You". Here:
 *
 *   state    explicit: { step, data }. The page carries it from one turn to the next (the request's `flow`, the reply's `flow` event),
 *            so nothing is rebuilt from the conversation and nothing can be lost by wording.
 *   steps    name -> confirm_name -> say -> email -> confirm_email -> area -> one `book` action. The code decides what comes next, what
 *            is said (fixed sentences, spelled letter by letter), and never claims a booking without the action.
 *   reading  one small model call per answer (the interpreter) returns what the line is: an answer, a yes, a no, a correction with the
 *            right value, a cancel, or something else. A cascade (DeepSeek, then Qwen), a fast path for a bare yes/no or a one-word
 *            name, and the regex parsers of booking.ts as the fallback when no model answers.
 *   leaving  a line that is not an answer twice in a row leaves the flow and goes to the normal routing: a real question mid-booking is
 *            answered, not parsed as a name.
 */
import { navigate, norm } from './answers.js';
import { areaOf, CANCEL, NO, parseEmail, parseName, parseSay, parseSpelled, sayEmail, spell, START, YES, type BookingAnswer } from './booking.js';
import { bookingUrl, CONSULT_SERVICES } from './tools.js';

export type BookingStep = 'name' | 'confirm_name' | 'say' | 'email' | 'confirm_email' | 'area';
export type BookingData = { name?: string; say?: string; email?: string; tries?: number };
export type BookingFlow = { kind: 'booking'; step: BookingStep; data: BookingData };
export type Reading = { verdict: 'answer' | 'yes' | 'no' | 'correction' | 'cancel' | 'other'; name?: string; say?: string; email?: string; area?: string };
export type Interpreter = (step: BookingStep, line: string, data: BookingData) => Promise<Reading | null>;
export type BookingTurn = { answer: BookingAnswer | null; flow: BookingFlow | null };

const firstName = (name: string) => name.split(' ')[0] || 'there';

/** What the flow says to ask for each step: also what it repeats when a line was not an answer. */
export function question(flow: BookingFlow): string {
  const { step, data } = flow;
  switch (step) {
    case 'name': return 'What name should I put it under?';
    case 'confirm_name': return `I heard ${data.name}, spelled ${spell((data.name ?? '').replace(/\s+/g, ''))}. Is that right?`;
    case 'say': return 'How do you say your name? Say it slowly, a syllable at a time.';
    case 'email': return `Thanks, ${firstName(data.say ?? data.name ?? '')}. What's your email address? Say it slowly, and spell anything unusual.`;
    case 'confirm_email': return `I have ${sayEmail(data.email ?? '')}. Is that right?`;
    case 'area': return 'Which area should the call cover: AI engineering, product design, marketing, or full-stack development?';
  }
}

const say = (text: string, extra: Partial<BookingAnswer> = {}): BookingAnswer => ({ routine: 'booking:flow', intent: 'book', text, actions: [], ...extra });
const plausibleName = (name?: string): name is string => !!name && /^[A-Za-z][A-Za-z' -]{1,39}$/.test(name.trim()) && name.trim().split(/\s+/).length <= 3;
const plausibleEmail = (email?: string): email is string => !!email && /^[a-z0-9][a-z0-9._%+-]*@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}$/.test(email);
const cap = (name: string) => name.trim().split(/\s+/).map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
const AREAS = CONSULT_SERVICES as readonly string[];

function finish(flow: BookingFlow, area: string, bookingBase: string): BookingAnswer {
  const { name, say: said, email } = flow.data;
  return {
    routine: 'booking:done', intent: 'book',
    text: `Done. The Pick a time button is in the chat now, with ${said ?? name ?? 'your name'} and your email filled in, for ${area}. Tap it to choose a slot.`,
    actions: [{ kind: 'book', url: bookingUrl(bookingBase, { name, email, topic: area }), name, email, topic: area }],
  };
}

/**
 * One turn. `flow` is the state the page sent (null when no booking is under way); the result carries the new state for the page to
 * send back (null when the flow ended or was never started) and the answer (null when this line is not the flow's).
 */
export async function bookingFlow(flow: BookingFlow | null, line: string, deps: { interpret: Interpreter; bookingBase?: string }): Promise<BookingTurn> {
  const base = deps.bookingBase;
  if (!base) return { answer: null, flow: null };
  const q = norm(line);

  if (!flow) {
    if (q.split(' ').length <= 12 && START.test(q) && !CANCEL.test(q)) {
      const next: BookingFlow = { kind: 'booking', step: 'name', data: {} };
      return { answer: say(`Happy to set that up. ${question(next)}`, { actions: [navigate('/contact', 'Contact page')], go: true }), flow: next };
    }
    return { answer: null, flow: null };
  }

  const reading = await deps.interpret(flow.step, line, flow.data);
  const data: BookingData = { ...flow.data };
  const stay = (step: BookingStep, text: string, patch: BookingData = {}): BookingTurn => {
    const next: BookingFlow = { kind: 'booking', step, data: { ...data, ...patch, tries: 0 } };
    return { answer: say(text), flow: next };
  };
  const notAnAnswer = (): BookingTurn => {
    const tries = (flow.data.tries ?? 0) + 1;
    // Twice in a row is enough: this is not the booking's line. It leaves, and the normal routing answers it.
    if (tries >= 2) return { answer: null, flow: null };
    return { answer: say(`Sorry, I didn't catch that. ${question(flow)}`), flow: { ...flow, data: { ...flow.data, tries } } };
  };

  if (!reading) return notAnAnswer();
  if (reading.verdict === 'cancel') return { answer: say('No problem. Say the word whenever you want to book.'), flow: null };
  if (reading.verdict === 'other') return notAnAnswer();

  switch (flow.step) {
    case 'name': {
      if (reading.verdict !== 'answer' && reading.verdict !== 'correction') return notAnAnswer();
      if (!plausibleName(reading.name)) return notAnAnswer();
      const name = cap(reading.name);
      return stay('confirm_name', question({ ...flow, step: 'confirm_name', data: { ...data, name } }), { name });
    }
    case 'confirm_name': {
      if (reading.verdict === 'correction' && plausibleName(reading.name)) {
        const name = cap(reading.name);
        return stay('confirm_name', question({ ...flow, step: 'confirm_name', data: { ...data, name } }), { name });
      }
      if (reading.verdict === 'yes') return stay('say', question({ ...flow, step: 'say', data }));
      if (reading.verdict === 'no') return stay('name', 'Sorry about that. Spell your name for me, letter by letter.', { name: undefined });
      return notAnAnswer();
    }
    case 'say': {
      if (reading.verdict === 'yes') return stay('email', question({ ...flow, step: 'email', data }));
      const said = (reading.say ?? '').trim();
      if (reading.verdict === 'answer' && /^[A-Za-z]+(?:-[A-Za-z]+){0,5}$/.test(said)) return stay('email', question({ ...flow, step: 'email', data: { ...data, say: cap(said) } }), { say: said[0].toUpperCase() + said.slice(1) });
      return notAnAnswer();
    }
    case 'email': {
      if ((reading.verdict === 'answer' || reading.verdict === 'correction') && plausibleEmail(reading.email?.toLowerCase())) {
        const email = reading.email!.toLowerCase();
        return stay('confirm_email', question({ ...flow, step: 'confirm_email', data: { ...data, email } }), { email });
      }
      return notAnAnswer();
    }
    case 'confirm_email': {
      if (reading.verdict === 'correction' && plausibleEmail(reading.email?.toLowerCase())) {
        const email = reading.email!.toLowerCase();
        return stay('confirm_email', question({ ...flow, step: 'confirm_email', data: { ...data, email } }), { email });
      }
      if (reading.verdict === 'yes') {
        const area = AREAS.find((a) => a === reading.area);
        return area ? { answer: finish({ ...flow, data }, area, base), flow: null } : stay('area', question({ ...flow, step: 'area', data }));
      }
      if (reading.verdict === 'no') return stay('email', 'Sorry about that. Say the whole address again, and spell the part before the at sign letter by letter.');
      return notAnAnswer();
    }
    case 'area': {
      const area = AREAS.find((a) => a === reading.area);
      if (reading.verdict === 'answer' && area) return { answer: finish({ ...flow, data }, area, base), flow: null };
      return notAnAnswer();
    }
  }
}

// ---- the regex reader: the fast path for a bare yes/no or one-word name, and the fallback when no model answers

const BARE_YES = new Set(['yes', 'yeah', 'yep', 'yup', 'correct', 'right', 'that is right', 'that s right', 'thats right', 'exactly', 'sure', 'ok', 'okay', 'yes please', 'yes it is', 'yes that is right', 'yes that s right']);
const BARE_NO = new Set(['no', 'nope', 'nah', 'wrong', 'not right', 'that is wrong', 'that s wrong', 'thats wrong', 'no that is wrong', 'no that s wrong']);

/** What a bare yes, a bare no or a single plain word is, without asking a model; null when it needs reading. */
export function fastReading(step: BookingStep, line: string): Reading | null {
  const q = norm(line);
  if (CANCEL.test(q) && !BARE_YES.has(q)) return { verdict: 'cancel' };
  if (step === 'confirm_name' || step === 'confirm_email') {
    if (BARE_YES.has(q)) return { verdict: 'yes' };
    if (BARE_NO.has(q)) return { verdict: 'no' };
  }
  if (step === 'name' && /^[a-z]{2,20}$/.test(q) && !['yes', 'no', 'hello', 'hi', 'what', 'why', 'how', 'um', 'uh', 'hmm', 'okay', 'ok', 'sure'].includes(q)) return { verdict: 'answer', name: q[0].toUpperCase() + q.slice(1) };
  return null;
}

/** The regex parsers as a reader: what the flow does when no model answers. */
export const ruleReader: Interpreter = async (step, line) => {
  const q = norm(line);
  if (CANCEL.test(q) && !YES.test(q)) return { verdict: 'cancel' };
  switch (step) {
    case 'name': {
      const name = parseSpelled(line) ?? (q.split(' ').length <= 6 ? parseName(line) : null);
      return name ? { verdict: 'answer', name } : { verdict: 'other' };
    }
    case 'confirm_name': {
      const spelled = parseSpelled(line);
      if (spelled) return { verdict: 'correction', name: spelled };
      if (NO.test(q)) return { verdict: 'no' };
      return YES.test(q) ? { verdict: 'yes' } : { verdict: 'other' };
    }
    case 'say': {
      const said = parseSay(line, '');
      if (said === '') return { verdict: 'yes' };
      return said ? { verdict: 'answer', say: said } : { verdict: 'other' };
    }
    case 'email': {
      const email = parseEmail(line);
      return email ? { verdict: 'answer', email } : { verdict: 'other' };
    }
    case 'confirm_email': {
      const email = parseEmail(line);
      if (email) return { verdict: 'correction', email };
      if (NO.test(q)) return { verdict: 'no' };
      return YES.test(q) ? { verdict: 'yes', area: areaOf(line) ?? undefined } : { verdict: 'other' };
    }
    case 'area': {
      const area = areaOf(line);
      return area ? { verdict: 'answer', area } : { verdict: 'other' };
    }
  }
};

/** The reader the route uses: the fast path, then `model`, then the regex reader when the model has nothing. */
export function readerWith(model: Interpreter | null): Interpreter {
  return async (step, line, data) => fastReading(step, line) ?? (model ? await model(step, line, data).catch(() => null) : null) ?? ruleReader(step, line, data);
}
