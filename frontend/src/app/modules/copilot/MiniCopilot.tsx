import { type FormEvent } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowUp, ChevronUp, Square, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { previewOf } from './replyPeek';
import { copilot, useCopilot } from './store';

const EASE = [0.2, 0.7, 0.1, 1] as const;

/**
 * The minimized chat on phones: a strip at the bottom edge that shows the latest reply and
 * the message field. Tapping the preview restores the full chat. The strip sits above the
 * on-screen keyboard through the --cp-kb variable that CopilotDock sets.
 */
export function MiniCopilot({ onRestore, onClose }: { onRestore: () => void; onClose: () => void }) {
  const { messages, busy, draft } = useCopilot();
  const location = useLocation();
  const reduceMotion = useReducedMotion();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || busy) return;
    copilot.setDraft('');
    void copilot.send(text, { path: location.pathname, title: document.title });
  };

  return (
    <motion.div
      className="cp-mini"
      role="region"
      aria-label="Copilot, minimized"
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.4, ease: EASE }}
    >
      <button type="button" className="cp-mini-open" onClick={onRestore} aria-label="Open the full chat">
        <span className="lab-live-dot" aria-hidden="true" />
        <span className="cp-mini-preview">{previewOf(messages)}</span>
        <ChevronUp size={18} aria-hidden="true" />
      </button>
      <form className="cp-mini-form" onSubmit={submit}>
        <label htmlFor="cp-ask-mini" className="sr-only">
          Ask about my work
        </label>
        <input
          id="cp-ask-mini"
          type="text"
          value={draft}
          maxLength={2000}
          enterKeyHint="send"
          autoComplete="off"
          placeholder={messages.length ? 'Ask a follow-up…' : 'Ask about my work…'}
          onChange={(event) => copilot.setDraft(event.target.value)}
        />
        {busy ? (
          <button type="button" className="cp-mini-send" aria-label="Stop" onClick={() => copilot.stop()}>
            <Square size={14} fill="currentColor" aria-hidden="true" />
          </button>
        ) : (
          <button type="submit" className="cp-mini-send" disabled={!draft.trim()} aria-label="Send">
            <ArrowUp size={18} strokeWidth={2.5} aria-hidden="true" />
          </button>
        )}
        <button type="button" className="cp-mini-close" onClick={onClose} aria-label="Close the copilot">
          <X size={16} aria-hidden="true" />
        </button>
      </form>
    </motion.div>
  );
}
