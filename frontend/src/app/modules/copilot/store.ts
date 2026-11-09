/**
 * The site copilot's state, one store for the whole app (TASK-DB-0098). The hero chat
 * and the floating dock both read it, so the conversation survives route changes and
 * moving between the two. Talks to /api/copilot (backend/src/copilot/route.ts); when the
 * API is away it answers from the built-in index in ../lab/copilotAnswers.ts.
 */
import { useSyncExternalStore } from 'react';
import { getAuthApiBaseUrl } from '../../lib/adminToken';
import { answer as localAnswer, type CopilotProject } from '../lab/copilotAnswers';
import { getTurnstileToken } from './turnstile';
import { scrollStageToElement, scrollStageToTop, setStageScroll } from '../lab/stageScroll';
import { agentCursor } from './agentCursor';
import { preloadWalk, walkIdle, walkLine, type WalkStep } from './holdAudio';
import { citeAt, MAX_CITES, passageSchedule, planRoute, sentenceStart, swipePlan, swipeY } from './citeRoute';
import { clearQuote, highlightQuote } from './quoteHighlight';
import { capPage, historyToSend, planSummary, RETRY_MS, type Summary } from './memory';

export type CopilotAction =
  /** `go` is set only when the visitor has just confirmed the move; otherwise it is a chip. */
  | { kind: 'navigate'; path: string; label: string; go?: boolean }
  | { kind: 'projects'; slugs: string[] }
  | { kind: 'link'; label: string; url: string }
  | { kind: 'book'; url: string; name?: string; email?: string; topic?: string }
  /** Voice calls only: scroll to a section when the spoken answer reaches character `at` (never shown as a chip). */
  | { kind: 'scrollstep'; path: string; at: number }
  /** Point at a section of a post, paper or project: scroll to its heading, tap it, highlight `quote`. Checked against the live content by the server. */
  | { kind: 'cite'; path: string; anchor: string; heading: string; quote?: string; mode?: 'swipe' | 'perch' }
  /** An expansion chip: a follow-up question. Clicking sends `text` as the visitor's message; the page does not move. */
  | { kind: 'ask'; text: string }
  /** A song make_song started (or a saved one): a player that waits for it and plays it (SongCard.tsx). Never a chip. */
  | { kind: 'song'; id: string; title?: string | null; cached?: boolean };

export type CopilotMessage = {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  /** Tool names currently running, shown as "Looking up…". */
  steps: string[];
  actions: CopilotAction[];
  streaming: boolean;
  /** Set when the answer came from the built-in index, not a model. */
  offline?: boolean;
  /** The provider/model used for a completed live answer. */
  model?: string;
  /** Set for an error line, so it is not sent back to the model as history. */
  error?: boolean;
  /** A line said aloud on a quiet call (holdAudio NUDGES), kept so a following "yes" has its question. */
  nudge?: boolean;
  /**
   * A line heard on a call that got no reply, and why ("another voice", "said to Campos"): shown greyed with "Answer this",
   * and never sent back as history. `heardId` is the voice agent's id for it (agent.claim), when the agent dropped it.
   */
  ignored?: string;
  heardId?: string;
};

/** The booking a call has made: shown as a card with one button, because a call has no chat thread to hold a chip. */
export type BookingOffer = { url: string; name?: string; email?: string; topic?: string };

/** A song started on a call: shown as a card over the page, since a call has no chat thread. */
export type SongOffer = { id: string; title?: string | null };

export type CopilotState = {
  /** The booking button of a voice call (booking.ts on the server); null until one is made. */
  booking?: BookingOffer | null;
  /** The song a call asked for (make_song); null once dismissed. */
  song?: SongOffer | null;
  messages: CopilotMessage[];
  busy: boolean;
  /** The dock's sidebar is open. */
  open: boolean;
  /** The hero chat is on screen, so the dock's pill stays hidden. */
  heroVisible: boolean;
  /** One draft shared by the homepage composer and the dock. */
  draft: string;
};

type Event =
  | { type: 'text'; text: string; replace?: boolean }
  | { type: 'action'; action: CopilotAction }
  | { type: 'step'; name: string; status: 'start' | 'done' | 'error' }
  | { type: 'done'; model: string }
  | { type: 'ignored'; reason: string }
  | { type: 'flow'; flow: unknown }
  | { type: 'error'; message: string };

const STORAGE_KEY = 'db-copilot-v1';
const VISITOR_KEY = 'db-copilot-visitor-v1';
const SUMMARY_KEY = 'db-copilot-summary-v1';
/** The same question asked again within this long, straight after its own answer, is not sent a second time. */
const DUPLICATE_MS = 30_000;
const askKey = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
let lastAsk: { key: string; at: number } | null = null;
/** Set by voice.ts while a call is up: answers a greyed line aloud (copilot.answerIgnored). */
let ignoredAnswerer: ((message: CopilotMessage) => Promise<void>) | null = null;
/** Replies that belong to a voice call: they never open the side panel, and they may move the page on their own. */
const voiceReplies = new Set<number>();
let pendingMoves: Promise<void>[] = [];
/** Set by voice.ts: called with a finished typed reply, so a call can speak the ones it has a recording for. */
export const typedReply: { hook?: (text: string) => void } = {};
let pendingSteps: Array<{ path: string; at: number }> = [];
/** The citations of a call's answer after the first: each is walked to as the answer reaches it. */
let pendingCites: Array<Extract<CopilotAction, { kind: 'cite' }>> = [];
let citesThisTurn = 0;
const citedKeys = new Set<string>();
/** The citation made before the answer is spoken; the later ones are scheduled after it. */
let firstCiteKey = '';
/** How long a reply may go without a single event before the chat stops waiting for it. */
const STALL_MS = 25_000;
/** How long a clicked citation's passage stays lit, and the moon beside it, in a text chat. */
const CHIP_CITE_HOLD_MS = 6000;

