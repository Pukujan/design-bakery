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
import { scrollStageToElement, scrollStageToTop } from '../lab/stageScroll';
import { agentCursor } from './agentCursor';

export type CopilotAction =
  /** `go` is set only when the visitor has just confirmed the move; otherwise it is a chip. */
  | { kind: 'navigate'; path: string; label: string; go?: boolean }
  | { kind: 'projects'; slugs: string[] }
  | { kind: 'link'; label: string; url: string }
  | { kind: 'book'; url: string; name?: string; email?: string; topic?: string }
  /** Voice calls only: scroll to a section when the spoken answer reaches character `at` (never shown as a chip). */
  | { kind: 'scrollstep'; path: string; at: number };

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
};

export type CopilotState = {
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
  | { type: 'error'; message: string };

const STORAGE_KEY = 'db-copilot-v1';
const VISITOR_KEY = 'db-copilot-visitor-v1';
const MAX_HISTORY = 20;
/** The same question asked again within this long, straight after its own answer, is not sent a second time. */
const DUPLICATE_MS = 30_000;
const askKey = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
let lastAsk: { key: string; at: number } | null = null;
/** Replies that belong to a voice call: they never open the side panel, and they may move the page on their own. */
const voiceReplies = new Set<number>();
/** Set by voice.ts: called with a finished typed reply, so a call can speak the ones it has a recording for. */
export const typedReply: { hook?: (text: string) => void } = {};
let pendingSteps: Array<{ path: string; at: number }> = [];
/** How long a reply may go without a single event before the chat stops waiting for it. */
const STALL_MS = 25_000;

function load(): CopilotMessage[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as CopilotMessage[]) : [];
    return parsed.map((m) => ({ ...m, streaming: false, steps: [] }));
  } catch {
    return [];
  }
}

let state: CopilotState = { messages: load(), busy: false, open: false, heroVisible: false, draft: '' };
let nextId = state.messages.reduce((max, m) => Math.max(max, m.id), 0) + 1;
const listeners = new Set<() => void>();
let abort: AbortController | null = null;
let navigateFn: ((path: string) => void) | null = null;
let pass: { value: string; at: number } | null = null;

function set(patch: Partial<CopilotState>) {
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
async function journey(path: string) {
  const list = detailParent(path);
  if (!list) return;
  agentCursor.release(25_000);
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
  const rect = card.getBoundingClientRect();
  const inView = rect.top >= 90 && rect.bottom <= window.innerHeight - 30;
  if (!inView) {
    const down = rect.top > 0;
    const seconds = scrollStageToElement(card, { slow: true });
    if (seconds > 0) {
      agentCursor.startScroll(down ? 'down' : 'up', seconds * 1000);
      await pause(seconds * 1000 + 250);
    }
  }
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

export const copilot = {
  setNavigate(fn: ((path: string) => void) | null) {
    navigateFn = fn;
  },
  setOpen: (open: boolean) => set({ open }),
  setDraft: (draft: string) => set({ draft }),
  setHeroVisible: (heroVisible: boolean) => {
    if (state.heroVisible !== heroVisible) set({ heroVisible });
  },
  clear() {
    abort?.abort();
    lastAsk = null;
    for (const id of [...reveals.keys()]) flushText(id);
    reveals.clear();
    set({ messages: [], busy: false });
  },
  stop() {
    abort?.abort();
  },
  /** Scroll to a section, or change page with the app's router and then scroll. */
  go(path: string, options: { slow?: boolean; agent?: boolean } = {}) {
    // A page deep in the site (a post, a project, a paper) is reached the way a person would: through its list page, scrolling
    // to the card, and clicking it.
    if (options.agent && detailParent(path) && !path.includes('#')) {
      void journey(path);
      return;
    }
    const [pathname, hash] = path.split('#');
    const scroll = () => {
      const target = hash ? document.getElementById(hash) : null;
      const down = target ? target.getBoundingClientRect().top > 0 : false;
      const seconds = hash ? scrollStageToElement(target, options) : scrollStageToTop(options);
      // On a call the cursor shows the scroll: a wheel moving down or up for as long as the page takes.
      if (options.agent && seconds > 0) agentCursor.startScroll(down ? 'down' : 'up', seconds * 1000);
      // Then it points at what it came to show: the section's heading, or the new page's title.
      if (options.agent) {
        const shown = target ?? document.querySelector('main h1, h1');
        window.setTimeout(() => void agentCursor.pointAtElement(shown), seconds * 1000 + 150);
      }
    };
    const run = () => {
      if (options.agent) agentCursor.release(options.slow ? 9000 : 2500);
      if (!pathname || pathname === window.location.pathname) {
        scroll();
        return;
      }
      if (navigateFn) navigateFn(path);
      else window.location.assign(path);
      // The new page needs a moment to mount before its section exists.
      let tries = 0;
      const wait = window.setInterval(() => {
        tries += 1;
        if (!hash || document.getElementById(hash) || tries > 25) {
          window.clearInterval(wait);
          scroll();
        }
      }, 120);
    };
    // On a call the agent's cursor glides to the link and presses it first, then the page moves.
    if (options.agent) void agentCursor.pointAtLinkFor(path).then(run);
    else run();
  },
  /** The scroll steps of the voice answer just given, to run as it is spoken. */
  takeSteps() {
    const steps = pendingSteps;
    pendingSteps = [];
    return steps;
  },
  async send(text: string, page: { path: string; title: string }, options: { typed?: boolean; voice?: boolean } = {}) {
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
    const history = state.messages
      .filter((m) => !m.error && m.text)
      .slice(-MAX_HISTORY)
      .map((m) => ({ role: m.role, content: m.text }));
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
    abort = new AbortController();
    try {
      await stream([...history, { role: 'user', content: question }], page, replyId, abort.signal, false, voice);
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
    const answer = state.messages.find((message) => message.id === replyId);
    return answer?.error ? 'Sorry, the response was interrupted. Please try again.' : answer?.text ?? '';
  },
};

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

/** Obtain a short-lived room grant using the same visitor pass as text chat. */
export async function requestVoiceGrant(signal?: AbortSignal): Promise<{ url: string; token: string }> {
  const request = async () => fetch(`${base()}/api/copilot/voice`, {
    method: 'POST', headers: { 'x-copilot-pass': await getPass(false, signal) },
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(15_000)]) : AbortSignal.timeout(15_000),
  });
  let response = await request();
  if (response.status === 401) {
    pass = null;
    response = await request();
  }
  if (!response.ok) throw new ApiError(response.status);
  return response.json() as Promise<{ url: string; token: string }>;
}

async function stream(
  messages: Array<{ role: string; content: string }>,
  page: { path: string; title: string },
  replyId: number,
  signal: AbortSignal,
  retried = false,
  voice = false,
): Promise<void> {
  const res = await fetch(`${base()}/api/copilot/chat`, {
    method: 'POST',
    signal,
    headers: { 'content-type': 'application/json', 'x-copilot-pass': await getPass(false, signal) },
    body: JSON.stringify({ messages, page, voice }),
  });
  if (res.status === 401 && !retried) {
    pass = null;
    return stream(messages, page, replyId, signal, true, voice);
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
      copilot.go(event.action.path, { slow: onCall, agent: onCall });
    }
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
