/**
 * The copilot's model chain, adapted from pukujan-lab-2/nyc-map-agent
 * server/features/agent/providers.ts (PR #36). "smart" is a chain of hosted models,
 * reordered by health (health.ts); "dev" is LFM3 on the Pro through InferHub. Smart
 * ends with dev, so a visitor only sees an error when every model is down, and the
 * client then answers from its built-in index.
 *
 * A smart key may be an Octo vault working key (octo_tmp_…): calls then go through
 * Octo's relay, which adds the real key, so this server never holds one.
 */
export type Profile = 'smart' | 'dev';

export interface Provider {
  id: string;
  label: string;
  model: string;
  /** OpenAI-compatible base URL, without /chat/completions. */
  target: string;
  key: string;
}

type Env = Record<string, string | undefined>;

/** In the order smart tries them. Each model can be changed with its *_MODEL variable. */
const TABLE = [
  // Haiku first (TASK-DB-0147): about 0.45 s to the first word and 1 s for a short answer, through Anthropic's
  // OpenAI-compatible endpoint, against about 1.7 s for DeepSeek's probe. Paid, so the daily token budget (COPILOT_DAILY_TOKENS)
  // is what caps it; unset SMART_ANTHROPIC_KEY and the chain is as before.
  { id: 'haiku', label: 'Claude Haiku (Anthropic)', keyEnv: 'SMART_ANTHROPIC_KEY', modelEnv: 'SMART_ANTHROPIC_MODEL', model: 'claude-haiku-5-5', target: 'https://api.anthropic.com/v1' },
  // InferHub sells the same model through several seats and a seat can have no offers for a day ("no available provider for cb/..."
  // on 2026-11-05), so DeepSeek is two entries on two seats: a seat that is down fails its probe and the other goes first.
  { id: 'deepseek', label: 'DeepSeek (InferHub)', keyEnv: 'SMART_DEEPSEEK_KEY', modelEnv: 'SMART_DEEPSEEK_MODEL', model: 'ali/deepseek-v4.1-flash', target: 'https://api.inferhub.dev/v1' },
  { id: 'deepseek-b', label: 'DeepSeek (InferHub, second seat)', keyEnv: 'SMART_DEEPSEEK_KEY', modelEnv: 'SMART_DEEPSEEK_MODEL_B', model: 'cbcn/deepseek-v4.1-flash', target: 'https://api.inferhub.dev/v1' },
  { id: 'qwen', label: 'Qwen (yolo)', keyEnv: 'SMART_QWEN_KEY', modelEnv: 'SMART_QWEN_MODEL', model: 'yolo', target: 'https://yolo-auto.com/v1' },
  // WorkBuddy refuses calls that do not stream and calls whose first message is not the system prompt.
  { id: 'workbuddy', label: 'WorkBuddy', keyEnv: 'SMART_WORKBUDDY_KEY', modelEnv: 'SMART_WORKBUDDY_MODEL', model: 'auto', target: 'https://www.workbuddy.ai/v2' },
  // One exact free model, never an auto-router (the vault's rule for this key).
  { id: 'openrouter', label: 'OpenRouter free', keyEnv: 'SMART_OPENROUTER_KEY', modelEnv: 'SMART_OPENROUTER_MODEL', model: 'nvidia/nemotron-3.5-super-vl:free', target: 'https://openrouter.ai/api/v1' },
] as const;

export function smartProviders(env: Env = process.env): Provider[] {
  return TABLE.flatMap((t) => {
    const key = env[t.keyEnv]?.trim();
    return key ? [{ id: t.id, label: t.label, model: env[t.modelEnv]?.trim() || t.model, target: t.target, key }] : [];
  });
}

/** Dev: InferHub with INFERHUB_MODEL, or nothing when no key is set. */
export function devProvider(env: Env = process.env): Provider | null {
  const key = env.INFERHUB_API_KEY?.trim();
  if (!key) return null;
  return {
    id: 'dev',
    label: 'Dev (InferHub)',
    model: env.INFERHUB_MODEL?.trim() || 'lfm3',
    target: (env.INFERHUB_BASE_URL?.trim() || 'https://api.inferhub.dev/v1').replace(/\/+$/, ''),
    key,
  };
}

/** AGENT_PROFILE, else smart when any smart provider is set. Smart with no keys gives dev. */
export function pickProfile(env: Env = process.env): Profile {
  const hasSmart = smartProviders(env).length > 0;
  const want = env.AGENT_PROFILE === 'dev' || env.AGENT_PROFILE === 'smart' ? env.AGENT_PROFILE : hasSmart ? 'smart' : 'dev';
  return want === 'smart' && hasSmart ? 'smart' : 'dev';
}

export const octoOrigin = (env: Env = process.env): string =>
  (env.OCTO_BASE_URL ?? 'https://octodb.design-bakery.com').replace(/\/+$/, '').replace(/\/api$/, '');

export const isWorkingKey = (key: string): boolean => key.startsWith('octo_tmp_');

/** Where one call to `path` (e.g. "/chat/completions") goes, and the headers that reach it. */
export function routeFor(p: Provider, path: string, env: Env = process.env): { url: string; headers: Record<string, string> } {
  const upstream = `${p.target}${path}`;
  const auth = { authorization: `Bearer ${p.key}` };
  return isWorkingKey(p.key)
    ? { url: `${octoOrigin(env)}/api/vault/proxy`, headers: { ...auth, 'x-octo-target': upstream } }
    : { url: upstream, headers: auth };
}
