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
import { generateText, stepCountIs, streamText, type LanguageModel, type ModelMessage, type StopCondition, type Tool, type ToolSet } from 'ai';
import { Router, type Request } from 'express';
import { z } from 'zod';
import { byHealth, healthReport, noteLatency, startWatcher } from './health.js';
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
import { ALL_BOOKING_TOOLS, bookingTools, describe, type BookingFlow } from './bookingState.js';
import { latestNews, newsBlock } from './news.js';
import { laneNameFor, loadLane } from './lanes/loader.js';
import { LANE_NAMES, type Lane } from './lanes/types.js';
import { createTextFilter } from './textFilter.js';
import { contextBudget, estimateTokens, fitHistory, sanitizeSummary, summarize, summaryBlock, SUMMARY_MAX_CHARS } from './memory.js';
import { isCutOff, trimToLastSentence } from './truncation.js';
import { mintVoiceToken, voiceTokenConfigured } from './voiceToken.js';

export type CopilotEvent =
  | { type: 'text'; text: string; replace?: boolean }
  | { type: 'action'; action: CopilotAction }
  | { type: 'step'; name: string; status: 'start' | 'done' | 'error' }
  | { type: 'done'; model: string }
  /** On a call, the model found the line was said to someone else in the visitor's room (the not_for_me tool): no reply, and the page greys it out. */
  | { type: 'ignored'; reason: string }
  | { type: 'flow'; flow: BookingFlow | null }
  /** Tests only (COPILOT_DEBUG_EVENTS=1): what the turn offered and what each tool returned, for the spec's checks (copilot-spec.md). */
  | { type: 'debug'; lane: string; maxSteps: number; offered: string[]; results: ToolResult[]; truncated: boolean; inputTokens: number; outputTokens: number }
  | { type: 'error'; message: string };

/** A tool's result as a test sees it: whether it worked, the line it gave to say, its refusal, how many passages it returned, and the start of its output (for the judge). */
type ToolResult = { name: string; ok?: boolean; say?: string; error?: string; next?: string; passages?: number; output?: string; backstop?: boolean };
function asResult(name: string, output: unknown): ToolResult {
  if (!output || typeof output !== 'object') return { name };
  const o = output as Record<string, unknown>;
  return {
    name,
    ...(typeof o.ok === 'boolean' ? { ok: o.ok } : {}),
    ...(typeof o.say === 'string' ? { say: o.say } : {}),
    ...(typeof o.error === 'string' ? { error: o.error } : {}),
    ...(typeof o.next === 'string' ? { next: o.next } : {}),
    ...(Array.isArray(o.passages) ? { passages: o.passages.length } : {}),
    output: JSON.stringify(o).slice(0, 1500),
  };
}

const chatBody = z.object({
  messages: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().min(1).max(2000) }))
    .min(1)
    .max(24),
  page: z.object({ path: z.string().max(300), title: z.string().max(200) }).optional(),
  /** True on a voice call: the reply is spoken, and the page may move on its own. */
  voice: z.boolean().optional(),
  /** The booking's state, kept by the page between turns (bookingState.ts). */
  flow: z.object({
    kind: z.literal('booking'),
    data: z.object({ name: z.string().max(60).optional(), say: z.string().max(60).optional(), email: z.string().max(120).optional(), area: z.string().max(40).optional(), nameOk: z.boolean().optional(), emailOk: z.boolean().optional() }),
  }).nullable().optional(),
  /** The visitor tapped "Answer this" on a line the call had not answered: it is for me, so the model is not offered not_for_me. */
  toMe: z.boolean().optional(),
  /** Tests only: run this turn on a named lane (the spec's lane-swap relation). Ignored unless COPILOT_DEBUG_EVENTS=1. */
  lane: z.enum(LANE_NAMES).optional(),
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

