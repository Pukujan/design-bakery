import type { LayoutVariant, PanelMode, TemplateFamily } from './templateSelection.js';
import { FONT_FAMILY, interFontFaceDefs } from './fonts.js';

export type RenderCardInput = {
  width: number;
  height: number;
  title: string;
  excerpt: string;
  categoryLabel: string;
  author: string;
  accentColor: string;
  tags: string[];
  family: TemplateFamily;
  layout: LayoutVariant;
  panelMode: PanelMode;
  stylePreset: 'auto' | 'minimal' | 'bold' | 'line_art';
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

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace(/^#/, '');
  const n = parseInt(h.length === 6 ? h : '6366f1', 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function mix(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

function darken(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const f = 1 - amount;
  return `rgb(${mix(r, 0, f)}, ${mix(g, 0, f)}, ${mix(b, 0, f)})`;
}

function lighten(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgb(${mix(r, 255, amount)}, ${mix(g, 255, amount)}, ${mix(b, 255, amount)})`;
}

/** Full-canvas ambient art (not a side card). */
function coverArt(family: TemplateFamily, layout: LayoutVariant, accent: string, w: number, h: number): string {
  const a = accent;
  const base = `
    <circle cx="${w * 0.72}" cy="${h * 0.28}" r="${Math.min(w, h) * 0.38}" fill="${a}" opacity="0.35"/>
    <circle cx="${w * 0.18}" cy="${h * 0.22}" r="${Math.min(w, h) * 0.28}" fill="${lighten(a, 0.35)}" opacity="0.25"/>
    <ellipse cx="${w * 0.5}" cy="${h * 0.12}" rx="${w * 0.55}" ry="${h * 0.2}" fill="${a}" opacity="0.12"/>`;

  if (family === 'diagram') {
    const ox = layout === 'c' ? w * 0.15 : w * 0.55;
    return `${base}
      <rect x="${ox}" y="${h * 0.18}" width="${w * 0.22}" height="${h * 0.14}" rx="12" fill="none" stroke="${a}" stroke-width="3" opacity="0.45"/>
      <rect x="${ox + w * 0.12}" y="${h * 0.28}" width="${w * 0.18}" height="${h * 0.12}" rx="10" fill="${a}" opacity="0.15"/>
      <line x1="${ox + w * 0.08}" y1="${h * 0.32}" x2="${ox + w * 0.22}" y2="${h * 0.38}" stroke="${a}" stroke-width="2" opacity="0.35"/>`;
  }
  if (family === 'nodes') {
    return `${base}
      <circle cx="${w * 0.62}" cy="${h * 0.35}" r="14" fill="${a}" opacity="0.5"/>
      <circle cx="${w * 0.78}" cy="${h * 0.22}" r="10" fill="${lighten(a, 0.4)}" opacity="0.4"/>
      <circle cx="${w * 0.48}" cy="${h * 0.42}" r="8" fill="${a}" opacity="0.35"/>
      <line x1="${w * 0.52}" y1="${h * 0.38}" x2="${w * 0.68}" y2="${h * 0.28}" stroke="${a}" stroke-width="2.5" opacity="0.4"/>`;
  }
  if (family === 'grid') {
    let g = '';
    const size = 36;
    const startX = w * 0.45;
    const startY = h * 0.12;
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 5; col++) {
        const op = 0.08 + ((row + col) % 4) * 0.06;
        g += `<rect x="${startX + col * size}" y="${startY + row * size}" width="28" height="28" rx="6" fill="${a}" opacity="${op}"/>`;
      }
    }
    return base + g;
  }
  // editorial — soft bands
  return `${base}
    <rect x="0" y="0" width="${w}" height="${h * 0.45}" fill="url(#skyWash)" opacity="0.5"/>
    <path d="M0 ${h * 0.5} Q ${w * 0.35} ${h * 0.38} ${w} ${h * 0.55} L ${w} 0 L 0 0 Z" fill="${a}" opacity="0.08"/>`;
}

function textAnchor(layout: LayoutVariant): {
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

function categoryPill(
  label: string,
  anchorX: number,
  y: number,
  accent: string,
  anchor: 'start' | 'middle',
): string {
  const text = escapeXml(label.toUpperCase());
  const padX = 14;
  const pillW = text.length * 7.5 + padX * 2;
  const x = anchor === 'middle' ? anchorX - pillW / 2 : anchorX;
  return `<rect x="${x}" y="${y - 22}" width="${pillW}" height="28" rx="14" fill="${accent}" opacity="0.95"/>
    <text x="${x + padX}" y="${y}" font-family="${FONT_FAMILY}" font-size="12" font-weight="700" letter-spacing="0.12em" fill="#ffffff">${text}</text>`;
}

export function renderBlogCardSvg(input: RenderCardInput): string {
  const { width: w, height: h, accentColor: accent } = input;
  const isWide = w / h > 1.45;
  const pad = Math.round(w * 0.07);
  const textLayout = textAnchor(input.layout);
  const textX = textLayout.anchor === 'middle' ? w * textLayout.x : pad + w * 0.01;
  const anchorAttr = textLayout.anchor === 'middle' ? 'middle' : 'start';

  const titleLines = wrapTitle(input.title, textLayout.maxTitleChars, textLayout.maxLines);
  const excerptLine = truncate(input.excerpt, isWide ? 100 : 130);
  const showExcerpt = textLayout.showExcerpt && excerptLine.length > 0;

  const scrimH = Math.round(h * (isWide ? 0.62 : 0.55));
  const scrimY = h - scrimH;
  const blockBottom = h - pad;
  const titleBlockLines = titleLines.length;
  const titleStartY =
    blockBottom -
    (showExcerpt ? 52 : 36) -
    titleBlockLines * textLayout.lineH;

  const titleSvg = titleLines
    .map(
      (line, i) =>
        `<tspan x="${textX}" dy="${i === 0 ? 0 : textLayout.lineH}" font-size="${textLayout.titleSize}" font-weight="700" fill="#ffffff">${escapeXml(line)}</tspan>`,
    )
    .join('');

  const art = coverArt(input.family, input.layout, accent, w, h);
  const { r, g, b } = hexToRgb(accent);
  const catY = titleStartY - 36;

  const authorX = textX;
  const authorY = blockBottom - 8;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    ${interFontFaceDefs()}
    <linearGradient id="heroBg" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0%" stop-color="${lighten(accent, 0.15)}" />
      <stop offset="45%" stop-color="rgb(${mix(r, 30, 0.5)}, ${mix(g, 30, 0.5)}, ${mix(b, 40, 0.5)})" />
      <stop offset="100%" stop-color="${darken(accent, 0.55)}" />
    </linearGradient>
    <linearGradient id="skyWash" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0f172a" stop-opacity="0"/>
      <stop offset="35%" stop-color="#0f172a" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0.88"/>
    </linearGradient>
    <filter id="titleShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000000" flood-opacity="0.65"/>
    </filter>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#heroBg)"/>
  ${art}
  <rect x="0" y="${scrimY}" width="${w}" height="${scrimH}" fill="url(#scrim)"/>
  ${categoryPill(input.categoryLabel, textX, catY, accent, textLayout.anchor)}
  <text x="${textX}" y="${titleStartY}" font-family="${FONT_FAMILY}" text-anchor="${anchorAttr}" filter="url(#titleShadow)">${titleSvg}</text>
  ${
    showExcerpt
      ? `<text x="${textX}" y="${blockBottom - 38}" font-family="${FONT_FAMILY}" font-size="18" font-weight="400" fill="#e2e8f0" text-anchor="${anchorAttr}" filter="url(#titleShadow)">${escapeXml(excerptLine)}</text>`
      : ''
  }
  <text x="${authorX}" y="${authorY}" font-family="${FONT_FAMILY}" font-size="15" font-weight="600" fill="#cbd5e1" text-anchor="${anchorAttr}" opacity="0.95">${escapeXml(input.author)}</text>
</svg>`;
}
