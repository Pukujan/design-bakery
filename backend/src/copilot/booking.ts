/**
 * Booking a call by voice, as a fixed dialogue instead of the model's judgement (2026-11-05, TASK-DB-0137).
 *
 * On the call of that day the model took "Fo John" for a name and wrote it down unchecked, heard "Poojan three six four five at gmail
 * dot com" and never read it back, said "the booking card is up" three times without calling the tool (and once calling it with
 * nothing in it), and called it on a page that could not show it. Speech recognition mishears names and addresses, so the dialogue
 * checks each one with the caller: it spells what it heard and waits for a yes, and a no asks for the letters.
 *
 *   start      "book the call" -> go to the Contact page, ask the name
 *   name       a few words -> spell it back, ask if it is right      (a no asks for the letters, then spells it back again)
 *   say        how the caller says it, a syllable at a time -> used for the rest of the call ("fine as spelled" keeps it)
 *   email      spoken or spelled -> spell it back, ask if it is right (the same)
 *   area       which of the four -> exactly one `book` action carrying the confirmed name and email
 *
 * The state is rebuilt each turn from the conversation itself: every line the dialogue says is recognisable, so nothing is stored.
 * A line it cannot make sense of returns null and the model has it. Voice calls only; a text chat has its own form.
 */
import { navigate, norm, type CachedAction } from './answers.js';
import { bookingUrl, CONSULT_SERVICES } from './tools.js';

type Message = { role: 'user' | 'assistant'; content: string };
export type BookingAnswer = { routine: string; intent: string; text: string; actions: CachedAction[]; go?: boolean };

const START = /\b(book|schedule|arrange|set up|make)\b.{0,30}\b(call|consultation|consult|meeting|appointment|session|time)\b|\bbook (it|me|one|a call|the call|that)\b/;
const CANCEL = /\b(never ?mind|cancel|forget it|stop|not now|no thanks|no thank you)\b/;
const YES = /^(?:(?:yes|yeah|yep|yup|sure|ok|okay|correct|right|exactly|that is|that s|thats)\b.*|(?:it is|it s) (?:right|correct))$/;
const NO = /^(?:no|nope|nah|wrong|incorrect|not (?:quite|right|really)|that is wrong|that s wrong|thats wrong)\b/;

// What the dialogue says, kept in one place: the same phrases are how a later turn knows where the conversation is.
const SAYS = {
  askName: 'Happy to set that up. What name should I put it under?',
  spellName: 'Sorry about that. Spell your name for me, letter by letter.',
  askSay: 'How do you say your name? Say it slowly, a syllable at a time.',
  askEmail: (name: string) => `Thanks, ${name}. What's your email address? Say it slowly, and spell anything unusual.`,
  spellEmail: 'Sorry about that. Say the whole address again, and spell the part before the at sign letter by letter.',
  askArea: 'Which area should the call cover: AI engineering, product design, marketing, or full-stack development?',
  again: (what: string) => `I did not catch that. ${what}`,
  cancelled: 'No problem. Say the word whenever you want to book.',
};
const ID = {
  askName: /What name should I put it under\?/,
  spellName: /Spell your name for me, letter by letter\./,
  confirmName: /I heard .+?, spelled .+?\. Is that right\?/,
  askSay: /How do you say your name\? Say it slowly/,
  askEmail: /What's your email address\? Say it slowly/,
  spellEmail: /Say the whole address again, and spell the part before the at sign/,
  confirmEmail: /I have .+?\. Is that right\?/,
  askArea: /Which area should the call cover/,
};

