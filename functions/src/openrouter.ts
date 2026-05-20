export type OpenRouterUsage = {
  inputTokens: number;
  outputTokens: number;
};

export type OpenRouterResult = {
  content: string;
  usage: OpenRouterUsage;
  model: string;
};

export async function callOpenRouter(params: {
  apiKey: string;
  model: string;
  system: string;
  user: string;
}): Promise<OpenRouterResult> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://design-bakery.local',
      'X-Title': 'Design Bakery Blog Agents',
    },
    body: JSON.stringify({
      model: params.model,
      temperature: 0.7,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: params.system },
        { role: 'user', content: params.user },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenRouter ${response.status}: ${text.slice(0, 400)}`);
  }

  const json = (await response.json()) as {
    model?: string;
    choices?: { message?: { content?: string } }[];
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };

  const content = json.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error('OpenRouter returned empty content');
  }

  return {
    content,
    model: json.model ?? params.model,
    usage: {
      inputTokens: json.usage?.prompt_tokens ?? 0,
      outputTokens: json.usage?.completion_tokens ?? 0,
    },
  };
}
