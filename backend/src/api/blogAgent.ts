import { Router } from 'express';
import { FieldValue } from 'firebase-admin/firestore';
import { adminFirestore } from '../../services/lib/firebaseApp.js';
import { resolveBlogForPromo } from '../../services/lib/blog/firestore.js';
import { buildPromoPrompt, parsePromoResponse } from '../../services/lib/promo.js';
import { callOpenRouter } from '../../services/lib/openrouter.js';
import {
  assertWithinLimits,
  recordUsage,
  remainingFromUsage,
} from '../../services/lib/rateLimit.js';
import { AGENT_API_VERSION, type AgentInvokeRequest } from '../../services/lib/types.js';
import type { AuthedRequest } from '../middleware/auth.js';
import { authedUserId } from '../middleware/auth.js';
import { resolveOpenRouterKey } from '../config/env.js';
import { sendRouteError } from '../middleware/httpErrors.js';

export const blogAgentRouter = Router();

async function writeAudit(entry: Record<string, unknown>) {
  const db = adminFirestore();
  await db.collection('agent_audit').add({
    ...entry,
    createdAt: FieldValue.serverTimestamp(),
  });
}

blogAgentRouter.post('/', async (req, res) => {
  const authed = req as AuthedRequest;
  try {
    const body = req.body as AgentInvokeRequest;
    if (!body || typeof body !== 'object') {
      res.status(400).json({ ok: false, code: 'VALIDATION', message: 'Missing request body.' });
      return;
    }
    if (body.version !== AGENT_API_VERSION) {
      res.status(400).json({
        ok: false,
        code: 'VALIDATION',
        message: `Unsupported API version ${body.version}.`,
      });
      return;
    }
    if (!body.action || typeof body.blogId !== 'number') {
      res.status(400).json({ ok: false, code: 'VALIDATION', message: 'action and blogId are required.' });
      return;
    }
    if (body.action === 'council' || body.action === 'seo_ai') {
      res.status(501).json({ ok: false, code: 'VALIDATION', message: `${body.action} is not available yet.` });
      return;
    }
    if (body.action !== 'promo') {
      res.status(400).json({ ok: false, code: 'VALIDATION', message: `Unknown action ${body.action}.` });
      return;
    }

    const uid = authedUserId(authed.user);
    await assertWithinLimits(uid);

    const apiKey = resolveOpenRouterKey();
    const model = process.env.OPENROUTER_MODEL?.trim() || 'deepseek/deepseek-chat-v3.1';
    const blog = await resolveBlogForPromo(body.blogId, body.blogSnapshot);
    const { system, user } = buildPromoPrompt({
      title: blog.title,
      excerpt: blog.excerpt,
      content: blog.content,
      tags: blog.tags ?? [],
      category: blog.category,
      author: blog.author,
      publicUrl: body.publicUrl,
      theme: body.theme,
      customInstructions: body.customInstructions,
    });

    const llm = await callOpenRouter({ apiKey, model, system, user });
    const promo = parsePromoResponse(llm.content);

    let remaining = { remainingDailyCalls: 0, remainingDailyTokens: 0 };
    try {
      const usage = await recordUsage(uid, {
        calls: 1,
        tokens: llm.usage.inputTokens + llm.usage.outputTokens,
      });
      remaining = remainingFromUsage(usage);
      await writeAudit({
        uid,
        action: body.action,
        blogId: body.blogId,
        model: llm.model,
        usage: llm.usage,
      });
    } catch (auditErr) {
      console.warn('agent_usage/audit write failed (promo still returned):', auditErr);
    }

    res.json({
      ok: true,
      action: body.action,
      data: promo,
      usage: llm.usage,
      ...remaining,
    });
  } catch (error) {
    sendRouteError(res, error);
  }
});
