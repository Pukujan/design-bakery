import type { PromoAgentData } from './types.js';

const THEME_HINTS: Record<string, string> = {
  professional: 'Clear, credible, senior IC tone. No hype.',
  playful: 'Warm and witty, still professional.',
  technical: 'Engineer-to-engineer, concrete and specific.',
  leadership: 'Product + people impact, concise executive tone.',
};

export function buildPromoPrompt(input: {
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  category: string;
  author: string;
  publicUrl?: string;
  theme?: string;
  customInstructions?: string;
}): { system: string; user: string } {
  const themeKey = (input.theme ?? 'professional').toLowerCase();
  const themeHint = THEME_HINTS[themeKey] ?? THEME_HINTS.professional;

  const system = [
    'You write social promo copy for a design/engineering blog.',
    'Respond with JSON only matching this schema:',
    '{"linkedInPost":"string","hashtags":["string"],"hooks":["string"]}',
    'linkedInPost: 900-1300 chars, short paragraphs, 1-2 emojis max, end with a soft CTA.',
    'hashtags: 4-8 items without # prefix.',
    'hooks: 3 alternate opening lines under 120 chars each.',
    themeHint,
  ].join('\n');

  const trimmedContent =
    input.content.length > 6000 ? `${input.content.slice(0, 6000)}\n…[truncated]` : input.content;

  const user = [
    `Title: ${input.title}`,
    `Excerpt: ${input.excerpt}`,
    `Category: ${input.category}`,
    `Author: ${input.author}`,
    `Tags: ${input.tags.join(', ') || 'none'}`,
    input.publicUrl ? `URL: ${input.publicUrl}` : '',
    input.customInstructions ? `Extra instructions: ${input.customInstructions}` : '',
    '',
    'Article markdown:',
    trimmedContent,
  ]
    .filter(Boolean)
    .join('\n');

  return { system, user };
}

export function parsePromoResponse(raw: string): PromoAgentData {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Promo response was not valid JSON');
    parsed = JSON.parse(match[0]);
  }

  const data = parsed as Partial<PromoAgentData>;
  const linkedInPost = typeof data.linkedInPost === 'string' ? data.linkedInPost.trim() : '';
  if (!linkedInPost) {
    throw new Error('Promo response missing linkedInPost');
  }

  const hashtags = Array.isArray(data.hashtags)
    ? data.hashtags.filter((t): t is string => typeof t === 'string').map((t) => t.trim()).filter(Boolean)
    : [];

  const hooks = Array.isArray(data.hooks)
    ? data.hooks.filter((t): t is string => typeof t === 'string').map((t) => t.trim()).filter(Boolean)
    : [];

  return { linkedInPost, hashtags, hooks };
}
