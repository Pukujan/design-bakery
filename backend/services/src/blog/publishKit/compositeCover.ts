import sharp from './sharpWithFonts.js';
import { rasterizePublishKitSvg } from './fontDiagnostics.js';
import { renderBlogCardSvg, type RenderCardInput } from './renderSvg.js';
import { renderCoverOverlaySvg, type OverlayInput } from './renderOverlay.js';

function heroCropPosition(overlay: OverlayInput): string {
  if (overlay.layoutHint === 'banner' || overlay.layoutHint === 'landscape') {
    return 'north';
  }
  const aspect = overlay.width / overlay.height;
  if (aspect > 1.45) return 'north';
  return 'centre';
}

export async function compositeHeroCover(
  backgroundPng: Buffer,
  overlay: OverlayInput,
): Promise<Buffer> {
  const { width: w, height: h } = overlay;
  const bg = await sharp(backgroundPng)
    .resize(w, h, { fit: 'cover', position: heroCropPosition(overlay) })
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
