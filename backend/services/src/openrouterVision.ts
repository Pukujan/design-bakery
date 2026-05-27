import type { OpenRouterUsage } from './openrouter.js';

export const DEFAULT_OCR_VL_MODEL = 'qwen/qwen3-vl-8b-instruct';

export function resolveOcrVisionModel(): string {
  return process.env.OPENROUTER_OCR_MODEL?.trim() || DEFAULT_OCR_VL_MODEL;
}

export async function callOpenRouterVision(params: {
  apiKey: string;
  model?: string;
  system: string;
  userText: string;
  imageUrl: string;
  maxTokens?: number;
}): Promise<{ content: string; usage: OpenRouterUsage; model: string }> {
  const model = params.model?.trim() || resolveOcrVisionModel();
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://design-bakery.local',
      'X-Title': 'Design Bakery Media Library OCR',
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: params.maxTokens ?? 256,
      messages: [
        { role: 'system', content: params.system },
        {
          role: 'user',
          content: [
            { type: 'text', text: params.userText },
            { type: 'image_url', image_url: { url: params.imageUrl } },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenRouter vision ${response.status}: ${text.slice(0, 400)}`);
  }

  const json = (await response.json()) as {
    model?: string;
    choices?: { message?: { content?: string } }[];
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };

  const content = json.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error('OpenRouter vision returned empty content');

  return {
    content,
    model: json.model ?? model,
    usage: {
      inputTokens: json.usage?.prompt_tokens ?? 0,
      outputTokens: json.usage?.completion_tokens ?? 0,
    },
  };
}
