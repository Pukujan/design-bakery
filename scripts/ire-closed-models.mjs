// Closed (API-only) model families and vendors that must never appear on the IRE page,
// which only covers open-weight models. Shared by the static and browser checks.
//
// A few tool and protocol names are allowed because they describe how to call InferHub,
// not which model to call: the Claude Code CLI and the bare `claude` command that starts
// it, the "OpenAI-compatible" and "Anthropic-compatible" endpoints, Claude Code's
// ANTHROPIC_* environment variables and LiteLLM's "openai/" client prefix. They're
// removed before the check runs.
const ALLOWED = [
  /\bClaude Code/gi,
  /\bOpenAI-compatible\b/gi,
  /\bAnthropic-compatible\b/gi,
  /\bANTHROPIC_[A-Z_]+\b/g,
  /^[ \t]*claude[ \t]*$/gm,
  /\bopenai\//g,
];

const CLOSED = [
  ['GPT', /\bGPT\b/i],
  ['OpenAI', /\bOpenAI\b/i],
  ['Codex', /\bCodex\b/i],
  ['Claude', /\bClaude\b/i],
  ['Anthropic', /\bAnthropic\b/i],
  ['Gemini', /\bGemini\b/i],
  ['Google', /\bGoogle\b/i],
  ['Grok', /\bGrok\b/i],
  ['xAI', /\bxAI\b/],
  ['Muse Spark', /\bMuse[\s-]?Spark\b/i],
  ['Meta', /\bMeta\b/],
];

/** Names of closed model families or vendors found in `text`, after the allowed tool names are removed. */
export function closedModelNames(text) {
  let t = String(text);
  for (const rx of ALLOWED) t = t.replace(rx, ' ');
  return CLOSED.filter(([, rx]) => rx.test(t)).map(([name]) => name);
}

/** Visible text of an HTML document: no tags, scripts or styles, with meta descriptions kept. */
export function visibleText(html) {
  const metas = [...html.matchAll(/<meta[^>]+content="([^"]*)"/gi)].map((m) => m[1]);
  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
  return `${metas.join(' ')} ${body}`;
}
