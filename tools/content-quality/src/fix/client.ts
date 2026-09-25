/**
 * Model client for `content:fix`.
 *
 * The endpoint is [OI]-compatible (`POST {base}/v1/chat/completions`) by
 * default, and Anthropic-compatible (`POST {base}/v1/messages`) when
 * `CQ_PROVIDER=anthropic` or the base URL contains "anthropic".
 */

export interface ModelConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  provider: 'openai' | 'anthropic';
  /** Optional full path override, e.g. `/v1/chat/completions`. */
  path?: string;
  maxTokens: number;
  temperature: number;
  timeoutMs: number;
}

export const DEFAULT_BASE_URL = 'https://api.inferhub.dev';
export const DEFAULT_MODEL = 'cb/deepseek-v4.1-flash';

export interface ChatMessage {
  role: 'system' | 'user';
  content: string;
}

export type Complete = (messages: ChatMessage[]) => Promise<string>;

export function modelConfigFromEnv(env: NodeJS.ProcessEnv = process.env): ModelConfig {
  const baseUrl = (env.CQ_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
  const provider = (env.CQ_PROVIDER ?? (/anthropic/i.test(baseUrl) ? 'anthropic' : 'openai')).toLowerCase();
  const config: ModelConfig = {
    baseUrl,
    apiKey: env.CQ_API_KEY ?? '',
    model: env.CQ_MODEL ?? DEFAULT_MODEL,
    provider: provider === 'anthropic' ? 'anthropic' : 'openai',
    maxTokens: Number.parseInt(env.CQ_MAX_TOKENS ?? '4096', 10) || 4096,
    temperature: Number.parseFloat(env.CQ_TEMPERATURE ?? '0') || 0,
    timeoutMs: Number.parseInt(env.CQ_TIMEOUT_MS ?? '120000', 10) || 120000,
  };
  if (env.CQ_PATH) config.path = env.CQ_PATH;
  return config;
}

export function endpointFor(config: ModelConfig): string {
  if (config.path) return `${config.baseUrl}${config.path.startsWith('/') ? '' : '/'}${config.path}`;
  const suffix = config.baseUrl.endsWith('/v1') ? '' : '/v1';
  return config.provider === 'anthropic'
    ? `${config.baseUrl}${suffix}/messages`
    : `${config.baseUrl}${suffix}/chat/completions`;
}

/** Never let an API key reach a log line. */
export function redact(text: string, apiKey: string): string {
  if (!apiKey) return text;
  return text.split(apiKey).join('[redacted]');
}

export function createComplete(config: ModelConfig, fetchImpl: typeof fetch = fetch): Complete {
  return async (messages: ChatMessage[]): Promise<string> => {
    if (!config.apiKey) {
      throw new Error('CQ_API_KEY is not set; the fix command needs an API key (never commit it).');
    }
    const url = endpointFor(config);
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    let body: unknown;
    if (config.provider === 'anthropic') {
      headers['x-api-key'] = config.apiKey;
      headers['anthropic-version'] = '2023-06-01';
      const system = messages.filter((message) => message.role === 'system').map((message) => message.content).join('\n\n');
      body = {
        model: config.model,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        ...(system ? { system } : {}),
        messages: messages.filter((message) => message.role !== 'system').map((message) => ({
          role: 'user',
          content: message.content,
        })),
      };
    } else {
      headers.authorization = `Bearer ${config.apiKey}`;
      body = {
        model: config.model,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        messages,
      };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.timeoutMs);
    let response: Response;
    try {
      response = await fetchImpl(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (error) {
      throw new Error(`Model request failed: ${redact(String(error), config.apiKey)}`);
    } finally {
      clearTimeout(timer);
    }

    const text = await response.text();
    if (!response.ok) {
      throw new Error(`Model request failed with HTTP ${response.status}: ${redact(text.slice(0, 500), config.apiKey)}`);
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error(`Model returned non-JSON output: ${redact(text.slice(0, 200), config.apiKey)}`);
    }
    return extractContent(parsed);
  };
}

function extractContent(payload: unknown): string {
  if (typeof payload !== 'object' || payload === null) return '';
  const record = payload as Record<string, unknown>;
  const choices = record.choices;
  if (Array.isArray(choices) && choices.length > 0) {
    const first = choices[0] as { message?: { content?: unknown }; text?: unknown };
    if (typeof first?.message?.content === 'string') return first.message.content;
    if (typeof first?.text === 'string') return first.text;
  }
  const content = record.content;
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part === 'object' && part !== null ? String((part as { text?: unknown }).text ?? '') : ''))
      .join('');
  }
  if (typeof content === 'string') return content;
  return '';
}
