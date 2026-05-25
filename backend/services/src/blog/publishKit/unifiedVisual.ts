import type { LayoutVariant, PanelMode, TemplateFamily } from './templateSelection.js';
import { compositeHeroCover, renderTemplateOnlyCover } from './compositeCover.js';
import { resolveMasterHeroPng } from './resolveMasterHero.js';
import type { RenderCardInput } from './renderSvg.js';
import type { OverlayInput } from './renderOverlay.js';
import type { VisualStylePreset } from './types.js';
import { COVER_SIZE, OG_SIZE } from './visualFormats.js';
import sharp from './sharpWithFonts.js';
import { resolveVisualMode, type VisualMode } from './visualRender.js';

export type PublishVisualVariants = {
  cover: Buffer;
  og: Buffer;
};

function overlayFor(
  base: Omit<OverlayInput, 'width' | 'height'>,
  width: number,
  height: number,
): OverlayInput {
  return { ...base, width, height };
}

/**
 * One hero artwork → cover (3:2) + OG (1.91:1) with per-size typography.
 * Thumbnails are derived on commit from these PNGs.
 */
export async function renderUnifiedPublishVisuals(params: {
  apiKey: string;
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
  templateIconPool?: string[];
  preferHeroCache?: boolean;
}): Promise<{
  variants: PublishVisualVariants;
  imageModel?: string;
  usedAi: boolean;
  heroSource?: 'cache' | 'openrouter';
  heroCacheId?: string;
  heroCacheScore?: number;
}> {
  const mode = resolveVisualMode(params.visualMode);
  const overlayBase = {
    title: params.title,
    excerpt: params.excerpt,
    categoryLabel: params.categoryLabel,
    author: params.author,
    accentColor: params.accentColor,
    layout: params.layout,
  };

  const tplCover: RenderCardInput = {
    width: COVER_SIZE.width,
    height: COVER_SIZE.height,
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
    templateIconPool: params.templateIconPool as RenderCardInput['templateIconPool'],
  };

  if (mode === 'template') {
    const cover = await renderTemplateOnlyCover(tplCover);
    const og = await resizePngToOg(cover);
    return { variants: { cover, og }, usedAi: false };
  }

  try {
    const hero = await resolveMasterHeroPng({
      apiKey: params.apiKey,
      title: params.title,
      excerpt: params.excerpt,
      category: params.category,
      categoryLabel: params.categoryLabel,
      tags: params.tags,
      accentColor: params.accentColor,
      family: params.family,
      layout: params.layout,
      stylePreset: params.stylePreset,
      imageModel: params.imageModel,
      preferHeroCache: params.preferHeroCache,
    });

    if (mode === 'ai') {
      const cover = await resizePng(hero.png, COVER_SIZE.width, COVER_SIZE.height);
      const og = await resizePng(hero.png, OG_SIZE.width, OG_SIZE.height);
      return {
        variants: { cover, og },
        imageModel: hero.imageModel,
        usedAi: true,
        heroSource: hero.source,
        heroCacheId: hero.heroCacheId,
        heroCacheScore: hero.heroCacheScore,
      };
    }

    const [cover, og] = await Promise.all([
      compositeHeroCover(
        hero.png,
        overlayFor(overlayBase, COVER_SIZE.width, COVER_SIZE.height),
      ),
      compositeHeroCover(hero.png, overlayFor(overlayBase, OG_SIZE.width, OG_SIZE.height)),
    ]);

    return {
      variants: { cover, og },
      imageModel: hero.imageModel,
      usedAi: true,
      heroSource: hero.source,
      heroCacheId: hero.heroCacheId,
      heroCacheScore: hero.heroCacheScore,
    };
  } catch (err) {
    console.warn('[publishKit] Unified AI hero failed, template fallback:', err);
    const cover = await renderTemplateOnlyCover(tplCover);
    const og = await resizePngToOg(cover);
    return { variants: { cover, og }, usedAi: false };
  }
}

async function resizePng(buf: Buffer, width: number, height: number): Promise<Buffer> {
  return sharp(buf).resize(width, height, { fit: 'cover', position: 'centre' }).png().toBuffer();
}

async function resizePngToOg(buf: Buffer): Promise<Buffer> {
  return resizePng(buf, OG_SIZE.width, OG_SIZE.height);
}
