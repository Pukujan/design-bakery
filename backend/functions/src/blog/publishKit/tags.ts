import { callOpenRouter } from '../../openrouter.js';
import { leadParagraphs } from './textUtils.js';
import type { MetaTonePreset, PublishKitSnapshot } from './types.js';
import { resolveCategoryLabel } from './categoryLabels.js';

export const MAX_BLOG_TAGS = 5;

const TAGS_SYSTEM = `You suggest blog post tags for a technical design/engineering blog.
Return ONLY valid JSON (no markdown fences) with keys:
tags (array of 3 to 5 strings), rationale (one short sentence).
Rules:
- Each tag is 1-3 words, Title Case (e.g. "Product Design", "AI Workflows").
- Tags must be relevant to the post topic, category, and opening content.
- No em dashes. No hashtags. No duplicate meanings.
- Maximum 5 tags in the array.`;

function toneHint(tone: MetaTonePreset): string {
  switch (tone) {
    case 'technical':
      return 'Tone: precise practitioner vocabulary.';
    case 'friendly':
      return 'Tone: approachable but professional.';
    case 'bold':
      return 'Tone: punchy, still accurate.';
    default:
      return 'Tone: match the post voice.';
  }
}

function stripEmDash(text: string): string {
  return text.replace(/\u2014/g, '-').replace(/\s+-\s+/g, ', ').trim();
}

function normalizeTag(raw: string): string {
  const t = stripEmDash(raw.trim());
  if (!t) return '';
  return t
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function dedupeTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const tag of tags) {
    const key = tag.toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
    if (out.length >= MAX_BLOG_TAGS) break;
  }
  return out;
}

export async function generateTags(params: {
  apiKey: string;
  model: string;
  snapshot: PublishKitSnapshot;
  metaTone?: MetaTonePreset;
}): Promise<{ tags: string[]; rationale?: string }> {
  const categoryLabel = resolveCategoryLabel(
    params.snapshot.category,
    params.snapshot.categoryLabel,
  );
  const lead = leadParagraphs(params.snapshot.content, 3, 1200);
  const existing = (params.snapshot.tags ?? []).filter(Boolean).join(', ') || 'none';

  const user = [
    toneHint(params.metaTone ?? 'auto'),
    `Title: ${params.snapshot.title}`,
    `Category: ${categoryLabel}`,
    `Author: ${params.snapshot.author}`,
    `Excerpt: ${params.snapshot.excerpt}`,
    `Existing tags (replace with a fresh set): ${existing}`,
    'Opening sections (for context):',
    lead || params.snapshot.excerpt,
  ]
    .filter(Boolean)
    .join('\n');

  const result = await callOpenRouter({
    apiKey: params.apiKey,
    model: params.model,
    system: TAGS_SYSTEM,
    user,
  });

  let parsed: { tags?: unknown; rationale?: string };
  try {
    const raw = result.content.replace(/^```json\s*/i, '').replace(/```\s*$/i, '');
    parsed = JSON.parse(raw) as typeof parsed;
  } catch {
    throw new Error('Tags agent returned invalid JSON');
  }

  const rawTags = Array.isArray(parsed.tags)
    ? parsed.tags.filter((t): t is string => typeof t === 'string')
    : [];

  const tags = dedupeTags(rawTags.map(normalizeTag).filter(Boolean));

  if (tags.length === 0) {
    throw new Error('Tags agent returned no usable tags');
  }

  return {
    tags,
    rationale: parsed.rationale ? stripEmDash(parsed.rationale.trim()) : undefined,
  };
}
