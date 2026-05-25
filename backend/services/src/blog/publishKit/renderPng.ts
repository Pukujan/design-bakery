import { rasterizePublishKitSvg } from './fontDiagnostics.js';
import { renderBlogCardSvg, type RenderCardInput } from './renderSvg.js';

export async function renderCardPng(input: RenderCardInput): Promise<Buffer> {
  const svg = renderBlogCardSvg(input);
  return rasterizePublishKitSvg(svg, `renderCardPng ${input.width}x${input.height}`);
}

export function bufferToDataUrl(png: Buffer): string {
  return `data:image/png;base64,${png.toString('base64')}`;
}