function load(): CopilotMessage[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as CopilotMessage[]) : [];
    return parsed.map((m) => ({ ...m, streaming: false, steps: [] }));
  } catch {
    return [];
  }
}

function loadSummary(): Summary | null {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(SUMMARY_KEY) ?? 'null') as Summary | null;
    return parsed && typeof parsed.text === 'string' && typeof parsed.upTo === 'number' ? { ...parsed, covers: Number(parsed.covers) || 0 } : null;
  } catch {
    return null;
  }
}

/** The rolling summary of the older part of the chat (memory.ts), kept with the conversation. */
let summary: Summary | null = loadSummary();
let summarizing = false;
let summaryRetryAt = 0;
/** Bumped by clear(), so a summary that comes back after the chat was cleared is dropped. */
let generation = 0;

function setSummary(next: Summary | null) {
  summary = next;
  try {
    if (next) sessionStorage.setItem(SUMMARY_KEY, JSON.stringify(next));
    else sessionStorage.removeItem(SUMMARY_KEY);
  } catch {
    /* private mode */
  }
}

/** The voice booking's place (bookingFlow.ts on the server): sent with each line, replaced by each reply's `flow` event. */
let callFlow: unknown = null;

let state: CopilotState = { messages: load(), busy: false, open: false, heroVisible: false, draft: '' };
let nextId = state.messages.reduce((max, m) => Math.max(max, m.id), 0) + 1;
const listeners = new Set<() => void>();
let abort: AbortController | null = null;
let navigateFn: ((path: string) => void) | null = null;
let pass: { value: string; at: number } | null = null;

function set(patch: Partial<CopilotState>) {
  if (patch.messages) patch = { ...patch, messages: capPage(patch.messages) };
  state = { ...state, ...patch };
  if (patch.messages) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state.messages.slice(-60)));
    } catch {
      /* private mode: the chat still works, it just won't survive a reload */
    }
  }
  listeners.forEach((fn) => fn());
}

function patchMessage(id: number, patch: (m: CopilotMessage) => Partial<CopilotMessage>) {
  set({ messages: state.messages.map((m) => (m.id === id ? { ...m, ...patch(m) } : m)) });
}

const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export const useCopilot = () => useSyncExternalStore(subscribe, () => state, () => state);

/**
 * Typed reveal. An answer that arrives whole (an instant answer, or the built-in index) would
 * pop onto the screen, so every reply's text goes through a queue that shows it a few characters
 * at a time, after a short "thinking" pause. A live model stream flows through the same queue and
 * is barely slowed, because the speed rises with the backlog. Voice turns skip it.
 */
const THINK_MS = 650;
const TICK_MS = 28;
type Reveal = {
  target: string;
  shown: number;
  instant: boolean;
  startAt: number;
  timer: ReturnType<typeof setTimeout> | null;
  waiters: Array<() => void>;
};
const reveals = new Map<number, Reveal>();

function revealFor(id: number, instant = false): Reveal {
  let reveal = reveals.get(id);
  if (!reveal) {
    reveal = { target: '', shown: 0, instant, startAt: Date.now() + (instant ? 0 : THINK_MS), timer: null, waiters: [] };
    reveals.set(id, reveal);
  }
  return reveal;
}

const typed = (reveal: Reveal) => reveal.shown >= reveal.target.length;

function release(reveal: Reveal) {
  for (const done of reveal.waiters.splice(0)) done();
}

function pump(id: number) {
  const reveal = reveals.get(id);
  if (!reveal || reveal.timer) return;
  const step = () => {
    reveal.timer = null;
    const wait = reveal.startAt - Date.now();
    if (wait > 0 && !reveal.instant) {
      reveal.timer = setTimeout(step, wait);
      return;
    }
    const backlog = reveal.target.length - reveal.shown;
    if (backlog > 0) {
      reveal.shown += reveal.instant ? backlog : Math.min(backlog, Math.max(2, Math.ceil(backlog / 30)));
      patchMessage(id, () => ({ text: reveal.target.slice(0, reveal.shown) }));
    }
    if (typed(reveal)) release(reveal);
    else reveal.timer = setTimeout(step, TICK_MS);
  };
  reveal.timer = setTimeout(step, 0);
}

function pushText(id: number, text: string, replace = false) {
  const reveal = revealFor(id);
  if (replace) {
    reveal.target = text;
    reveal.shown = 0;
    patchMessage(id, () => ({ text: '' }));
  } else {
    reveal.target += text;
  }
  pump(id);
}

/** Resolves once everything queued for this reply is on screen. */
function untilTyped(id: number): Promise<void> {
  const reveal = reveals.get(id);
  if (!reveal || typed(reveal)) return Promise.resolve();
  return new Promise((resolve) => reveal.waiters.push(resolve));
}

/** Show everything queued at once (a stopped or interrupted reply) and drop the queue. */
function flushText(id: number) {
  const reveal = reveals.get(id);
  if (!reveal) return;
  if (reveal.timer) clearTimeout(reveal.timer);
  reveal.timer = null;
  reveal.shown = reveal.target.length;
  patchMessage(id, () => ({ text: reveal.target }));
  release(reveal);
}

/** The list page a detail page belongs to, or null for any other path. */
function detailParent(path: string): string | null {
  if (/^\/blogs\/[^/]+$/.test(path)) return '/blogs';
  if (/^\/work\/[^/]+$/.test(path)) return '/#work';
  if (/^\/research\/papers\/[^/]+$/.test(path)) return '/research';
  return null;
}

const pause = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

/** The moon's words for a step of a walk, in its bubble, and said aloud for a text-chat visitor. */
function walkSay(step: WalkStep, aloud: boolean, ms?: number) {
  const words = walkLine(step, aloud);
  if (words) agentCursor.say([words], ms);
}

