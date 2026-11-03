/**
 * Replies that stop mid-sentence (TASK-DB-0135). A reply the model cut off at its output
 * cap used to be sent as complete: "...bias containment, and a few others. Want me" (a
 * Qwen turn whose hidden reasoning used 200 of its 240 tokens, 2026-11-03). The stream
 * reports why it stopped; a cut-off reply is trimmed back to its last whole sentence.
 */

/** A sentence end: . ! ? or an ellipsis, then any closing quote or bracket. */
const SENTENCE_END = /[.!?…]["'”’)\]]*(?=\s|$)/g;

/** True when the model ran out of budget, or stopped on something other than a finish with no closing punctuation. */
export function isCutOff(finishReason: string | undefined, text: string): boolean {
  if (finishReason === 'length') return true;
  const t = text.trimEnd();
  if (!t || finishReason === 'stop' || finishReason === 'tool-calls') return false;
  return !/[.!?…"'”’)\]]$/.test(t);
}

/**
 * `text` cut back to its last complete sentence. With no complete sentence the last
 * whole word is kept and an ellipsis added, so the visitor never sees a dangling "Want me".
 */
export function trimToLastSentence(text: string): string {
  const t = text.trimEnd();
  let end = -1;
  for (const m of t.matchAll(SENTENCE_END)) end = m.index + m[0].length;
  if (end > 0) return t.slice(0, end).trimEnd();
  const words = t.replace(/\s+\S*$/, '').trimEnd();
  return `${(words || t).replace(/[,;:\-–—]+$/, '')}…`;
}
