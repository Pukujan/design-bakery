/**
 * What the spec (additionals/doc/copilot-spec.md) says about tools, threads and actions, written down here on its own rather
 * than imported from the backend: a test that reuses the code's own rules cannot catch the code breaking them.
 */

export const BOOKING_TOOLS = [
  'booking_start', 'booking_give_name', 'booking_confirm_name', 'booking_give_pronunciation',
  'booking_give_email', 'booking_confirm_email', 'booking_give_area', 'booking_repeat', 'booking_cancel',
];

/** Offered only on a call (§5), and only in the chat. */
export const VOICE_ONLY = [...BOOKING_TOOLS, 'not_for_me'];
export const CHAT_ONLY = ['suggest_followups', 'book_call'];

/** Tools that only read: they move no thread and show nothing, so two runs may differ in them and still agree (§8). */
export const READ_ONLY = ['search_site', 'read_paper', 'read_blog', 'outline_passages', 'search_passages'];

/** Which tools may produce each kind of action (INV-3). */
export const ACTION_SOURCES = {
  navigate: ['navigate', 'step_list', 'tour_next', 'tour_start', 'tour_back', 'tour_skip', 'tour_resume', 'booking_start'],
  cite: ['cite_section', 'summarize_page', 'speak_summary'],
  projects: ['show_projects'],
  link: ['share_link'],
  ask: ['suggest_followups'],
  book: ['booking_give_name', 'booking_confirm_name', 'booking_give_pronunciation', 'booking_give_email', 'booking_confirm_email', 'booking_give_area', 'book_call'],
};

/** Tools that, when they return ok, have sent the page this kind of action (INV-3: what a tool says it did reached the page). */
/** A navigate action without `go` is a button that opens the page only when pressed: in a chat, suggest_followups makes those (INV-3). */
export const BUTTON_SOURCES = { navigate: ['suggest_followups'] };

export const EMITS_ON_OK = { share_link: 'link', step_list: 'navigate', tour_next: 'navigate' };

/** Tools that may move the page thread (§4). */
export const PAGE_MOVERS = [...new Set([...ACTION_SOURCES.navigate, ...ACTION_SOURCES.cite])];

/** The booking's steps in the spec's order, each with the one tool that answers it (§4, O-2). */
const BOOKING_ORDER = [
  ['ask_name', (d) => !d.name, 'booking_give_name'],
  ['confirm_name', (d) => !d.nameOk, 'booking_confirm_name'],
  ['ask_pronunciation', (d) => !d.say, 'booking_give_pronunciation'],
  ['ask_email', (d) => !d.email, 'booking_give_email'],
  ['confirm_email', (d) => !d.emailOk, 'booking_confirm_email'],
  ['ask_area', (d) => !d.area, 'booking_give_area'],
];

/** The step a booking is on, or 'finish' when everything is given and confirmed. */
export function bookingStep(flow) {
  if (!flow) return null;
  const data = flow.data ?? {};
  for (const [name, open] of BOOKING_ORDER) if (open(data)) return name;
  return 'finish';
}

/** The booking tools O-2 allows for a booking state. */
export function bookingToolsFor(flow) {
  if (!flow) return ['booking_start'];
  const step = bookingStep(flow);
  const tool = BOOKING_ORDER.find(([name]) => name === step)?.[2];
  return [...(tool ? [tool] : []), 'booking_repeat', 'booking_cancel'];
}

/** Lower case, letters and digits only, single spaces: two lines that differ only in punctuation or spacing compare equal. */
export function plain(text) {
  let out = '';
  let space = false;
  for (const ch of String(text ?? '').toLowerCase()) {
    const keep = (ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9') || ch.toLowerCase() !== ch.toUpperCase();
    if (keep) {
      if (space && out) out += ' ';
      out += ch;
      space = false;
    } else space = true;
  }
  return out;
}

/** Whether `text` says `line`, ignoring case, punctuation and spacing. */
export const says = (text, line) => plain(text).includes(plain(line));

export function endsWithQuestion(text) {
  const t = String(text ?? '').trim();
  let i = t.length - 1;
  // A closing quote or bracket after the question mark still ends the reply on a question.
  while (i >= 0 && ['"', "'", ')', '”', '’'].includes(t[i])) i -= 1;
  return i >= 0 && t[i] === '?';
}

export const countQuestions = (text) => Array.from(String(text ?? '')).filter((c) => c === '?').length;

export function endsWholeSentence(text) {
  const t = String(text ?? '').trim();
  let i = t.length - 1;
  while (i >= 0 && ['"', "'", ')', '”', '’'].includes(t[i])) i -= 1;
  return i >= 0 && ['.', '!', '?', '…'].includes(t[i]);
}

/** Deep equality for plain JSON values (thread state). */
export function same(a, b) {
  return JSON.stringify(sortKeys(a ?? null)) === JSON.stringify(sortKeys(b ?? null));
}
function sortKeys(v) {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === 'object') {
    const out = {};
    for (const k of Object.keys(v).sort()) if (v[k] !== undefined) out[k] = sortKeys(v[k]);
    return out;
  }
  return v;
}
