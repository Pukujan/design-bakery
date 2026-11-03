/**
 * The agent's own cursor. On a voice call the page moves on its own, so a cursor with the agent's name glides to the
 * link it is about to use, presses it, and only then does the page change: it looks like someone driving, not a page
 * that jumps. This file holds its state; AgentCursor.tsx draws it.
 */
import { useSyncExternalStore } from 'react';

type State = { visible: boolean; x: number; y: number; presses: number; scroll: 'up' | 'down' | null };

let state: State = { visible: false, x: -100, y: -100, presses: 0, scroll: null };
let scrollTimer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();
let hideTimer: ReturnType<typeof setTimeout> | undefined;

const set = (patch: Partial<State>) => {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
};
const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

export const useAgentCursor = () =>
  useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
    () => state,
  );

/** The link on this page that leads to a path, if it is on screen. */
function visibleLinkFor(path: string): HTMLElement | null {
  const link = document.querySelector<HTMLElement>(`a[href="${path.replace(/"/g, '')}"]`);
  if (!link) return null;
  const rect = link.getBoundingClientRect();
  const onScreen = rect.width > 0 && rect.height > 0 && rect.top >= 0 && rect.bottom <= window.innerHeight && rect.left >= 0 && rect.right <= window.innerWidth;
  return onScreen ? link : null;
}

const GLIDE_MS = 800;
const PRESS_MS = 280;

export const agentCursor = {
  /**
   * Bring the cursor to the link for `path` and press it, then resolve. If that link is not on screen the cursor just
   * appears mid-page and rests there, since the page is about to scroll.
   */
  async pointAtLinkFor(path: string) {
    clearTimeout(hideTimer);
    const link = visibleLinkFor(path);
    if (!state.visible) set({ x: window.innerWidth * 0.72, y: window.innerHeight * 0.62 });
    set({ visible: true });
    if (!link) {
      set({ x: window.innerWidth * 0.62, y: window.innerHeight * 0.5 });
      await wait(450);
      return;
    }
    const rect = link.getBoundingClientRect();
    set({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    await wait(GLIDE_MS);
    set({ presses: state.presses + 1 });
    await wait(PRESS_MS);
  },
  /**
   * Glide to a heading or block the agent has just scrolled to and tap it ("here"). The spot comes from the element's
   * live position, so it lands in the right place on a phone and on a wide screen alike.
   */
  async pointAtElement(element: Element | null) {
    if (!element) return;
    const rect = element.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) return;
    clearTimeout(hideTimer);
    set({
      visible: true,
      scroll: null,
      x: Math.min(window.innerWidth - 60, rect.left + Math.min(rect.width * 0.25, 160)),
      y: Math.min(window.innerHeight - 60, Math.max(70, rect.top + Math.min(rect.height * 0.5, 40))),
    });
    await wait(GLIDE_MS);
    set({ presses: state.presses + 1 });
  },
  /**
   * Show the cursor scrolling: it rests mid-page with a wheel and arrows moving up or down for as long as the page takes
   * to scroll, so the visitor sees the agent doing it.
   */
  startScroll(direction: 'up' | 'down', ms: number) {
    clearTimeout(hideTimer);
    clearTimeout(scrollTimer);
    if (!state.visible) set({ x: window.innerWidth * 0.62, y: window.innerHeight * 0.5 });
    set({ visible: true, scroll: direction });
    scrollTimer = setTimeout(() => set({ scroll: null }), ms);
  },
  /** Let the cursor fade away after the move it is part of has had time to play. */
  release(afterMs: number) {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => set({ visible: false }), afterMs);
  },
  hide() {
    clearTimeout(hideTimer);
    set({ visible: false });
  },
};

// Development only: a handle for trying the cursor from the console.
if (import.meta.env.DEV && typeof window !== 'undefined') (window as unknown as { __agentCursor?: typeof agentCursor }).__agentCursor = agentCursor;
