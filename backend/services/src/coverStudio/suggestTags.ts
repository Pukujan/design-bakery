import { parseAgentJson } from '../blog/agentJson.js';
import { callOpenRouter } from '../openrouter.js';
import { MAX_COVER_STUDIO_TAGS } from './constants.js';

const SYSTEM = `You suggest visual theme tags for cover art generation.
Return ONLY valid JSON with keys:
suggestedTags (array of 5 to 8 short strings), rationale (one short sentence).
Rules:
- Each tag is 1-3 words, Title Case (e.g. "Cloud Architecture", "Neon Grid").
- Tags describe mood, subject, and visual motifs for an illustration — not SEO keywords.
- No hashtags. No em dashes. No duplicate meanings.`;

function normalizeTag(raw: string): string {
  const t = raw.trim().replace(/\u2014/g, '-');
  if (!t) return '';
  return t
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function dedupeTags(tags: string[], max: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const tag of tags) {
    const key = tag.toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
    if (out.length >= max) break;
  }
  return out;
}

export async function suggestCoverStudioTags(params: {
  apiKey: string;
  model: string;
  title: string;
  description: string;
}): Promise<{ suggestedTags: string[]; rationale?: string }> {
  const user = [
    `Title: ${params.title.trim()}`,
    `Description: ${params.description.trim()}`,
    `Return ${MAX_COVER_STUDIO_TAGS + 3} diverse tag options the user can pick from (max ${MAX_COVER_STUDIO_TAGS} will be used on the image).`,
  ].join('\n');

  const result = await callOpenRouter({
    apiKey: params.apiKey,
    model: params.model,
    system: SYSTEM,
    user,
  });

  const parsed = parseAgentJson<{ suggestedTags?: string[]; tags?: string[]; rationale?: string }>(
    result.content,
  );
  const list = parsed.suggestedTags ?? parsed.tags ?? [];
  const suggestedTags = dedupeTags(
    list.map((t) => normalizeTag(String(t))).filter(Boolean),
    MAX_COVER_STUDIO_TAGS + 3,
  );

  return {
    suggestedTags,
    rationale: parsed.rationale,
  };
}
