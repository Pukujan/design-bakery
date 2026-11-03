/**
 * The copilot's streaming text filter (TASK-DB-0098 follow-up).
 *
 * Two things the Phoenix traces showed, and this exists to stop both:
 *
 *  1. A model on the chain leaked its reasoning as answer text. The "give me a tour"
 *     turn arrived as ~1,400 characters of thinking, then a `</think>`, then the real
 *     two-sentence answer — 1,525 characters shown to a visitor who should have read
 *     150. Sometimes the opening tag is missing, so the block cannot be detected up
 *     front; it is only recognisable once the closing tag arrives.
 *
 *  2. Models narrate before calling a tool ("Let me pull up the blog page for you.").
 *     That sentence is noise next to the answer, and the prompt asking nicely is not a
 *     guarantee.
 *
 * Short answers are therefore held until the turn ends — they arrive at once anyway —
 * so a late `</think>` can be cut without the visitor seeing it. Longer answers stream,
 * and if a think block turns up mid-stream the client is told to replace what it had.
 */

const CLOSERS = ['</think>', '<｜end▁of▁thinking｜>'];

/** Text that only says what the copilot is about to do. */
const NARRATION = /^(let me|i'll|i will|one moment|sure,? let me|pulling|taking you|looking|checking|opening|here(?:'s| is) the)/i;

/** The whole reply on a voice call when the words heard were not for the copilot (VOICE_NOTE in route.ts). */
export const QUIET = /^\s*\[quiet\][\s.]*$/i;

export type TextFilter = {
  /** A text delta from the model. */
  push: (text: string) => void;
  /** A tool call started; the text so far may be a preamble. */
  toolCall: () => void;
  /** A tool call finished; the next text starts a new paragraph. */
  toolResult: () => void;
  /** The turn ended. Returns the final visible text. */
  flush: () => string;
  /** The reply was QUIET: flush() returned nothing on purpose. */
  quiet: () => boolean;
};

export function createTextFilter(send: (text: string, replace?: boolean) => void, hold = 220): TextFilter {
  let raw = '';
  let shown = '';
  let afterTool = false;
  let firstTool = true;
  let quiet = false;

  /** The answer text in `raw`, with any leaked reasoning in front of it removed. */
  const clean = () => {
    const at = Math.max(...CLOSERS.map((closer) => raw.lastIndexOf(closer)));
    const text = at >= 0 ? raw.slice(raw.indexOf('>', at) + 1) : raw;
    return text.replace(/^\s+/, '');
  };

  const emit = () => {
    const text = clean();
    if (text === shown) return;
    if (!shown) send(text);
    else if (text.startsWith(shown)) send(text.slice(shown.length));
    else send(text, true);
    shown = text;
  };

  const reset = () => {
    raw = '';
    shown = '';
    send('', true);
  };

  return {
    push(text) {
      if (!text) return;
      if (afterTool && raw && !/\s$/.test(raw)) raw += '\n\n';
      afterTool = false;
      raw += text;
      const thinking = raw.trimStart().startsWith('<think') && !CLOSERS.some((closer) => raw.includes(closer));
      if (thinking) return;
      if (raw.length >= hold || CLOSERS.some((closer) => raw.includes(closer))) emit();
    },
    toolCall() {
      if (firstTool && clean().length <= 200 && NARRATION.test(clean())) reset();
      firstTool = false;
    },
    toolResult() {
      afterTool = true;
    },
    flush() {
      // On a call the model answers words not meant for it (someone else in the room) with QUIET: nothing is shown or said.
      if (!shown && QUIET.test(clean())) {
        quiet = true;
        return '';
      }
      emit();
      return shown.trim();
    },
    quiet: () => quiet,
  };
}
