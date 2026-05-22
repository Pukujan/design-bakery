import { callOpenRouter } from '../../openrouter.js';
import { leadParagraphs } from './textUtils.js';
import type { MetaTonePreset, PublishKitSnapshot } from './types.js';
import { resolveCategoryLabel } from './categoryLabels.js';

const META_SYSTEM = `You write SEO metadata and a reader-facing excerpt for a technical design/engineering blog.
Return ONLY valid JSON (no markdown fences) with keys:
excerpt (max 200 chars, plain summary for blog index cards — hook the reader, not keyword stuffing),
metaTitle (max 60 chars), metaDescription (max 155 chars, search/snippet focused),
rationale (one short sentence).
Rules: Do not use em dashes (—). Use commas, periods, or hyphens instead. No clickbait. excerpt and metaDescription should differ in wording.`;

function toneHint(tone: MetaTonePreset): string {
  switch (tone) {
    case 'technical':
      return 'Tone: precise, practitioner-focused.';
    case 'friendly':
      return 'Tone: warm and approachable, still professional.';
    case 'bold':
      return 'Tone: confident hook, avoid clickbait.';
    default:
      return 'Tone: match the post voice.';
  }
}

function stripEmDash(text: string): string {
  return text.replace(/\u2014/g, '-').replace(/\s+-\s+/g, ', ').trim();
}

export async function generateMeta(params: {
  apiKey: string;
  model: string;
  snapshot: PublishKitSnapshot;
  publicUrl?: string;
  metaTone?: MetaTonePreset;
}): Promise<{
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  rationale?: string;
}> {
  const tags = params.snapshot.tags?.length ? params.snapshot.tags.join(', ') : 'none';
  const categoryLabel = resolveCategoryLabel(
    params.snapshot.category,
    params.snapshot.categoryLabel,
  );
  const lead = leadParagraphs(params.snapshot.content, 3, 1200);
  const user = [
    toneHint(params.metaTone ?? 'auto'),
    params.publicUrl ? `Canonical URL: ${params.publicUrl}` : '',
    `Title: ${params.snapshot.title}`,
    `Category: ${categoryLabel}`,
    `Author: ${params.snapshot.author}`,
    `Excerpt: ${params.snapshot.excerpt}`,
    `Tags: ${tags}`,
    'Opening sections (for context):',
    lead || params.snapshot.excerpt,
  ]
    .filter(Boolean)
    .join('\n');

  const result = await callOpenRouter({
    apiKey: params.apiKey,
    model: params.model,
    system: META_SYSTEM,
    user,
  });

  let parsed: {
    excerpt?: string;
    metaTitle?: string;
    metaDescription?: string;
    rationale?: string;
  };
  try {
    const raw = result.content.replace(/^```json\s*/i, '').replace(/```\s*$/i, '');
    parsed = JSON.parse(raw) as typeof parsed;
  } catch {
    throw new Error('Meta agent returned invalid JSON');
  }

  const metaTitle = stripEmDash((parsed.metaTitle ?? params.snapshot.title).trim().slice(0, 60));
  const metaDescription = stripEmDash(
    (parsed.metaDescription ?? params.snapshot.excerpt).trim().slice(0, 155),
  );
  const excerpt = stripEmDash(
    (parsed.excerpt ?? metaDescription ?? params.snapshot.excerpt).trim().slice(0, 200),
  );
  return {
    excerpt,
    metaTitle,
    metaDescription,
    rationale: parsed.rationale ? stripEmDash(parsed.rationale.trim()) : undefined,
  };
}
