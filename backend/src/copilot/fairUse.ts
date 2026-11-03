/**
 * Keeps visitors from spending the owner's inference: per-key rolling windows with a
 * burst limit, and one global daily token budget. In memory, per process.
 *
 * The chat limits are three rolling windows that apply at once, per visitor address
 * and per pass session: 50 in 2 hours, 100 in 10 hours and 200 in 4 days. A request is
 * refused while any of them is full. The durable limiter (durableLimit.ts) enforces the
 * same numbers across replicas; this in-memory copy is the per-process guard.
 */
import { BlockList, isIP } from 'node:net';

type Window = { hits: number[] };

export interface LimitWindow {
  max: number;
  ms: number;
}

export interface LimitConfig {
  windowMax: number;
  windowMs: number;
  burstMax: number;
  burstMs: number;
  /**
   * Rolling windows that must all have room. When set, these replace windowMax/windowMs.
   * Each window's refusal reports its own retry time; the caller gets the latest one.
   */
  windows?: LimitWindow[];
}

const num = (value: string | undefined, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const MINUTE = 60_000;

export const limitConfigFromEnv = (env = process.env): LimitConfig => {
  const short: LimitWindow = {
    max: num(env.COPILOT_RATE_SHORT_MAX, 50),
    ms: num(env.COPILOT_RATE_SHORT_WINDOW_MIN, 2 * 60) * MINUTE,
  };
  const mid: LimitWindow = {
    max: num(env.COPILOT_RATE_MID_MAX, 100),
    ms: num(env.COPILOT_RATE_MID_WINDOW_MIN, 10 * 60) * MINUTE,
  };
  const long: LimitWindow = {
    max: num(env.COPILOT_RATE_MAX, 200),
    ms: num(env.COPILOT_RATE_WINDOW_MIN, 4 * 24 * 60) * MINUTE,
  };
  return {
    windowMax: long.max,
    windowMs: long.ms,
    burstMax: num(env.COPILOT_BURST_MAX, 4),
    burstMs: 20_000,
    windows: [short, mid, long],
  };
};

export function createLimiter(config: LimitConfig, now: () => number = Date.now) {
  const keys = new Map<string, Window>();
  const windows: LimitWindow[] = config.windows?.length
    ? config.windows
    : [{ max: config.windowMax, ms: config.windowMs }];
  const longest = Math.max(...windows.map((w) => w.ms));
  return {
    /** Counts one request for `key`; ok false with when to retry once over a limit. */
    take(key: string): { ok: true } | { ok: false; retryAt: number } {
      const t = now();
      const w = keys.get(key) ?? { hits: [] };
      w.hits = w.hits.filter((at) => t - at < longest);
      let blocked = false;
      let retryAt = 0;
      for (const window of windows) {
        const inWindow = w.hits.filter((at) => t - at < window.ms);
        if (inWindow.length >= window.max) {
          // Admitted again once enough of the oldest hits have left this window.
          blocked = true;
          retryAt = Math.max(retryAt, inWindow[inWindow.length - window.max] + window.ms);
        }
      }
      const recent = w.hits.filter((at) => t - at < config.burstMs);
      if (recent.length >= config.burstMax) {
        blocked = true;
        retryAt = Math.max(retryAt, recent[recent.length - config.burstMax] + config.burstMs);
      }
      if (blocked) return { ok: false, retryAt };
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

/**
 * Owner exemption from the per-address, per-session and durable request limits, so the owner and their network can
 * test the live site. Entries are IPv4/IPv6 addresses or CIDR ranges, comma-separated; anything malformed is ignored.
 * The daily token budget still applies to everyone. The address checked is the one `clientIp` (guard.ts) trusts, which
 * is only safe while the API is reachable through Cloudflare/Caddy alone (see TASK-DB-0140).
 */
export function createExemptMatcher(list = process.env.COPILOT_RATE_EXEMPT_IPS): (ip: string) => boolean {
  const rules = new BlockList();
  let count = 0;
  for (const raw of (list ?? '').split(',')) {
    const entry = raw.trim();
    if (!entry) continue;
    const [addr, bits, extra] = entry.split('/');
    const family = isIP(addr);
    if (!family || extra !== undefined) continue;
    const type = family === 4 ? 'ipv4' : 'ipv6';
    if (bits === undefined) {
      rules.addAddress(addr, type);
    } else {
      const n = Number(bits);
      if (!/^\d{1,3}$/.test(bits) || n > (family === 4 ? 32 : 128)) continue;
      rules.addSubnet(addr, n, type);
    }
    count++;
  }
  if (!count) return () => false;
  return (ip: string) => {
    const family = isIP(ip.trim());
    return family ? rules.check(ip.trim(), family === 4 ? 'ipv4' : 'ipv6') : false;
  };
}
