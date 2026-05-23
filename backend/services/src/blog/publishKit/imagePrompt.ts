import { resolveCategoryLabel } from './categoryLabels.js';
import { stripMarkdownForCard } from './textUtils.js';
import type { LayoutVariant, TemplateFamily } from './templateSelection.js';
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

const LAYOUT_COMPOSITION: Record<LayoutVariant, string> = {
  a: 'Composition variant A: decorative art on the right, clear negative space bottom-left for title overlay.',
  b: 'Composition variant B: decorative art on the left, clear negative space bottom-right for title overlay.',
  c: 'Composition variant C: wide top band of decor, subject lower-center, bottom third open for text.',
  d: 'Composition variant D: diagonal flow, corner accent cluster opposite the text-safe zone.',
  e: 'Composition variant E: art weighted top-right, title zone lower-left third.',
  f: 'Composition variant F: centered hero subject, title band across lower center.',
  g: 'Composition variant G: minimal upper art, large bottom text band.',
  h: 'Composition variant H: art along bottom edge, text stacked upper-left.',
  i: 'Composition variant I: vertical accent stripe left, open center-right for text.',
  j: 'Composition variant J: symmetric balance, text centered bottom.',
  k: 'Composition variant K: bold corner burst opposite text, high contrast zones.',
  l: 'Composition variant L: scattered small motifs, generous middle text gutter.',
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
  layout?: LayoutVariant;
  stylePreset?: VisualStylePreset;
}): string {
  const label = resolveCategoryLabel(params.category, params.categoryLabel);
  const topic = stripMarkdownForCard(params.title);
  const scene = FAMILY_SCENE[params.family];
  const style = STYLE_HINT[params.stylePreset ?? 'auto'];
  const layoutHint = params.layout ? LAYOUT_COMPOSITION[params.layout] : '';
  const tagHint = params.tags.slice(0, 3).join(', ');

  return [
    `[hero prompt v${HERO_IMAGE_PROMPT_VERSION}]`,
    'Friendly blog hero illustration: modern flat vector / cartoon style, welcoming and human.',
    'Include one or two simple vector cartoon characters (diverse, approachable, expressive but not childish).',
    'Add decorative line art, icons, and light graphic shapes that support the topic (not clutter).',
    style,
    layoutHint,
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