const DIGITS: Record<string, string> = { zero: '0', one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9' };
const FILLER = new Set('my name is it its it\'s the um uh er ah ok okay so yes yeah yep sure and thats that\'s call me i am im i\'m this for hi hello please email address'.split(' '));
const TLDS = 'com net org edu gov io co dev ai app me us uk info biz ca au de in np';
const TLD_END = new RegExp(`\\.(?:${TLDS.split(' ').join('|')})$`);

/** "Poojan." / "my name is poojan bajracharya" -> "Poojan Bajracharya"; null when it is not a plausible name. */
export function parseName(text: string): string | null {
  const words = text.toLowerCase().replace(/[^a-z' -]/g, ' ').split(/\s+/).filter((w) => w && !FILLER.has(w));
  if (!words.length || words.length > 3) return null;
  return words.map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
}

const KEEP_AS_IS = /\b(fine|as spelled|as it is spelled|same|normal|the way you said|that is right|that s right|the way it looks|doesn t matter|skip|nothing special|just say it)\b/;

/**
 * How the caller says their name, from the syllables they give ("poo jun", "Poo-jun", "it's pronounced poo jahn") as "Poo-jun", the form
 * the voice reads. "As spelled" and the like keep the name as it is (the returned value is then the plain name); null when the answer
 * is not a few short syllables.
 */
export function parseSay(text: string, name: string): string | null {
  const q = norm(text);
  if (KEEP_AS_IS.test(q)) return name;
  const syllables = q.replace(/\b(it s|it is|its|pronounced|say|said|i say|you say|like|sounds like|the|is|um+|uh+|er+m?|hmm+|ah+|oh|well|so|okay|ok|yeah|yes)\b/g, ' ').split(/\s+/).filter(Boolean);
  if (!syllables.length || syllables.length > 6 || syllables.some((w) => w.length > 8 || !/^[a-z]+$/.test(w))) return null;
  const joined = syllables.join('-');
  return joined[0].toUpperCase() + joined.slice(1);
}

/** "p u j a n", "P-U-J-A-N" or "P, U, J, A, N" -> "Pujan"; null when it is not a run of single letters. */
export function parseSpelled(text: string): string | null {
  const tokens = text.toLowerCase().replace(/[^a-z]+/g, ' ').trim().split(' ').filter(Boolean);
  const letters = tokens.filter((t) => t.length === 1);
  if (letters.length < 2 || letters.length < tokens.length - 1) return null;
  const word = letters.join('');
  return word[0].toUpperCase() + word.slice(1);
}

/** "poojan three six four five at gmail dot com" -> "poojan3645@gmail.com"; null when it does not make an address. */
export function parseEmail(text: string): string | null {
  const tokens = text.toLowerCase().replace(/[,;]/g, ' ')
    .replace(/\bat sign\b/g, '@').replace(/\bat\b/g, '@').replace(/\b(?:dot|period|point)\b/g, '.')
    .replace(/\bunderscore\b/g, '_').replace(/\b(?:dash|hyphen|minus)\b/g, '-').replace(/\bplus\b/g, '+')
    .replace(/\b(zero|one|two|three|four|five|six|seven|eight|nine)\b/g, (d) => DIGITS[d])
    .replace(/([@.])/g, ' $1 ').split(/\s+/).filter(Boolean);
  while (tokens.length && FILLER.has(tokens[0])) tokens.shift();
  let out = '';
  for (const token of tokens) {
    out += token;
    if (out.includes('@') && TLD_END.test(out)) break;
  }
  return /^[a-z0-9][a-z0-9._%+-]*@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}$/.test(out) ? out : null;
}

/** "Poojan" -> "P, O, O, J, A, N": commas make the voice say the letters, not a word. */
const spell = (word: string) => word.replace(/[^a-z0-9]/gi, '').toUpperCase().split('').join(', ');
const COMMON_DOMAINS = new Set(['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'proton.me', 'protonmail.com']);
/** An address as it is read back: the part before the at sign letter by letter, a well-known domain as words. */
export function sayEmail(email: string): string {
  const [local, domain] = email.split('@');
  const mark: Record<string, string> = { '.': 'dot', _: 'underscore', '-': 'dash', '+': 'plus' };
  const localSaid = local.split(/([._+-])/).filter(Boolean).map((part) => (mark[part] ?? spell(part))).join(', ');
  return `${localSaid}, at ${COMMON_DOMAINS.has(domain) ? domain.replace('.', ' dot ') : domain.split('.').map(spell).join(', dot, ')}`;
}

function areaOf(text: string): (typeof CONSULT_SERVICES)[number] | null {
  const q = norm(text);
  if (/\b(ai|a i|engineering|machine learning|ml)\b/.test(q) && !/\bfull stack\b/.test(q)) return 'AI engineering';
  if (/\b(product|design|designer)\b/.test(q)) return 'Product design';
  if (/\b(market|marketing)\b/.test(q)) return 'Marketing';
  if (/\b(full ?stack|developer|development|web)\b/.test(q)) return 'Full-stack development';
  return null;
}

/** What the dialogue last said, as a stage; undefined when the last assistant line is not one of its own. */
function stageOf(assistant: string | undefined): keyof typeof ID | undefined {
  if (!assistant) return undefined;
  return (Object.keys(ID) as Array<keyof typeof ID>).find((k) => ID[k].test(assistant));
}

type Data = { name?: string; say?: string; email?: string; nameOk?: boolean; emailOk?: boolean };

/**
 * The next thing the dialogue says, or null when this line is not part of it. `messages` ends with the caller's line;
 * `bookingBase` is COPILOT_BOOKING_URL (without it there is nothing to book into, so the dialogue does not start).
 */
export function bookingTurn(messages: Message[], bookingBase: string | undefined): BookingAnswer | null {
  if (!bookingBase || messages.at(-1)?.role !== 'user') return null;
  const last = messages.at(-1)!.content;
  const q = norm(last);
  const say = (text: string, extra: Partial<BookingAnswer> = {}): BookingAnswer => ({ routine: 'booking:dialogue', intent: 'book', text, actions: [], ...extra });

  // Where the dialogue is: the flow starts at the last time it asked for a name, and its data is rebuilt from there.
  let startAt = -1;
  for (let i = messages.length - 2; i >= 0; i -= 1) if (messages[i].role === 'assistant' && ID.askName.test(messages[i].content)) { startAt = i; break; }
  const prior = messages.at(-2)?.role === 'assistant' ? messages.at(-2)!.content : undefined;
  const stage = startAt >= 0 ? stageOf(prior) : undefined;

  if (!stage) {
    if (q.split(' ').length <= 12 && START.test(q) && !CANCEL.test(q)) {
      return say(SAYS.askName, { actions: [navigate('/contact', 'Contact page')], go: true });
    }
    return null;
  }
  if (CANCEL.test(q) && !YES.test(q)) return say(SAYS.cancelled);

  // The data so far: each earlier answer of the caller's, read with the stage that asked for it.
  const data: Data = {};
  for (let i = startAt + 1; i < messages.length - 1; i += 1) {
    const m = messages[i];
    if (m.role !== 'user') continue;
    const asked = stageOf(messages[i - 1]?.content);
    if (asked === 'askName') data.name = parseName(m.content) ?? data.name;
    else if (asked === 'spellName') data.name = parseSpelled(m.content) ?? parseName(m.content) ?? data.name;
    else if (asked === 'askSay') data.say = parseSay(m.content, data.name ?? '') ?? data.say;
    else if (asked === 'askEmail' || asked === 'spellEmail') data.email = parseEmail(m.content) ?? data.email;
    else if (asked === 'confirmName') data.nameOk = YES.test(norm(m.content)) ? true : NO.test(norm(m.content)) ? false : data.nameOk;
    else if (asked === 'confirmEmail') data.emailOk = YES.test(norm(m.content)) ? true : NO.test(norm(m.content)) ? false : data.emailOk;
  }

  switch (stage) {
    case 'askName':
    case 'spellName': {
      const name = stage === 'spellName' ? (parseSpelled(last) ?? parseName(last)) : parseName(last);
      if (!name) return say(SAYS.again(stage === 'spellName' ? SAYS.spellName : SAYS.askName));
      return say(`I heard ${name}, spelled ${spell(name.replace(/\s+/g, ''))}. Is that right?`);
    }
    case 'confirmName': {
      if (YES.test(q)) return say(SAYS.askSay);
      if (NO.test(q)) return say(SAYS.spellName);
      return say(SAYS.again(`I heard ${data.name ?? 'a name'}. Is that right, yes or no?`));
    }
    case 'askSay': {
      const said = parseSay(last, data.name ?? '');
      // Twice unclear is enough: the name is used as it is written and the dialogue goes on.
      const asked = messages.filter((m) => m.role === 'assistant' && ID.askSay.test(m.content)).length;
      if (!said && asked < 2) return say(SAYS.again(SAYS.askSay));
      return say(SAYS.askEmail(firstName(said ?? data.name ?? '')));
    }
    case 'askEmail':
    case 'spellEmail': {
      const email = parseEmail(last);
      if (!email) return say(SAYS.again(stage === 'spellEmail' ? SAYS.spellEmail : "Say your email address again, slowly, with 'at' and 'dot'."));
      return say(`I have ${sayEmail(email)}. Is that right?`);
    }
    case 'confirmEmail': {
      if (YES.test(q)) {
        const area = areaOf(last);
        return area ? finish(data, area, bookingBase) : say(SAYS.askArea);
      }
      if (NO.test(q)) return say(SAYS.spellEmail);
      return say(SAYS.again('Is the email address right, yes or no?'));
    }
    case 'askArea': {
      const area = areaOf(last);
      return area ? finish(data, area, bookingBase) : say(SAYS.again(SAYS.askArea));
    }
  }
}

/** The first word of a name as the voice should say it: "Poo-jun Bajracharya" -> "Poo-jun". */
const firstName = (name: string) => name.split(' ')[0] || 'there';

function finish(data: Data, area: (typeof CONSULT_SERVICES)[number], bookingBase: string): BookingAnswer {
  const topic = area;
  return {
    routine: 'booking:done', intent: 'book',
    text: `Done. The Pick a time button is in the chat now, with ${data.say ?? data.name ?? 'your name'} and your email filled in, for ${area}. Tap it to choose a slot.`,
    actions: [{ kind: 'book', url: bookingUrl(bookingBase, { name: data.name, email: data.email, topic }), name: data.name, email: data.email, topic }],
  };
}
