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
import { takeDurableCopilotLimit, durableLimitConfigured } from './durableLimit.js';
import { FOLLOW_ON_CALL } from './answers.js';
import { routeRequest } from './routines.js';
import { createTextFilter } from './textFilter.js';

export type CopilotEvent =
  | { type: 'text'; text: string; replace?: boolean }
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
  /** True on a voice call: the reply is spoken, and the page may move on its own. */
  voice: z.boolean().optional(),
});

const limiter = createLimiter(limitConfigFromEnv());
const passLimiter = createLimiter({ windowMax: 20, windowMs: 3600_000, burstMax: 5, burstMs: 60_000 });
const budget = createDailyBudget();

const SYSTEM = `You are AI Pujan on design-bakery.com, my portfolio: the AI version of Pujan Bajracharya, an AI engineer. Always speak as me, in the first person ("I build...", "my projects...", "my research"). Never talk about Pujan in the third person and never say "he", "him" or "his" about me: the work is mine. Always be open that you are AI Pujan, an AI, when it comes up. If someone asks whether you are real or fake, or whether you and Pujan are the same person, say that he and I are one: you are AI Pujan, built from his work and speaking for him, and you are not him live. Keep it short and warm.
Visitors are often new: recruiters, founders, engineers. Help them learn about my work history, projects, research and writing, and move around the site.

How to answer:
- Keep replies short: one or two sentences, under 45 words. For a summary, at most three short points. Give more detail only when asked.
- Only state facts from the site brief or your tools; they hold only content already published on this site. If the site does not say, say so and suggest what it does cover. Never invent employers, dates, numbers or links.
- Research papers marked pending are working drafts awaiting my approval; say so when you cite one.
- Moving the visitor: never open a page on your own. When a page would help, offer it in words and ask, for example "Want me to open the Work page?", then wait. Call navigate only after the visitor says yes to that question. Even if they ask to see a page directly, ask first. On a tour, offer one page at a time.
- Contact and consultations: when a visitor asks how to contact me, wants to hire me, or wants a free consultation, offer the Contact page with "Want me to open the Contact page?". Say that on that page they can choose an area and a time. Do not list every link, and never claim a time is booked. If the visitor is already on /contact and asks to book in this chat, call book_call.
- Use tools silently: do not announce that you are reading, searching or about to answer. Do not repeat a page title already shown on a link.
- Use show_projects for "which projects" questions, and share_link for LinkedIn, GitHub, Behance, email, or a project link from the brief.
- Plain text only, no markdown headings or tables. Short lists are fine.`;

/** Added to the prompt on a voice call: short spoken sentences, and moving the visitor without asking first. */
const VOICE_NOTE = `This is a live voice call. Speak in short, natural sentences, one idea at a time, with no lists, markdown or links. Do not ask permission to move the visitor: when a page or a section would help, say in a few words where you are taking them and call navigate right away, then keep talking about what is on that page. For anything long, give one passage and offer to go on to the next.`;

/**
 * A short yes to a question the assistant just asked. The only way a page moves on its
 * own: the visitor confirmed the offer in their own words (issue #147, confirm first).
 */
