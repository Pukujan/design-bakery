/**
 * /api/copilot: the site copilot (TASK-DB-0098).
 *
 *   GET  /config  what the browser needs: Turnstile site key, whether booking is set up
 *   POST /pass    Turnstile token in, signed visitor pass out (guard.ts)
 *   GET  /health  the profile and each smart provider's last probe, without keys
 *   POST /chat    one turn, streamed as NDJSON events (see CopilotEvent)
 *
 * The model chain is nyc-map-agent's (providers.ts, health.ts, model-fallback.ts).
 * When no model is configured or the daily budget is spent, /chat answers 503 and the
 * browser falls back to its built-in answers.
 */
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { stepCountIs, streamText, type ModelMessage } from 'ai';
import { Router, type Request } from 'express';
import { z } from 'zod';
import { byHealth, healthReport, startWatcher } from './health.js';
import { fallbackFetch } from './model-fallback.js';
import { checkPass, clientIp, issuePass, turnstileSiteKey } from './guard.js';
import { createDailyBudget, createLimiter, limitConfigFromEnv } from './fairUse.js';
import { siteBrief } from './knowledge.js';
import { devProvider, pickProfile, routeFor, smartProviders, type Provider } from './providers.js';
import { makeTools, type CopilotAction } from './tools.js';
import { TurnTrace } from './tracing.js';
import { takeDurableCopilotLimit } from './durableLimit.js';

export type CopilotEvent =
  | { type: 'text'; text: string }
  | { type: 'action'; action: CopilotAction }
  | { type: 'step'; name: string; status: 'start' | 'done' | 'error' }
  | { type: 'done'; model: string }
  | { type: 'error'; message: string };

const chatBody = z.object({
  messages: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().min(1).max(2000) }))
    .min(1)
    .max(24),
  page: z.object({ path: z.string().max(300), title: z.string().max(200) }).optional(),
});

const limiter = createLimiter(limitConfigFromEnv());
const passLimiter = createLimiter({ windowMax: 20, windowMs: 3600_000, burstMax: 5, burstMs: 60_000 });
const budget = createDailyBudget();

const SYSTEM = `You are the copilot on design-bakery.com, the portfolio of Pujan Bajracharya, an AI engineer.
Visitors are often new: recruiters, founders, engineers. Help them understand who Pujan is, his work history, projects, research and writing, and move around the site.

How to answer:
- Speak about Pujan in the third person. Be warm, direct and specific. Default to one or two short sentences, ideally under 50 words. For a summary give the main point and at most two supporting points, in under 70 words. Give more detail only when requested.
- Only state facts from the site brief or your tools. If the site does not say, say so and suggest what it does cover. Never invent employers, dates, numbers or links.
- Research papers marked pending are working papers awaiting his approval; say so when you cite one.
- Navigate when the visitor asks to open or see a page, or asks for a tour. For a tour use at most two navigation steps, with a short sentence for each, then offer to go deeper. Do not navigate just because you mention a page.
- Use tools silently: don't announce that you are reading, searching, or about to answer. Avoid repeating a page title already shown on a link.
- Use show_projects for "which projects" questions, share_link for LinkedIn, GitHub, email or a project's live link.
- Pujan offers free 30-minute consultations. When a visitor asks how to contact him or wants a consultation, navigate to /contact and briefly say they can choose an area and a time there. Do not repeat the booking offer or list every link. If the visitor is already on /contact and specifically asks to book through chat, call book_call. Never claim a time is booked; the visitor picks it.
- Plain text only, no markdown headings or tables. Short lists are fine.`;

function chain(): Provider[] {
  const dev = devProvider();
  const smart = pickProfile() === 'smart' ? byHealth(smartProviders()) : [];
  if (smart.length) startWatcher();
  return dev ? [...smart, dev] : smart;
}

const ipOf = (req: Request) => clientIp(req.headers, req.socket.remoteAddress ?? '');

export const copilotRouter = Router();

copilotRouter.get('/config', (_req, res) => {
  res.set('cache-control', 'no-store').json({
    ok: true,
    turnstileSiteKey: turnstileSiteKey(),
    booking: Boolean(process.env.COPILOT_BOOKING_URL?.trim()),
    live: chain().length > 0,
  });
});

copilotRouter.post('/pass', async (req, res) => {
  const ip = ipOf(req);
  if (!passLimiter.take(`pass:${ip}`).ok) {
    res.status(429).json({ ok: false, code: 'RATE_LIMITED' });
    return;
  }
  const token = typeof req.body?.token === 'string' ? req.body.token : '';
  const proof = typeof req.body?.visitor === 'string' ? req.body.visitor.slice(0, 2048) : undefined;
  const issued = await issuePass(token, ip, proof);
  if (!issued) {
    res.status(403).json({ ok: false, code: 'CHALLENGE_FAILED' });
    return;
  }
  res.set('cache-control', 'no-store').json({ ok: true, pass: issued.pass, visitor: issued.visitor });
});

copilotRouter.get('/health', (_req, res) => {
  res.set('cache-control', 'no-store').json({ ok: true, profile: pickProfile(), smart: healthReport(), dev: Boolean(devProvider()) });
});

