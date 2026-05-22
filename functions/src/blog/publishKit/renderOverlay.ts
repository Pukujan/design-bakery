import type { LayoutVariant } from './templateSelection.js';
import { FONT_FAMILY, interFontFaceDefs } from './fonts.js';

export type OverlayInput = {
  width: number;
  height: number;
  title: string;
  excerpt: string;
  categoryLabel: string;
  author: string;
  accentColor: string;
  layout: LayoutVariant;
};

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function truncate(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function wrapTitle(title: string, maxCharsPerLine: number, maxLines: number): string[] {
  const words = title.trim().split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxCharsPerLine) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = word;
      if (lines.length >= maxLines) break;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  return lines.slice(0, maxLines);
}

const REF_WIDTH = 1200;
const REF_HEIGHT = 800;

function textAnchorBase(layout: LayoutVariant): {
  x: number;
  anchor: 'start' | 'middle';
  maxTitleChars: number;
  titleSize: number;
  lineH: number;
  maxLines: number;
  showExcerpt: boolean;
} {
  switch (layout) {
    case 'b':
      return { x: 0.5, anchor: 'middle', maxTitleChars: 32, titleSize: 48, lineH: 56, maxLines: 3, showExcerpt: true };
    case 'c':
      return { x: 0.08, anchor: 'start', maxTitleChars: 40, titleSize: 56, lineH: 60, maxLines: 2, showExcerpt: false };
    case 'd':
      return { x: 0.08, anchor: 'start', maxTitleChars: 44, titleSize: 44, lineH: 48, maxLines: 3, showExcerpt: true };
    default:
      return { x: 0.08, anchor: 'start', maxTitleChars: 36, titleSize: 52, lineH: 56, maxLines: 3, showExcerpt: true };
  }
}

/** Scale typography for OG, cover, and square thumbs from one master hero. */
function textAnchor(layout: LayoutVariant, w: number, h: number) {
  const base = textAnchorBase(layout);
  const scale = Math.min(w / REF_WIDTH, h / REF_HEIGHT);
  return {
    ...base,
    maxTitleChars: Math.max(12, Math.round(base.maxTitleChars * (w / REF_WIDTH))),
    titleSize: Math.max(22, Math.round(base.titleSize * scale)),
    lineH: Math.max(26, Math.round(base.lineH * scale)),
  };
}

function categoryPill(
  label: string,
  anchorX: number,
  y: number,
  accent: string,
  anchor: 'start' | 'middle',
  fontSize: number,
): string {
  const text = escapeXml(label.toUpperCase());
  const padX = Math.round(14 * (fontSize / 12));
  const pillH = Math.round(28 * (fontSize / 12));
  const pillW = text.length * (fontSize * 0.62) + padX * 2;
  const x = anchor === 'middle' ? anchorX - pillW / 2 : anchorX;
  return `<rect x="${x}" y="${y - pillH + 6}" width="${pillW}" height="${pillH}" rx="${pillH / 2}" fill="${accent}" opacity="0.95"/>
    <text x="${x + padX}" y="${y}" font-family="${FONT_FAMILY}" font-size="${fontSize}" font-weight="700" letter-spacing="0.12em" fill="#ffffff">${text}</text>`;
}

/** Transparent PNG overlay: scrim + typography for compositing on AI hero art. */
export function renderCoverOverlaySvg(input: OverlayInput): string {
  const { width: w, height: h, accentColor: accent } = input;
  const pad = Math.round(w * 0.07);
  const isWide = w / h > 1.45;
  const textLayout = textAnchor(input.layout, w, h);
  const scale = Math.min(w / REF_WIDTH, h / REF_HEIGHT);
  const excerptSize = Math.max(13, Math.round(18 * scale));
  const authorSize = Math.max(11, Math.round(15 * scale));
  const pillFontSize = Math.max(9, Math.round(12 * scale));
  const textX = textLayout.anchor === 'middle' ? w * textLayout.x : pad;
  const anchorAttr = textLayout.anchor === 'middle' ? 'middle' : 'start';

  const titleLines = wrapTitle(input.title, textLayout.maxTitleChars, textLayout.maxLines);
  const excerptLine = truncate(input.excerpt, isWide ? 100 : 130);
  const showExcerpt = textLayout.showExcerpt && excerptLine.length > 0;

  const scrimH = Math.round(h * (isWide ? 0.62 : 0.55));
  const scrimY = h - scrimH;
  const blockBottom = h - pad;
  const excerptBlock = Math.round(52 * scale);
  const titleGap = Math.round(36 * scale);
  const catGap = Math.round(36 * scale);
  const titleStartY =
    blockBottom - (showExcerpt ? excerptBlock : titleGap) - titleLines.length * textLayout.lineH;
  const catY = titleStartY - catGap;

  const titleSvg = titleLines
    .map(
      (line, i) =>
        `<tspan x="${textX}" dy="${i === 0 ? 0 : textLayout.lineH}" font-size="${textLayout.titleSize}" font-weight="700" fill="#ffffff">${escapeXml(line)}</tspan>`,
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    ${interFontFaceDefs()}
    <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0f172a" stop-opacity="0"/>
      <stop offset="35%" stop-color="#0f172a" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0.9"/>
    </linearGradient>
    <filter id="titleShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000000" flood-opacity="0.7"/>
    </filter>
  </defs>
  <rect x="0" y="${scrimY}" width="${w}" height="${scrimH}" fill="url(#scrim)"/>
  ${categoryPill(input.categoryLabel, textX, catY, accent, textLayout.anchor, pillFontSize)}
  <text x="${textX}" y="${titleStartY}" font-family="${FONT_FAMILY}" text-anchor="${anchorAttr}" filter="url(#titleShadow)">${titleSvg}</text>
  ${
    showExcerpt
      ? `<text x="${textX}" y="${blockBottom - Math.round(38 * scale)}" font-family="${FONT_FAMILY}" font-size="${excerptSize}" fill="#e2e8f0" text-anchor="${anchorAttr}" filter="url(#titleShadow)">${escapeXml(excerptLine)}</text>`
      : ''
  }
  <text x="${textX}" y="${blockBottom - Math.round(8 * scale)}" font-family="${FONT_FAMILY}" font-size="${authorSize}" font-weight="600" fill="#cbd5e1" text-anchor="${anchorAttr}">${escapeXml(input.author)}</text>
</svg>`;
}
