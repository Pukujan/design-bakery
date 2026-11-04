import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type FocusEvent,
  type MouseEvent,
} from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ChevronDown, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import '../lab/lab.css';
import './copilot.css';
import { CopilotChat } from './CopilotChat';
import { MiniCopilot } from './MiniCopilot';
import VoiceOrb from './VoiceOrb';
import MoonCursor from './MoonCursor';
import { useAgentCursor } from './agentCursor';
import { useReplyPeek } from './replyPeek';
import { copilot, useCopilot } from './store';
import { useVoice } from './voice';

const EASE = [0.2, 0.7, 0.1, 1] as const;
/** Phones: the chat is a bottom sheet that can fold into a strip. Matches the CSS breakpoint. */
const MOBILE_QUERY = '(max-width: 760px)';

function useMobile() {
  return useSyncExternalStore(
    (notify) => {
      const media = window.matchMedia(MOBILE_QUERY);
      media.addEventListener('change', notify);
      return () => media.removeEventListener('change', notify);
    },
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => false,
  );
}

type View = { bottom: number; height: number; top: number };

/**
 * The visual viewport: where its top sits in the layout viewport, how tall it is, and how far the on-screen keyboard
 * lifts the bottom edge. Null when the browser does not report it.
 */
function useVisualViewport(enabled: boolean): View | null {
  const [view, setView] = useState<View | null>(null);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!enabled || !vv) {
      setView(null);
      return;
    }
    const update = () => {
      const next = {
        bottom: Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)),
        height: Math.round(vv.height),
        top: Math.round(vv.offsetTop),
      };
      setView((prev) => (prev && prev.bottom === next.bottom && prev.height === next.height && prev.top === next.top ? prev : next));
    };
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, [enabled]);

  return view;
}

function blurActive() {
  const active = document.activeElement;
  if (active instanceof HTMLElement) active.blur();
}

/** Keep focus where it is when a button is pressed, so the keyboard does not close before the click. */
const keepFocus = (event: MouseEvent) => event.preventDefault();

/**
 * The sticky copilot: a pill in the corner that opens a side panel. The panel does not
 * block the page, so the visitor can talk while the copilot moves them around the site.
 * Hidden while the hero chat is on screen. On phones the panel is a bottom sheet that lifts
 * above the keyboard, and after an approved page change it folds into a strip.
 */
