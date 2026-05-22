import sharp from 'sharp';
import { renderBlogCardSvg, type RenderCardInput } from './renderSvg.js';
import { renderCoverOverlaySvg, type OverlayInput } from './renderOverlay.js';

export async function compositeHeroCover(
  backgroundPng: Buffer,
  overlay: OverlayInput,
): Promise<Buffer> {
  const { width: w, height: h } = overlay;
  const bg = await sharp(backgroundPng)
    .resize(w, h, { fit: 'cover', position: 'centre' })
    .png()
    .toBuffer();

  const overlaySvg = renderCoverOverlaySvg(overlay);
  const overlayPng = await sharp(Buffer.from(overlaySvg)).png().toBuffer();

  return sharp(bg)
    .composite([{ input: overlayPng, blend: 'over' }])
    .png()
    .toBuffer();
}

export async function renderTemplateOnlyCover(input: RenderCardInput): Promise<Buffer> {
  const svg = renderBlogCardSvg(input);
  return sharp(Buffer.from(svg)).png().toBuffer();
}
