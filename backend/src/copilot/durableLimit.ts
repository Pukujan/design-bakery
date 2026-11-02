/**
 * Persistent rolling limits for the public copilot. The workspace database owns
 * the atomic decision, so API restarts and multiple replicas share one budget.
 * Apply supabase/migrations/011_copilot_rate_limit.sql to the Octo workspace
 * before enabling this code. The API key must have read and write scopes.
 */
import { createHmac } from 'node:crypto';
import { dbQueryOne } from '../../services/lib/db.js';

export type DurableLimit = { ok: true } | { ok: false; retryAt: number };

/** The caller must fail closed (HTTP 503), never silently allow a request. */
export class DurableLimitUnavailable extends Error {
  constructor() {
    super('The copilot rate limiter is unavailable');
    this.name = 'DurableLimitUnavailable';
  }
}

type Row = { allowed: unknown; retry_at: unknown };
type Query = (sql: string, params: unknown[]) => Promise<Row | null>;

/** A fixed secret shared across replicas; changing it resets active allowances. */
function identifier(secret: string, domain: 'ip' | 'visitor', value: string): string {
  return createHmac('sha256', secret).update(`${domain}\0${value}`, 'utf8').digest('hex');
}

/**
 * Admit one text/voice model turn against both identities: 50 / 2 h, 100 / 10 h,
 * and 200 / 4 days, rolling. Rejections do not create a hit. The caller should
 * retain its existing short burst limiter as a separate control.
 *
 * The visitor must be a stable signed identifier; minting a new visitor ID for
 * each request would defeat that half of the limit. A missing IP uses the same
 * conservative bucket for unknown addresses. Never log raw inputs or HMACs.
 */
export async function takeDurableCopilotLimit(
  ip: string,
  visitor: string,
  options: { secret?: string; query?: Query } = {},
): Promise<DurableLimit> {
  const secret = options.secret ?? process.env.COPILOT_RATE_SECRET ?? process.env.COPILOT_PASS_SECRET ?? '';
  if (Buffer.byteLength(secret, 'utf8') < 32 || !visitor.trim()) throw new DurableLimitUnavailable();
  const ipHash = identifier(secret, 'ip', ip.trim().toLowerCase() || 'unknown');
  const visitorHash = identifier(secret, 'visitor', visitor.trim());
  try {
    const query: Query = options.query ?? ((sql, params) => dbQueryOne<Row>(sql, params));
    const row = await query('select allowed, retry_at from public.copilot_take_rate_slot($1, $2)', [ipHash, visitorHash]);
    if (row?.allowed === true) return { ok: true };
    if (row?.allowed === false && typeof row.retry_at === 'string') {
      const retryAt = Date.parse(row.retry_at);
      if (Number.isFinite(retryAt)) return { ok: false, retryAt };
    }
    throw new Error('invalid rate limiter response');
  } catch {
    throw new DurableLimitUnavailable();
  }
}