/** Waits for a link to a path to be on the page; null if it never shows up. */
async function linkFor(path: string, ms = 3000): Promise<HTMLElement | null> {
  for (let waited = 0; waited <= ms; waited += 120) {
    const link = document.querySelector<HTMLElement>(`a[href="${path.replace(/"/g, '')}"]`);
    if (link) return link;
    await pause(120);
  }
  return null;
}

/**
 * Opens a detail page the way a visitor would, with the agent's cursor doing each step: to the list page through its
 * link, a slow scroll to the card, a press on the card, and then the new page's title. If the card cannot be found it
 * simply goes there.
 */
async function journey(path: string, aloud = false) {
  const list = detailParent(path);
  if (!list) return;
  agentCursor.release(25_000);
  walkSay('start', aloud, 2600);
  let card = document.querySelector<HTMLElement>(`a[href="${path.replace(/"/g, '')}"]`);
  if (!card) {
    // Not on this page: go to the list page first, by pressing its link.
    await agentCursor.pointAtLinkFor(list);
    if (navigateFn) navigateFn(list);
    else window.location.assign(list);
    const hash = list.split('#')[1];
    for (let tries = 0; tries < 25 && hash && !document.getElementById(hash); tries += 1) await pause(120);
    card = await linkFor(path);
  }
  if (!card) {
    if (navigateFn) navigateFn(path);
    else window.location.assign(path);
    agentCursor.release(4000);
    return;
  }
  // Scroll to the card slowly, wheel and all, then point at it and press.
  await scrollToCard(card, aloud);
  if (aloud) await walkIdle();
  walkSay('found', aloud);
  await agentCursor.pointAtLinkFor(path);
  card.click();
  // On the new page: back to the top, and the cursor taps its title.
  await pause(500);
  for (let tries = 0; tries < 25 && window.location.pathname !== path; tries += 1) await pause(120);
  scrollStageToTop({ slow: false });
  await pause(500);
  await agentCursor.pointAtElement(document.querySelector('main h1, h1'));
  agentCursor.release(6000);
}

/** The height of the screen the visitor can see: on a phone, above the keyboard. */
const screenHeight = () => window.visualViewport?.height ?? window.innerHeight;

/** The card is where the cursor can reach it: its middle on screen, below the header. */
function cardInReach(card: HTMLElement): boolean {
  const rect = card.getBoundingClientRect();
  const middle = rect.top + rect.height / 2;
  return rect.height > 0 && middle >= 130 && middle <= screenHeight() - 70;
}

/**
 * Scrolls a card slowly to the middle of the screen, wheel and all, unless it is already where the cursor can reach it.
 * A phone can move the page under the glide (the keyboard closing, a late image), so where the card ended up is checked,
 * and a card that is still out of reach is put in place at once.
 */
async function scrollToCard(card: HTMLElement, aloud = false) {
  for (let attempt = 0; attempt < 2 && !cardInReach(card); attempt += 1) {
    const rect = card.getBoundingClientRect();
    // Land the card in the middle of the screen (or just under the header when it is taller than the window).
    const offset = -Math.max(110, (screenHeight() - rect.height) / 2);
    const seconds = scrollStageToElement(card, { slow: true, offset });
    if (seconds > 0) {
      if (attempt === 0) walkSay('scroll', aloud, Math.max(2600, seconds * 1000));
      agentCursor.startScroll(rect.top > 0 ? 'down' : 'up', seconds * 1000);
      await pause(seconds * 1000);
    }
    await agentCursor.settle(card);
  }
  if (!cardInReach(card)) {
    setStageScroll(card.getBoundingClientRect().top + window.scrollY - Math.max(110, (screenHeight() - card.offsetHeight) / 2));
    await agentCursor.settle(card);
  }
}

/** On a phone, a chip pressed while typing closes the keyboard: wait for the screen to grow back before measuring anything. */
async function keyboardDown() {
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  const viewport = window.visualViewport;
  if (!viewport) return;
  for (let waited = 0; waited < 900 && viewport.height < window.innerHeight - 80; waited += 60) await pause(60);
  await pause(120);
}

/**
 * On a call, project cards in the chat are not seen (the visitor is listening, and there are no chips), so the page shows
 * them instead: to the work list if they are not on this page, then down the list, pointing at each card in turn. Resolves
 * once the first card is on screen, so the answer is spoken while the rest are shown.
 */
async function showCards(slugs: string[]) {
  const paths = slugs.map((slug) => `/work/${slug}`);
  agentCursor.release(25_000);
  if (!document.querySelector(`a[href="${paths[0]}"]`)) await copilot.go('/#work', { slow: true, agent: true });
  const cards: HTMLElement[] = [];
  for (const path of paths) {
    const card = await linkFor(path, cards.length ? 0 : 3000);
    if (card) cards.push(card);
  }
  // Top to bottom, so the page only ever scrolls down.
  cards.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
  if (!cards.length) return;
  await scrollToCard(cards[0]);
  await agentCursor.pointAtElement(cards[0]);
  void (async () => {
    for (const card of cards.slice(1)) {
      await pause(1800);
      await scrollToCard(card);
      await agentCursor.pointAtElement(card);
    }
    agentCursor.release(3000);
  })();
}

/** The heading a cite points at: by its anchor, else by its text (a heading the page numbers or styles differently). */
function headingFor(anchor: string, heading: string): HTMLElement | null {
  const byId = document.getElementById(anchor);
  if (byId) return byId;
  const wanted = heading.replace(/\s+/g, ' ').trim().toLowerCase();
  for (const candidate of document.querySelectorAll<HTMLElement>('main h2, main h3, h2, h3')) {
    if ((candidate.textContent ?? '').replace(/\s+/g, ' ').trim().toLowerCase() === wanted) return candidate;
  }
  return null;
}

/**
 * Cites a section the way a person would show it: get to the page (through its list, with the cursor, if it is not
 * there), scroll slowly to the heading, tap it, then mark the quoted passage. If the heading is not on the page it
 * stays where it is and says nothing more.
 */
