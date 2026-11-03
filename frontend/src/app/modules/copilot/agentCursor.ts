/**
 * The agent's own cursor. On a voice call the page moves on its own, so a cursor with the agent's name glides to the
 * link it is about to use, presses it, and only then does the page change: it looks like someone driving, not a page
 * that jumps. This file holds its state; AgentCursor.tsx draws it.
 */
import { useSyncExternalStore } from 'react';
import { nearestEdge, perchSpot } from './citeRoute';

type State = { visible: boolean; x: number; y: number; presses: number; scroll: 'up' | 'down' | null; moonOut: boolean; moonReturning: boolean; caption: string;
  /** The moon is a visitor on a text chat's errand, not the call's mascot: it flies in, guides, and flies out. */
  guest: boolean; leaving: boolean; entry: { x: number; y: number } | null; onCall: boolean };

let state: State = { visible: false, x: -100, y: -100, presses: 0, scroll: null, moonOut: false, moonReturning: false, caption: '', guest: false, leaving: false, entry: null, onCall: false };
let scrollTimer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();
let hideTimer: ReturnType<typeof setTimeout> | undefined;
let perchTimer: ReturnType<typeof setInterval> | undefined;
let guestTimer: ReturnType<typeof setTimeout> | undefined;
let leaveTimer: ReturnType<typeof setTimeout> | undefined;
/** However a journey ends or fails, a guest moon is gone by then. */
const GUEST_MAX_MS = 70_000;
const LEAVE_MAX_MS = 3000;
/** The moon's size on screen (MoonCursor's SIZE). */
const MOON = 46;

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
/** Where on a link the cursor aims: its middle, or the middle of the part of it that is on screen when it is taller than the window. */
function aimPoint(rect: DOMRect) {
  const top = Math.max(rect.top, 110);
  const bottom = Math.min(rect.bottom, window.innerHeight - 50);
  const y = top < bottom ? (top + bottom) / 2 : rect.top + rect.height / 2;
  return { x: rect.left + rect.width / 2, y };
}

function visibleLinkFor(path: string): HTMLElement | null {
  const link = document.querySelector<HTMLElement>(`a[href="${path.replace(/"/g, '')}"]`);
  if (!link) return null;
  const rect = link.getBoundingClientRect();
  // A tall card counts as on screen when a part of it is where the cursor can aim, not only when all of it fits.
  const point = aimPoint(rect);
  const onScreen = rect.width > 0 && rect.height > 0 && point.y >= 70 && point.y <= window.innerHeight - 20 && point.x >= 0 && point.x <= window.innerWidth;
  return onScreen ? link : null;
}

/** Takes the agent's hover look off every link it was on. */
function clearHover() {
  document.querySelectorAll('[data-agent-hover]').forEach((element) => element.removeAttribute('data-agent-hover'));
}

/**
 * Called before the cursor is shown. Off a call, the moon is a guest: it starts just outside the screen edge nearest the
 * place it is going and comes in from there. Already on screen (or on a call, where it is the call's own moon), nothing changes.
 */
function appear(toward: { x: number; y: number }) {
  clearTimeout(leaveTimer);
  if (state.visible) {
    if (state.leaving) set({ leaving: false });
  } else if (!state.onCall) {
    set({ guest: true, leaving: false, entry: nearestEdge(toward, { width: window.innerWidth, height: window.innerHeight }, MOON) });
  }
  clearTimeout(guestTimer);
  if (state.guest) guestTimer = setTimeout(() => agentCursor.finishGuest(), GUEST_MAX_MS);
}

/** Waits until an element has stopped moving on screen (a page that is still scrolling or settling), so the cursor aims at where it will stay. */
async function settle(element: Element, maxMs = 3500) {
  let last = '';
  let still = 0;
  for (let waited = 0; waited < maxMs && still < 4; waited += 60) {
    const r = element.getBoundingClientRect();
    const now = `${Math.round(r.left)}:${Math.round(r.top)}:${Math.round(r.width)}`;
    still = now === last ? still + 1 : 0;
    last = now;
    await wait(60);
  }
}

/** Keeps the cursor on an element for a while, following it if it still drifts (a late layout shift, a smooth scroll that has not quite ended). */
async function follow(element: Element, ms: number) {
  for (let waited = 0; waited < ms; waited += 80) {
    if (!element.isConnected) return;
    set(aimPoint(element.getBoundingClientRect()));
    await wait(80);
  }
}

const GLIDE_MS = 800;
const PRESS_MS = 280;

let captionTimer: ReturnType<typeof setTimeout> | undefined;
const jitter = (min: number, max: number) => min + Math.random() * (max - min);

