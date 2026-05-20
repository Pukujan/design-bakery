import { config as loadEnv } from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp } from 'firebase-admin/app';

// Load from functions/.env (works for both src/ and lib/ after compile).
const functionsDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
loadEnv({ path: resolve(functionsDir, '.env'), override: true });
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { AGENT_API_VERSION, type AgentInvokeRequest } from './types.js';
import { isFunctionsEmulator } from './emulator.js';
import { assertWithinLimits, recordUsage, remainingFromUsage } from './rateLimit.js';
import { resolveBlogForPromo } from './blog.js';
import { buildPromoPrompt, parsePromoResponse } from './promo.js';
import { callOpenRouter } from './openrouter.js';

initializeApp();

function resolveApiKey(): string {
  const fromEnv = process.env.OPENROUTER_API_KEY?.trim();
  if (fromEnv?.startsWith('sk-')) return fromEnv;
  throw new HttpsError(
    'failed-precondition',
    'OPENROUTER_API_KEY is missing or empty in functions/.env. Save the file (⌘S), then restart: pnpm run functions:serve'
  );
}

function assertAdminEmail(email: string | undefined) {
  const allowlist = (process.env.ALLOWED_ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (allowlist.length === 0) return;
  if (!email || !allowlist.includes(email.toLowerCase())) {
    throw new HttpsError('permission-denied', 'This account is not allowed to use blog agents.');
  }
}

function mapError(error: unknown): HttpsError {
  const message = error instanceof Error ? error.message : 'Unknown error';
  if (message.startsWith('QUOTA:')) {
    return new HttpsError('resource-exhausted', message.replace(/^QUOTA:\s*/, ''), {
      code: 'QUOTA',
    });
  }
  if (message.includes('not found')) {
    return new HttpsError('not-found', message, { code: 'VALIDATION' });
  }
  return new HttpsError('internal', message, { code: 'INTERNAL' });
}

async function writeAudit(entry: Record<string, unknown>) {
  const db = getFirestore();
  await db.collection('agent_audit').add({
    ...entry,
    createdAt: FieldValue.serverTimestamp(),
  });
}

export const invokeBlogAgent = onCall(
  {
    region: 'us-central1',
    cors: true,
    timeoutSeconds: 120,
    memory: '512MiB',
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Sign in to admin before using agents.', {
        code: 'AUTH',
      });
    }

    assertAdminEmail(request.auth.token.email);

    const body = request.data as AgentInvokeRequest;
    if (!body || typeof body !== 'object') {
      throw new HttpsError('invalid-argument', 'Missing request body.', { code: 'VALIDATION' });
    }
    if (body.version !== AGENT_API_VERSION) {
      throw new HttpsError('invalid-argument', `Unsupported API version ${body.version}.`, {
        code: 'VALIDATION',
      });
    }
    if (!body.action || typeof body.blogId !== 'number') {
      throw new HttpsError('invalid-argument', 'action and blogId are required.', {
        code: 'VALIDATION',
      });
    }

    const uid = request.auth.uid;

    const emulator = isFunctionsEmulator();

    try {
      if (!emulator) {
        await assertWithinLimits(uid);
      }

      if (body.action === 'council' || body.action === 'seo_ai') {
        throw new HttpsError('unimplemented', `${body.action} is not available yet.`, {
          code: 'VALIDATION',
        });
      }

      if (body.action !== 'promo') {
        throw new HttpsError('invalid-argument', `Unknown action ${body.action as string}.`, {
          code: 'VALIDATION',
        });
      }

      const apiKey = resolveApiKey();
      const model =
        process.env.OPENROUTER_MODEL?.trim() || 'qwen/qwen-2.5-7b-instruct';
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

      let remaining = {
        remainingDailyCalls: emulator ? 29 : 0,
        remainingDailyTokens: emulator ? 119_000 : 0,
      };
      if (!emulator) {
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
      }

      return {
        ok: true as const,
        action: body.action,
        data: promo,
        usage: llm.usage,
        ...remaining,
      };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('invokeBlogAgent error:', message, error);
      throw mapError(error);
    }
  }
);
