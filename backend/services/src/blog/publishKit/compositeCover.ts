import sharp from './sharpWithFonts.js';
import { rasterizePublishKitSvg } from './fontDiagnostics.js';
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
  const overlayPng = await rasterizePublishKitSvg(
    overlaySvg,
    `cover overlay ${w}x${h} layout=${overlay.layout}`,
  );

  return sharp(bg)
    .composite([{ input: overlayPng, blend: 'over' }])
    .png()
    .toBuffer();
}

export async function renderTemplateOnlyCover(input: RenderCardInput): Promise<Buffer> {
  const svg = renderBlogCardSvg(input);
  return rasterizePublishKitSvg(
    svg,
    `template card ${input.width}x${input.height} layout=${input.layout}`,
  );
}
