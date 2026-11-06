/**
 * Plays a conversation through the copilot's real backend, as the page does on a call: it keeps the messages, the page the
 * visitor is on (moved when a reply moves it) and the threads (`flow`, replaced by each `flow` event), and records every turn
 * as the spec's checks need it. The backend must run with COPILOT_DEBUG_EVENTS=1 (the `api-voice` launch config).
 */

export function createClient(base = 'http://localhost:8787') {
  const root = base.endsWith('/') ? base.slice(0, -1) : base;
  let token = null;
  async function pass() {
    if (token) return token;
    const r = await fetch(`${root}/api/copilot/pass`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"token":""}' });
    const j = await r.json();
    if (!j.pass) throw new Error(`no pass from ${root}: ${JSON.stringify(j)}`);
    // One pass serves every run: it lasts two hours, and /pass has its own rate limit.
    token = j.pass;
    return token;
  }
  async function turn(body) {
    const t = Date.now();
    const r = await fetch(`${root}/api/copilot/chat`, {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-copilot-pass': await pass() }, body: JSON.stringify(body),
    });
    const raw = await r.text();
    const events = raw.split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return { type: 'garbled', raw: l }; } });
    return { events, ms: Date.now() - t, status: r.status };
  }
  return { pass, turn, base: root };
}

/** The reply as the visitor ends up with it: a `replace` event takes back what was streamed before it. */
export const replyText = (events) => events.filter((x) => x.type === 'text').reduce((acc, x) => (x.replace ? x.text : acc + x.text), '');

/**
 * Runs `conversation` ({ startPage, steps: [{ say, page?, toMe? }] }) and returns one record per turn.
 * `lane` asks the backend for a lane (honoured only in a test run); `voice` defaults to true, as on a call.
 */
export async function runConversation(client, conversation, { lane, voice = true } = {}) {
  const messages = [];
  let flow = null;
  let page = conversation.startPage ?? { path: '/', title: 'Home' };
  const turns = [];
  for (const [i, step] of conversation.steps.entries()) {
    if (step.page) page = step.page;
    const pageBefore = page;
    const flowBefore = flow;
    messages.push({ role: 'user', content: step.say });
    const got = await client.turn({
      messages: messages.slice(-24), voice,
      ...(step.toMe ? { toMe: true } : {}), ...(flow ? { flow } : {}), ...(page ? { page } : {}), ...(lane ? { lane } : {}),
    });
    for (const ev of got.events) if (ev.type === 'flow') flow = ev.flow;
    const actions = got.events.filter((x) => x.type === 'action').map((x) => x.action);
    // The page moves when a reply moves it (the call's browser takes the move before the speech): the next turn is told so.
    for (const a of actions) {
      if (a.kind === 'navigate' && a.go) page = { path: a.path, title: a.label };
      if (a.kind === 'cite') page = { path: a.path, title: page.title };
    }
    const text = replyText(got.events);
    const debug = got.events.find((x) => x.type === 'debug');
    messages.push({ role: 'assistant', content: text || '(no reply)' });
    turns.push({
      i: i + 1, say: step.say, toMe: step.toMe === true, voice,
      pageBefore, pageAfter: page, flowBefore, flowAfter: flow,
      text, actions,
      steps: got.events.filter((x) => x.type === 'step' && x.status === 'start').map((x) => x.name),
      results: debug?.results ?? [],
      offered: debug?.offered ?? null,
      lane: debug?.lane ?? null,
      maxSteps: debug?.maxSteps ?? null,
      truncated: debug?.truncated ?? false,
      tokens: debug ? debug.inputTokens + debug.outputTokens : null,
      ignored: got.events.some((x) => x.type === 'ignored'),
      errors: [...(got.status === 200 ? [] : [`HTTP ${got.status}`]), ...got.events.filter((x) => x.type === 'error').map((x) => x.message)],
      ms: got.ms,
      model: got.events.find((x) => x.type === 'done')?.model ?? '-',
    });
  }
  return turns;
}
