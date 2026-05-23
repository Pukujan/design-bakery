import type { OpenRouterUsage } from '../../openrouter.js';
import { dataUrlToBuffer } from './dataUrl.js';

export const DEFAULT_IMAGE_MODEL = 'google/gemini-2.5-flash-image';

/** Cheaper alternatives: black-forest-labs/flux.2-klein-4b, google/gemini-3.1-flash-image-preview */
export function resolveImageModel(): string {
  return process.env.OPENROUTER_IMAGE_MODEL?.trim() || DEFAULT_IMAGE_MODEL;
}

export function isAiImageEnabled(): boolean {
  const mode = (process.env.PUBLISH_KIT_VISUAL_MODE ?? 'template').trim().toLowerCase();
  return mode === 'hybrid' || mode === 'ai';
}

export type AspectRatio = '1:1' | '16:9' | '3:2' | '4:3';

export async function generateHeroImage(params: {
  apiKey: string;
  model?: string;
  prompt: string;
  aspectRatio: AspectRatio;
}): Promise<{ png: Buffer; model: string; usage: OpenRouterUsage }> {
  const model = params.model?.trim() || resolveImageModel();
  const modalities = model.includes('flux') ? ['image'] : ['image', 'text'];

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://design-bakery.local',
      'X-Title': 'Design Bakery Publish Kit',
    },
    body: JSON.stringify({
      model,
      temperature: 0.85,
      messages: [{ role: 'user', content: params.prompt }],
      modalities,
      image_config: {
        aspect_ratio: params.aspectRatio,
        image_size: '1K',
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenRouter image ${response.status}: ${text.slice(0, 400)}`);
  }

  const json = (await response.json()) as {
    model?: string;
    choices?: {
      message?: {
        images?: { image_url?: { url?: string }; type?: string }[];
        content?: string;
      };
    }[];
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };

  const images = json.choices?.[0]?.message?.images;
  const url = images?.[0]?.image_url?.url;
  if (!url) {
    throw new Error('OpenRouter image model returned no image (check OPENROUTER_IMAGE_MODEL supports image output).');
  }

  return {
    png: dataUrlToBuffer(url),
    model: json.model ?? model,
    usage: {
      inputTokens: json.usage?.prompt_tokens ?? 0,
      outputTokens: json.usage?.completion_tokens ?? 0,
    },
  };
}