let citeQueue: Promise<void> = Promise.resolve();
/** Several citations in one answer are walked to one after the other, never at once. */
function cite(action: Extract<CopilotAction, { kind: 'cite' }>, holdMs?: number): Promise<void> {
  const run = citeQueue.then(() => walkTo(action, holdMs)).catch(() => undefined);
  citeQueue = run;
  return run;
}

/** `holdMs` is how long the passage takes to speak: the moon stays at the heading and the quote stays lit for that long. */
async function walkTo(action: Extract<CopilotAction, { kind: 'cite' }>, holdMs = 14_000) {
  for (const step of planRoute(window.location.pathname, action.path, action.anchor)) {
    if (step.kind === 'page') await copilot.go(step.path, { slow: true, agent: true });
  }
  // The post or paper may still be loading from the API.
  let heading: HTMLElement | null = null;
  for (let waited = 0; waited <= 6000 && !heading; waited += 150) {
    heading = headingFor(action.anchor, action.heading);
    if (!heading) await pause(150);
  }
  if (!heading) {
    agentCursor.release(2500);
    return;
  }
  clearQuote();
  agentCursor.release(holdMs + 4000);
  // The heading sits in the upper third of the screen; if it already does, the page does not move.
  const rect = heading.getBoundingClientRect();
  const inView = rect.top >= 90 && rect.top <= window.innerHeight * 0.38;
  if (!inView) {
    const down = rect.top > 0;
    const seconds = scrollStageToElement(heading, { slow: true, offset: -Math.round(window.innerHeight * 0.22) });
    if (seconds > 0) {
      agentCursor.startScroll(down ? 'down' : 'up', seconds * 1000);
      await pause(seconds * 1000 + 250);
    }
  }
  // Tap the heading from the margin beside it and stay there while the passage is spoken.
  await agentCursor.perch(heading);
  if (action.quote) highlightQuote(heading, action.quote, holdMs);
  await pause(Math.min(holdMs, 1500));
  agentCursor.release(Math.max(0, holdMs - 1500) + 1500);
}

/** The citations of a summary: one continuous swipe through the post while he talks (takeSwipe). */
let pendingSwipe: Array<Extract<CopilotAction, { kind: 'cite' }>> = [];
let stopSwipe: (() => void) | null = null;

/** Pages that are a list of cards: when the call takes the visitor to one, the page is scrolled through while the answer is spoken. */
const LIST_PAGE = /^\/(?:research|blogs|work)\/?$|^\/?#work$/;
let listMove = false;

/**
 * Scrolls down through a list page, slowly, for as long as the answer takes to say, so every card is on the screen as it is
 * talked about (2026-11-05: "it said eleven papers and I could only see the first few"). The visitor's own wheel, touch or key
 * hands the page back at once. At most a few screens: far enough to show the list, short enough not to lose its top.
 */
