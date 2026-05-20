import type { PromoAgentData } from './types.js';

const THEME_HINTS: Record<string, string> = {
  professional:
    'Senior practitioner voice: specific, calm, first-person where natural. No hype or sales tone.',
  playful: 'Warm and human, one light aside allowed — still credible, not meme-y.',
  technical:
    'Engineer-to-engineer: name concrete tools, patterns, tradeoffs, and lessons from the article.',
  leadership:
    'Impact and decisions for tech leads: outcomes, risks, what you would do differently.',
};

const VOICE_RULES = [
  'Write like a real person sharing a post they published — not marketing copy or an AI assistant.',
  'NO emojis. Do not use emoji characters anywhere in linkedInPost or hooks.',
  'Avoid clichés and LLM tells: "excited to share", "dive in", "game-changer", "leverage", "in today\'s landscape", "without further ado", "here\'s the thing", "let\'s unpack", "robust", "seamless", "cutting-edge".',
  'Use short paragraphs (2–4 sentences). Include 2–4 specific insights or examples pulled from the article (not generic summaries).',
  'Mention the article title naturally once. End with a single understated CTA to read the post (include URL if provided).',
].join('\n');

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
    'You write LinkedIn promo posts for a design/engineering blog.',
    'Respond with JSON only — no markdown fences — matching this schema:',
    '{"linkedInPost":"string","hashtags":["string"],"hooks":["string"]}',
    '',
    'linkedInPost requirements:',
    '- Length: 1,500–2,400 characters (substantive; not a one-liner teaser).',
    '- Structure: hook paragraph → 2–3 body paragraphs with concrete detail from the article → brief CTA.',
    '- hashtags: 4–6 relevant tags, no # prefix, lowercase or camelCase ok.',
    '- hooks: 3 alternate opening lines, each under 140 chars, distinct angles.',
    '',
    VOICE_RULES,
    themeHint,
  ].join('\n');

  const trimmedContent =
    input.content.length > 12_000
      ? `${input.content.slice(0, 12_000)}\n…[truncated for length]`
      : input.content;

  const user = [
    `Title: ${input.title}`,
    `Excerpt: ${input.excerpt}`,
    `Category: ${input.category}`,
    `Author: ${input.author}`,
    `Tags: ${input.tags.join(', ') || 'none'}`,
    input.publicUrl ? `Article URL (use in CTA): ${input.publicUrl}` : '',
    input.customInstructions ? `Author instructions: ${input.customInstructions}` : '',
    '',
    'Full article (base the post on this — be specific, not vague):',
    trimmedContent,
  ]
    .filter(Boolean)
    .join('\n');

  return { system, user };
}

/** Strip emoji from model output if it ignores instructions. */
function stripEmoji(text: string): string {
  return text.replace(/\p{Extended_Pictographic}/gu, '').replace(/\s{2,}/g, ' ').trim();
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
  const linkedInPost = stripEmoji(
    typeof data.linkedInPost === 'string' ? data.linkedInPost.trim() : ''
  );
  if (!linkedInPost) {
    throw new Error('Promo response missing linkedInPost');
  }

  const hashtags = Array.isArray(data.hashtags)
    ? data.hashtags
        .filter((t): t is string => typeof t === 'string')
        .map((t) => stripEmoji(t.trim()))
        .filter(Boolean)
    : [];

  const hooks = Array.isArray(data.hooks)
    ? data.hooks
        .filter((t): t is string => typeof t === 'string')
        .map((t) => stripEmoji(t.trim()))
        .filter(Boolean)
    : [];

  return { linkedInPost, hashtags, hooks };
}
