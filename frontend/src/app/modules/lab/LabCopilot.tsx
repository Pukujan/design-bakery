import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowUp, Mic } from 'lucide-react';
import {
  answer,
  PLACEHOLDER_QUESTIONS,
  SUGGESTIONS,
  type CopilotAction,
  type CopilotAnswer,
} from './copilotAnswers';

const EASE = [0.2, 0.7, 0.1, 1] as const;

type Message = { id: number; role: 'user' | 'copilot'; text: string; answer?: CopilotAnswer };

/** Types out example questions in the empty composer. */
function useTypedPlaceholder(active: boolean) {
  const reduceMotion = useReducedMotion();
  const [text, setText] = useState<string>(PLACEHOLDER_QUESTIONS[0]);

  useEffect(() => {
    if (!active || reduceMotion) return;
    let question = 0;
    let chars = 0;
    let deleting = false;
    let timer = 0;
    const tick = () => {
      const full = PLACEHOLDER_QUESTIONS[question];
      chars += deleting ? -1 : 1;
      setText(full.slice(0, chars));
      let wait = deleting ? 22 : 55;
      if (!deleting && chars === full.length) {
        deleting = true;
        wait = 1800;
      } else if (deleting && chars === 0) {
        deleting = false;
        question = (question + 1) % PLACEHOLDER_QUESTIONS.length;
        wait = 300;
      }
      timer = window.setTimeout(tick, wait);
    };
    timer = window.setTimeout(tick, 900);
    return () => window.clearTimeout(timer);
  }, [active, reduceMotion]);

  return text;
}

/** Reveals a finished answer word by word, like a streamed reply. */
function StreamedText({ text, onDone }: { text: string; onDone: () => void }) {
  const reduceMotion = useReducedMotion();
  const words = text.split(/(\s+)/);
  const [count, setCount] = useState(reduceMotion ? words.length : 0);

  useEffect(() => {
    if (count >= words.length) {
      onDone();
      return;
    }
    const timer = window.setTimeout(() => setCount((c) => c + 2), 18);
    return () => window.clearTimeout(timer);
  }, [count, words.length, onDone]);

  return (
    <>
      {words.slice(0, count).join('')}
      {count < words.length && <span className="lab-caret" aria-hidden="true" />}
    </>
  );
}

function ActionButton({ action }: { action: CopilotAction }) {
  if (action.kind === 'scroll') {
    return (
      <button
        type="button"
        className="lab-chip lab-chip--solid"
        onClick={() => document.querySelector(action.target)?.scrollIntoView({ behavior: 'smooth' })}
      >
        {action.label} ↓
      </button>
    );
  }
  const external = /^https?:\/\//.test(action.href);
  return (
    <a
      className="lab-chip lab-chip--solid"
      href={action.href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
    >
      {action.label} {external ? '↗' : '→'}
    </a>
  );
}

function CopilotReply({ message, onDone }: { message: Message; onDone: () => void }) {
  const [done, setDone] = useState(false);
  const finish = () => {
    if (done) return;
    setDone(true);
    onDone();
  };
  const reply = message.answer!;

  return (
    <div className="lab-msg lab-msg--copilot">
      <p className="lab-msg-text">
        <StreamedText text={reply.text} onDone={finish} />
      </p>
      <AnimatePresence>
        {done && (reply.projects?.length || reply.actions?.length) ? (
          <motion.div
            className="lab-msg-extras"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            {reply.actions?.map((action) => <ActionButton key={action.label} action={action} />)}
            {reply.projects?.map((project) => (
              <span
                key={project.id}
                className="lab-chip"
                style={{ '--chip-dot': project.accentColor } as React.CSSProperties}
              >
                <i className="lab-chip-dot" aria-hidden="true" />
                {project.title}
              </span>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function LabCopilot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [focused, setFocused] = useState(false);
  const [thinking, setThinking] = useState(false);
  const nextId = useRef(1);
  const threadRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const placeholder = useTypedPlaceholder(!focused && draft === '' && messages.length === 0);

  useEffect(() => {
    const thread = threadRef.current;
    if (thread) thread.scrollTo({ top: thread.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking]);

  const ask = (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || thinking) return;
    setDraft('');
    setThinking(true);
    setMessages((prev) => [...prev, { id: nextId.current++, role: 'user', text: trimmed }]);
    // Short pause so the reply reads as considered; the live copilot streams here.
    window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: nextId.current++, role: 'copilot', text: '', answer: answer(trimmed) },
      ]);
    }, 450);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    ask(draft);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      ask(draft);
    }
  };

  const lastIsUser = messages.at(-1)?.role === 'user';

  return (
    <div className={`lab-copilot${thinking ? ' is-thinking' : ''}`}>
      <div className="lab-copilot-status lab-mono">
        <span className="lab-live-dot" aria-hidden="true" />
        Copilot · knows my projects
      </div>

      <AnimatePresence initial={false}>
        {messages.length > 0 && (
          <motion.div
            ref={threadRef}
            className="lab-thread"
            data-lenis-prevent
            aria-live="polite"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            {messages.map((message) =>
              message.role === 'user' ? (
                <motion.p
                  key={message.id}
                  className="lab-msg lab-msg--user"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: EASE }}
                >
                  {message.text}
                </motion.p>
              ) : (
                <CopilotReply key={message.id} message={message} onDone={() => setThinking(false)} />
              ),
            )}
            {lastIsUser && (
              <div className="lab-typing" aria-label="Copilot is thinking">
                <span />
                <span />
                <span />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <form className="lab-composer" onSubmit={submit} onClick={() => inputRef.current?.focus()}>
        <label htmlFor="lab-ask" className="sr-only">
          Ask about my work
        </label>
        <textarea
          id="lab-ask"
          ref={inputRef}
          rows={1}
          value={draft}
          placeholder={messages.length ? 'Ask a follow-up…' : placeholder}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoComplete="off"
        />
        <div className="lab-composer-actions">
          <a
            className="lab-icon-btn"
            href="https://demo.design-bakery.com"
            target="_blank"
            rel="noopener noreferrer"
            title="Try the voice version (Website Copilot demo)"
            aria-label="Try the voice version"
            data-cursor="Voice"
          >
            <Mic size={18} />
          </a>
          <button
            type="submit"
            className="lab-send"
            disabled={!draft.trim() || thinking}
            aria-label="Send"
            data-cursor="Ask"
          >
            <ArrowUp size={20} strokeWidth={2.5} />
          </button>
        </div>
      </form>

      {messages.length === 0 && (
        <div className="lab-suggestions">
          {SUGGESTIONS.map((suggestion, index) => (
            <motion.button
              key={suggestion}
              type="button"
              className="lab-chip"
              onClick={() => ask(suggestion)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.1 + index * 0.08, ease: EASE }}
            >
              {suggestion}
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
