import { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { MessageCircle, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
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
  const { open, minimized, heroVisible, messages } = useCopilot();
  const reduceMotion = useReducedMotion();
  const location = useLocation();
  const previousPath = useRef(location.pathname);

  useEffect(() => {
    const pathChanged = previousPath.current !== location.pathname;
    previousPath.current = location.pathname;
    if (pathChanged && open && window.matchMedia('(max-width: 640px)').matches) {
      (document.activeElement as HTMLElement | null)?.blur?.();
      copilot.setMinimized(true);
    }
  }, [location.pathname, open]);

  useEffect(() => {
    const viewport = window.visualViewport;
    const update = () => {
      document.documentElement.style.setProperty('--cp-visual-height', `${viewport?.height ?? window.innerHeight}px`);
      document.documentElement.style.setProperty('--cp-visual-bottom', `${viewport ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop) : 0}px`);
    };
    update();
    viewport?.addEventListener('resize', update);
    viewport?.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    return () => {
      viewport?.removeEventListener('resize', update);
      viewport?.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

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
    if (!open) return;
    if (window.matchMedia('(min-width: 641px)').matches) document.getElementById('cp-ask-dock')?.focus({ preventScroll: true });
    requestAnimationFrame(() => {
      const thread = document.querySelector<HTMLElement>('.cp-panel .cp-thread');
      if (thread) thread.scrollTop = thread.scrollHeight;
    });
  }, [open]);

  const showPill = !open && !minimized && !heroVisible;

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
        {minimized && !heroVisible && (
          <motion.div key="mini" className="cp-minimized" initial={reduceMotion ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 18 }}>
            <button type="button" className="cp-mini-expand" onClick={() => copilot.setOpen(true)}>
              <MessageCircle size={16} aria-hidden="true" />
              <span>Continue with Pujan</span>
              <span className="cp-mini-preview">{messages.filter((message) => message.role === 'assistant').at(-1)?.text || 'Ask me anything…'}</span>
            </button>
            <button type="button" className="cp-mini-close" onClick={() => copilot.setMinimized(false)} aria-label="Hide chat"><X size={16} /></button>
            <CopilotChat variant="mini" />
          </motion.div>
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