function visitorSaidYes(messages: Array<{ role: string; content: string }>): boolean {
  const last = messages.at(-1);
  const before = messages.at(-2);
  if (!last || last.role !== 'user' || last.content.includes('?')) return false;
  if (last.content.trim().split(/\s+/).length > 5) return false;
  if (!/^\s*(yes|yeah|yep|yup|sure|ok|okay|please|go ahead|do it|open it|sounds good|absolutely|definitely)\b/i.test(last.content)) return false;
  return before?.role === 'assistant' && /\?\s*$/.test(before.content.trim());
}

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
  const { messages, page, voice = false } = parsed.data;
  const question = messages.at(-1)?.content ?? '';
  const turn = new TurnTrace(session);
  turn.input = question;
  turn.channel = voice ? 'voice' : 'text';

  res.status(200).set({ 'content-type': 'application/x-ndjson; charset=utf-8', 'cache-control': 'no-store', 'x-accel-buffering': 'no' });
  res.flushHeaders();
  const send = (event: CopilotEvent) => {
    if (event.type === 'action') turn.actions.push(event.action.kind === 'navigate' ? `navigate:${event.action.path}${event.action.go ? '(go)' : ''}` : event.action.kind);
    res.write(`${JSON.stringify(event)}\n`);
  };

  // The instant tier, before the durable limit: the questions visitors open with are
  // answered from the site's own data with no model call, so they cost nothing to serve
  // and keep working when the database holding the rate budget is down. A follow-up
  // carries context, so only a near-exact match counts after the first turn.
  const cached = await routeRequest(question, messages.length === 1, voice);
  if (cached) {
    turn.model = `cache:${cached.intent}`;
    turn.routine = cached.routine;
    turn.output = cached.text;
    send({ type: 'text', text: cached.text });
    // In a chat an instant answer offers its pages as chips the visitor clicks. On a call, when the visitor asked to be
    // shown something, the call takes them there, and a tour scrolls section by section as it is spoken.
    const follow = cached.go ?? (voice && FOLLOW_ON_CALL.has(cached.intent));
    for (const action of cached.actions) {
      // On a call there are no buttons: only a page move the call makes itself.
      if (voice && !(follow && action.kind === 'navigate')) continue;
      send({ type: 'action', action: action.kind === 'navigate' ? { ...action, go: follow } : action });
    }
    if (voice) for (const step of cached.steps ?? []) send({ type: 'action', action: { kind: 'scrollstep', path: step.path, at: step.at } });
    send({ type: 'done', model: turn.model });
    turn.finish('done');
    res.end();
    return;
  }

  try {
    const limit = await takeDurableCopilotLimit(ip, session);
    if (!limit.ok) {
      res.status(429).set('retry-after', String(Math.max(1, Math.ceil((limit.retryAt - Date.now()) / 1000)))).json({ ok: false, code: 'RATE_LIMITED' });
      return;
    }
  } catch {
    // A limiter that was never configured is a deploy gap, and the in-memory window
    // above is still enforcing 200 / 4 days for this process; a configured limiter that
    // fails is a real fault, and stays fail-closed.
    if (durableLimitConfigured()) {
      res.status(503).json({ ok: false, code: 'LIMIT_UNAVAILABLE' });
      return;
    }
    console.warn('[copilot] no durable rate limiter configured; in-memory limits only');
  }
  const providers = chain();
  if (!providers.length || !budget.open()) {
    res.status(503).json({ ok: false, code: providers.length ? 'BUDGET' : 'NO_MODEL' });
    return;
  }

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
    // The page context rides on the user turn, not the system prompt. The prompt then
    // stays byte-identical across a conversation, which is what lets a provider's prefix
    // cache hit instead of re-billing the brief on every step of a tool loop.
    const where = page ? `\n\n[The visitor is on ${page.path} ("${page.title}").]` : '';
    const history: ModelMessage[] = messages.map((m, index) =>
      index === messages.length - 1 && m.role === 'user' ? { role: 'user', content: `${m.content}${where}` } : { role: m.role, content: m.content },
    );
    const result = streamText({
      model,
      system: `${voice ? `${SYSTEM}\n\n${VOICE_NOTE}` : SYSTEM}\n\n# Site brief\n${brief}`,
      messages: history,
      tools: makeTools(
        // On a call the model moves the page itself and sends no buttons.
        (action) => {
          if (voice && action.kind !== 'navigate') return;
          send({ type: 'action', action });
        },
        { canNavigate: voice || visitorSaidYes(messages) },
      ),
      stopWhen: stepCountIs(6),
      maxOutputTokens: 240,
      abortSignal: abort.signal,
    });

    // Streaming hygiene lives in textFilter.ts: leaked reasoning blocks are cut, and the
    // "let me look that up" line before a tool call is dropped.
    const filter = createTextFilter((text, replace) => send({ type: 'text', text, replace }));

    for await (const part of result.fullStream) {
      if (part.type === 'text-delta') {
        filter.push(part.text);
      } else if (part.type === 'tool-call') {
        filter.toolCall();
        turn.stepStart(part.toolCallId, part.toolName, part.input);
        send({ type: 'step', name: part.toolName, status: 'start' });
      } else if (part.type === 'tool-result') {
        filter.toolResult();
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
    turn.output = filter.flush();
    // A model that only called tools and said nothing must not leave the visitor (or a call) in silence.
    if (!turn.output.trim()) {
      turn.output = turn.actions.some((a) => a.startsWith('navigate')) ? 'Here it is.' : 'I lost my train of thought there. Could you ask that again?';
      send({ type: 'text', text: turn.output });
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
