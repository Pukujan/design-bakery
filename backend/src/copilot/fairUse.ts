/**
 * Keeps visitors from spending the owner's inference: a per-key sliding window with a
 * burst limit, and one global daily token budget. In memory, per process.
 */
type Window = { hits: number[] };

export interface LimitConfig {
  windowMax: number;
  windowMs: number;
  burstMax: number;
  burstMs: number;
}

const num = (value: string | undefined, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export const limitConfigFromEnv = (env = process.env): LimitConfig => ({
  // The durable limiter enforces the rolling multi-day limits; this guard also
  // caps memory growth and retains the short burst protection.
  windowMax: num(env.COPILOT_RATE_MAX, 200),
  windowMs: num(env.COPILOT_RATE_WINDOW_MIN, 4 * 24 * 60) * 60_000,
  burstMax: num(env.COPILOT_BURST_MAX, 4),
  burstMs: 20_000,
});

export function createLimiter(config: LimitConfig, now: () => number = Date.now) {
  const keys = new Map<string, Window>();
  return {
    /** Counts one request for `key`; ok false with when to retry once over a limit. */
    take(key: string): { ok: true } | { ok: false; retryAt: number } {
      const t = now();
      const w = keys.get(key) ?? { hits: [] };
      w.hits = w.hits.filter((at) => t - at < config.windowMs);
      const recent = w.hits.filter((at) => t - at < config.burstMs);
      if (w.hits.length >= config.windowMax) return { ok: false, retryAt: w.hits[0] + config.windowMs };
      if (recent.length >= config.burstMax) return { ok: false, retryAt: recent[0] + config.burstMs };
      w.hits.push(t);
      keys.set(key, w);
      if (keys.size > 20_000) keys.delete(keys.keys().next().value as string);
      return { ok: true };
    },
  };
}

/** Tokens spent today (UTC) across every visitor; over the cap, answers come without a model. */
export function createDailyBudget(cap = num(process.env.COPILOT_DAILY_TOKENS, 2_000_000), now: () => number = Date.now) {
  let day = '';
  let used = 0;
  const today = () => new Date(now()).toISOString().slice(0, 10);
  return {
    open(): boolean {
      if (today() !== day) {
        day = today();
        used = 0;
      }
      return used < cap;
    },
    record(tokens: number) {
      if (today() !== day) {
        day = today();
        used = 0;
      }
      used += tokens;
    },
  };
}
