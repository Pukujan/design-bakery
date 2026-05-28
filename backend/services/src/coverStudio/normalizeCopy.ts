import { parseAgentJson } from '../blog/agentJson.js';
import { callOpenRouter } from '../openrouter.js';

const SYSTEM = `You lightly copy-edit a cover image title and short description.
Return ONLY valid JSON with keys: title (string), description (string), changed (boolean).

Rules:
- Fix only obvious grammar and spelling mistakes in common words.
- Do NOT change the spelling of personal names, product names, or brand names.
- DO capitalize names properly: first letter uppercase (e.g. "pujan" → "Pujan", "sarah chen" → "Sarah Chen").
- Preserve meaning, tone, and approximate length.
- If the text is already fine, return the original strings unchanged and set changed to false.
- No em dashes. No markdown.`;

export type NormalizedCoverCopy = {
  title: string;
  description: string;
  changed: boolean;
};

function capitalizeNameWords(text: string): string {
  return text.replace(/\b([a-z][a-z'-]{1,})\b/g, (word) => {
    if (word.length <= 2 && !/^[a-z]$/.test(word)) return word;
    return word.charAt(0).toUpperCase() + word.slice(1);
  });
}

function fallbackNormalize(title: string, description: string): NormalizedCoverCopy {
  const nextTitle = capitalizeNameWords(title.trim());
  const nextDescription = capitalizeNameWords(description.trim());
  const changed = nextTitle !== title.trim() || nextDescription !== description.trim();
  return { title: nextTitle, description: nextDescription, changed };
}

export async function normalizeCoverStudioCopy(params: {
  apiKey: string;
  model: string;
  title: string;
  description: string;
}): Promise<NormalizedCoverCopy> {
  const title = params.title.trim();
  const description = params.description.trim();
  if (!title && !description) {
    return { title, description, changed: false };
  }

  const user = [
    `Title: ${title}`,
    `Description: ${description}`,
    'Return JSON only.',
  ].join('\n');

  try {
    const result = await callOpenRouter({
      apiKey: params.apiKey,
      model: params.model,
      system: SYSTEM,
      user,
    });

    const parsed = parseAgentJson<{
      title?: string;
      description?: string;
      changed?: boolean;
    }>(result.content);

    const nextTitle = String(parsed.title ?? title).trim() || title;
    const nextDescription = String(parsed.description ?? description).trim() || description;
    const changed =
      parsed.changed === true ||
      nextTitle !== title ||
      nextDescription !== description;

    return { title: nextTitle, description: nextDescription, changed };
  } catch {
    return fallbackNormalize(title, description);
  }
}
