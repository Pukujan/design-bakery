import { buildHeroImagePrompt, HERO_IMAGE_PROMPT_VERSION } from './imagePrompt.js';
import { findCachedHeroPng, loadCachedHeroPng, storeHeroCachePng } from './heroCache.js';
import { generateHeroImage, resolveImageModel } from './openrouterImage.js';
import type { LayoutVariant, TemplateFamily } from './templateSelection.js';
import type { VisualStylePreset } from './types.js';

export type MasterHeroSource = 'cache' | 'openrouter';

export type ResolvedMasterHero = {
  png: Buffer;
  source: MasterHeroSource;
  imageModel?: string;
  heroCacheId?: string;
  heroCacheScore?: number;
};

/**
 * Text-free 1:1 hero for hybrid/ai modes.
 * Order: slug-matched cache → OpenRouter → caller handles template fallback.
 */
export async function resolveMasterHeroPng(params: {
  apiKey: string;
  title: string;
  excerpt: string;
  category: string;
  categoryLabel: string;
  tags: string[];
  accentColor: string;
  family: TemplateFamily;
  layout: LayoutVariant;
  stylePreset: VisualStylePreset;
  imageModel?: string;
  preferHeroCache?: boolean;
}): Promise<ResolvedMasterHero> {
  const useCache = params.preferHeroCache !== false;

  if (useCache) {
    const hit = await findCachedHeroPng({
      tags: params.tags,
      category: params.category,
      family: params.family,
      stylePreset: params.stylePreset,
      layout: params.layout,
    });
    if (hit) {
      const png = await loadCachedHeroPng(hit);
      return {
        png,
        source: 'cache',
        heroCacheId: hit.id,
        heroCacheScore: hit.score,
      };
    }
  }

  const imageModel = params.imageModel?.trim() || resolveImageModel();
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

  const { png } = await generateHeroImage({
    apiKey: params.apiKey,
    model: imageModel,
    prompt,
    aspectRatio: '1:1',
  });

  void storeHeroCachePng({
    png,
    tags: params.tags,
    category: params.category,
    family: params.family,
    stylePreset: params.stylePreset,
    layout: params.layout,
  });

  return { png, source: 'openrouter', imageModel };
}

export { HERO_IMAGE_PROMPT_VERSION };
