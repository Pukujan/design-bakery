/**
 * When and what to summarise (TASK-DB-0134). Pure, so scripts/test-copilot-memory.mjs reads it straight from the source.
 * The browser keeps the whole conversation; once enough of it has built up, all but the newest turns are condensed by
 * the server into a rolling summary, and only the turns after that point are sent with each request.
 */
export type MemoryMessage = { id: number; role: 'user' | 'assistant'; text: string; error?: boolean; nudge?: boolean; ignored?: string };

/** Summarise when this many turns (idle nudge lines not counted) sit after the last summary. */
export const SUMMARIZE_AT = 14;
/** The newest turns that are never summarised away. The last two always hold a pending offer and the answer to it. */
export const KEEP_RECENT = 6;
/** Most messages the page keeps; the summary stands in for anything older. */
export const MAX_PAGE_MESSAGES = 200;
/** Most turns sent verbatim with a request. */
export const MAX_HISTORY = 20;
/** After a failed summary, wait this long before trying again; the plain trim to MAX_HISTORY covers the gap. */
export const RETRY_MS = 60_000;

export type Summary = { text: string; /** Id of the last message the text covers. */ upTo: number; /** How many turns it stands for. */ covers: number };

/** The turns that count as history: after the summary, not an error line, with text. Nudge lines stay (they carry the offer). */
export const liveTurns = <T extends MemoryMessage>(messages: T[], summary: Summary | null): T[] =>
  messages.filter((m) => m.id > (summary?.upTo ?? 0) && !m.error && !m.ignored && m.text);

export type SummaryPlan = { cover: MemoryMessage[]; upTo: number };

/** What to condense now, or null when the conversation is still short. Nudge lines are stored but not counted or summarised. */
export function planSummary(messages: MemoryMessage[], summary: Summary | null): SummaryPlan | null {
  const live = liveTurns(messages, summary);
  if (live.filter((m) => !m.nudge).length <= SUMMARIZE_AT) return null;
  const head = live.slice(0, Math.max(0, live.length - KEEP_RECENT));
  const cover = head.filter((m) => !m.nudge);
  if (!cover.length) return null;
  return { cover, upTo: head[head.length - 1].id };
}

/** The turns to send: everything after the summary, newest MAX_HISTORY. A failed summary leaves this plain trim in force. */
export function historyToSend(messages: MemoryMessage[], summary: Summary | null): Array<{ role: 'user' | 'assistant'; content: string }> {
  return liveTurns(messages, summary)
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role, content: m.text.slice(0, 2000) }));
}

/** Messages kept on the page: the newest MAX_PAGE_MESSAGES. */
export const capPage = <T>(messages: T[]): T[] => (messages.length > MAX_PAGE_MESSAGES ? messages.slice(-MAX_PAGE_MESSAGES) : messages);
