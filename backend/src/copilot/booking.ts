/**
 * The words of a voice booking: how a name, how it is said, an email and an area are read from speech, and how they are spelled back.
 * The dialogue itself (its steps, its explicit state and the model that reads each answer) is bookingFlow.ts; these parsers are its
 * fallback when no model answers, and its helpers. First written as a fixed dialogue (2026-11-05, TASK-DB-0137).
 */
import { norm, type CachedAction } from './answers.js';
import { CONSULT_SERVICES } from './tools.js';

export type BookingAnswer = { routine: string; intent: string; text: string; actions: CachedAction[]; go?: boolean };

export const START = /\b(book|schedule|arrange|set up|make)\b.{0,30}\b(call|consultation|consult|meeting|appointment|session|time)\b|\bbook (it|me|one|a call|the call|that)\b/;
export const CANCEL = /\b(never ?mind|cancel|forget it|stop|not now|no thanks|no thank you)\b/;
export const YES = /^(?:(?:yes|yeah|yep|yup|sure|ok|okay|correct|right|exactly|that is|that s|thats)\b.*|(?:it is|it s) (?:right|correct))$/;
export const NO = /^(?:no|nope|nah|wrong|incorrect|not (?:quite|right|really)|that is wrong|that s wrong|thats wrong)\b/;

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
  // "That's P-U-J-A-N": the "s" of the contraction is not a letter of the name.
  const tokens = text.toLowerCase().replace(/\b(?:that|it|here|this)['’]s\b|\bthats\b/g, ' ').replace(/[^a-z]+/g, ' ').trim().split(' ').filter(Boolean);
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
  // "one five oh four": an "oh" between or beside digits is a zero.
  const isDigit = (t?: string) => !!t && /^\d+$/.test(t);
  tokens.forEach((t, i) => { if (t === 'oh' && (isDigit(tokens[i - 1]) || isDigit(tokens[i + 1]))) tokens[i] = '0'; });
  // A word said and then spelled ("Teresa, T E R E S A G U A J A R D O"): the letters are the address, the spoken word its start.
  for (let i = 0; i < tokens.length; i += 1) {
    if (!/^[a-z]$/.test(tokens[i]) || (i > 0 && /^[a-z]$/.test(tokens[i - 1]))) continue;
    let j = i;
    while (j < tokens.length && /^[a-z]$/.test(tokens[j])) j += 1;
    const run = tokens.slice(i, j).join('');
    const before = tokens[i - 1];
    if (j - i >= 3 && before && /^[a-z]{3,}$/.test(before) && run.startsWith(before)) tokens.splice(i - 1, 1);
  }
  while (tokens.length && FILLER.has(tokens[0])) tokens.shift();
  let out = '';
  for (const token of tokens) {
    out += token;
    if (out.includes('@') && TLD_END.test(out)) break;
  }
  return /^[a-z0-9][a-z0-9._%+-]*@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}$/.test(out) ? out : null;
}

/** "Poojan" -> "P, O, O, J, A, N": commas make the voice say the letters, not a word. */
export const spell = (word: string) => word.replace(/[^a-z0-9]/gi, '').toUpperCase().split('').join(', ');
const COMMON_DOMAINS = new Set(['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'proton.me', 'protonmail.com']);
/** An address as it is read back: the part before the at sign letter by letter, a well-known domain as words. */
export function sayEmail(email: string): string {
  const [local, domain] = email.split('@');
  const mark: Record<string, string> = { '.': 'dot', _: 'underscore', '-': 'dash', '+': 'plus' };
  const localSaid = local.split(/([._+-])/).filter(Boolean).map((part) => (mark[part] ?? spell(part))).join(', ');
  return `${localSaid}, at ${COMMON_DOMAINS.has(domain) ? domain.replace('.', ' dot ') : domain.split('.').map(spell).join(', dot, ')}`;
}

export function areaOf(text: string): (typeof CONSULT_SERVICES)[number] | null {
  const q = norm(text);
  if (/\b(ai|a i|engineering|machine learning|ml)\b/.test(q) && !/\bfull stack\b/.test(q)) return 'AI engineering';
  if (/\b(product|design|designer)\b/.test(q)) return 'Product design';
  if (/\b(market|marketing)\b/.test(q)) return 'Marketing';
  if (/\b(full ?stack|developer|development|web)\b/.test(q)) return 'Full-stack development';
  return null;
}
