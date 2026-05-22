import { resolveCategoryLabel } from './categoryLabels.js';
import { stripMarkdownForCard } from './textUtils.js';
import type { TemplateFamily } from './templateSelection.js';
import type { VisualStylePreset } from './types.js';

/**
 * Bump on every hero art-direction change (tagged in prompts + imagePrompt.history.md).
 */
export const HERO_IMAGE_PROMPT_VERSION = '0.3';

const FAMILY_SCENE: Record<TemplateFamily, string> = {
  editorial:
    'cozy creative workspace with a friendly vector character at a laptop, notebooks and plants, warm inviting mood',
  diagram:
    'playful technical scene with line-art flowcharts, connected nodes, and a small cartoon guide character pointing at ideas',
  nodes:
    'whimsical AI lab with soft glowing nodes, dotted connections, and approachable cartoon characters exploring together',
  grid:
    'orderly systems collage with modular blocks, grid lines, and cheerful flat icons with one mascot character',
};

const STYLE_HINT: Record<VisualStylePreset, string> = {
  auto: 'balanced flat vector illustration with gentle gradients',
  minimal: 'extra whitespace, thin line art, few colors, one small character',
  bold: 'strong shapes, saturated accent blocks, confident cartoon silhouettes',
  line_art: 'primarily monochrome line art with spot color accents and simple character outlines',
};

export function buildHeroImagePrompt(params: {
  title: string;
  excerpt: string;
  category: string;
  categoryLabel?: string;
  tags: string[];
  accentColor: string;
  family: TemplateFamily;
  stylePreset?: VisualStylePreset;
}): string {
  const label = resolveCategoryLabel(params.category, params.categoryLabel);
  const topic = stripMarkdownForCard(params.title);
  const scene = FAMILY_SCENE[params.family];
  const style = STYLE_HINT[params.stylePreset ?? 'auto'];
  const tagHint = params.tags.slice(0, 3).join(', ');

  return [
    `[hero prompt v${HERO_IMAGE_PROMPT_VERSION}]`,
    'Friendly blog hero illustration: modern flat vector / cartoon style, welcoming and human.',
    'Include one or two simple vector cartoon characters (diverse, approachable, expressive but not childish).',
    'Add decorative line art, icons, and light graphic shapes that support the topic (not clutter).',
    style,
    `Topic: ${topic}. Category: ${label}.`,
    tagHint ? `Themes: ${tagHint}.` : '',
    `Color palette anchored on ${params.accentColor}, soft harmonious gradients.`,
    scene,
    'Square 1:1 composition: subject centered with safe margins so the same art can crop to wide cover and OG formats.',
    'Clear negative space in the bottom third for title text overlay on every crop.',
    'No text, no letters, no words, no logos, no watermarks, no UI screenshots.',
    'Not photorealistic, not stock photography, not scary or uncanny, not hyper-3D.',
  ]
    .filter(Boolean)
    .join(' ');
}
