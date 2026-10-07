import { dbInsert } from '../db.js';

export type AgentAuditAction = 'agent.post.create' | 'agent.post.update';

/**
 * Record an agent write in agent_audit. Best effort: a logging failure must not
 * fail a publish, so callers treat the promise as advisory.
 */
export async function recordAgentAudit(input: {
  action: AgentAuditAction;
  numericId: number;
  tokenName: string;
  detail?: Record<string, unknown>;
}): Promise<void> {
  await dbInsert('agent_audit', {
    user_id: null,
    action: input.action,
    blog_id: input.numericId,
    model: null,
    usage: { agent_token: input.tokenName, ...(input.detail ?? {}) },
  });
}
