import { compositeHeroCover, renderTemplateOnlyCover } from '../blog/publishKit/compositeCover.js';
import { resolveMasterHeroPng } from '../blog/publishKit/resolveMasterHero.js';
import type { RenderCardInput } from '../blog/publishKit/renderSvg.js';
import type { OverlayInput } from '../blog/publishKit/renderOverlay.js';
import type { LayoutVariant, PanelMode, TemplateFamily } from '../blog/publishKit/templateSelection.js';
import sharp from '../blog/publishKit/sharpWithFonts.js';
import { resolveVisualMode, type VisualMode } from '../blog/publishKit/visualRender.js';
import type { VisualStylePreset } from '../blog/publishKit/types.js';
import {
  COVER_STUDIO_SOCIAL_FORMATS,
  layoutForSocialHint,
  type SocialFormatDef,
} from './socialFormats.js';

export type RenderedSocialVariant = {
  format: SocialFormatDef;
  png: Buffer;
};

export type CoverStudioSocialPackResult = {
  variants: RenderedSocialVariant[];
  rawHeroPng?: Buffer;
  imageModel?: string;
  usedAi: boolean;
  heroSource?: 'cache' | 'openrouter';
  heroCacheId?: string;
  heroCacheScore?: number;
};

function overlayFor(
  base: Omit<OverlayInput, 'width' | 'height'>,
  width: number,
  height: number,
): OverlayInput {
  return { ...base, width, height };
}

async function renderOneFormat(params: {
  format: SocialFormatDef;
  mode: VisualMode;
  overlayBase: Omit<OverlayInput, 'width' | 'height'>;
  tplBase: {
    title: string;
    excerpt: string;
    categoryLabel: string;
    author: string;
    accentColor: string;
    tags: string[];
    family: TemplateFamily;
    panelMode: PanelMode;
    stylePreset: VisualStylePreset;
    designSeed?: number;
    templateIconPool?: string[];
  };
  layout: LayoutVariant;
  heroPng?: Buffer;
}): Promise<Buffer> {
  const { format, mode, overlayBase, tplBase, layout, heroPng } = params;
  const w = format.width;
  const h = format.height;

  const cardInput: RenderCardInput = {
    ...tplBase,
    width: w,
    height: h,
    layout,
    templateIconPool: tplBase.templateIconPool as RenderCardInput['templateIconPool'],
  };

  if (mode === 'template') {
    return renderTemplateOnlyCover(cardInput);
  }

  if (!heroPng) {
    return renderTemplateOnlyCover(cardInput);
  }

  if (mode === 'ai') {
    return sharp(heroPng).resize(w, h, { fit: 'cover', position: 'centre' }).png().toBuffer();
  }

  return compositeHeroCover(heroPng, overlayFor(overlayBase, w, h));
}

/**
 * One generation → nine platform-sized exports with per-size typography (overlay scales in renderOverlay).
 */
export async function renderCoverStudioSocialPack(params: {
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
}): Promise<CoverStudioSocialPackResult> {
  const mode = resolveVisualMode(params.visualMode);
  const overlayBase = {
    title: params.title,
    excerpt: params.excerpt,
    categoryLabel: params.categoryLabel,
    author: params.author,
    accentColor: params.accentColor,
    layout: params.layout,
    hideBranding: true,
  };

  const tplBase = {
    title: params.title,
    excerpt: params.excerpt,
    categoryLabel: params.categoryLabel,
    author: params.author,
    accentColor: params.accentColor,
    tags: params.tags,
    family: params.family,
    panelMode: params.panelMode,
    stylePreset: params.stylePreset,
    designSeed: params.designSeed,
    templateIconPool: params.templateIconPool,
    hideBranding: true,
  };

  let heroPng: Buffer | undefined;
  let imageModel: string | undefined;
  let usedAi = false;
  let heroSource: 'cache' | 'openrouter' | undefined;
  let heroCacheId: string | undefined;
  let heroCacheScore: number | undefined;

  if (mode !== 'template') {
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
      heroPng = hero.png;
      imageModel = hero.imageModel;
      usedAi = true;
      heroSource = hero.source;
      heroCacheId = hero.heroCacheId;
      heroCacheScore = hero.heroCacheScore;
    } catch (err) {
      console.warn('[coverStudio] Hero failed, template fallback for all sizes:', err);
    }
  }

  const variants = await Promise.all(
    COVER_STUDIO_SOCIAL_FORMATS.map(async (format) => {
      const layout = layoutForSocialHint(
        params.layout,
        format.layoutHint,
      ) as LayoutVariant;
      const overlayLayout: LayoutVariant =
        format.layoutHint === 'landscape' || format.layoutHint === 'banner' ? 'e' : layout;
      const png = await renderOneFormat({
        format,
        mode: heroPng ? mode : 'template',
        overlayBase: {
          ...overlayBase,
          layout: overlayLayout,
          layoutHint: format.layoutHint,
        },
        tplBase,
        layout,
        heroPng,
      });
      return { format, png };
    }),
  );

  return {
    variants,
    rawHeroPng: heroPng,
    imageModel,
    usedAi,
    heroSource,
    heroCacheId,
    heroCacheScore,
  };
}
