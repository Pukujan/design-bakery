import { useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { X } from 'lucide-react';
import '../lab/lab.css';
import './copilot.css';
import { CopilotChat } from './CopilotChat';
import { copilot, useCopilot } from './store';

const EASE = [0.2, 0.7, 0.1, 1] as const;

/**
 * The sticky copilot: a pill in the corner that opens a side panel. The panel does not
 * block the page, so the visitor can talk while the copilot moves them around the site.
 * Hidden while the hero chat is on screen.
 */
export default function CopilotDock() {
  const { open, heroVisible, messages } = useCopilot();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') copilot.setOpen(false);
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        copilot.setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open) document.getElementById('cp-ask-dock')?.focus({ preventScroll: true });
  }, [open]);

  const showPill = !open && !heroVisible;

  return (
    <div className="cp-dock">
      <AnimatePresence>
        {showPill && (
          <motion.button
            key="pill"
            type="button"
            className="cp-pill"
            onClick={() => copilot.setOpen(true)}
            initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.9 }}
            transition={{ duration: 0.5, ease: EASE }}
            aria-label="Open the copilot"
          >
            <span className="lab-live-dot" aria-hidden="true" />
            {messages.length ? 'Continue chat' : 'Ask me anything'}
            <kbd className="cp-kbd">⌘K</kbd>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.aside
            key="panel"
            className="cp-panel"
            role="complementary"
            aria-label="Copilot"
            initial={reduceMotion ? false : { x: '105%' }}
            animate={{ x: 0 }}
            exit={{ x: '105%' }}
            transition={{ duration: 0.55, ease: EASE }}
          >
            <button type="button" className="cp-close" onClick={() => copilot.setOpen(false)} aria-label="Close the copilot">
              <X size={18} />
            </button>
            <CopilotChat variant="dock" />
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
