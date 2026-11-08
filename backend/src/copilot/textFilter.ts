/**
 * The copilot's streaming text filter (TASK-DB-0098 follow-up).
 *
 * What the Phoenix traces showed, and this exists to stop:
 *
 *  1. A model on the chain leaked its reasoning as answer text. The "give me a tour"
 *     turn arrived as ~1,400 characters of thinking, then a `</think>`, then the real
 *     two-sentence answer — 1,525 characters shown to a visitor who should have read
 *     150. Sometimes the opening tag is missing, so the block cannot be detected up
 *     front; it is only recognisable once the closing tag arrives.
 *
 *
 * Short answers are therefore held until the turn ends — they arrive at once anyway —
 * so a late `</think>` can be cut without the visitor seeing it. Longer answers stream,
 * and if a think block turns up mid-stream the client is told to replace what it had.
 */

const CLOSERS = ['</think>', '<｜end▁of▁thinking｜>'];

/**
 * 2. The line before a tool call that narrates the model's own work rather than talking to the visitor. On the
 * 2026-11-08 call it was spoken aloud: "The visitor says "give me one more" on the blog list, and "next" means step_list."
 * and "I need to read the paper before I can point at its sections". A plain "Let me open the research page." stays:
 * on a call it is what the visitor hears while the tool runs.
 */
const NARRATION = ['the visitor', 'step_list', 'read_paper', 'read_blog', 'search_site', 'cite_section', 'outline_passages', 'summarize_page',
  'tour_next', 'show_projects', 'share_link', 'send_message', 'navigate(', 'tool call', 'this turn', 'before i can point', 'i need to read',
  "i haven't actually read", 'i have not actually read', 'in this conversation'];
const narrates = (text: string) => {
  const lower = text.toLowerCase().replaceAll('\u2019', "'");
  return NARRATION.some((phrase) => lower.includes(phrase));
};

export type TextFilter = {
  /** A text delta from the model. */
  push: (text: string) => void;
  /** A tool call started; the text so far may be a preamble. */
  toolCall: () => void;
  /** A tool call finished; the next text starts a new paragraph. */
  toolResult: () => void;
  /** The turn ended. Returns the final visible text. */
  flush: () => string;
};

export function createTextFilter(send: (text: string, replace?: boolean) => void, hold = 220): TextFilter {
  let raw = '';
  let shown = '';
  let afterTool = false;
  /** Where the text since the last tool call starts in `raw`. */
  let segment = 0;

  /** The answer text in `raw`, with any leaked reasoning in front of it removed. */
  const clean = () => {
    const at = Math.max(...CLOSERS.map((closer) => raw.lastIndexOf(closer)));
    const text = at >= 0 ? raw.slice(raw.indexOf('>', at) + 1) : raw;
    return text.trimStart();
  };

  const emit = () => {
    const text = clean();
    if (text === shown) return;
    if (!shown) send(text);
    else if (text.startsWith(shown)) send(text.slice(shown.length));
    else send(text, true);
    shown = text;
  };

  return {
    push(text) {
      if (!text) return;
      if (afterTool && raw && raw.trimEnd() === raw) raw += '\n\n';
      afterTool = false;
      raw += text;
      const thinking = raw.trimStart().startsWith('<think') && !CLOSERS.some((closer) => raw.includes(closer));
      if (thinking) return;
      if (raw.length >= hold || CLOSERS.some((closer) => raw.includes(closer))) emit();
    },
    toolCall() {
      if (raw.length > segment && narrates(raw.slice(segment))) {
        raw = raw.slice(0, segment);
        if (shown) emit();
      }
    },
    toolResult() {
      afterTool = true;
      segment = raw.length;
    },
    flush() {
      emit();
      return shown.trim();
    },
  };
}
