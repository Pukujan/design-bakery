/**
 * The judge (copilot-spec.md §7, J-1 to J-5): a small model reads one turn (the line, the reply, the tools and what they
 * returned, the actions) against the rubric in scripts/sim/judge.json and says pass or fail for each id asked, with a reason.
 * It is for wording the code does not write; everything the code decides is checked without it.
 */
import { readFile } from 'node:fs/promises';

export async function loadRubric(file = new URL('../judge.json', import.meta.url)) {
  return JSON.parse(await readFile(file, 'utf8'));
}

/** The ids every turn is judged on without asking: J-1 whenever there is a reply, J-2 when a page was summarised. */
export function defaultAsks(t) {
  if (t.ignored || !t.text.trim()) return {};
  return { 'J-1': '', ...(t.steps.includes('summarize_page') || t.steps.includes('speak_summary') ? { 'J-2': '' } : {}) };
}

/** One action as the page experienced it, so the judge need not know the event format. */
export function describeAction(a) {
  if (a.kind === 'navigate') return a.go ? `moved the page to ${a.path}` : `showed a button to open ${a.path}`;
  if (a.kind === 'cite') return `highlighted ${a.heading ? `"${a.heading}"` : 'a passage'} on ${a.path}`;
  if (a.kind === 'projects') return `showed project cards: ${(a.slugs ?? []).join(', ')}`;
  if (a.kind === 'link') return `showed a link button "${a.label}" (${a.url})`;
  if (a.kind === 'book') return 'showed the Pick a time booking button';
  if (a.kind === 'ask') return 'showed follow-up question buttons';
  return a.kind;
}

export function judgeMessages(rubric, t, asks, brief = '') {
  const ids = Object.keys(asks);
  const rules = ids.map((id) => `${id}: ${rubric.rubric[id]}${asks[id] ? `\n  For this turn: ${asks[id]}` : ''}`).join('\n');
  const tools = t.results.length ? t.results.map((r) => `- ${r.name}: ${r.output ?? JSON.stringify(r)}`).join('\n') : '(none)';
  const actions = t.actions.length ? t.actions.map((a) => `- ${describeAction(a)}`).join('\n') : '(none)';
  return [
    {
      role: 'system',
      content: 'You check one turn of a portfolio site\'s AI assistant ("AI Pujan", speaking as Pujan) against rules. Judge only the rules listed. Be strict about facts and claims, lenient about style. Answer with one JSON object and nothing else: {"<id>": {"pass": true|false, "why": "<one short sentence>"}} for every id listed.',
    },
    {
      role: 'user',
      content: [
        `Rules:\n${rules}`,
        `The visitor was on ${t.pageBefore?.path ?? '/'}${t.voice ? ', on a voice call' : ''}. After the turn the page is ${t.pageAfter?.path ?? t.pageBefore?.path ?? '/'}.`,
        `The visitor said: ${JSON.stringify(t.say)}`,
        `Tools the assistant called and what they returned:\n${tools}`,
        `Actions the page received (page moves, highlights, cards, buttons):\n${actions}`,
        `The assistant's reply: ${JSON.stringify(t.text)}`,
        ...(brief ? [`Site brief (the published facts):\n${brief}`] : []),
      ].join('\n\n'),
    },
  ];
}

/** Reads the judge's JSON answer; an id it left out comes back as unknown, never as a pass. */
export function parseVerdict(text, ids) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  let parsed = {};
  if (start >= 0 && end > start) { try { parsed = JSON.parse(text.slice(start, end + 1)); } catch { parsed = {}; } }
  return Object.fromEntries(ids.map((id) => {
    const v = parsed[id];
    return [id, v && typeof v.pass === 'boolean' ? { pass: v.pass, why: String(v.why ?? '') } : { pass: null, why: 'the judge gave no verdict' }];
  }));
}

const trimEnd = (text, tail) => { let s = text; while (s.endsWith(tail)) s = s.slice(0, -tail.length); return s; };