const SYSTEM = `You are AI Pujan on design-bakery.com, my portfolio: the AI version of Pujan Bajracharya, an AI engineer. Always speak as me, in the first person ("I build...", "my projects...", "my research"). Never talk about Pujan in the third person and never say "he", "him" or "his" about me: the work is mine. Visitors may call me "he", "him" or a wrong name; never correct them or remark on the name (no "I'm not X"), just answer as if they had said mine. Always be open that you are AI Pujan, an AI, when it comes up. If someone asks whether you are real or fake, or whether you and Pujan are the same person, say that he and I are one: you are AI Pujan, built from his work and speaking for him, and you are not him live. Keep it short and warm.
Visitors are often new: recruiters, founders, engineers. Help them learn about my work history, projects, research and writing, and move around the site.

How to answer:
- Keep replies short: one or two sentences, under 45 words. For a summary, at most three short points. Give more detail only when asked.
- Only state facts from the site brief or your tools; they hold only content already published on this site. If the site does not say, say so and suggest what it does cover. Never invent employers, dates, numbers or links.
- Research papers marked pending are working drafts awaiting my approval; say so when you cite one.
- Moving the visitor: do not open a page nobody asked about; offer it and wait for a yes. When the visitor asks to be shown something, directly or vaguely ("show me anything", "you pick", "I don't know"), that is the yes: pick one and call navigate in that same reply, then say one thing about it. Never ask them to choose. On a tour, take them to one page at a time and name what comes next as a statement, not a question.
- Contact and consultations: when a visitor asks how to contact me, wants to hire me, or wants a free consultation, offer the Contact page. Say that on that page they can choose an area and a time. Do not list every link, and never claim a time is booked. If the visitor is already on /contact and asks to book in this chat, or says yes to a call you offered, call book_call as soon as you know the area. Do not ask for a topic before booking; a short yes or a vague topic ("anything about AI") is enough.
- Messages: when a visitor wants to send me a message or leave a note rather than book a call, take it in this chat with send_message (their name, email and message; read it back and send only on a yes). On a call, offer the Contact page instead.
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
- When the visitor corrects you or points out a mistake, thank them in a few words with a dry line, take the correction seriously and fix it. You have a few catchphrases ("that's a load-bearing statement", "filed under things I meant to do", "working as intended, retroactively"): use one at most every few replies, never when the visitor is annoyed or the subject is serious.
- You know the famous AI trick questions (the car wash fifty metres away, letters in strawberry, 9.11 against 9.9, the seahorse emoji): answer correctly first, then one dry line. Say "famously" only about well-documented ones and never claim what any model gets wrong today.
- A joke or opinion about AI in general is yours; a project, role, number or paper is only ever what the site says, from the brief and your tools. The length rules above still hold: the personality lives in the wording, not in extra length.`;

