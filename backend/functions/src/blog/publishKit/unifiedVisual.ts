import type { LayoutVariant, PanelMode, TemplateFamily } from './templateSelection.js';
import { buildHeroImagePrompt } from './imagePrompt.js';
import { generateHeroImage, resolveImageModel } from './openrouterImage.js';
import { compositeHeroCover, renderTemplateOnlyCover } from './compositeCover.js';
import type { RenderCardInput } from './renderSvg.js';
import type { OverlayInput } from './renderOverlay.js';
import type { VisualStylePreset } from './types.js';
import { COVER_SIZE, OG_SIZE } from './visualFormats.js';
import sharp from 'sharp';
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
}): Promise<{ variants: PublishVisualVariants; imageModel?: string; usedAi: boolean }> {
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
  };

  if (mode === 'template') {
    const cover = await renderTemplateOnlyCover(tplCover);
    const og = await resizePngToOg(cover);
    return { variants: { cover, og }, usedAi: false };
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
      stylePreset: params.stylePreset,
    });

    const { png: masterAi } = await generateHeroImage({
      apiKey: params.apiKey,
      model: imageModel,
      prompt,
      aspectRatio: '1:1',
    });

    if (mode === 'ai') {
      const cover = await resizePng(masterAi, COVER_SIZE.width, COVER_SIZE.height);
      const og = await resizePng(masterAi, OG_SIZE.width, OG_SIZE.height);
      return { variants: { cover, og }, imageModel, usedAi: true };
    }

    const [cover, og] = await Promise.all([
      compositeHeroCover(
        masterAi,
        overlayFor(overlayBase, COVER_SIZE.width, COVER_SIZE.height),
      ),
      compositeHeroCover(masterAi, overlayFor(overlayBase, OG_SIZE.width, OG_SIZE.height)),
    ]);

    return { variants: { cover, og }, imageModel, usedAi: true };
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