function scrollThroughList(durationMs: number) {
  stopSwipe?.();
  const startY = window.scrollY;
  const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const endY = Math.min(maxY, startY + window.innerHeight * 3.5);
  if (endY - startY < 40) return;
  const started = performance.now();
  let frame = 0;
  agentCursor.startScroll('down', durationMs);
  const cancel = () => {
    cancelAnimationFrame(frame);
    window.removeEventListener('wheel', cancel);
    window.removeEventListener('touchstart', cancel);
    window.removeEventListener('keydown', cancel);
    agentCursor.startScroll('down', 0);
    if (stopSwipe === cancel) stopSwipe = null;
  };
  stopSwipe = cancel;
  window.addEventListener('wheel', cancel, { passive: true });
  window.addEventListener('touchstart', cancel, { passive: true });
  window.addEventListener('keydown', cancel);
  const tick = () => {
    const t = Math.min(1, (performance.now() - started) / durationMs);
    const eased = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
    setStageScroll(startY + (endY - startY) * eased);
    if (t >= 1) cancel();
    else frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
}

/**
 * Speaks a summary by swiping: the page moves through the post in step with the speech, a quick leg to each heading that
 * puts it in the upper third just as its sentence starts, then holds still with that heading lit while it is spoken. The moon stays under the swipe.
 * Length and pace follow the estimated speech (`cps` characters a second), and any wheel or touch from the visitor ends it.
 */
function swipeThrough(answer: string, cites: Array<Extract<CopilotAction, { kind: 'cite' }>>, cps: number) {
  stopSwipe?.();
  // Each passage is in place on the sentence where it is spoken, the first included.
  const later = passageSchedule(answer, cites.slice(1), { seen: new Set([`${cites[0].path}#${cites[0].anchor}`]), minDwell: 40 });
  const items = [{ cite: cites[0], el: null as HTMLElement | null }, ...later.map((p) => ({ cite: p.cite, el: null as HTMLElement | null }))];
  const firstAt = sentenceStart(answer, citeAt(answer, cites[0], 0, cites.length));
  const plan = swipePlan(answer.length, [firstAt, ...later.map((p) => Math.max(p.at, firstAt))], cps);
  const startY = window.scrollY;
  const started = performance.now();
  let frame = 0;
  let active = -1;
  agentCursor.release(plan.end * 1000 + 3000);
  agentCursor.startScroll('down', plan.end * 1000);
  const cancel = () => {
    cancelAnimationFrame(frame);
    window.removeEventListener('wheel', cancel);
    window.removeEventListener('touchstart', cancel);
    agentCursor.startScroll('down', 0);
    clearQuote();
    document.querySelectorAll('[data-agent-quote]').forEach((el) => el.removeAttribute('data-agent-quote'));
    if (stopSwipe === cancel) stopSwipe = null;
  };
  stopSwipe = cancel;
  window.addEventListener('wheel', cancel, { passive: true });
  window.addEventListener('touchstart', cancel, { passive: true });
  const tick = () => {
    const t = (performance.now() - started) / 1000;
    for (const item of items) item.el ??= headingFor(item.cite.anchor, item.cite.heading);
    // The scroll position that puts each heading a fifth of the way down, read live so the page is followed as it settles.
    // A heading not found keeps the page where the one before left it.
    const targets: number[] = [];
    for (const item of items) targets.push(item.el ? item.el.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.22 : (targets.at(-1) ?? startY));
    setStageScroll(swipeY(t, plan, targets, startY));
    let now = -1;
    plan.times.forEach((time, i) => {
      if (t >= time - 0.3) now = i;
    });
    if (now !== active && now >= 0) {
      active = now;
      clearQuote();
      const { el, cite } = items[now];
      if (el) {
        if (cite.quote) highlightQuote(el, cite.quote, ((plan.times[now + 1] ?? plan.end) - plan.times[now]) * 1000);
        el.setAttribute('data-agent-quote', '');
      }
    }
    if (t < plan.end + 0.3) frame = requestAnimationFrame(tick);
    else cancel();
  };
  frame = requestAnimationFrame(tick);
}

export const copilot = {
  setNavigate(fn: ((path: string) => void) | null) {
    navigateFn = fn;
  },
  setOpen: (open: boolean) => set({ open }),
  dismissBooking: () => set({ booking: null }),
  dismissSong: () => set({ song: null }),
  /** Where a song's status and audio are (backend route.ts, /songs/:id). */
  songUrl: (id: string, audio = false) => `${base()}/api/copilot/songs/${id}${audio ? '/audio' : ''}`,
  /** A call ended or the chat was cleared: a booking under way is over. */
  resetFlow: () => { callFlow = null; },
  setDraft: (draft: string) => set({ draft }),
  setHeroVisible: (heroVisible: boolean) => {
    if (state.heroVisible !== heroVisible) set({ heroVisible });
  },
  /** A saved line the call said aloud enters the conversation, so the server sees the offer when the visitor says yes. */
  noteSaid(text: string) {
    if (!text || state.busy) return;
    const last = state.messages.at(-1);
    // Two nudges in a row are one pending offer: the newest replaces the older one.
    const kept = last?.nudge ? state.messages.slice(0, -1) : state.messages;
    set({ messages: [...kept, { id: nextId++, role: 'assistant', text, steps: [], actions: [], streaming: false, nudge: true }] });
  },
  clear() {
    callFlow = null;
    abort?.abort();
    lastAsk = null;
    for (const id of [...reveals.keys()]) flushText(id);
    reveals.clear();
    generation += 1;
    setSummary(null);
    set({ messages: [], busy: false });
  },
  stop() {
    abort?.abort();
  },
  /** Scroll to a section, or change page with the app's router and then scroll. */
  go(path: string, options: { slow?: boolean; agent?: boolean; aloud?: boolean } = {}): Promise<void> {
    // A page deep in the site (a post, a project, a paper) is reached the way a person would: through its list page, scrolling
    // to the card, and clicking it.
    // From one paper to the next (or back) the visitor is already inside the list's pages: they go straight there, not out to the
    // list and back through a card, which took ten seconds and failed going backwards (2026-11-05, "Previous" stayed on the page).
    const sibling = detailParent(path) !== null && detailParent(path) === detailParent(window.location.pathname);
    if (options.agent && detailParent(path) && !path.includes('#') && !sibling) return journey(path, options.aloud);
    const [pathname, hash] = path.split('#');
    const scroll = () =>
      new Promise<void>((resolve) => {
        const target = hash ? document.getElementById(hash) : null;
        const down = target ? target.getBoundingClientRect().top > 0 : false;
        const seconds = hash ? scrollStageToElement(target, options) : scrollStageToTop(options);
        // On a call the cursor shows the scroll: a wheel moving down or up for as long as the page takes.
        if (options.agent && seconds > 0) agentCursor.startScroll(down ? 'down' : 'up', seconds * 1000);
        if (options.aloud && target && seconds > 0.6) walkSay('scroll', true, Math.max(2600, seconds * 1000));
        // Then it points at what it came to show: the section's heading, or the new page's title.
        if (options.agent) {
          const shown = target ?? document.querySelector('main h1, h1');
          window.setTimeout(() => {
            if (options.aloud && target) void walkIdle().then(() => walkSay('found', true));
            void agentCursor.pointAtElement(shown).then(() => resolve());
          }, seconds * 1000 + 150);
        } else resolve();
      });
    const run = (): Promise<void> => {
      if (options.agent) agentCursor.release(options.slow ? 9000 : 2500);
      if (options.aloud) walkSay('start', true, 2600);
      if (!pathname || pathname === window.location.pathname) return scroll();
      if (navigateFn) navigateFn(path);
      else window.location.assign(path);
      // The new page needs a moment to mount before its section exists.
      return new Promise<void>((resolve) => {
        let tries = 0;
        const wait = window.setInterval(() => {
          tries += 1;
          if (!hash || document.getElementById(hash) || tries > 25) {
            window.clearInterval(wait);
            void scroll().then(() => resolve());
          }
        }, 120);
      });
    };
    // On a call the agent's cursor glides to the link and presses it first, then the page moves.
    return options.agent ? agentCursor.pointAtLinkFor(path).then(run) : run();
  },
  /**
   * A navigation chip, or a "yes" to an offer to open a page: the moon comes in as a guest, goes to the link and presses it,
   * and leaves a moment after the page has arrived. On a phone the chat sheet closes first, since it would cover the target.
   */
  async guide(path: string): Promise<void> {
    preloadWalk();
    if (!window.matchMedia('(min-width: 821px)').matches) {
      set({ open: false });
      await keyboardDown();
    }
    return copilot.go(path, { slow: true, agent: true, aloud: true }).catch(() => agentCursor.hide());
  },
  /**
   * A page button printed in the chat: walk there, then summarise what it opened, so pressing it is never just a move.
   * The request carries the button's own path (with its section, such as /#experience), not the address bar's.
   */
  async openAndSummarise(path: string): Promise<void> {
    await copilot.guide(path);
    await copilot.send('Summarise this for me.', { path, title: document.title });
  },
  /** Point at a section of the page cited by the copilot (a chip click in text chat). The moon stays a few seconds, not a whole spoken passage. */
  cite: (action: Extract<CopilotAction, { kind: 'cite' }>) => {
    if (!window.matchMedia('(min-width: 821px)').matches) set({ open: false });
    return cite(action, CHIP_CITE_HOLD_MS);
  },
  /** The same, with how long its passage takes to speak (a call). */
  citeFor: cite,
  /** On a call, the moves the answer just given has started: the answer is spoken only once they are done. */
  takeMoves(): Promise<void> {
    const moves = pendingMoves;
    pendingMoves = [];
    return Promise.all(moves).then(() => undefined);
  },
  /** The later citations of the answer just given, each with the character where it is spoken, in order. */
  /** The summary's passages for the answer just given, to be swiped through as it is spoken (swipe). */
  takeSwipe() {
    const cites = pendingSwipe;
    pendingSwipe = [];
    return cites;
  },
  swipe: swipeThrough,
  /** Whether the answer just given moved the call to a list page that should be scrolled through as it is spoken. */
  takeListScroll() {
    const yes = listMove;
    listMove = false;
    return yes;
  },
  scrollList: scrollThroughList,
  stopSwipe: () => stopSwipe?.(),
  takeCites(answer: string) {
    const cites = pendingCites;
    pendingCites = [];
    return passageSchedule(answer, cites, { seen: new Set(firstCiteKey ? [firstCiteKey] : []) });
  },
  /** The scroll steps of the voice answer just given, to run as it is spoken. */
  takeSteps() {
    const steps = pendingSteps;
    pendingSteps = [];
    return steps;
  },
  /** A line the voice agent heard and dropped (another voice, an unsure mumble): on the thread, greyed, to answer anyway. */
  noteIgnored(text: string, reason: string, heardId: string) {
    if (!text.trim()) return;
    set({ messages: capPage([...state.messages, { id: nextId++, role: 'user', text: text.trim(), steps: [], actions: [], streaming: false, ignored: reason, heardId }]) });
  },
  /** While a call is up, voice.ts answers a greyed line aloud; with no call, it is asked as typed. */
  setIgnoredAnswerer(answerer: ((message: CopilotMessage) => Promise<void>) | null) {
    ignoredAnswerer = answerer;
  },
  /** "Answer this" on a greyed line: it was for the copilot after all. */
  async answerIgnored(id: number) {
    const message = state.messages.find((m) => m.id === id && m.ignored);
    if (!message || state.busy) return;
    set({ messages: state.messages.filter((m) => m.id !== id) });
    if (ignoredAnswerer) await ignoredAnswerer(message);
    else await copilot.send(message.text, { path: window.location.pathname, title: document.title }, { toMe: true });
  },
  async send(text: string, page: { path: string; title: string }, options: { typed?: boolean; voice?: boolean; toMe?: boolean } = {}) {
    const question = text.trim().slice(0, 2000);
    if (!question || state.busy) return '';
    // Pressing a button again ("Ask the copilot about X") must not send the same request over and over: while its
    // answer is the latest message, the repeat shows that answer instead of asking again. Voice turns are exempt,
    // since someone repeating themselves aloud means it.
    const voice = options.voice === true;
    if (!voice && options.typed !== false) {
      const key = askKey(question);
      const latest = state.messages.at(-1);
      if (lastAsk && lastAsk.key === key && Date.now() - lastAsk.at < DUPLICATE_MS && latest?.role === 'assistant' && !latest.error) {
        return latest.text;
      }
      lastAsk = { key, at: Date.now() };
    }
    const history = historyToSend(state.messages, summary);
    const userId = nextId++;
    const replyId = nextId++;
    set({
      busy: true,
      messages: [
        ...state.messages,
        { id: userId, role: 'user', text: question, steps: [], actions: [], streaming: false },
        { id: replyId, role: 'assistant', text: '', steps: [], actions: [], streaming: true },
      ],
    });
    revealFor(replyId, options.typed === false || voice);
    if (voice) voiceReplies.add(replyId);
    pendingSteps = [];
    pendingCites = [];
    citesThisTurn = 0;
    citedKeys.clear();
    pendingSwipe = [];
    firstCiteKey = '';
    abort = new AbortController();
    try {
      await stream([...history, { role: 'user', content: question }], page, replyId, abort.signal, false, voice, summary, options.toMe === true);
    } catch (error) {
      if (abort.signal.aborted) {
        flushText(replyId);
        patchMessage(replyId, (m) => ({ streaming: false, text: m.text || 'Stopped.' }));
      } else {
        flushText(replyId);
        const partial = state.messages.find((m) => m.id === replyId)?.text;
        if (partial) patchMessage(replyId, (m) => ({ text: `${m.text}\n\nThe response was interrupted. Please try again.`, error: true }));
        else answerOffline(question, replyId, error instanceof ApiError ? error.status : 0);
      }
    } finally {
      await untilTyped(replyId);
      reveals.delete(replyId);
      voiceReplies.delete(replyId);
      patchMessage(replyId, () => ({ streaming: false, steps: [] }));
      set({ busy: false });
      abort = null;
    }
    void condense();
    const answer = state.messages.find((message) => message.id === replyId);
    return answer?.error ? 'Sorry, the response was interrupted. Please try again.' : answer?.text ?? '';
  },
};

/**
 * Once the chat is long, ask the server to condense its older turns into the rolling summary (old summary plus the
 * newly dropped turns, never from scratch). In the background, one at a time; if it fails, the plain trim in
 * historyToSend stays in force and the next try waits RETRY_MS.
 */
async function condense() {
  if (summarizing || Date.now() < summaryRetryAt) return;
  const plan = planSummary(state.messages, summary);
  if (!plan) return;
  summarizing = true;
  const mine = generation;
  try {
    const res = await fetch(`${base()}/api/copilot/summarize`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-copilot-pass': await getPass() },
      body: JSON.stringify({ previous: summary?.text, messages: plan.cover.map((m) => ({ role: m.role, content: m.text.slice(0, 2000) })) }),
      signal: AbortSignal.timeout(12_000),
    });
    const data = res.ok ? ((await res.json()) as { summary?: unknown }) : null;
    if (mine !== generation) return;
    if (typeof data?.summary !== 'string' || !data.summary.trim()) throw new Error('no summary');
    setSummary({ text: data.summary.trim(), upTo: plan.upTo, covers: (summary?.covers ?? 0) + plan.cover.length });
  } catch {
    summaryRetryAt = Date.now() + RETRY_MS;
  } finally {
    summarizing = false;
  }
}