/** Added to the prompt on a voice call: short spoken sentences, and moving the visitor without asking first. */
const VOICE_NOTE = `This is a live voice call. Speak in short, natural sentences, one idea at a time, with no lists, markdown or links. Stay under 35 words unless asked for more.
What the visitor says comes from speech recognition, which mishears names: "President" is usually Precedent, "Arise" is Arize. When a word sounds like one of my projects, papers or tools, take it as that and answer about it, without remarking on the word.
Moving the visitor: do not ask permission. When a page or a section would help, say in a few words where you are taking them and call navigate right away, then talk about what is on that page. Never say you are opening, showing or taking them somewhere ("Let's start with Cortex", "There they are") unless this same reply calls navigate, show_projects or cite_section; when the visitor says "any of them", "you pick", "anything", "whatever" or "just show me", pick one project yourself and call navigate or show_projects in that same reply. Never answer a vague ask with a question ("what are you working on?", "which one?") and never read out a list of headings or names for them to choose from. When you speak about a particular part of a post, paper or project, call cite_section for it first (with a short quote if one fits), so the page is already there when you say it. For anything long, give one passage and offer to go on to the next.
Summaries: when asked to summarise or explain a post, paper or project ("summarise this", "what's this about", "explain it"), call summarize_page once, then SAY the summary: one short sentence for each passage it returns, in order. The page follows by itself; do not call cite_section for it. The words you speak are the summary: never answer only "Here it is" or "Here you go". "Next", "next one", "previous", "go on", "keep going" or "back" on a paper, post, project or a list of them always means the neighbour in that list: call step_list, every time, and never answer it in words alone. Asked to be taken to a page ("take me to the blog", "open the research"), call navigate in that same reply. Examples, each one a tool call in the same reply as your words: "Next." on a paper -> step_list next. "Show me Precedent." -> navigate /work/precedent. "What's the best way to reach you?" or "how would I contact you" -> navigate /contact. "Take me to the blog" -> navigate /blogs. "Show me your research" -> navigate /research. Never say "here it is", "here you go" or "taking you there" without the call. When they leave the choice to you, call tour_next.
Booking a call: when they want a call or a consultation, call booking_start (it opens the Contact page itself). Each step has its own booking tool and only the tool for the current step is offered ("[Booking in progress]" at the end of their message says where it is). Call it with what the line gave, exactly as heard (keep the spelling "Poojan" even if you know a more common one; the caller corrects it at the read-back), then say the "say" it returns, word for word. Never ask for a name or email twice. A line that does not answer the step (a complaint, noise, a yes where a name was asked) is booking_repeat. A no, a spelling or a whole new email at a read-back is a correction, sent through the confirm tool with correct false. If they stop or change their mind, call booking_cancel; if they ask something else mid-booking, answer it and then take the booking up again. The button appears by itself when the last step succeeds; never say it is up before that tool result says so. A line that garbles a request to book ("book it for me", "set that up") is still a request to book: start it.
Lines for someone else: the microphone is open in the visitor's room. If a line is clearly to another person there ("Hey Campos, grab me a coffee"), call not_for_me and write nothing. A short line, a fragment, a name given as an answer or a command like "Next." is for you.
Never end a reply by handing the turn back ("Want me to...?", "Anything else?", "Which one would you like?") unless you truly need an answer to go on.
Be good company, not a brochure:
- Talk about whatever the visitor brings up: their day, their pet, their lunch, the weather, a random thought. Stay on their topic for as long as they do; react to the actual detail they said and add a take of your own. Do not steer back to my work, the site or a page unless they ask, or the chat has clearly run dry.
- Do not end every reply with a question or an offer. In about a third of replies, end on a dry, witty or mildly sarcastic throwaway line instead, for no reason at all (in the spirit of "Honestly, that's more drama than most product launches." Make up your own; never reuse that one). Offers to open a page are rare: at most one every few turns, and never two turns running.
- Gentle, good-natured teasing of famous tech figures, their products and the AI hype is fine when asked; poke at the public persona, never accuse them of anything or invent facts.
- For a real question or a worried visitor, drop the jokes and answer straight.`

/**
 * Added to the prompt in a text chat whose lane has suggest_followups: every reply leaves buttons to press, and a page is offered
 * as a button. The fixed answers that used to bring their own buttons are gone (#221), so without this the model rarely made any.
 */
const CHAT_NOTE = `This is a text chat, and every reply leaves the visitor buttons to press. In the same reply as your words, call suggest_followups once: two or three short questions they might ask next, written as they would type them, and, when a page would help, up to two pages to open (for example /#work "See the work", /work/precedent "Open Precedent", /contact "Contact page"). A page button is how you offer a page in a chat: do not also ask "Want me to open...?" in words, and call navigate only when they asked to go there or said yes. Never list the buttons in your words.`;

/** Tools that only put something on the page; their result gives the model nothing new to say. */
const SHOWS_ONLY = ['suggest_followups', 'show_projects', 'share_link', 'navigate', 'cite_section'];

/**
 * A chat reply is done once its words are written and its buttons are out: another round trip would only add a second
 * paragraph below the buttons. A step that also read something (a post, a summary) still goes on, so the answer is not cut.
 */
const answeredWithButtons: StopCondition<ToolSet> = ({ steps }) => {
  const calls = steps.at(-1)?.toolCalls ?? [];
  return calls.some((call) => call.toolName === 'suggest_followups') && calls.every((call) => SHOWS_ONLY.includes(call.toolName)) && steps.some((step) => step.text.trim() !== '');
};

