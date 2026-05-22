import { CALLABLE_CORS } from './callableCors.js';
import { loadProjectEnv } from './loadEnv.js';
import { ensureFirebaseAdminApp } from './firebaseApp.js';
import { openRouterApiKey } from './secrets.js';

loadProjectEnv();
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { AGENT_API_VERSION, type AgentInvokeRequest } from './types.js';
import { isFunctionsEmulator } from './emulator.js';
import { assertWithinLimits, recordUsage, remainingFromUsage } from './rateLimit.js';
import { resolveBlogForPromo } from './blog/firestore.js';
import { buildPromoPrompt, parsePromoResponse } from './promo.js';
import { callOpenRouter } from './openrouter.js';
import {
  PUBLISH_KIT_API_VERSION,
  type PublishKitRequest,
} from './blog/publishKit/types.js';
import { handlePublishKit } from './blog/publishKit/handler.js';

ensureFirebaseAdminApp();

function resolveApiKey(): string {
  try {
    const fromSecret = openRouterApiKey.value()?.trim();
    if (fromSecret?.startsWith('sk-')) return fromSecret;
  } catch {
    /* emulator / local: secret optional */
  }
  const fromEnv = process.env.OPENROUTER_API_KEY?.trim();
  if (fromEnv?.startsWith('sk-')) return fromEnv;
  throw new HttpsError(
    'failed-precondition',
    isFunctionsEmulator()
      ? 'OPENROUTER_API_KEY is missing in root .env. Save the file, then restart pnpm run dev.'
      : 'OPENROUTER_API_KEY is not configured in production. Run: firebase functions:secrets:set OPENROUTER_API_KEY',
  );
}

const callableOptions = {
  region: 'us-central1' as const,
  cors: CALLABLE_CORS,
  secrets: [openRouterApiKey],
};

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
    ...callableOptions,
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
        process.env.OPENROUTER_MODEL?.trim() || 'deepseek/deepseek-chat-v3.1';
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

export const invokeBlogPublishKit = onCall(
  {
    ...callableOptions,
    timeoutSeconds: 120,
    memory: '1GiB',
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Sign in to admin before using publish kit.', {
        code: 'AUTH',
      });
    }

    assertAdminEmail(request.auth.token.email);

    const body = request.data as PublishKitRequest;
    if (!body || typeof body !== 'object') {
      throw new HttpsError('invalid-argument', 'Missing request body.', { code: 'VALIDATION' });
    }
    if (body.version !== PUBLISH_KIT_API_VERSION) {
      throw new HttpsError('invalid-argument', `Unsupported API version ${body.version}.`, {
        code: 'VALIDATION',
      });
    }

    try {
      const apiKey = resolveApiKey();
      const model = process.env.OPENROUTER_MODEL?.trim() || 'deepseek/deepseek-chat-v3.1';
      return await handlePublishKit({ body, apiKey, model });
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('invokeBlogPublishKit error:', message, error);
      throw mapError(error);
    }
  }
);