class ApiError extends Error {
  constructor(readonly status: number) {
    super(`copilot ${status}`);
  }
}

const base = () => getAuthApiBaseUrl() ?? '';

async function getPass(force = false, signal?: AbortSignal): Promise<string> {
  if (!force && pass && Date.now() - pass.at < 100 * 60_000) return pass.value;
  const config = (await (await fetch(`${base()}/api/copilot/config`, { signal })).json()) as { turnstileSiteKey: string | null };
  const token = config.turnstileSiteKey ? await getTurnstileToken(config.turnstileSiteKey, signal) : '';
  let visitor: string | null = null;
  try { visitor = localStorage.getItem(VISITOR_KEY); } catch { /* IP limits still apply when storage is blocked. */ }
  const res = await fetch(`${base()}/api/copilot/pass`, {
    method: 'POST',
    signal,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token, visitor }),
  });
  if (!res.ok) throw new ApiError(res.status);
  const issued = (await res.json()) as { pass: string; visitor?: string };
  if (issued.visitor) {
    try { localStorage.setItem(VISITOR_KEY, issued.visitor); } catch { /* storage is optional */ }
  }
  pass = { value: issued.pass, at: Date.now() };
  return pass.value;
}

/**
 * Sends the contact page's message form through the API (TASK-DB-0148), with the chat's visitor pass, so the same
 * human check guards it. True only when the API says it was emailed.
 */