/** The one call a chat reply gets when the model wrote it without buttons: the reply is done, and this call can only make them. */
const BUTTONS_ONLY = `You are AI Pujan on design-bakery.com, the portfolio of Pujan Bajracharya, an AI engineer, and you speak as him. The reply below is already written. Call suggest_followups for it: two or three short questions the visitor might ask next, written as they would type them, and up to two pages of the site worth opening next (/#about, /#experience, /#work, /blogs, /research, /contact).`;

async function backstopButtons(model: LanguageModel, suggest: Tool, question: string, answer: string, page: { path: string } | undefined, signal: AbortSignal) {
  await generateText({
    model,
    system: BUTTONS_ONLY,
    prompt: `The visitor is on ${page?.path ?? '/'}.\nThe visitor wrote: ${question}\nI replied: ${answer}`,
    tools: { suggest_followups: suggest },
    toolChoice: { type: 'tool', toolName: 'suggest_followups' },
    stopWhen: stepCountIs(1),
    maxOutputTokens: 300,
    // The reply is already on screen: buttons that take longer than this are not worth holding the stream for.
    abortSignal: AbortSignal.any([signal, AbortSignal.timeout(8000)]),
  });
}

/** On a call there are no follow-up buttons: the tool that makes them only costs a model round trip and its suggestions go nowhere. */
function callTools<T extends Record<string, unknown>>(tools: T, voice: boolean, booking: BookingFlow | null): Partial<T> {
  if (!voice) {
    const chat = { ...tools } as Record<string, unknown>;
    for (const name of [...ALL_BOOKING_TOOLS, 'not_for_me']) delete chat[name];
    return chat as Partial<T>;
  }
  // On a call the booking tools offered are the ones for the booking's current step (bookingState.ts), decided before the model runs.
  const rest = { ...tools } as Record<string, unknown>;
  // send_message too: an email address spelled out by voice goes wrong too easily.
  for (const name of ['suggest_followups', 'book_call', 'send_message']) delete rest[name];
  const offered = bookingTools(booking);
  for (const name of ALL_BOOKING_TOOLS) if (!offered.includes(name)) delete rest[name];
  return rest as Partial<T>;
}

/** Which list the page belongs to, so "next" and "previous" are read against it. From the path alone. */
function listHintFor(path: string): string {
  const [top, second] = path.split('#')[0].split('/').filter(Boolean);
  const kind = top === 'research' ? 'papers' : top === 'blogs' ? 'posts' : top === 'work' && second ? 'projects' : '';
  return kind ? ` This page is in the list of my ${kind}: "next" and "previous" mean step_list.` : '';
}

/** A lane with a closed tool list offers only those tools. */
function onlyLaneTools<T extends Record<string, unknown>>(lane: Lane, tools: T): Partial<T> {
  const allowed = lane.manifest.tools;
  if (allowed === 'all') return tools;
  return Object.fromEntries(Object.entries(tools).filter(([name]) => allowed.includes(name))) as Partial<T>;
}

/** The providers a lane may use, in health order. Without a lane, all of them (the summary and /config use that). */
function chain(voice = false, lane?: Lane): Provider[] {
  const dev = devProvider();
  const smart = pickProfile() === 'smart' ? byHealth(smartProviders(), voice) : [];
  if (smart.length) startWatcher();
  const all = dev ? [...smart, dev] : smart;
  return lane ? all.filter((p) => lane.manifest.providers.includes(p.id)) : all;
}

/** One model over the provider chain, falling back down it. A caller hears the wait: on a call a model that has not started
 * in 4 s gives way to the next (6 s in a chat). `hurry`: a busy model is skipped at once instead of retried after a pause. */
function modelFor(providers: Provider[], voice: boolean, onUse: (model: string) => void, hurry = false, lane?: Lane) {
  const steps = providers.map((p) => ({ name: `${p.id}:${p.model}`, model: p.model, route: (path: string) => routeFor(p, path) }));
  return createOpenAICompatible({
    name: 'copilot',
    baseURL: 'http://copilot.invalid/v1',
    apiKey: 'per-provider',
    fetch: fallbackFetch(steps, fetch, console.warn, hurry ? () => Promise.resolve() : undefined, lane ? lane.manifest.limits.startMs[voice ? 'voice' : 'chat'] : voice ? 4000 : undefined, (name, ms) => { noteLatency(name.split(':')[0], ms); onUse(name); }, lane?.adjustBody),
  })(steps[0].model);
}

