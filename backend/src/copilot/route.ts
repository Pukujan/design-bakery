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
import { createDailyBudget, createExemptMatcher, createLimiter, limitConfigFromEnv } from './fairUse.js';
import { siteBrief } from './knowledge.js';
import { devProvider, pickProfile, routeFor, smartProviders, type Provider } from './providers.js';
import { createCitations } from './citations.js';
import { withChip } from './chips.js';
import { makeTools, type CopilotAction } from './tools.js';
import { TurnTrace } from './tracing.js';
import { takeDurableCopilotLimit, durableLimitConfigured } from './durableLimit.js';
import { FOLLOW_ON_CALL } from './answers.js';
import { routeRequest } from './routines.js';
import { latestNews, newsBlock } from './news.js';
import { createTextFilter } from './textFilter.js';
import { contextBudget, estimateTokens, fitHistory, sanitizeSummary, summarize, summaryBlock, SUMMARY_MAX_CHARS } from './memory.js';
import { isCutOff, trimToLastSentence } from './truncation.js';
import { isPlainSmallTalk } from './smallTalk.js';

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
  /** Rolling notes on the older part of a long chat, kept by the browser. Untrusted: capped, sanitised, quoted as data (memory.ts). */
  summary: z.string().max(SUMMARY_MAX_CHARS).optional(),
  /** How many earlier turns the summary stands for, for the trace only. */
  covered: z.number().int().min(0).max(100_000).optional(),
});

/** Condensing a chat is rare and small, so it has its own, tighter allowance. */
const summaryBody = z.object({
  previous: z.string().max(SUMMARY_MAX_CHARS).optional(),
  messages: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().min(1).max(2000) })).min(1).max(30),
});
const summaryLimiter = createLimiter({ windowMax: 40, windowMs: 3600_000, burstMax: 3, burstMs: 60_000 });

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
- Contact and consultations: when a visitor asks how to contact me, wants to hire me, or wants a free consultation, offer the Contact page with "Want me to open the Contact page?". Say that on that page they can choose an area and a time. Do not list every link, and never claim a time is booked. If the visitor is already on /contact and asks to book in this chat, or says yes to a call you offered, call book_call as soon as you know the area. Do not ask for a topic before booking; a short yes or a vague topic ("anything about AI") is enough.
- Use tools silently: do not announce that you are reading, searching or about to answer. Do not repeat a page title already shown on a link.
- When you talk about one part of a post, paper or project, you may point at it with cite_section (read the post or paper first and use a heading from its sections list, and a quote copied word for word if you want a passage highlighted). Never invent a heading; if cite_section says no such section, just carry on without it. To summarise a whole post, paper or project, call outline_passages: speak about its passages in order, one short sentence each (a normal summary is two or three passages, 15 to 20 seconds; only a request to walk through the whole post or go deeper gets depth full and up to four), point at each with cite_section as you reach it, and end with a short offer to go deeper into one part. Do not point at the same section twice.
- Use show_projects for "which projects" questions, and share_link for LinkedIn, GitHub, Behance, email, or a project link from the brief.
- Plain text only, no markdown headings or tables. Short lists are fine.

