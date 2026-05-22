import sharp from 'sharp';
import { renderBlogCardSvg, type RenderCardInput } from './renderSvg.js';

export async function renderCardPng(input: RenderCardInput): Promise<Buffer> {
  const svg = renderBlogCardSvg(input);
  return sharp(Buffer.from(svg)).png().toBuffer();
}

export function bufferToDataUrl(png: Buffer): string {
  return `data:image/png;base64,${png.toString('base64')}`;
}