// The voice service creates a room; the visitor's spoken turns are answered by
// /chat, so it has the same published site knowledge and visitor limits.
copilotRouter.post('/voice', async (req, res) => {
  const session = await checkPass(req.get('x-copilot-pass'));
  if (!session) { res.status(401).json({ ok: false, code: 'NO_PASS' }); return; }
  if (!limiter.take(`voice:${session}`).ok || !limiter.take(`voice-ip:${ipOf(req)}`).ok) {
    res.status(429).json({ ok: false, code: 'RATE_LIMITED' }); return;
  }
  try {
    const response = await fetch('https://copilot.design-bakery.com/api/voice/token', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}',
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error('voice service unavailable');
    const grant = await response.json() as { url?: unknown; token?: unknown };
    if (grant.url !== 'wss://copilot.design-bakery.com' || typeof grant.token !== 'string') throw new Error('invalid voice grant');
    res.set('cache-control', 'no-store').json({ url: grant.url, token: grant.token });
  } catch {
    res.status(503).json({ ok: false, code: 'VOICE_UNAVAILABLE' });
  }
});

copilotRouter.post('/chat', async (req, res) => {
  const session = await checkPass(req.get('x-copilot-pass'));
  if (!session) {
    res.status(401).json({ ok: false, code: 'NO_PASS' });
    return;
  }
  const parsed = chatBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ ok: false, code: 'VALIDATION' });
    return;
  }
  // Both the address and the pass are limited, so neither a new pass nor a new address resets it.
  const ip = ipOf(req);
  const byIp = limiter.take(`ip:${ip}`);
  const bySession = byIp.ok ? limiter.take(`session:${session}`) : byIp;
  if (!bySession.ok) {
    res.status(429).set('retry-after', String(Math.ceil((bySession.retryAt - Date.now()) / 1000))).json({ ok: false, code: 'RATE_LIMITED' });
    return;
  }
  try {
    const limit = await takeDurableCopilotLimit(ip, session);
    if (!limit.ok) {
      res.status(429).set('retry-after', String(Math.max(1, Math.ceil((limit.retryAt - Date.now()) / 1000)))).json({ ok: false, code: 'RATE_LIMITED' });
      return;
    }
  } catch {
    res.status(503).json({ ok: false, code: 'LIMIT_UNAVAILABLE' });
    return;
  }
  const providers = chain();
  if (!providers.length || !budget.open()) {
    res.status(503).json({ ok: false, code: providers.length ? 'BUDGET' : 'NO_MODEL' });
    return;
  }

  const { messages, page } = parsed.data;
  const turn = new TurnTrace(session);
  turn.input = messages.at(-1)?.content ?? '';

  res.status(200).set({ 'content-type': 'application/x-ndjson; charset=utf-8', 'cache-control': 'no-store', 'x-accel-buffering': 'no' });
  res.flushHeaders();
  const send = (event: CopilotEvent) => res.write(`${JSON.stringify(event)}\n`);
  const abort = new AbortController();
  res.on('close', () => {
    if (!res.writableFinished) abort.abort();
  });

  const steps = providers.map((p) => ({ name: `${p.id}:${p.model}`, model: p.model, route: (path: string) => routeFor(p, path) }));
  const model = createOpenAICompatible({
    name: 'copilot',
    baseURL: 'http://copilot.invalid/v1',
    apiKey: 'per-provider',
    fetch: fallbackFetch(steps, fetch, console.warn, undefined, undefined, (used) => {
      turn.model = used;
    }),
  })(steps[0].model);

  try {
    const brief = await siteBrief();
    const where = page ? `The visitor is on ${page.path} ("${page.title}").` : '';
    const history: ModelMessage[] = messages.map((m) => ({ role: m.role, content: m.content }));
    const result = streamText({
      model,
      system: `${SYSTEM}\n\n# Site brief\n${brief}\n\n${where}`,
      messages: history,
      tools: makeTools((action) => send({ type: 'action', action })),
      stopWhen: stepCountIs(6),
      maxOutputTokens: 320,
      abortSignal: abort.signal,
    });
    let afterTool = false;
    for await (const part of result.fullStream) {
      if (part.type === 'text-delta') {
        if (!part.text) continue;
        const separator = afterTool && turn.output && !/\s$/.test(turn.output) && !/^\s/.test(part.text) ? '\n\n' : '';
        const text = separator + part.text;
        afterTool = false;
        turn.output += text;
        send({ type: 'text', text });
      } else if (part.type === 'tool-call') {
        turn.stepStart(part.toolCallId, part.toolName, part.input);
        send({ type: 'step', name: part.toolName, status: 'start' });
      } else if (part.type === 'tool-result') {
        afterTool = true;
        turn.stepEnd(part.toolCallId, true, part.output);
        send({ type: 'step', name: part.toolName, status: 'done' });
      } else if (part.type === 'tool-error') {
        turn.stepEnd(part.toolCallId, false);
        send({ type: 'step', name: part.toolName, status: 'error' });
      } else if (part.type === 'error') {
        throw part.error;
      } else if (part.type === 'finish') {
        turn.inputTokens = part.totalUsage.inputTokens ?? 0;
        turn.outputTokens = part.totalUsage.outputTokens ?? 0;
        budget.record(turn.inputTokens + turn.outputTokens);
      }
    }
    send({ type: 'done', model: turn.model });
    turn.finish('done');
  } catch (error) {
    if (!abort.signal.aborted) {
      console.warn('[copilot] turn failed:', error instanceof Error ? error.message.slice(0, 200) : 'unknown');
      send({ type: 'error', message: 'The models are busy right now.' });
    }
    turn.finish('error');
  } finally {
    res.end();
  }
});