/** Where the judge's call goes: an Octo working key (octo_tmp_) goes through Octo's vault proxy, as the backend's routeFor. */
export function judgeRoute(env, target, key) {
  const upstream = `${trimEnd(target, '/')}/chat/completions`;
  const auth = { authorization: `Bearer ${key}` };
  if (!key.startsWith('octo_tmp_')) return { url: upstream, headers: auth };
  const origin = trimEnd(trimEnd(env.OCTO_BASE_URL?.trim() || 'https://octodb.design-bakery.com', '/'), '/api');
  return { url: `${origin}/api/vault/proxy`, headers: { ...auth, 'x-octo-target': upstream } };
}

/** A judge bound to the rubric and a key. Returns failures as { id, turn, msg } and keeps every verdict in `verdicts`. */
export function createJudge({ env, rubric, brief = async () => '' }) {
  const key = env.SMART_DEEPSEEK_KEY?.trim();
  const model = env.SIM_JUDGE_MODEL?.trim() || rubric.model;
  const verdicts = [];
  let usage = 0;
  async function judge(t, asks) {
    const ids = Object.keys(asks);
    if (!ids.length) return [];
    if (!key) return [{ id: 'JUDGE', turn: t.i, msg: 'no judge key (SMART_DEEPSEEK_KEY) in backend/.env: wording not checked' }];
    const route = judgeRoute(env, rubric.target, key);
    const body = JSON.stringify({
      model, temperature: 0, max_tokens: 400, thinking: { type: 'disabled' },
      messages: judgeMessages(rubric, t, asks, ids.includes('J-3') ? await brief() : ''),
    });
    const call = () => fetch(route.url, {
      method: 'POST', headers: { 'content-type': 'application/json', ...route.headers }, body, signal: AbortSignal.timeout(45_000),
    }).catch((error) => ({ ok: false, status: 0, error }));
    // A gateway error (no answer, 5xx) is tried twice more; a refusal (4xx) is not.
    let r = await call();
    for (let attempt = 1; attempt <= 2 && !r.ok && (r.status === 0 || r.status >= 500); attempt += 1) {
      await new Promise((done) => setTimeout(done, 1500 * attempt));
      r = await call();
    }
    if (!r.ok) return [{ id: 'JUDGE', turn: t.i, msg: `the judge did not answer (HTTP ${r.status}): ${ids} not checked` }];
    const j = await r.json();
    usage += (j.usage?.prompt_tokens ?? 0) + (j.usage?.completion_tokens ?? 0);
    const verdict = parseVerdict(j.choices?.[0]?.message?.content ?? '', ids);
    const out = [];
    for (const id of ids) {
      verdicts.push({ turn: t.i, id, ...verdict[id] });
      if (verdict[id].pass === false) out.push({ id, turn: t.i, msg: `${verdict[id].why} (reply: "${t.text.slice(0, 120)}")` });
      if (verdict[id].pass === null) out.push({ id: 'JUDGE', turn: t.i, msg: `${id}: ${verdict[id].why}` });
    }
    return out;
  }
  return { judge, verdicts, tokens: () => usage, version: rubric.version };
}

/** The site brief, built by the compiled backend (pnpm --dir backend build) from the same content the copilot reads. */
export function briefLoader(env) {
  let cached = null;
  return async () => {
    if (cached !== null) return cached;
    for (const [k, v] of Object.entries(env)) if (process.env[k] === undefined) process.env[k] = v;
    try {
      const { siteBrief } = await import(new URL('../../../backend/lib/copilot/knowledge.js', import.meta.url).href);
      cached = await siteBrief();
    } catch (error) {
      console.warn(`[judge] no site brief (${error instanceof Error ? error.message.slice(0, 100) : 'unknown'}): J-3 judged without it`);
      cached = '';
    }
    return cached;
  };
}

/** Runs async jobs a few at a time. */
export async function pool(jobs, size = 4) {
  const out = [];
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(size, jobs.length) }, async () => {
    while (next < jobs.length) {
      const i = next++;
      out[i] = await jobs[i]();
    }
  }));
  return out;
}
