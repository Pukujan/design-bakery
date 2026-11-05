/**
 * Health watcher for the smart chain, adapted from pukujan-lab-2/nyc-map-agent
 * server/features/agent/health.ts (PR #36). Every five minutes each provider gets one
 * small streaming request that should call `search_site`; it is healthy only when the
 * tool call arrives. Failing providers move to the back of the chain but stay in it as
 * a last resort. Once a day each vault working key is renewed. State is in memory: one
 * Node process serves the API.
 */
import { isWorkingKey, octoOrigin, routeFor, smartProviders, type Provider } from './providers.js';

export interface Health {
  ok: boolean;
  /** Time to the tool call in ms; null when the probe failed. */
  ms: number | null;
  checkedAt: number;
  /** An HTTP status or a short reason, never a key. */
  error: string | null;
}

const state = new Map<string, Health>();
const FREE_LAST = 'openrouter';

/**
 * How long each provider really takes to start a reply, as a moving average of the calls it answered. The probe above
 * sends a two-line prompt, so it cannot tell a model that is quick on that from one that is quick on an 8k-token prompt:
 * on 2026-11-05 a call was served mostly by the provider with the best probe and the slowest real replies.
 */
const real = new Map<string, { ms: number; n: number }>();
const REAL_ALPHA = 0.3;
/** Samples before a measured time outranks the probe's. */
const REAL_MIN = 2;

export function noteLatency(id: string, ms: number): void {
  if (!(ms > 0) || !Number.isFinite(ms)) return;
  const had = real.get(id);
  real.set(id, had ? { ms: had.ms * (1 - REAL_ALPHA) + ms * REAL_ALPHA, n: had.n + 1 } : { ms, n: 1 });
}

/** The measured time when there are enough samples, else the probe's. */
const speedOf = (id: string): number => {
  const m = real.get(id);
  return m && m.n >= REAL_MIN ? m.ms : (state.get(id)?.ms ?? Infinity);
};

/** Healthy and never-probed providers first, in their own order; failing ones after. */
export function byHealth<T extends { id: string }>(providers: T[], fastest = false): T[] {
  const failing = (p: T) => state.get(p.id)?.ok === false;
  const healthy = providers.filter((p) => !failing(p));
  // On a call the wait is heard: the provider whose last probe was quickest goes first. Never-probed ones keep their place.
  const ms = (p: T) => speedOf(p.id);
  // The free model is a reasoning model: it answers the probe's two-line prompt first, then takes up to 16 s on a real
  // 8k-token prompt. It stays the last resort of the healthy ones, never ranked by the probe.
  const free = healthy.filter((p) => p.id === FREE_LAST);
  const paid = healthy.filter((p) => p.id !== FREE_LAST);
  if (fastest) paid.sort((a, b) => (ms(a) === Infinity || ms(b) === Infinity ? 0 : ms(a) - ms(b)));
  return [...paid, ...free, ...providers.filter(failing)];
}

export function healthReport(providers: Provider[] = smartProviders()) {
  return providers.map((p) => ({ id: p.id, label: p.label, model: p.model, ...state.get(p.id) }));
}

const PROBE_TOOL = [
  {
    type: 'function',
    function: {
      name: 'search_site',
      description: "Search Pujan's portfolio site",
      parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] },
    },
  },
];
const PROBE_MESSAGES = [
  { role: 'system', content: "You answer questions about Pujan's portfolio. Use tools to look things up." },
  { role: 'user', content: 'Which of his projects use RAG?' },
];

export async function probe(p: Provider, f: typeof fetch = fetch, timeoutMs = 20_000): Promise<Health> {
  const { url, headers } = routeFor(p, '/chat/completions');
  const started = Date.now();
  const fail = (error: string): Health => ({ ok: false, ms: null, checkedAt: Date.now(), error });
  try {
    const res = await f(url, {
      method: 'POST',
      headers: { ...headers, 'content-type': 'application/json' },
      body: JSON.stringify({ model: p.model, messages: PROBE_MESSAGES, tools: PROBE_TOOL, max_tokens: 200, stream: true }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok || !res.body) return fail(`HTTP ${res.status}`);
    const text = await res.text();
    if (/"error"\s*:/.test(text) && !/"tool_calls"/.test(text)) return fail('error in stream');
    return /"tool_calls"[\s\S]*"search_site"/.test(text)
      ? { ok: true, ms: Date.now() - started, checkedAt: Date.now(), error: null }
      : fail('no tool call');
  } catch (e) {
    return fail(e instanceof Error && e.name === 'TimeoutError' ? 'timeout' : 'unreachable');
  }
}

/** Renew one working key for another 30 days. Plain keys need nothing. */
async function renew(p: Provider): Promise<boolean> {
  if (!isWorkingKey(p.key)) return true;
  try {
    const res = await fetch(`${octoOrigin()}/api/vault/lease/renew`, {
      method: 'POST',
      headers: { authorization: `Bearer ${p.key}`, 'content-type': 'application/json' },
      body: JSON.stringify({ expiresInDays: 30 }),
      signal: AbortSignal.timeout(10_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

let started = false;

/** Probe now and every five minutes; renew keys now and daily. Starts once. */
export function startWatcher(log: (m: string) => void = console.warn): void {
  if (started || smartProviders().length === 0) return;
  started = true;
  const probeAll = async () => {
    for (const p of smartProviders()) {
      const before = state.get(p.id)?.ok;
      const h = await probe(p);
      state.set(p.id, h);
      if (before !== h.ok) log(`[copilot] ${p.label} (${p.model}) is ${h.ok ? `healthy, ${h.ms} ms` : `failing: ${h.error}`}`);
    }
  };
  const renewAll = async () => {
    for (const p of smartProviders()) if (!(await renew(p))) log(`[copilot] ${p.label} working key renewal failed`);
  };
  void probeAll();
  void renewAll();
  setInterval(() => void probeAll(), 5 * 60_000).unref();
  setInterval(() => void renewAll(), 24 * 3600_000).unref();
}