export const agentCursor = {
  /** Resolves once the element has stopped moving on screen. */
  settle,
  /** A few words in the moon's bubble about what it is doing right now, one of several wordings. */
  say(options: readonly string[], ms = 1900) {
    clearTimeout(captionTimer);
    set({ caption: options[Math.floor(Math.random() * options.length)] });
    captionTimer = setTimeout(() => set({ caption: '' }), ms);
  },
  /** The moon is out of the call card (it leaves when a call connects) and is on its way back when the call ends. */
  setMoon(patch: { out?: boolean; returning?: boolean }) {
    set({ ...(patch.out === undefined ? {} : { moonOut: patch.out }), ...(patch.returning === undefined ? {} : { moonReturning: patch.returning }) });
  },
  /**
   * Bring the cursor to the link for `path` and press it, then resolve. If that link is not on screen the cursor just
   * appears mid-page and rests there, since the page is about to scroll.
   */
  async pointAtLinkFor(path: string) {
    clearTimeout(hideTimer);
    const found = document.querySelector<HTMLElement>(`a[href="${path.replace(/"/g, '')}"]`);
    // A page that is still scrolling or laying out moves its links: wait for the one we want to hold still before aiming.
    if (found) await settle(found);
    const link = visibleLinkFor(path);
    const rect0 = link?.getBoundingClientRect();
    appear(rect0 ? aimPoint(rect0) : { x: window.innerWidth * 0.62, y: window.innerHeight * 0.5 });
    if (!state.visible) set({ x: window.innerWidth * 0.72, y: window.innerHeight * 0.62 });
    set({ visible: true });
    if (!link) {
      set({ x: window.innerWidth * 0.62, y: window.innerHeight * 0.5 });
      await wait(450);
      return;
    }
    set(aimPoint(link.getBoundingClientRect()));
    await follow(link, jitter(650, 1000));
    // The cursor is over the link: it lights up the way it does under a real pointer (CSS :hover cannot be set from a script).
    clearHover();
    link.setAttribute('data-agent-hover', '');
    await follow(link, jitter(160, 380));
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
    appear({ x: rect.left + 40, y: rect.top + 20 });
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
   * Sit beside a heading and stay there: glide to its margin, tap it, then follow its position as the page settles (the
   * moon is anchored to the heading, not to a spot on the screen) until the next move or release.
   */
  async perch(element: HTMLElement | null) {
    if (!element) return;
    agentCursor.unperch();
    clearTimeout(hideTimer);
    appear({ x: element.getBoundingClientRect().left, y: element.getBoundingClientRect().top });
    const spot = () => perchSpot(element.getBoundingClientRect(), { width: window.innerWidth, height: window.innerHeight });
    set({ visible: true, scroll: null, ...spot() });
    await wait(GLIDE_MS);
    set({ presses: state.presses + 1 });
    perchTimer = setInterval(() => {
      if (!element.isConnected) return;
      const next = spot();
      if (Math.abs(next.x - state.x) > 2 || Math.abs(next.y - state.y) > 2) set(next);
    }, 120);
  },
  unperch() {
    clearInterval(perchTimer);
    perchTimer = undefined;
  },
  /**
   * Show the cursor scrolling: it rests mid-page with a wheel and arrows moving up or down for as long as the page takes
   * to scroll, so the visitor sees the agent doing it.
   */
  startScroll(direction: 'up' | 'down', ms: number) {
    clearTimeout(hideTimer);
    clearTimeout(scrollTimer);
    appear({ x: window.innerWidth * 0.62, y: window.innerHeight * 0.5 });
    if (!state.visible) set({ x: window.innerWidth * 0.62, y: window.innerHeight * 0.5 });
    set({ visible: true, scroll: direction });
    scrollTimer = setTimeout(() => set({ scroll: null }), ms);
  },
  /** Let the cursor fade away after the move it is part of has had time to play. */
  release(afterMs: number) {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      agentCursor.unperch();
      clearHover();
      if (state.guest) agentCursor.leave();
      else set({ visible: false });
    }, afterMs);
  },
  hide() {
    agentCursor.unperch();
    clearTimeout(hideTimer);
    clearHover();
    if (state.guest) agentCursor.finishGuest();
    else set({ visible: false });
  },
  /** A guest moon heads for the nearest edge (MoonCursor flies it there and calls finishGuest); if it never does, it is removed anyway. */
  leave() {
    if (!state.guest || state.leaving) return;
    agentCursor.unperch();
    clearHover();
    set({ leaving: true, scroll: null, caption: '' });
    clearTimeout(leaveTimer);
    leaveTimer = setTimeout(() => agentCursor.finishGuest(), LEAVE_MAX_MS);
  },
  /** The guest is gone: nothing of it is left on screen. */
  finishGuest() {
    clearTimeout(guestTimer);
    clearTimeout(leaveTimer);
    clearTimeout(hideTimer);
    clearTimeout(scrollTimer);
    agentCursor.unperch();
    clearHover();
    set({ visible: false, guest: false, leaving: false, entry: null, scroll: null, caption: '' });
  },
  /** MoonCursor tells us when a voice call is on: on a call the moon is the call's own and never a guest. */
  setOnCall(onCall: boolean) {
    if (state.onCall === onCall) return;
    set({ onCall, ...(onCall ? { guest: false, leaving: false, entry: null } : {}) });
    if (onCall) {
      clearTimeout(guestTimer);
      clearTimeout(leaveTimer);
    }
  },
};

// Development only: a handle for trying the cursor from the console.
if (import.meta.env.DEV && typeof window !== 'undefined') (window as unknown as { __agentCursor?: typeof agentCursor }).__agentCursor = agentCursor;
