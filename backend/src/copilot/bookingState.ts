/**
 * Booking a call by voice: the slots the model fills (name, how it is said, email, area) and the order they are confirmed in.
 *
 * The model listens and calls booking_update with what it understood; this code keeps the state (the page carries it between turns,
 * route.ts), says what is missing or must be read back next, and refuses to finish until the name and the email were confirmed by
 * the caller. Nothing here reads a caller's words.
 */
export const CONSULT_SERVICES = ['AI engineering', 'Product design', 'Marketing', 'Full-stack development'] as const;

export type BookingState = { name?: string; say?: string; email?: string; area?: string; nameOk?: boolean; emailOk?: boolean };
export type BookingFlow = { kind: 'booking'; data: BookingState };

const alnum = (c: string) => c.toLowerCase() !== c.toUpperCase() || (c >= '0' && c <= '9');
/** "Pujan" -> "P, U, J, A, N": commas make the voice say the letters, not a word. */
export const spell = (word: string) => Array.from(word).filter(alnum).map((c) => c.toUpperCase()).join(', ');

const COMMON = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'proton.me', 'protonmail.com'];
const MARKS: Record<string, string> = { '.': 'dot', _: 'underscore', '-': 'dash', '+': 'plus' };
/** An address as it is read back: the part before the at sign letter by letter, a well-known domain as words. */
export function sayEmail(email: string): string {
  const [local, domain = ''] = email.split('@');
  const said: string[] = [];
  let run = '';
  for (const c of local) {
    if (MARKS[c]) { if (run) said.push(spell(run)); said.push(MARKS[c]); run = ''; } else run += c;
  }
  if (run) said.push(spell(run));
  const where = COMMON.includes(domain) ? domain.split('.').join(' dot ') : domain.split('.').map(spell).join(', dot, ');
  return `${said.join(', ')}, at ${where}`;
}


/** What the model must do next, decided by the code from what is filled and confirmed. */
export function nextStep(s: BookingState): { next: string; say?: string } {
  if (!s.name) return { next: 'ask_name', say: 'What name should I put it under?' };
  if (!s.nameOk) return { next: 'confirm_name', say: `I heard ${s.name}, spelled ${spell(s.name)}. Is that right?` };
  if (!s.say) return { next: 'ask_pronunciation', say: 'How do you say your name? Say it slowly, a syllable at a time.' };
  if (!s.email) return { next: 'ask_email', say: `What's your email address? Say it slowly, and spell anything unusual.` };
  if (!s.emailOk) return { next: 'confirm_email', say: `I have ${sayEmail(s.email)}. Is that right?` };
  if (!s.area) return { next: 'ask_area', say: 'Which area should the call cover: AI engineering, product design, marketing, or full-stack development?' };
  return { next: 'finish' };
}

/** The state in one line for the model's context ("[Booking in progress: ...]"). */
export function describe(s: BookingState): string {
  const next = nextStep(s);
  const have = [s.name && `name ${s.name}${s.nameOk ? ' (confirmed)' : ''}`, s.say && `said ${s.say}`, s.email && `email ${s.email}${s.emailOk ? ' (confirmed)' : ''}`, s.area && `area ${s.area}`].filter(Boolean).join(', ');
  return `${have || 'nothing yet'}. Next: ${next.next}${next.say ? ` — say: "${next.say}"` : ''}`;
}

/** The booking tools the model is offered this turn: the one for the step the booking is at, and cancel. Nothing else can move it. */
export function bookingTools(flow: BookingFlow | null): string[] {
  if (!flow) return ['booking_start'];
  const byStep: Record<string, string> = {
    ask_name: 'booking_give_name', confirm_name: 'booking_confirm_name', ask_pronunciation: 'booking_give_pronunciation',
    ask_email: 'booking_give_email', confirm_email: 'booking_confirm_email', ask_area: 'booking_give_area',
  };
  return [byStep[nextStep(flow.data).next], 'booking_repeat', 'booking_cancel'];
}
export const ALL_BOOKING_TOOLS = ['booking_start', 'booking_give_name', 'booking_confirm_name', 'booking_give_pronunciation', 'booking_give_email', 'booking_confirm_email', 'booking_give_area', 'booking_repeat', 'booking_cancel'];
