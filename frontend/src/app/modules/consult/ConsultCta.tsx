import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useReducedMotion } from 'motion/react';
import { copilot } from '../copilot/store';
import './consult-cta.css';

const LIVE_PHRASE = 'live consultation with my AI';
const TYPE_MS = 85;
const DELETE_MS = 45;
const HOLD_MS = 1600;
const PAUSE_MS = 500;
const CONSULT_INTENT = 'I would like a live consultation about my project. ';

/**
 * The homepage's live consultation entry. Its label types and deletes itself with a blinking
 * cursor (static text when the visitor prefers reduced motion). A click opens the copilot chat
 * with a consultation intent in the shared composer, so the visitor can add detail and send it.
 */
export function LiveConsultButton() {
  const reduceMotion = useReducedMotion();
  const [typed, setTyped] = useState('');

  useEffect(() => {
    if (reduceMotion) return;
    let count = 0;
    let deleting = false;
    let timer = 0;
    const tick = () => {
      if (!deleting) {
        count += 1;
        setTyped(LIVE_PHRASE.slice(0, count));
        if (count === LIVE_PHRASE.length) {
          deleting = true;
          timer = window.setTimeout(tick, HOLD_MS);
          return;
        }
        timer = window.setTimeout(tick, TYPE_MS);
        return;
      }
      count -= 1;
      setTyped(LIVE_PHRASE.slice(0, count));
      if (count === 0) {
        deleting = false;
        timer = window.setTimeout(tick, PAUSE_MS);
        return;
      }
      timer = window.setTimeout(tick, DELETE_MS);
    };
    timer = window.setTimeout(tick, PAUSE_MS);
    return () => window.clearTimeout(timer);
  }, [reduceMotion]);

  const shown = reduceMotion ? LIVE_PHRASE : typed;

  const openConsultChat = () => {
    copilot.setDraft(CONSULT_INTENT);
    copilot.setOpen(true);
    window.setTimeout(() => {
      const composer = document.querySelector<HTMLTextAreaElement>('.lab-composer textarea');
      composer?.focus({ preventScroll: false });
    }, 60);
  };

  return (
    <button
      type="button"
      className="consult-live"
      aria-label={LIVE_PHRASE}
      onClick={openConsultChat}
    >
      <span className="consult-live-dot" aria-hidden="true" />
      <span className="consult-live-text" aria-hidden="true">
        {shown}
      </span>
      <span className="consult-live-caret" aria-hidden="true" />
    </button>
  );
}

/** The static booking entry. It leads to the Contact page, where visitors can send a message or book a call. */
export function BookConsultLink() {
  return (
    <Link to="/contact" className="consult-book-cta">
      Book a free consultation <span aria-hidden="true">→</span>
    </Link>
  );
}
