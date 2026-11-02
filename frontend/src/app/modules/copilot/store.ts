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

export type CopilotAction =
  | { kind: 'navigate'; path: string; label: string }
  | { kind: 'projects'; slugs: string[] }
  | { kind: 'link'; label: string; url: string }
  | { kind: 'book'; url: string; name?: string; email?: string; topic?: string };

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
};

type Event =
  | { type: 'text'; text: string }
  | { type: 'action'; action: CopilotAction }
  | { type: 'step'; name: string; status: 'start' | 'done' | 'error' }
  | { type: 'done'; model: string }
  | { type: 'error'; message: string };

const STORAGE_KEY = 'db-copilot-v1';
const MAX_HISTORY = 20;

function load(): CopilotMessage[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as CopilotMessage[]) : [];
    return parsed.map((m) => ({ ...m, streaming: false, steps: [] }));
  } catch {
    return [];
  }
}

let state: CopilotState = { messages: load(), busy: false, open: false, heroVisible: false };
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

export const copilot = {
  setNavigate(fn: ((path: string) => void) | null) {
    navigateFn = fn;
  },
  setOpen: (open: boolean) => set({ open }),
  setHeroVisible: (heroVisible: boolean) => {
    if (state.heroVisible !== heroVisible) set({ heroVisible });
  },
  clear() {
    abort?.abort();
    set({ messages: [], busy: false });
  },
  stop() {
    abort?.abort();
  },
  /** Scroll to a section, or change page with the app's router and then scroll. */
  go(path: string) {
    const [pathname, hash] = path.split('#');
    const scroll = () => {
      if (!hash) return window.scrollTo({ top: 0, behavior: 'smooth' });
      const target = document.getElementById(hash);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return undefined;
    };
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
  },
  async send(text: string, page: { path: string; title: string }) {
    const question = text.trim().slice(0, 2000);
    if (!question || state.busy) return;
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
    abort = new AbortController();
    try {
      await stream([...history, { role: 'user', content: question }], page, replyId, abort.signal);
    } catch (error) {
      if (abort.signal.aborted) {
        patchMessage(replyId, (m) => ({ streaming: false, text: m.text || 'Stopped.' }));
      } else {
        answerOffline(question, replyId, error instanceof ApiError ? error.status : 0);
      }
    } finally {
      patchMessage(replyId, () => ({ streaming: false, steps: [] }));
      set({ busy: false });
      abort = null;
    }
  },
};

class ApiError extends Error {
  constructor(readonly status: number) {
    super(`copilot ${status}`);
  }
}

const base = () => getAuthApiBaseUrl() ?? '';

async function getPass(force = false): Promise<string> {
  if (!force && pass && Date.now() - pass.at < 100 * 60_000) return pass.value;
  const config = (await (await fetch(`${base()}/api/copilot/config`)).json()) as { turnstileSiteKey: string | null };
  const token = config.turnstileSiteKey ? await getTurnstileToken(config.turnstileSiteKey) : '';
  const res = await fetch(`${base()}/api/copilot/pass`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) throw new ApiError(res.status);
  pass = { value: ((await res.json()) as { pass: string }).pass, at: Date.now() };
  return pass.value;
}

async function stream(
  messages: Array<{ role: string; content: string }>,
  page: { path: string; title: string },
  replyId: number,
  signal: AbortSignal,
  retried = false,
): Promise<void> {
  const res = await fetch(`${base()}/api/copilot/chat`, {
    method: 'POST',
    signal,
    headers: { 'content-type': 'application/json', 'x-copilot-pass': await getPass() },
    body: JSON.stringify({ messages, page }),
  });
  if (res.status === 401 && !retried) {
    pass = null;
    return stream(messages, page, replyId, signal, true);
  }
  if (!res.ok || !res.body) throw new ApiError(res.status);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let newline: number;
    while ((newline = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      if (line) handle(JSON.parse(line) as Event, replyId);
    }
  }
}

function handle(event: Event, replyId: number) {
  if (event.type === 'text') {
    patchMessage(replyId, (m) => ({ text: m.text + event.text }));
  } else if (event.type === 'step') {
    patchMessage(replyId, (m) => ({
      steps: event.status === 'start' ? [...m.steps, event.name] : m.steps.filter((s) => s !== event.name),
    }));
  } else if (event.type === 'action') {
    patchMessage(replyId, (m) => ({ actions: [...m.actions, event.action] }));
    // Moving the page is the point of a tour: do it as the model says it.
    if (event.action.kind === 'navigate') copilot.go(event.action.path);
  } else if (event.type === 'error') {
    patchMessage(replyId, (m) => ({ text: m.text || event.message, error: !m.text }));
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
  patchMessage(replyId, () => ({ text: reply.text, actions, offline: true }));
}
