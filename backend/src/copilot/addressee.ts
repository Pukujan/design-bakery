/**
 * On a call, was this line said to me? The microphone is open in the visitor's room. voice-agent/ drops what the sound alone
 * gives away before a line gets here: another person's voice, my own voice heard back, a short mumble the recogniser was
 * unsure of. What sound cannot tell is the visitor themself turning to someone else ("Hey Campos, can you grab me a
 * coffee?"). Such a line calls someone by a name that is not mine, so only a line that does is asked about, with one small
 * yes/no question; every other line is answered without one. On any doubt (an error, a slow model, an unclear answer) the
 * line is answered: a wrong reply costs less than a visitor ignored.
 */

/** Capitalised words at the start or end of a line that are not names. */
const NOT_NAMES = new Set(
  ('okay ok sorry yes yeah yep no nope well so thanks thank please hello hey hi wait cool great nice sure right alright oh wow ' +
    'also and but what why how when where who which can could would should will do does did is are was tell show give let ' +
    'man dude bro buddy mate guys folks everyone everybody friend sir god jesus lord seriously honestly actually really ' +
    'interesting true exactly perfect awesome fine good hmm huh anyway again there here then now today yesterday tomorrow')
    .split(' '),
);
/** How a recogniser may spell my name (Parakeet heard "Pujan" as these). */
const MY_NAMES = new Set(['ai', 'pujan', 'poojan', 'pujon', 'puja', 'pooja', 'bujan', 'bhujan', 'pushan']);

const GREETING = /^(?:hey|hi|hello|yo|oi|okay|ok|thanks|thank you|sorry|excuse me|listen)\b[\s,]*/i;
/** "Campos! …", "Campos, …" (or after a greeting, "Hey Campos can you …" with no comma) */
const LEADING = /^([A-Z][a-z]{2,})\s*[,!?.]/;
const LEADING_AFTER_GREETING = /^([A-Z][a-z]{2,})\b/;
/** "…, Campos?" */
const TRAILING = /,\s*([A-Z][a-z]{2,})\s*[?!.]*$/;

/** The name the line calls someone by, when it is not mine; null for a line that names no one. */
export function otherName(line: string): string | null {
  const text = line.trim();
  const rest = text.replace(GREETING, '');
  const greeted = rest !== text;
  const found = [(greeted ? LEADING_AFTER_GREETING : LEADING).exec(rest)?.[1], TRAILING.exec(text)?.[1]];
  for (const name of found) {
    const lower = name?.toLowerCase();
    if (lower && !NOT_NAMES.has(lower) && !MY_NAMES.has(lower)) return name!;
  }
  return null;
}

/** The yes/no question. `before` is what I said last (the line may answer it). */
export function addresseePrompt(line: string, name: string, before?: string): string {
  return [
    'You check one line from a live voice call between a website visitor and AI Pujan, an AI that speaks for Pujan.',
    "The visitor's microphone also hears their room, so the visitor may be talking to someone else there.",
    before ? `AI Pujan last said: "${before.slice(-300)}"` : 'AI Pujan has not said anything yet.',
    `The line heard: "${line}"`,
    `It calls someone "${name}". Was the line said to AI Pujan? Answer with one word: yes or no.`,
  ].join('\n');
}

/**
 * True unless the line is clearly for someone else. `ask` runs the prompt on a model and resolves to its answer; it is given
 * a signal that aborts after `ms`.
 */
export async function saidToMe(
  line: string,
  before: string | undefined,
  ask: (prompt: string, signal: AbortSignal) => Promise<string>,
  ms = 3000,
): Promise<{ toMe: boolean; name: string | null; asked: boolean }> {
  const name = otherName(line);
  if (!name) return { toMe: true, name, asked: false };
  const slow = new AbortController();
  const timer = setTimeout(() => slow.abort(new Error('slow')), ms);
  try {
    const answer = await Promise.race([
      ask(addresseePrompt(line, name, before), slow.signal),
      new Promise<never>((_, reject) => slow.signal.addEventListener('abort', () => reject(slow.signal.reason))),
    ]);
    return { toMe: !/^\W*no\b/i.test(answer.trim()), name, asked: true };
  } catch {
    return { toMe: true, name, asked: true };
  } finally {
    clearTimeout(timer);
  }
}
