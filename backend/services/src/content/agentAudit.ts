import { supabaseAdmin } from '../supabaseClient.js';

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
  const { error } = await supabaseAdmin().from('agent_audit').insert({
    user_id: null,
    action: input.action,
    blog_id: input.numericId,
    model: null,
    usage: { agent_token: input.tokenName, ...(input.detail ?? {}) },
  });
  if (error) throw new Error(`Agent audit write failed: ${error.message}`);
}