const ipOf = (req: Request) => clientIp(req.headers, req.socket.remoteAddress ?? '');
// Read once at start. Exempt requests skip the request limits but never the daily token budget.
const isExempt = createExemptMatcher();
const exemptReq = (req: Request) => isExempt(ipOf(req));

export const copilotRouter = Router();

copilotRouter.get('/config', (req, res) => {
  res.set('cache-control', 'no-store').json({
    ok: true,
    // No site key for the owner's network: the page then asks for a pass without showing the human check.
    turnstileSiteKey: exemptReq(req) ? null : turnstileSiteKey(),
    booking: Boolean(process.env.COPILOT_BOOKING_URL?.trim()),
    live: chain().length > 0,
  });
});

copilotRouter.post('/pass', async (req, res) => {
  const ip = ipOf(req);
  // The owner's own addresses skip the request limits (fairUse.ts), this one included: the simulator asks for a pass per run.
  if (!exemptReq(req) && !passLimiter.take(`pass:${ip}`).ok) {
    res.status(429).json({ ok: false, code: 'RATE_LIMITED' });
    return;
  }
  const token = typeof req.body?.token === 'string' ? req.body.token : '';
  const proof = typeof req.body?.visitor === 'string' ? req.body.visitor.slice(0, 2048) : undefined;
  const issued = await issuePass(token, ip, proof, exemptReq(req));
  if (!issued) {
    res.status(403).json({ ok: false, code: 'CHALLENGE_FAILED' });
    return;
  }
  res.set('cache-control', 'no-store').json({ ok: true, pass: issued.pass, visitor: issued.visitor });
});

copilotRouter.get('/health', (_req, res) => {
  res.set('cache-control', 'no-store').json({ ok: true, profile: pickProfile(), smart: healthReport(), dev: Boolean(devProvider()) });
});

const VOICE_SERVICE = 'https://copilot.design-bakery.com';
/**
 * The voice service sleeps when idle and its first token after that took 11.7 s, past the old 10 s cut-off, so a visitor's
 * first call failed with "Voice is unavailable". It now gets 25 s, and one more try if the first fails.
 */
async function voiceGrant(): Promise<{ url?: unknown; token?: unknown }> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      const response = await fetch(`${VOICE_SERVICE}/api/voice/token`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}',
        signal: AbortSignal.timeout(25_000),
      });
      if (!response.ok) throw new Error('voice service unavailable');
      return await response.json() as { url?: unknown; token?: unknown };
    } catch (error) {
      if (attempt >= 1) throw error;
    }
  }
}

let warmedAt = 0;
// The page calls this when the call button shows, so the voice agent is awake before anyone presses it. The service stops
// the agent after 10 idle minutes and starts it again (about 10 s) on /api/voice/options, without waiting; its health page
// does not wake it. Once a minute at most, whoever asks; it hands out no token, so it needs no pass.
copilotRouter.post('/voice/warm', (_req, res) => {
  if (!voiceTokenConfigured() && Date.now() - warmedAt > 60_000) {
    warmedAt = Date.now();
    void fetch(`${VOICE_SERVICE}/api/voice/options`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}',
      signal: AbortSignal.timeout(10_000),
    }).catch(() => undefined);
  }
  res.status(204).end();
});

