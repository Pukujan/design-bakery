/**
 * The model that reads one answer in the booking flow (bookingFlow.ts). A cascade over the hosted providers: the first valid JSON
 * wins, the next provider is tried on a timeout or an invalid answer, and null when none answers (the flow then uses its regex reader).
 * DeepSeek goes first (about 2 s, 87% on the router benchmark of 2026-11-05), then Qwen (90%, slower).
 */
import { routeFor, smartProviders, type Provider } from './providers.js';
import type { Interpreter, Reading } from './bookingFlow.js';

const ORDER = ['deepseek', 'qwen', 'workbuddy'];
const STEP_TEXT = {
  name: "asked for the caller's name",
  confirm_name: 'read the name back letter by letter and asked if it is right',
  say: 'asked how the caller says their name, a syllable at a time',
  email: "asked for the caller's email address",
  confirm_email: 'read the email back letter by letter and asked if it is right (the caller may also say which area the call is about)',
  area: 'asked which area the call should cover',
} as const;

export const SYSTEM = `You read one line a caller says on a voice call while booking a free consultation. The line comes from speech recognition: it may mishear names, drop punctuation, say digits as words ("one five oh four" is 1504: "oh" next to digits is a zero), say "at" and "dot", or spell letters ("T E R E S A"). Decide what the line does at the current step. Answer with JSON only: {"verdict": "...", "name": ..., "say": ..., "email": ..., "area": ...}
verdict:
- "answer": it gives what this step asked for.
- "yes" or "no": it agrees or disagrees. Anything that only agrees is "yes" ("that's right", "yeah correct").
- "correction": it disagrees AND gives the right value (a spelling like "that's P-U-J-A-N", a different name, a whole email). Put the value in the right field.
- "cancel": they want to stop booking.
- "other": anything else: a question, a complaint ("I already told you"), small talk, noise, a fragment.
Fill only what the line contains. name: a person's name, capitalised, nothing else (a sentence is not a name: use "other"). email: the full address in lower case with digits as digits. say: how they pronounce their name as hyphenated syllables like "Poo-jun"; if they say it is fine as spelled, verdict "yes". area: exactly one of "AI engineering", "Product design", "Marketing", "Full-stack development".`;

function parse(text: string): Reading | null {
  const raw = text.match(/\{[\s\S]*?\}/)?.[0];
  if (!raw) return null;
  try {
    const j = JSON.parse(raw) as Record<string, unknown>;
    const verdict = String(j.verdict ?? '');
    if (!['answer', 'yes', 'no', 'correction', 'cancel', 'other'].includes(verdict)) return null;
    const str = (v: unknown) => (typeof v === 'string' && v.trim() && v.trim().toLowerCase() !== 'null' ? v.trim() : undefined);
    return { verdict: verdict as Reading['verdict'], name: str(j.name), say: str(j.say), email: str(j.email)?.toLowerCase(), area: str(j.area) };
  } catch {
    return null;
  }
}

async function ask(p: Provider, user: string, ms: number): Promise<Reading | null> {
  const to = routeFor(p, '/chat/completions');
  try {
    const res = await fetch(to.url, {
      method: 'POST', headers: { 'content-type': 'application/json', ...to.headers },
      body: JSON.stringify({ model: p.model, temperature: 0, max_tokens: 600, messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: user }] }),
      signal: AbortSignal.timeout(ms),
    });
    if (!res.ok) return null;
    const j = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return parse(j.choices?.[0]?.message?.content ?? '');
  } catch {
    return null;
  }
}

export function modelReader(providers: Provider[] = smartProviders(), ms = 6000): Interpreter {
  const chain = ORDER.flatMap((id) => providers.filter((p) => p.id === id));
  return async (step, line, data) => {
    const known = [data.name && `name heard: ${data.name}`, data.email && `email heard: ${data.email}`].filter(Boolean).join('; ');
    const user = `Step: the caller was ${STEP_TEXT[step]}.${known ? ` (${known})` : ''}\nLine: "${line.replace(/"/g, "'")}"`;
    for (const p of chain) {
      const reading = await ask(p, user, ms);
      if (reading) return reading;
    }
    return null;
  };
}