export async function sendSiteMessage(body: { name: string; email: string; message: string; area?: string }): Promise<boolean> {
  const send = async (force: boolean) =>
    fetch(`${base()}/api/copilot/message`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-copilot-pass': await getPass(force) },
      body: JSON.stringify(body),
    });
  let res = await send(false);
  // An expired pass is renewed once.
  if (res.status === 401) res = await send(true);
  const data = (await res.json().catch(() => null)) as { ok?: unknown } | null;
  return res.ok && data?.ok === true;
}

/** Whether the API can email a message (the contact form shows as not open otherwise). */
export async function siteMessagesOpen(): Promise<boolean> {
  try {
    const config = (await (await fetch(`${base()}/api/copilot/config`)).json()) as { messages?: unknown };
    return config.messages === true;
  } catch {
    return false;
  }
}

/** Obtain a short-lived room grant using the same visitor pass as text chat. */
/** The API gives the voice service two tries of 25 seconds each when it has to wake up, so the page waits for both. */
const GRANT_MS = 55_000;

export async function requestVoiceGrant(signal?: AbortSignal): Promise<{ url: string; token: string; call?: string }> {
  const request = async () => fetch(`${base()}/api/copilot/voice`, {
    method: 'POST', headers: { 'x-copilot-pass': await getPass(false, signal) },
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(GRANT_MS)]) : AbortSignal.timeout(GRANT_MS),
  });
  let response = await request();
  if (response.status === 401) {
    pass = null;
    response = await request();
  }
  if (!response.ok) throw new ApiError(response.status);
  return response.json() as Promise<{ url: string; token: string; call?: string }>;
}

let warmedAt = 0;
/** Wakes the voice service while the visitor is still reading, so a call does not start against a sleeping one. */
export function warmVoice() {
  if (Date.now() - warmedAt < 4 * 60_000) return;
  warmedAt = Date.now();
  void fetch(`${base()}/api/copilot/voice/warm`, { method: 'POST', keepalive: true }).catch(() => undefined);
}