// The voice service creates a room; the visitor's spoken turns are answered by
// /chat, so it has the same published site knowledge and visitor limits.
copilotRouter.post('/voice', async (req, res) => {
  const session = await checkPass(req.get('x-copilot-pass'));
  if (!session) { res.status(401).json({ ok: false, code: 'NO_PASS' }); return; }
  if (!exemptReq(req) && (!limiter.take(`voice:${session}`).ok || !limiter.take(`voice-ip:${ipOf(req)}`).ok)) {
    res.status(429).json({ ok: false, code: 'RATE_LIMITED' }); return;
  }
  // `call` is the visitor's session: the page hands it to the voice agent, so the agent's spans join this session in Phoenix.
  if (voiceTokenConfigured()) {
    const grant = mintVoiceToken();
    res.set('cache-control', 'no-store').json({ url: grant.url, token: grant.token, call: session });
    return;
  }
  try {
    const grant = await voiceGrant();
    if (grant.url !== 'wss://copilot.design-bakery.com' || typeof grant.token !== 'string') throw new Error('invalid voice grant');
    res.set('cache-control', 'no-store').json({ url: grant.url, token: grant.token, call: session });
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
  const { messages, page, voice = false, covered = 0, toMe = false } = parsed.data;
  const summary = sanitizeSummary(parsed.data.summary);
  const question = messages.at(-1)?.content ?? '';
  const turn = new TurnTrace(session);
  turn.input = question;
  turn.channel = voice ? 'voice' : 'text';
  turn.exempt = exempt;

  // Every line goes to the model, which decides what it means: answer, move the page (tools), fill the booking, or find it
  // was said to someone else in the room (not_for_me). No wording is matched here.
  const before = messages.at(-2)?.role === 'assistant' ? messages.at(-2)?.content : undefined;
  void before;
  // What AI Pujan has already said, so a tour moves on to somewhere new (tour_next).
  const said = messages.filter((m) => m.role === 'assistant').slice(-12).map((m) => m.content).join(' ');
  let booking: BookingFlow | null = (parsed.data.flow ?? null) as BookingFlow | null;
  let bookingTouched = false;
  let ignoredLine = false;

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
  // The lane for this channel (lanes/): its providers, its limits, its tool list and its model fixes. The others are not loaded.
  // A test run (COPILOT_DEBUG_EVENTS=1) may name the lane and is sent a debug event; a public request can do neither.
  const debugEvents = process.env.COPILOT_DEBUG_EVENTS === '1';
  const lane = await loadLane(debugEvents && parsed.data.lane ? parsed.data.lane : laneNameFor(voice ? 'voice' : 'chat'));
  turn.lane = lane.manifest.name;
  const channel = voice ? 'voice' : 'chat';
  const providers = chain(voice, lane);
  if (!providers.length || !budget.open()) {
    res.status(503).json({ ok: false, code: providers.length ? 'BUDGET' : 'NO_MODEL' });
    return;
  }

  // Only now does the reply start streaming: a refusal above (limit, budget, no model) is still a proper HTTP status.
  res.status(200).set({ 'content-type': 'application/x-ndjson; charset=utf-8', 'cache-control': 'no-store', 'x-accel-buffering': 'no' });
  res.flushHeaders();
  const send = (event: CopilotEvent) => {
    if (event.type === 'action') turn.actions.push(event.action.kind === 'navigate' ? `navigate:${event.action.path}${event.action.go ? '(go)' : ''}` : event.action.kind);
    res.write(`${JSON.stringify(event)}\n`);
  };

  const abort = new AbortController();
  res.on('close', () => {
    if (!res.writableFinished) abort.abort();
  });

  const model = modelFor(providers, voice, (used) => {
    turn.model = used;
  }, false, lane);

  try {
    const [brief, news] = await Promise.all([siteBrief(), latestNews()]);
    // The page context rides on the user turn, not the system prompt. The prompt then
    // stays byte-identical across a conversation, which is what lets a provider's prefix
    // cache hit instead of re-billing the brief on every step of a tool loop.
    const listHint = page ? listHintFor(page.path) : '';
    const where = `${page ? `\n\n[The visitor is on ${page.path} ("${page.title}").${listHint}]` : ''}${voice && booking ? `\n[Booking in progress: ${describe(booking.data)}]` : ''}`;
    // The chat note asks for suggest_followups, so it goes only where that tool is offered (the small lane has none).
    const buttons = !voice && (lane.manifest.tools === 'all' || lane.manifest.tools.includes('suggest_followups'));
    const system = `${voice ? `${SYSTEM}\n\n${VOICE_NOTE}` : buttons ? `${SYSTEM}\n\n${CHAT_NOTE}` : SYSTEM}${lane.promptNote ? `\n\n${lane.promptNote}` : ''}\n\n# Site brief\n${brief}${newsBlock(news)}${summaryBlock(summary)}`;
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
    const offered = onlyLaneTools(lane, callTools(makeTools(
        // On a call the model moves the page itself and sends no buttons; project cards and the booking button are what a call shows.
        (action) => {
          if (voice && action.kind !== 'navigate' && action.kind !== 'cite' && action.kind !== 'book' && action.kind !== 'projects') return;
          send({ type: 'action', action: withChip(action) });
        },
        {
          canNavigate: true, citations, voice, page, said,
          booking: { get: () => booking, set: (next) => { booking = next; bookingTouched = true; } },
          notForMe: () => { if (!toMe) ignoredLine = true; },
        },
      ), voice, booking));
    turn.offered = Object.keys(offered);
    const results: ToolResult[] = [];
    const debug = () => {
      if (debugEvents) send({ type: 'debug', lane: lane.manifest.name, maxSteps: lane.manifest.limits.maxSteps[channel], offered: turn.offered, results, truncated: turn.truncated, inputTokens: turn.inputTokens, outputTokens: turn.outputTokens });
    };
    const result = streamText({
      model,
      system,
      messages: history,
      tools: offered,
      // Each step is a model round trip: on a call six of them took 18 to 32 s. Four leave room for a read, a page move and a pointer.
      stopWhen: buttons ? [stepCountIs(lane.manifest.limits.maxSteps[channel]), answeredWithButtons] : stepCountIs(lane.manifest.limits.maxSteps[channel]),
      // The prompt keeps replies short; this is the ceiling, with room above a visible reply for a model that still thinks.
      maxOutputTokens: lane.manifest.limits.maxOutputTokens[channel],
      abortSignal: abort.signal,
    });

    // Streaming hygiene lives in textFilter.ts: leaked reasoning blocks are cut, and the
    // "let me look that up" line before a tool call is dropped.
    const filter = createTextFilter((text, replace) => send({ type: 'text', text, replace }));

    for await (const part of result.fullStream) {
      if (part.type === 'text-delta') {
        if (!ignoredLine) filter.push(part.text);
      } else if (part.type === 'tool-call') {
        filter.toolCall();
        turn.stepStart(part.toolCallId, part.toolName, part.input);
        send({ type: 'step', name: part.toolName, status: 'start' });
      } else if (part.type === 'tool-result') {
        filter.toolResult();
        turn.stepEnd(part.toolCallId, true, part.output);
        results.push(asResult(part.toolName, part.output));
        send({ type: 'step', name: part.toolName, status: 'done' });
      } else if (part.type === 'tool-error') {
        turn.stepEnd(part.toolCallId, false);
        results.push({ name: part.toolName, ok: false });
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
    if (bookingTouched) send({ type: 'flow', flow: booking });
    if (ignoredLine) {
      turn.model = turn.model || 'addressee';
      turn.actions.push('ignored');
      send({ type: 'ignored', reason: 'said to someone else' });
      debug();
      send({ type: 'done', model: turn.model });
      turn.finish('done');
      return;
    }
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
    // The prompt asks for buttons on every chat reply, and most replies have them; one that came without gets them here.
    if (buttons && !empty && offered.suggest_followups && !turn.actions.includes('ask') && !abort.signal.aborted) {
      // Sent as a step like any tool call, so the page and the trace see which tool made the buttons.
      turn.stepStart('backstop', 'suggest_followups', {});
      send({ type: 'step', name: 'suggest_followups', status: 'start' });
      try {
        await backstopButtons(model, offered.suggest_followups, question, turn.output, page, abort.signal);
        turn.stepEnd('backstop', true);
        results.push({ name: 'suggest_followups', ok: true, backstop: true });
        send({ type: 'step', name: 'suggest_followups', status: 'done' });
      } catch (error) {
        turn.stepEnd('backstop', false);
        results.push({ name: 'suggest_followups', ok: false, backstop: true });
        if (!abort.signal.aborted) {
          send({ type: 'step', name: 'suggest_followups', status: 'error' });
          console.warn('[copilot] no follow-up buttons:', error instanceof Error ? error.message.slice(0, 200) : 'unknown');
        }
      }
    }
    debug();
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