export default function CopilotDock() {
  const { open, heroVisible, messages } = useCopilot();
  const call = useVoice();
  const agent = useAgentCursor();
  const { peek, unseen } = useReplyPeek();
  // There is one bubble: the moon's when it is out, else one over the pill.
  const moonOut = agent.visible || agent.moonReturning;
  const reduceMotion = useReducedMotion();
  const mobile = useMobile();
  const { pathname } = useLocation();
  const view = useVisualViewport(mobile && open);
  const [minimized, setMinimized] = useState(false);
  const [typing, setTyping] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef(pathname);

  const strip = mobile && open && minimized;

  // A click outside the panel closes it. Clicks on the chat itself, the call orb, or any control that opens the chat
  // (marked data-copilot-open) are not "outside", so those buttons keep working.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest('.cp-dock, .cp-chat, .vo, [data-copilot-open]')) return;
      copilot.setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

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

  // On a phone the box is not focused on open: the keyboard would cover most of the conversation the visitor came back
  // to read. They tap the box to type.
  useEffect(() => {
    if (open && !mobile) document.getElementById('cp-ask-dock')?.focus({ preventScroll: true });
  }, [open, mobile]);

  // A page change the visitor approved (the copilot only changes page on a confirmed chip)
  // closes the keyboard and folds the chat into the strip, on phones.
  useEffect(() => {
    if (pathRef.current === pathname) return;
    pathRef.current = pathname;
    if (!mobile || !open) return;
    blurActive();
    setMinimized(true);
  }, [pathname, mobile, open]);

  useEffect(() => {
    if (!open) setMinimized(false);
  }, [open]);

  // Keep the latest message in view: when the panel opens or is restored, as a reply
  // streams in, and when the keyboard moves the thread's bottom edge.
  useLayoutEffect(() => {
    const thread = rootRef.current?.querySelector<HTMLElement>('.cp-thread');
    if (thread) thread.scrollTop = thread.scrollHeight;
  }, [open, minimized, messages, view?.bottom]);

  const onFocus = (event: FocusEvent<HTMLDivElement>) => {
    if (isField(event.target)) setTyping(true);
  };
  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (isField(event.target)) setTyping(false);
  };

  // On a call, the call card is what opens the chat, so the Continue chat pill steps aside (the shortcut still works).
  const showPill = !open && !heroVisible && call.status === 'idle';
  const vars = view
    ? ({ '--cp-kb': `${view.bottom}px`, '--cp-vvh': `${view.height}px`, '--cp-vvtop': `${view.top}px` } as CSSProperties)
    : undefined;

  return (
    <div
      ref={rootRef}
      className={`cp-dock${strip ? ' cp-dock--strip' : ''}${view ? ' cp-dock--vv' : ''}`}
      style={vars}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      <VoiceOrb />
      <MoonCursor peek={moonOut ? peek : null} />
      <AnimatePresence>
        {showPill && peek && !moonOut && (
          <motion.button
            key={peek.kind === 'dots' ? 'dots' : 'text'}
            type="button"
            className="cp-pill-bubble"
            onClick={() => copilot.setOpen(true)}
            initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.9 }}
            transition={{ duration: 0.25, ease: EASE }}
            aria-label="Open the reply"
          >
            {peek.kind === 'dots' ? (
              <span className="moon-dots">
                <i />
                <i />
                <i />
              </span>
            ) : (
              peek.text
            )}
          </motion.button>
        )}
      </AnimatePresence>
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
            {unseen ? 'New reply' : messages.length ? 'Continue chat' : 'Ask me anything'}
            <kbd className="cp-kbd">⌘K</kbd>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && !strip && (
          <motion.aside
            key="panel"
            className="cp-panel"
            role="complementary"
            aria-label="Copilot"
            initial={reduceMotion ? false : { x: '105%' }}
            animate={{ x: 0 }}
            onAnimationComplete={() => {
              // The thread is laid out while the panel slides in; land on the latest message once it is in place.
              const thread = rootRef.current?.querySelector<HTMLElement>('.cp-thread');
              if (thread) thread.scrollTop = thread.scrollHeight;
            }}
            exit={{ x: '105%' }}
            transition={{ duration: 0.55, ease: EASE }}
          >
            <div className="cp-bar">
              {mobile && typing ? (
                <button
                  type="button"
                  className="cp-hide-keys"
                  onMouseDown={keepFocus}
                  onClick={blurActive}
                >
                  Hide keyboard
                </button>
              ) : messages.length > 0 ? (
                <button type="button" className="cp-link cp-new" onClick={() => copilot.clear()}>
                  New chat
                </button>
              ) : (
                <span />
              )}
              <div className="cp-bar-end">
                {mobile && (
                  <button
                    type="button"
                    className="cp-min"
                    onMouseDown={keepFocus}
                    onClick={() => {
                      blurActive();
                      setMinimized(true);
                    }}
                    aria-label="Minimize the copilot"
                  >
                    <ChevronDown size={18} aria-hidden="true" />
                  </button>
                )}
                <button type="button" className="cp-close" onClick={() => copilot.setOpen(false)} aria-label="Close the copilot">
                  <X size={18} />
                </button>
              </div>
            </div>
            <CopilotChat variant="dock" />
          </motion.aside>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {strip && (
          <MiniCopilot
            key="strip"
            onRestore={() => setMinimized(false)}
            onClose={() => copilot.setOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function isField(target: EventTarget): boolean {
  return target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement;
}
