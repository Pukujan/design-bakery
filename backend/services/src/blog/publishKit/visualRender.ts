import type { LayoutVariant, PanelMode, TemplateFamily } from './templateSelection.js';
import { buildHeroImagePrompt } from './imagePrompt.js';
import {
  generateHeroImage,
  resolveImageModel,
  type AspectRatio,
} from './openrouterImage.js';
import { compositeHeroCover, renderTemplateOnlyCover } from './compositeCover.js';
import type { RenderCardInput } from './renderSvg.js';
import type { OverlayInput } from './renderOverlay.js';
import type { VisualStylePreset } from './types.js';

export type VisualMode = 'hybrid' | 'template' | 'ai';

export function resolveVisualMode(pref?: VisualMode): VisualMode {
  if (pref === 'hybrid' || pref === 'template' || pref === 'ai') return pref;
  const env = (process.env.PUBLISH_KIT_VISUAL_MODE ?? 'template').trim().toLowerCase();
  if (env === 'template' || env === 'ai') return env;
  return 'hybrid';
}

function templateInput(params: {
  width: number;
  height: number;
  title: string;
  excerpt: string;
  categoryLabel: string;
  author: string;
  accentColor: string;
  tags: string[];
  family: TemplateFamily;
  layout: LayoutVariant;
  panelMode: PanelMode;
  stylePreset: VisualStylePreset;
  designSeed?: number;
}): RenderCardInput {
  return {
    width: params.width,
    height: params.height,
    title: params.title,
    excerpt: params.excerpt,
    categoryLabel: params.categoryLabel,
    author: params.author,
    accentColor: params.accentColor,
    tags: params.tags,
    family: params.family,
    layout: params.layout,
    panelMode: params.panelMode,
    stylePreset: params.stylePreset,
    designSeed: params.designSeed,
  };
}

function overlayInput(params: {
  width: number;
  height: number;
  title: string;
  excerpt: string;
  categoryLabel: string;
  author: string;
  accentColor: string;
  layout: LayoutVariant;
}): OverlayInput {
  return {
    width: params.width,
    height: params.height,
    title: params.title,
    excerpt: params.excerpt,
    categoryLabel: params.categoryLabel,
    author: params.author,
    accentColor: params.accentColor,
    layout: params.layout,
  };
}

export async function renderPublishCoverPng(params: {
  apiKey: string;
  width: number;
  height: number;
  aspectRatio: AspectRatio;
  title: string;
  excerpt: string;
  category: string;
  categoryLabel: string;
  author: string;
  accentColor: string;
  tags: string[];
  family: TemplateFamily;
  layout: LayoutVariant;
  panelMode: PanelMode;
  stylePreset: VisualStylePreset;
  visualMode?: VisualMode;
  imageModel?: string;
  designSeed?: number;
}): Promise<{ png: Buffer; imageModel?: string; usedAi: boolean }> {
  const mode = resolveVisualMode(params.visualMode);
  const tpl = templateInput(params);

  if (mode === 'template') {
    return { png: await renderTemplateOnlyCover(tpl), usedAi: false };
  }

  const imageModel = params.imageModel?.trim() || resolveImageModel();

  try {
    const prompt = buildHeroImagePrompt({
      title: params.title,
      excerpt: params.excerpt,
      category: params.category,
      categoryLabel: params.categoryLabel,
      tags: params.tags,
      accentColor: params.accentColor,
      family: params.family,
      layout: params.layout,
      stylePreset: params.stylePreset,
    });

    const { png: aiPng } = await generateHeroImage({
      apiKey: params.apiKey,
      model: imageModel,
      prompt,
      aspectRatio: params.aspectRatio,
    });

    if (mode === 'ai') {
      return { png: aiPng, imageModel, usedAi: true };
    }

    const png = await compositeHeroCover(
      aiPng,
      overlayInput({
        width: params.width,
        height: params.height,
        title: params.title,
        excerpt: params.excerpt,
        categoryLabel: params.categoryLabel,
        author: params.author,
        accentColor: params.accentColor,
        layout: params.layout,
      }),
    );
    return { png, imageModel, usedAi: true };
  } catch (err) {
    console.warn('[publishKit] AI hero failed, using template fallback:', err);
    return { png: await renderTemplateOnlyCover(tpl), usedAi: false };
  }
}
