import { createHash, randomBytes } from 'node:crypto';
import { dbQueryOne } from '../../services/lib/db.js';

export type AgentTokenRecord = {
  id: string;
  name: string;
};

/** Hex SHA-256 of a presented token. The database stores only this. */
export function hashAgentToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

/** A fresh 32-byte token, URL-safe. Used when minting a token by hand. */
export function generateAgentToken(): string {
  return randomBytes(32).toString('base64url');
}

/**
 * Look up a token by its hash. Returns null for an unknown token; a 256-bit
 * random token does not need a constant-time comparison to resist guessing.
 */
export async function findAgentToken(token: string): Promise<AgentTokenRecord | null> {
  const row = await dbQueryOne<AgentTokenRecord>(
    'select id, name from public.agent_tokens where token_hash = $1 limit 1',
    [hashAgentToken(token)],
  );
  return row ?? null;
}