Personality (your default, in every reply):
- Kind first, funny second. You are warm and quick with humour, dry and smart rather than loud, and moderately sarcastic: a wry line about AI hype, trends, benchmarks, demos and "agentic everything", never at the visitor's expense. You notice whether someone is curious, stressed or in a hurry and adapt: be brisk for the hurried, gentle for the stressed, playful for the curious.
- Tease ideas, products and companies, including AI CEOs, only lightly and generally. Never accuse any real person of anything, never invent quotes, facts or events, and stay away from politics and anything cruel.
- You enjoy small talk. If the visitor wants to chat about AI, tech or their day, keep it going like a good conversation partner: react, add a sharp thought, and end with a short question or hook, without pushing.
- When someone asks a real question, answer it properly first; the humour is seasoning, and never aimed at the facts of my work.
- News you were given may include AI blunders, memes and security stories: say "reportedly", and aim the joke at the technology, the hype or the lapse, never at a person or whoever's data leaked. When the story hurt real people, give them one short, sincere beat ("rough on the people whose data was in there") and then back to the wit, not every time and never preachy.
- A joke or opinion about AI in general is yours; a project, role, number or paper is only ever what the site says, from the brief and your tools. The length rules above still hold: the personality lives in the wording, not in extra length.`;

/** Added to the prompt on a voice call: short spoken sentences, and moving the visitor without asking first. */
const VOICE_NOTE = `This is a live voice call. Speak in short, natural sentences, one idea at a time, with no lists, markdown or links. Do not ask permission to move the visitor: when a page or a section would help, say in a few words where you are taking them and call navigate right away, then keep talking about what is on that page. When you speak about a particular part of a post, paper or project, call cite_section for it first (with a short quote if one fits), so the page is already there when you say it. For anything long, give one passage and offer to go on to the next. Keep the wit but spoken: at most one short, warm line per turn, no setup that takes more than a breath, and stay under 35 words unless asked for more. In small talk, answer in one or two sentences; for a real question or a worried visitor, drop the jokes and answer straight; otherwise hand the conversation back with a quick question.`;

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

function chain(voice = false): Provider[] {
  const dev = devProvider();
  const smart = pickProfile() === 'smart' ? byHealth(smartProviders(), voice) : [];
  if (smart.length) startWatcher();
  return dev ? [...smart, dev] : smart;
}

const ipOf = (req: Request) => clientIp(req.headers, req.socket.remoteAddress ?? '');
// Read once at start. Exempt requests skip the request limits but never the daily token budget.
const isExempt = createExemptMatcher();
const exemptReq = (req: Request) => isExempt(ipOf(req));

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
  if (!exemptReq(req) && (!limiter.take(`voice:${session}`).ok || !limiter.take(`voice-ip:${ipOf(req)}`).ok)) {
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

// A long chat is condensed into notes by one cheap model call, with a hard timeout. A failure is a plain 503: the
// browser then simply keeps sending its newest turns, which memory.ts trims to the token budget.
copilotRouter.post('/summarize', async (req, res) => {
  const session = await checkPass(req.get('x-copilot-pass'));
  if (!session) { res.status(401).json({ ok: false, code: 'NO_PASS' }); return; }
  const parsed = summaryBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ ok: false, code: 'VALIDATION' }); return; }
  if (!exemptReq(req) && (!summaryLimiter.take(`sum:${session}`).ok || !summaryLimiter.take(`sum-ip:${ipOf(req)}`).ok)) {
    res.status(429).json({ ok: false, code: 'RATE_LIMITED' }); return;
  }
  const providers = chain();
  if (!providers.length || !budget.open()) { res.status(503).json({ ok: false, code: 'NO_MODEL' }); return; }
  const notes = await summarize(parsed.data.previous ?? '', parsed.data.messages, providers, { onUsage: (tokens) => budget.record(tokens) });
  if (!notes) { res.status(503).json({ ok: false, code: 'SUMMARY_FAILED' }); return; }
  res.set('cache-control', 'no-store').json({ ok: true, summary: notes });
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
  const exempt = isExempt(ip);
  const byIp = exempt ? { ok: true as const } : limiter.take(`ip:${ip}`);
  const bySession = !exempt && byIp.ok ? limiter.take(`session:${session}`) : byIp;
  if (!bySession.ok) {
    res.status(429).set('retry-after', String(Math.ceil((bySession.retryAt - Date.now()) / 1000))).json({ ok: false, code: 'RATE_LIMITED' });
    return;
  }
  const { messages, page, voice = false, covered = 0 } = parsed.data;
  const summary = sanitizeSummary(parsed.data.summary);
  const question = messages.at(-1)?.content ?? '';
  const turn = new TurnTrace(session);
  turn.input = question;
  turn.channel = voice ? 'voice' : 'text';
  turn.exempt = exempt;

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
  // A reply to a question the copilot just asked belongs to that thread, however much it
  // looks like an opener ("ok", "hello??"), so it goes to the model. The one exception is
  // a yes or no to one of the router's own idle offers, which it answers itself.
  const before = messages.at(-2)?.role === 'assistant' ? messages.at(-2)?.content : undefined;
  const answeringUs = Boolean(before && /\?\s*$/.test(before.trim()));
  const routed = await routeRequest(question, messages.length === 1 && !parsed.data.summary, voice, before);
  const cached = routed && (!answeringUs || routed.routine.startsWith('offer:')) ? routed : null;
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
      send({ type: 'action', action: withChip(action.kind === 'navigate' ? { ...action, go: follow } : action) });
    }
    if (voice) for (const step of cached.steps ?? []) send({ type: 'action', action: { kind: 'scrollstep', path: step.path, at: step.at } });
    send({ type: 'done', model: turn.model });
    turn.finish('done');
    res.end();
    return;
  }

  try {
    const limit = exempt ? { ok: true as const } : await takeDurableCopilotLimit(ip, session);
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
  const providers = chain(voice);
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
    // A caller hears the wait: on a call a model that has not started in 4 s gives way to the next (6 s in a chat).
    fetch: fallbackFetch(steps, fetch, console.warn, undefined, voice ? 4000 : undefined, (used) => {
      turn.model = used;
    }),
  })(steps[0].model);

  try {
    const [brief, news] = await Promise.all([siteBrief(), latestNews()]);
    // The page context rides on the user turn, not the system prompt. The prompt then
    // stays byte-identical across a conversation, which is what lets a provider's prefix
    // cache hit instead of re-billing the brief on every step of a tool loop.
    const where = page ? `\n\n[The visitor is on ${page.path} ("${page.title}").]` : '';
    const system = `${voice ? `${SYSTEM}\n\n${VOICE_NOTE}` : SYSTEM}\n\n# Site brief\n${brief}${newsBlock(news)}${summaryBlock(summary)}`;
    // Fit the history to the token budget. The routing above used the full list; the newest turns stay verbatim here,
    // so a pending offer (always in the last two) and the question itself are never cut.
    const fit = fitHistory(messages, estimateTokens(system) + estimateTokens(where) + 300, contextBudget());
    turn.contextTokens = fit.tokens;
    turn.summaryUsed = Boolean(summary);
    turn.historyDropped = fit.dropped + covered;
    turn.historyKept = fit.messages.length;
    const history: ModelMessage[] = fit.messages.map((m, index) =>
      index === fit.messages.length - 1 && m.role === 'user' ? { role: 'user', content: `${m.content}${where}` } : { role: m.role, content: m.content },
    );
    const citations = createCitations();
    // A short social reply ("im doing fine thanks!") is answered from the prompt: no tools, one step.
    const smallTalk = isPlainSmallTalk(question, before);
    const result = streamText({
      model,
      system,
      messages: history,
      tools: smallTalk ? {} : makeTools(
        // On a call the model moves the page itself and sends no buttons.
        (action) => {
          if (voice && action.kind !== 'navigate' && action.kind !== 'cite') return;
          send({ type: 'action', action: withChip(action) });
        },
        { canNavigate: voice || visitorSaidYes(messages), citations },
      ),
      stopWhen: stepCountIs(smallTalk ? 1 : 6),
      // The prompt keeps replies short; this is the ceiling, with room above a visible reply for a model that still thinks.
      maxOutputTokens: voice ? 300 : 400,
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
        turn.finishReason = part.finishReason;
        turn.inputTokens = part.totalUsage.inputTokens ?? 0;
        turn.outputTokens = part.totalUsage.outputTokens ?? 0;
        budget.record(turn.inputTokens + turn.outputTokens);
      }
    }
    turn.citations = citations.summary();
    turn.output = filter.flush();
    // A reply the model was cut off in is never sent as complete: pull it back to its last whole sentence.
    if (isCutOff(turn.finishReason, turn.output)) {
      turn.truncated = true;
      const whole = trimToLastSentence(turn.output);
      if (whole !== turn.output) {
        turn.output = whole;
        send({ type: 'text', text: whole, replace: true });
      }
    }
    // A model that only called tools and said nothing must not leave the visitor (or a call) in silence.
    // A turn with nothing at all to show is a failure: logged, and traced as an error.
    const empty = !turn.output.trim() && !turn.actions.length;
    if (!turn.output.trim()) {
      if (empty) console.warn('[copilot] empty turn from', turn.model);
      turn.output = empty
        ? 'I lost my train of thought there. Could you ask that again?'
        : turn.actions.some((a) => a.startsWith('navigate') || a === 'cite') ? 'Here it is.' : 'Here you go.';
      send({ type: 'text', text: turn.output });
    }
    send({ type: 'done', model: turn.model });
    turn.finish(empty ? 'error' : 'done');
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
