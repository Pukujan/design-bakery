import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowUp, Mic, PhoneOff, Rocket, Square } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useProjectRecords } from '../../lib/portfolioDocs';
import { PLACEHOLDER_QUESTIONS, SUGGESTIONS } from '../lab/copilotAnswers';
import { copilot, useCopilot, type CopilotAction, type CopilotMessage } from './store';
import { useVoice, voice } from './voice';
import './chat-core.css';

const EASE = [0.2, 0.7, 0.1, 1] as const;

const STEP_LABEL: Record<string, string> = {
  search_site: 'Searching the site',
  read_blog: 'Reading a post',
  read_paper: 'Reading a paper',
  navigate: 'Taking you there',
  show_projects: 'Pulling up projects',
  share_link: 'Finding the link',
  book_call: 'Opening the booking page',
};


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

function ActionView({ action }: { action: CopilotAction }) {
  const records = useProjectRecords();
  const projectBySlug = new Map(records.map((p) => [p.slug, p]));
  if (action.kind === 'navigate') {
    return (
      <button type="button" className="lab-chip lab-chip--solid" onClick={() => copilot.go(action.path)}>
        <Rocket className="cp-rocket" size={14} aria-hidden="true" focusable="false" />
        {action.label}
      </button>
    );
  }
  if (action.kind === 'projects') {
    return (
      <>
        {action.slugs.map((slug) => {
          const project = projectBySlug.get(slug);
          if (!project) return null;
          return (
            <button
              key={slug}
              type="button"
              className="lab-chip"
              style={{ '--chip-dot': project.accentColor } as React.CSSProperties}
              onClick={() => copilot.go(`/work/${slug}`)}
            >
              <Rocket className="cp-rocket" size={14} aria-hidden="true" focusable="false" />
              {project.title}
            </button>
          );
        })}
      </>
    );
  }
  if (action.kind === 'book') {
    return (
      <a className="lab-chip lab-chip--solid" href={action.url} target="_blank" rel="noopener noreferrer">
        Pick a time ↗
      </a>
    );
  }
  const external = /^(https?:|mailto:)/.test(action.url);
  return (
    <a
      className="lab-chip lab-chip--solid"
      href={action.url}
      target={external && !action.url.startsWith('mailto:') ? '_blank' : undefined}
      rel="noopener noreferrer"
    >
      {action.label} {external ? '↗' : '→'}
    </a>
  );
}

function AssistantMessage({ message }: { message: CopilotMessage }) {
  const waiting = message.streaming && !message.text && message.steps.length === 0;
  return (
    <div className="lab-msg lab-msg--copilot">
      {waiting && (
        <div className="lab-typing" aria-label="Copilot is thinking">
          <span />
          <span />
          <span />
        </div>
      )}
      {message.steps.length > 0 && (
        <p className="lab-mono lab-msg-step">{STEP_LABEL[message.steps.at(-1)!] ?? 'Working'}…</p>
      )}
      {message.text && (
        <p className="lab-msg-text" style={{ whiteSpace: 'pre-wrap' }}>
          {message.text}
          {message.streaming && <span className="lab-caret" aria-hidden="true" />}
        </p>
      )}
      {message.actions.length > 0 && (
        <div className="lab-msg-extras">
          {message.actions.map((action, index) => (
            <ActionView key={index} action={action} />
          ))}
        </div>
      )}
    </div>
  );
}

/** One conversation, shared by the hero and the dock through the copilot store. */
export function CopilotChat({ variant }: { variant: 'hero' | 'dock' }) {
  const { messages, busy, draft } = useCopilot();
  const voiceState = useVoice();
  const location = useLocation();
  const [focused, setFocused] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const placeholder = useTypedPlaceholder(!focused && draft === '' && messages.length === 0);

  useEffect(() => {
    const thread = threadRef.current;
    if (thread) thread.scrollTo({ top: thread.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const ask = (question: string) => {
    if (!question.trim() || busy) return;
    copilot.setDraft('');
    void copilot.send(question, { path: location.pathname, title: document.title });
  };

  // Before the first message, focusing the box opens a second line: sample questions while it
  // is empty, then the closest matches to what is being typed.
  const typed = draft.trim().toLowerCase();
  const hints = messages.length === 0 && focused
    ? (typed
        ? [...SUGGESTIONS].filter((q) => typed.split(/\s+/).every((word) => q.toLowerCase().includes(word)) && q.toLowerCase() !== typed)
            .sort((a, b) => Number(b.toLowerCase().startsWith(typed)) - Number(a.toLowerCase().startsWith(typed)))
            .slice(0, 2)
        : [...SUGGESTIONS].slice(0, 4))
    : [];

  const submit = (event: FormEvent) => {
    event.preventDefault();
    ask(draft);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Tab' && !event.shiftKey && typed && hints.length) {
      event.preventDefault();
      copilot.setDraft(hints[0]);
      return;
    }
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      ask(draft);
    }
  };

  const id = `cp-ask-${variant}`;

  return (
    <div className={`lab-copilot cp-chat cp-chat--${variant}${busy ? ' is-thinking' : ''}`}>
      {variant === 'dock' && messages.length > 0 && (
        <div className="lab-copilot-status lab-mono">
          <button type="button" className="cp-link" onClick={() => copilot.clear()}>
            New chat
          </button>
        </div>
      )}

      {messages.length > 0 && (
        <div ref={threadRef} className="lab-thread cp-thread" data-lenis-prevent aria-live="polite">
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
              <AssistantMessage key={message.id} message={message} />
            ),
          )}
        </div>
      )}

      <form className="lab-composer" onSubmit={submit} onClick={() => inputRef.current?.focus()}>
        <label htmlFor={id} className="sr-only">
          Ask about my work
        </label>
        <textarea
          id={id}
          ref={inputRef}
          rows={1}
          value={draft}
          maxLength={2000}
          placeholder={messages.length ? 'Ask a follow-up…' : placeholder}
          onChange={(event) => copilot.setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoComplete="off"
        />
        <div className="lab-composer-actions">
          <button
            type="button"
            className="cp-voice"
            aria-label={voiceState.status === 'idle' ? 'Start voice call' : 'End voice call'}
            onClick={() => voiceState.status === 'idle' ? void voice.start() : voice.stop()}
          >
            {voiceState.status === 'idle' ? <Mic size={16} /> : <PhoneOff size={16} />}
            <span>{voiceState.status === 'idle' ? 'Voice call' : 'End call'}</span>
          </button>
          {busy ? (
            <button type="button" className="lab-send" aria-label="Stop" onClick={() => copilot.stop()}>
              <Square size={16} fill="currentColor" />
            </button>
          ) : (
            <button type="submit" className="lab-send" disabled={!draft.trim()} aria-label="Send" data-cursor="Ask">
              <ArrowUp size={20} strokeWidth={2.5} />
            </button>
          )}
        </div>
        <AnimatePresence initial={false}>
          {hints.length > 0 && (
            <motion.ul
              key="hints"
              className="cp-hints"
              aria-label="Suggested questions"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: EASE }}
            >
              {hints.map((hint) => (
                <li key={hint}>
                  <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => ask(hint)}>
                    {hint}
                  </button>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </form>
      {(voiceState.status !== 'idle' || voiceState.error) && (
        <p className="lab-mono lab-msg-note" role="status">
          {voiceState.error || (voiceState.status === 'connecting' ? 'Connecting voice…' : 'Voice call connected')}
        </p>
      )}
      {voiceState.audioBlocked && (
        <button type="button" className="lab-chip" onClick={() => void voice.enableAudio()}>
          Enable call audio
        </button>
      )}
    </div>
  );
}