async function stream(
  messages: Array<{ role: string; content: string }>,
  page: { path: string; title: string },
  replyId: number,
  signal: AbortSignal,
  retried = false,
  voice = false,
  notes: Summary | null = null,
  toMe = false,
): Promise<void> {
  const res = await fetch(`${base()}/api/copilot/chat`, {
    method: 'POST',
    signal,
    headers: { 'content-type': 'application/json', 'x-copilot-pass': await getPass(false, signal) },
    // `toMe`: the visitor said this line was for the copilot ("Answer this"), so the server does not ask whether it was.
    body: JSON.stringify({ messages, page, voice, ...(toMe ? { toMe } : {}), ...(voice && callFlow ? { flow: callFlow } : {}), ...(notes ? { summary: notes.text, covered: notes.covers } : {}) }),
  });
  if (res.status === 401 && !retried) {
    pass = null;
    return stream(messages, page, replyId, signal, true, voice, notes, toMe);
  }
  if (!res.ok || !res.body) throw new ApiError(res.status);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let completed = false;
  for (;;) {
    // A model that goes quiet mid-answer must not leave the chat stuck: after a long silence, give up on the stream.
    let stall: ReturnType<typeof setTimeout> | undefined;
    const quiet = new Promise<never>((_, reject) => {
      stall = setTimeout(() => reject(new Error('copilot stream stalled')), STALL_MS);
    });
    const { done, value } = await Promise.race([reader.read(), quiet]).finally(() => clearTimeout(stall));
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let newline: number;
    while ((newline = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      if (line) {
        const event = JSON.parse(line) as Event;
        if (event.type === 'error') throw new Error(event.message);
        handle(event, replyId);
        if (event.type === 'done') completed = true;
      }
    }
  }
  if (!completed) throw new Error('incomplete copilot stream');
}

function handle(event: Event, replyId: number) {
  if (event.type === 'text') {
    // `replace` arrives when the server retracts text it already streamed: a reasoning
    // block that leaked as answer text, or a "let me look that up" line before a tool call.
    pushText(replyId, event.text, event.replace);
  } else if (event.type === 'step') {
    patchMessage(replyId, (m) => ({
      steps: event.status === 'start' ? [...m.steps, event.name] : m.steps.filter((s) => s !== event.name),
    }));
  } else if (event.type === 'action') {
    if (event.action.kind === 'scrollstep') {
      pendingSteps.push({ path: event.action.path, at: event.action.at });
      return;
    }
    if (event.action.kind === 'cite' && voiceReplies.has(replyId)) {
      // On a call it happens before the answer is spoken, after any page move this answer made (the pages load in turn).
      // The first happens before the answer is spoken; later ones as he reaches them (takeCites).
      const action = event.action;
      // At most MAX_CITES moves in one answer, and a section is never visited twice.
      const key = `${action.path}#${action.anchor}`;
      if (citesThisTurn >= MAX_CITES || citedKeys.has(key)) return;
      citedKeys.add(key);
      citesThisTurn += 1;
      if (action.mode === 'swipe') {
        // A summary: only get to the page now; the swiping happens as he speaks (takeSwipe).
        if (citesThisTurn === 1) {
          const before = Promise.all(pendingMoves);
          pendingMoves.push(before.then(() => (window.location.pathname === action.path ? undefined : copilot.go(action.path, { slow: true, agent: true }))).catch(() => undefined));
        }
        pendingSwipe.push(action);
        return;
      }
      if (citesThisTurn === 1) {
        firstCiteKey = key;
        const before = Promise.all(pendingMoves);
        pendingMoves.push(before.then(() => cite(action)).catch(() => undefined));
      } else pendingCites.push(action);
      return;
    }
    if (event.action.kind === 'book' && voiceReplies.has(replyId)) {
      // A call has no chips (the page moves instead), but the person has just given a name and an email to book: the button
      // to pick a time must be on the screen, and not left to a chat thread nobody is reading.
      const { url, name, email, topic } = event.action;
      set({ booking: { url, name, email, topic } });
      return;
    }
    if (event.action.kind === 'song' && voiceReplies.has(replyId)) {
      // Like the booking button: the song plays from a card over the page, since nobody on a call reads the chat.
      set({ song: { id: event.action.id, title: event.action.title } });
      return;
    }
    if (event.action.kind === 'projects' && voiceReplies.has(replyId)) {
      const slugs = event.action.slugs;
      const before = Promise.all(pendingMoves);
      pendingMoves.push(before.then(() => showCards(slugs)).catch(() => undefined));
      return;
    }
    // Chips appear once the text has been typed. On a call there are no chips: the page moves instead.
    if (!voiceReplies.has(replyId)) {
      void untilTyped(replyId).then(() => patchMessage(replyId, (m) => ({ actions: [...m.actions, event.action] })));
    }
    // The server sets `go` only after the visitor said yes to an offer. On desktop the
    // panel stays open through the move; the draft lives in the store, so it survives.
    if (event.action.kind === 'navigate' && event.action.go) {
      // On a call the page moves and the side panel stays shut: the visitor is listening, not reading.
      if (!voiceReplies.has(replyId) && window.matchMedia('(min-width: 821px)').matches) copilot.setOpen(true);
      const onCall = voiceReplies.has(replyId);
      // Typed or spoken, the moon takes the visitor there.
      const move = onCall ? copilot.go(event.action.path, { slow: true, agent: true }) : copilot.guide(event.action.path);
      if (onCall) {
        pendingMoves.push(move);
        listMove = LIST_PAGE.test(event.action.path);
      }
    }
  } else if (event.type === 'flow') {
    callFlow = event.flow;
  } else if (event.type === 'ignored') {
    // On a call the line was said to someone else in the visitor's room: no reply, and the line stays, greyed, to answer anyway.
    set({ messages: state.messages.filter((m) => m.id !== replyId).map((m) => (m.id === replyId - 1 ? { ...m, ignored: event.reason } : m)) });
  } else if (event.type === 'error') {
    patchMessage(replyId, (m) => ({ text: m.text || event.message, error: !m.text }));
  } else if (event.type === 'done') {
    patchMessage(replyId, () => ({ model: event.model || 'live model' }));
    if (!voiceReplies.has(replyId)) {
      const text = state.messages.find((m) => m.id === replyId)?.text;
      if (text) typedReply.hook?.(text);
    }
  }
}

/** The built-in index answers when the API is not reachable or over its limit. */
function answerOffline(question: string, replyId: number, status: number) {
  if (status === 429) {
    patchMessage(replyId, () => ({
      text: "You're asking faster than I can answer. Give it a minute and try again.",
      error: true,
    }));
    return;
  }
  const reply = localAnswer(question);
  const actions: CopilotAction[] = [];
  if (reply.projects?.length) actions.push({ kind: 'projects', slugs: reply.projects.map((p: CopilotProject) => p.slug) });
  for (const action of reply.actions ?? []) {
    actions.push(action.kind === 'scroll' ? { kind: 'navigate', path: action.target.replace(/^#/, '/#'), label: action.label } : { kind: 'link', label: action.label, url: action.href });
  }
  pushText(replyId, reply.text);
  patchMessage(replyId, () => ({ offline: true }));
  void untilTyped(replyId).then(() => patchMessage(replyId, () => ({ actions })));
}

// Development only: a handle for trying the copilot from the console.
if (import.meta.env.DEV && typeof window !== 'undefined') (window as unknown as { __copilot?: typeof copilot }).__copilot = copilot;
