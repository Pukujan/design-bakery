import type { NextFunction, Request, Response } from 'express';
import { findAgentToken, type AgentTokenRecord } from '../auth/agentToken.js';
import { isSupabaseConfigured } from '../../services/lib/supabaseClient.js';

export type AgentAuthedRequest = Request & { agent: AgentTokenRecord };

/**
 * Bearer-token gate for the agent publishing API. Separate from the human admin
 * JWT: agent tokens are opaque random strings checked against agent_tokens, and
 * they carry no roles — the two routes they open are create and update only.
 */
export async function requireAgentToken(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!isSupabaseConfigured()) {
      res.status(503).json({
        ok: false,
        code: 'AUTH',
        message: 'Agent publishing is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env.',
      });
      return;
    }

    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      res.status(401).json({ ok: false, code: 'AUTH', message: 'Missing agent bearer token.' });
      return;
    }

    const token = header.slice(7).trim();
    if (!token) {
      res.status(401).json({ ok: false, code: 'AUTH', message: 'Missing agent bearer token.' });
      return;
    }

    const agent = await findAgentToken(token);
    if (!agent) {
      res.status(401).json({ ok: false, code: 'AUTH', message: 'Unknown agent token.' });
      return;
    }

    (req as AgentAuthedRequest).agent = agent;
    next();
  } catch (error) {
    console.error('[api] agent token check failed', error);
    res.status(500).json({ ok: false, code: 'INTERNAL', message: 'Token check failed.' });
  }
}
