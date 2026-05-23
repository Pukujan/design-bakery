import type { LayoutVariant, PanelMode, TemplateFamily } from './templateSelection.js';
import { FONT_FAMILY, interFontFaceDefs } from './fonts.js';
import {
  deriveTemplatePalette,
  linearGradientVector,
  type TemplatePalette,
} from './templateRng.js';
import { renderTechStickers, zoneFromIndex, type TextVerticalZone, type TechIconId } from './techStickers.js';

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
  /** When set, gradients + decor vary per seed (template mode). */
  designSeed?: number;
  /** Agent/heuristic icon pool for template stickers. */
  templateIconPool?: TechIconId[];
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
function coverArt(
  family: TemplateFamily,
  layout: LayoutVariant,
  palette: TemplatePalette,
  w: number,
  h: number,
): string {
  const a = palette.primary;
  const b = palette.secondary;
  const c = palette.tertiary;
  const v = palette.artVariant;
  const minDim = Math.min(w, h);

  const blobA = (cx: number, cy: number, r: number, fill: string, op: number) =>
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" opacity="${op}"/>`;

  const baseVariants = [
    `${blobA(w * 0.72, h * 0.28, minDim * 0.38, a, 0.35)}
     ${blobA(w * 0.18, h * 0.22, minDim * 0.28, b, 0.28)}
     <ellipse cx="${w * 0.5}" cy="${h * 0.12}" rx="${w * 0.55}" ry="${h * 0.2}" fill="${c}" opacity="0.14"/>`,
    `${blobA(w * 0.82, h * 0.18, minDim * 0.32, b, 0.32)}
     ${blobA(w * 0.28, h * 0.35, minDim * 0.42, c, 0.22)}
     ${blobA(w * 0.55, h * 0.08, minDim * 0.2, a, 0.18)}`,
    `${blobA(w * 0.15, h * 0.15, minDim * 0.45, c, 0.3)}
     ${blobA(w * 0.65, h * 0.4, minDim * 0.35, a, 0.25)}
     <ellipse cx="${w * 0.4}" cy="${h * 0.2}" rx="${w * 0.35}" ry="${h * 0.15}" fill="${b}" opacity="0.2"/>`,
  ];
  const base = baseVariants[v % baseVariants.length];

  const stripeWash =
    v % 2 === 0
      ? `<g opacity="0.12">${Array.from({ length: 7 }, (_, i) => {
          const x = w * (-0.1 + i * 0.18);
          return `<rect x="${x}" y="-${h * 0.1}" width="${w * 0.08}" height="${h * 1.2}" fill="${b}" transform="rotate(${18 + (v % 3) * 8} ${w / 2} ${h / 2})"/>`;
        }).join('')}</g>`
      : '';

  if (family === 'diagram') {
    const ox = layout === 'c' ? w * 0.15 : layout === 'd' ? w * 0.08 : w * 0.55;
    const diagramVariants = [
      `<rect x="${ox}" y="${h * 0.18}" width="${w * 0.22}" height="${h * 0.14}" rx="12" fill="none" stroke="${a}" stroke-width="3" opacity="0.45"/>
       <rect x="${ox + w * 0.12}" y="${h * 0.28}" width="${w * 0.18}" height="${h * 0.12}" rx="10" fill="${b}" opacity="0.18"/>
       <line x1="${ox + w * 0.08}" y1="${h * 0.32}" x2="${ox + w * 0.22}" y2="${h * 0.38}" stroke="${c}" stroke-width="2" opacity="0.35"/>`,
      `<polygon points="${ox},${h * 0.32} ${ox + w * 0.18},${h * 0.18} ${ox + w * 0.28},${h * 0.34}" fill="${b}" opacity="0.2"/>
       <circle cx="${ox + w * 0.22}" cy="${h * 0.26}" r="10" fill="${a}" opacity="0.45"/>
       <line x1="${ox + w * 0.28}" y1="${h * 0.26}" x2="${ox + w * 0.42}" y2="${h * 0.22}" stroke="${c}" stroke-width="2.5" opacity="0.4"/>`,
      `<path d="M ${ox} ${h * 0.38} L ${ox + w * 0.1} ${h * 0.2} L ${ox + w * 0.24} ${h * 0.36} Z" fill="${c}" opacity="0.22"/>
       <rect x="${ox + w * 0.14}" y="${h * 0.24}" width="${w * 0.16}" height="${h * 0.1}" rx="8" fill="none" stroke="${a}" stroke-width="2.5" opacity="0.5"/>`,
    ];
    return base + stripeWash + diagramVariants[v % diagramVariants.length];
  }

  if (family === 'nodes') {
    const nodeVariants = [
      `<circle cx="${w * 0.62}" cy="${h * 0.35}" r="14" fill="${a}" opacity="0.5"/>
       <circle cx="${w * 0.78}" cy="${h * 0.22}" r="10" fill="${b}" opacity="0.4"/>
       <circle cx="${w * 0.48}" cy="${h * 0.42}" r="8" fill="${c}" opacity="0.35"/>
       <line x1="${w * 0.52}" y1="${h * 0.38}" x2="${w * 0.68}" y2="${h * 0.28}" stroke="${a}" stroke-width="2.5" opacity="0.4"/>`,
      `<circle cx="${w * 0.7}" cy="${h * 0.25}" r="18" fill="${b}" opacity="0.35"/>
       <circle cx="${w * 0.52}" cy="${h * 0.32}" r="11" fill="${c}" opacity="0.45"/>
       <circle cx="${w * 0.85}" cy="${h * 0.38}" r="7" fill="${a}" opacity="0.5"/>
       <line x1="${w * 0.58}" y1="${h * 0.3}" x2="${w * 0.78}" y2="${h * 0.28}" stroke="${b}" stroke-width="2" opacity="0.45"/>
       <line x1="${w * 0.58}" y1="${h * 0.34}" x2="${w * 0.82}" y2="${h * 0.36}" stroke="${c}" stroke-width="2" opacity="0.35"/>`,
      `<circle cx="${w * 0.58}" cy="${h * 0.28}" r="22" fill="none" stroke="${a}" stroke-width="2" opacity="0.35"/>
       <circle cx="${w * 0.58}" cy="${h * 0.28}" r="6" fill="${b}" opacity="0.55"/>
       <circle cx="${w * 0.76}" cy="${h * 0.34}" r="9" fill="${c}" opacity="0.4"/>
       <circle cx="${w * 0.44}" cy="${h * 0.36}" r="7" fill="${a}" opacity="0.35"/>`,
    ];
    return base + stripeWash + nodeVariants[v % nodeVariants.length];
  }

  if (family === 'grid') {
    let g = '';
    const size = 32 + (v % 3) * 6;
    const startX = w * (0.38 + (v % 4) * 0.04);
    const startY = h * (0.1 + (v % 3) * 0.03);
    const cols = 4 + (v % 2);
    const rows = 3 + (v % 2);
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const fill = col % 3 === 0 ? a : col % 3 === 1 ? b : c;
        const op = 0.08 + ((row + col + v) % 5) * 0.05;
        g += `<rect x="${startX + col * size}" y="${startY + row * size}" width="${size - 8}" height="${size - 8}" rx="6" fill="${fill}" opacity="${op}"/>`;
      }
    }
    return base + stripeWash + g;
  }

  const editorialVariants = [
    `<rect x="0" y="0" width="${w}" height="${h * 0.45}" fill="url(#skyWash)" opacity="0.5"/>
     <path d="M0 ${h * 0.5} Q ${w * 0.35} ${h * 0.38} ${w} ${h * 0.55} L ${w} 0 L 0 0 Z" fill="${a}" opacity="0.08"/>`,
    `<path d="M0 ${h * 0.55} C ${w * 0.25} ${h * 0.35}, ${w * 0.75} ${h * 0.65}, ${w} ${h * 0.42} L ${w} 0 L 0 0 Z" fill="${b}" opacity="0.12"/>
     <path d="M0 ${h * 0.48} Q ${w * 0.5} ${h * 0.62} ${w} ${h * 0.4}" fill="none" stroke="${c}" stroke-width="3" opacity="0.25"/>`,
    `<ellipse cx="${w * 0.5}" cy="${h * 0.35}" rx="${w * 0.48}" ry="${h * 0.22}" fill="${c}" opacity="0.1"/>
     <rect x="${w * 0.05}" y="${h * 0.05}" width="${w * 0.9}" height="${h * 0.35}" rx="24" fill="none" stroke="${a}" stroke-width="2" opacity="0.2"/>`,
  ];
  return base + stripeWash + editorialVariants[v % editorialVariants.length];
}

function decorThemeLayer(theme: number, palette: TemplatePalette, w: number, h: number): string {
  const a = palette.primary;
  const b = palette.secondary;
  const c = palette.tertiary;
  const t = theme % 8;
  if (t === 0) {
    let dots = '';
    for (let i = 0; i < 18; i++) {
      const cx = (w * ((i * 47) % 100)) / 100;
      const cy = (h * ((i * 29) % 100)) / 100;
      dots += `<circle cx="${cx}" cy="${cy}" r="${3 + (i % 4)}" fill="${i % 2 ? b : c}" opacity="0.25"/>`;
    }
    return dots;
  }
  if (t === 1) {
    return `<circle cx="${w * 0.5}" cy="${h * 0.45}" r="${Math.min(w, h) * 0.42}" fill="none" stroke="${b}" stroke-width="2" opacity="0.2"/>
      <circle cx="${w * 0.5}" cy="${h * 0.45}" r="${Math.min(w, h) * 0.28}" fill="none" stroke="${c}" stroke-width="1.5" opacity="0.18"/>`;
  }
  if (t === 2) {
    return `<path d="M0 ${h * 0.35} Q ${w * 0.5} ${h * 0.15} ${w} ${h * 0.4}" fill="none" stroke="${a}" stroke-width="4" opacity="0.15"/>
      <path d="M0 ${h * 0.55} Q ${w * 0.45} ${h * 0.72} ${w} ${h * 0.48}" fill="none" stroke="${b}" stroke-width="3" opacity="0.12"/>`;
  }
  if (t === 3) {
    let mesh = '';
    for (let x = 0; x < 6; x++) {
      for (let y = 0; y < 4; y++) {
        mesh += `<rect x="${w * 0.08 + x * w * 0.14}" y="${h * 0.06 + y * h * 0.12}" width="${w * 0.1}" height="${h * 0.08}" rx="4" fill="${x % 2 ? b : c}" opacity="0.06"/>`;
      }
    }
    return mesh;
  }
  if (t === 4) {
    return `<polygon points="${w * 0.02},${h * 0.2} ${w * 0.22},${h * 0.05} ${w * 0.18},${h * 0.35}" fill="${c}" opacity="0.14"/>
      <polygon points="${w * 0.92},${h * 0.25} ${w * 0.78},${h * 0.08} ${w * 0.98},${h * 0.12}" fill="${b}" opacity="0.12"/>`;
  }
  if (t === 5) {
    return `<rect x="${w * 0.04}" y="${h * 0.04}" width="${w * 0.92}" height="${h * 0.92}" rx="20" fill="none" stroke="${a}" stroke-width="2" opacity="0.12"/>`;
  }
  if (t === 6) {
    let lines = '';
    for (let i = 0; i < 8; i++) {
      lines += `<line x1="0" y1="${h * (0.1 + i * 0.1)}" x2="${w}" y2="${h * (0.05 + i * 0.11)}" stroke="${b}" stroke-width="1" opacity="0.08"/>`;
    }
    return lines;
  }
  return `<ellipse cx="${w * 0.5}" cy="${h * 0.5}" rx="${w * 0.35}" ry="${h * 0.25}" fill="${c}" opacity="0.08"/>`;
}

type TextLayoutSpec = {
  x: number;
  anchor: 'start' | 'middle' | 'end';
  maxTitleChars: number;
  titleSize: number;
  lineH: number;
  maxLines: number;
  showExcerpt: boolean;
  verticalZone: TextVerticalZone;
  textWidthFrac: number;
  scrimMode: 'bottom' | 'top' | 'center' | 'left' | 'right';
};

function layoutVerticalDefault(layout: LayoutVariant): TextVerticalZone {
  switch (layout) {
    case 'b':
    case 'f':
    case 'j':
      return 'center';
    case 'c':
    case 'g':
    case 'h':
      return 'top';
    case 'k':
      return 'upper';
    case 'l':
      return 'lower';
    default:
      return 'bottom';
  }
}

function scrimForZone(zone: TextVerticalZone, anchor: 'start' | 'middle' | 'end'): TextLayoutSpec['scrimMode'] {
  if (zone === 'top' || zone === 'upper') return 'top';
  if (zone === 'center') return 'center';
  if (zone === 'lower' || zone === 'bottom') {
    if (anchor === 'end') return 'right';
    if (anchor === 'start') return 'left';
    return 'bottom';
  }
  return 'bottom';
}

function textAnchor(layout: LayoutVariant, palette: TemplatePalette): TextLayoutSpec {
  const zonePick = (palette.textZone + palette.textStyleVariant) % 8;
  const seedZone = zoneFromIndex(zonePick);
  const layoutZone = layoutVerticalDefault(layout);
  const blendMode = palette.textZone % 4;
  const verticalZone =
    blendMode === 0
      ? seedZone
      : blendMode === 1
        ? layoutZone
        : blendMode === 2
          ? (palette.textZone % 2 === 0 ? seedZone : layoutZone)
          : zoneFromIndex(Math.floor((zonePick + layout.charCodeAt(0)) % 8));

  const widthFrac = Math.min(0.92, Math.max(0.48, palette.textWidthFrac));

  let base: Omit<TextLayoutSpec, 'verticalZone' | 'textWidthFrac' | 'scrimMode'>;
  switch (layout) {
    case 'b':
      base = { x: 0.5, anchor: 'middle', maxTitleChars: 32, titleSize: 48, lineH: 56, maxLines: 3, showExcerpt: true };
      break;
    case 'c':
      base = { x: 0.08, anchor: 'start', maxTitleChars: 40, titleSize: 56, lineH: 60, maxLines: 2, showExcerpt: false };
      break;
    case 'd':
      base = { x: 0.08, anchor: 'start', maxTitleChars: 44, titleSize: 44, lineH: 48, maxLines: 3, showExcerpt: true };
      break;
    case 'e':
      base = { x: 0.92, anchor: 'end', maxTitleChars: 34, titleSize: 46, lineH: 52, maxLines: 3, showExcerpt: true };
      break;
    case 'f':
      base = { x: 0.5, anchor: 'middle', maxTitleChars: 28, titleSize: 50, lineH: 54, maxLines: 2, showExcerpt: true };
      break;
    case 'g':
      base = { x: 0.5, anchor: 'middle', maxTitleChars: 36, titleSize: 42, lineH: 46, maxLines: 4, showExcerpt: false };
      break;
    case 'h':
      base = { x: 0.1, anchor: 'start', maxTitleChars: 38, titleSize: 40, lineH: 44, maxLines: 3, showExcerpt: false };
      break;
    case 'i':
      base = { x: 0.55, anchor: 'start', maxTitleChars: 32, titleSize: 48, lineH: 52, maxLines: 3, showExcerpt: true };
      break;
    case 'j':
      base = { x: 0.5, anchor: 'middle', maxTitleChars: 30, titleSize: 44, lineH: 50, maxLines: 3, showExcerpt: true };
      break;
    case 'k':
      base = { x: 0.12, anchor: 'start', maxTitleChars: 42, titleSize: 58, lineH: 62, maxLines: 2, showExcerpt: false };
      break;
    case 'l':
      base = { x: 0.5, anchor: 'middle', maxTitleChars: 26, titleSize: 38, lineH: 42, maxLines: 4, showExcerpt: true };
      break;
    default:
      base = { x: 0.08, anchor: 'start', maxTitleChars: 36, titleSize: 52, lineH: 56, maxLines: 3, showExcerpt: true };
  }

  const charScale = 0.75 + widthFrac * 0.35;
  const style = palette.textStyleVariant;
  const titleScale = 0.86 + (style % 3) * 0.1;
  const lineScale = 0.9 + (style % 2) * 0.12;
  const maxLinesAdj = style === 3 ? 1 : 0;
  return {
    ...base,
    maxTitleChars: Math.round(base.maxTitleChars * charScale),
    titleSize: Math.round(base.titleSize * titleScale * (0.88 + widthFrac * 0.18)),
    lineH: Math.round(base.lineH * lineScale),
    maxLines: Math.min(4, base.maxLines + maxLinesAdj),
    verticalZone,
    textWidthFrac: widthFrac,
    scrimMode: scrimForZone(verticalZone, base.anchor),
  };
}

function verticalAnchorY(
  zone: TextVerticalZone,
  blockHeight: number,
  h: number,
  pad: number,
  yJitter = 0,
): number {
  let y: number;
  switch (zone) {
    case 'top':
      y = pad + 28;
      break;
    case 'upper':
      y = h * 0.18;
      break;
    case 'center':
      y = h * 0.5 - blockHeight * 0.45;
      break;
    case 'lower':
      y = h * 0.62 - blockHeight * 0.15;
      break;
    default:
      y = h - pad - blockHeight;
  }
  return y + h * yJitter;
}

function renderScrim(
  mode: TextLayoutSpec['scrimMode'],
  textTop: number,
  textBottom: number,
  w: number,
  h: number,
  pad: number,
): string {
  const bandPad = pad * 0.6;
  const textBandTop = Math.max(0, textTop - bandPad);
  const textBandH = Math.min(h, textBottom - textTop + bandPad * 2);

  switch (mode) {
    case 'top': {
      const scrimH = Math.round(Math.max(h * 0.42, textBottom + pad));
      return `<rect x="0" y="0" width="${w}" height="${scrimH}" fill="url(#scrimTop)"/>`;
    }
    case 'center':
      return `<rect x="${pad * 0.5}" y="${textBandTop}" width="${w - pad}" height="${textBandH}" rx="20" fill="url(#scrimCenter)"/>`;
    case 'left': {
      const scrimW = Math.round(w * 0.58);
      return `<rect x="0" y="0" width="${scrimW}" height="${h}" fill="url(#scrimSide)"/>`;
    }
    case 'right': {
      const scrimW = Math.round(w * 0.58);
      return `<rect x="${w - scrimW}" y="0" width="${scrimW}" height="${h}" fill="url(#scrimSideRight)"/>`;
    }
    default: {
      const scrimH = Math.round(Math.max(h * 0.42, h - textTop + pad));
      const scrimY = h - scrimH;
      return `<rect x="0" y="${scrimY}" width="${w}" height="${scrimH}" fill="url(#scrim)"/>`;
    }
  }
}

function categoryPill(
  label: string,
  anchorX: number,
  y: number,
  accent: string,
  anchor: 'start' | 'middle' | 'end',
): string {
  const text = escapeXml(label.toUpperCase());
  const padX = 14;
  const pillW = text.length * 7.5 + padX * 2;
  const x =
    anchor === 'middle' ? anchorX - pillW / 2 : anchor === 'end' ? anchorX - pillW : anchorX;
  return `<rect x="${x}" y="${y - 22}" width="${pillW}" height="28" rx="14" fill="${accent}" opacity="0.95"/>
    <text x="${x + padX}" y="${y}" font-family="${FONT_FAMILY}" font-size="12" font-weight="700" letter-spacing="0.12em" fill="#ffffff">${text}</text>`;
}

export function renderBlogCardSvg(input: RenderCardInput): string {
  const { width: w, height: h, accentColor: accent } = input;
  const palette =
    input.designSeed !== undefined
      ? deriveTemplatePalette(accent, input.designSeed)
      : deriveTemplatePalette(accent, 0);
  const pillAccent = palette.primary;
  const isWide = w / h > 1.45;
  const pad = Math.round(w * 0.07);
  const textLayout = textAnchor(input.layout, palette);
  const textX =
    textLayout.anchor === 'middle'
      ? w * textLayout.x
      : textLayout.anchor === 'end'
        ? w - pad
        : pad + w * 0.01;
  const anchorAttr = textLayout.anchor;

  const titleLines = wrapTitle(input.title, textLayout.maxTitleChars, textLayout.maxLines);
  const excerptLine = truncate(input.excerpt, isWide ? Math.round(100 * textLayout.textWidthFrac) : Math.round(130 * textLayout.textWidthFrac));
  const showExcerpt = textLayout.showExcerpt && excerptLine.length > 0;

  const titleBlockLines = titleLines.length;
  const metaBlockH = 36 + titleBlockLines * textLayout.lineH + (showExcerpt ? 52 : 20) + 28;
  const blockTop = verticalAnchorY(textLayout.verticalZone, metaBlockH, h, pad, palette.textYJitter);
  const catY = blockTop + 8;
  const titleStartY = blockTop + 36;
  const excerptY = titleStartY + titleBlockLines * textLayout.lineH + 18;
  const authorY = (showExcerpt ? excerptY + 32 : titleStartY + titleBlockLines * textLayout.lineH + 28);
  const textBottom = authorY + 12;

  const textLeftNorm =
    textLayout.anchor === 'middle'
      ? textLayout.x - textLayout.textWidthFrac / 2
      : textLayout.anchor === 'end'
        ? 1 - pad / w - textLayout.textWidthFrac
        : pad / w + textLayout.x * 0.02;

  const designSeed = input.designSeed ?? 0;
  const stickers = renderTechStickers({
    designSeed: designSeed || 1,
    primary: palette.primary,
    secondary: palette.secondary,
    tertiary: palette.tertiary,
    w,
    h,
    textBounds: {
      y: blockTop / h,
      h: (textBottom - blockTop) / h,
      x: Math.max(0, textLeftNorm),
      w: textLayout.textWidthFrac,
    },
    iconPool: input.templateIconPool,
  });

  const titleSvg = titleLines
    .map(
      (line, i) =>
        `<tspan x="${textX}" dy="${i === 0 ? 0 : textLayout.lineH}" font-size="${textLayout.titleSize}" font-weight="700" fill="#ffffff">${escapeXml(line)}</tspan>`,
    )
    .join('');

  const art = coverArt(input.family, input.layout, palette, w, h);
  const { r, g, b } = hexToRgb(palette.primary);
  const { r: r2, g: g2, b: b2 } = hexToRgb(palette.secondary);
  const gradVec = linearGradientVector(palette.gradAngleDeg);
  const scrimSvg = renderScrim(textLayout.scrimMode, blockTop, textBottom, w, h, pad);

  const heroBgDef = palette.useRadialBg
    ? `<radialGradient id="heroBg" cx="0.35" cy="0.25" r="0.95">
      <stop offset="0%" stop-color="${lighten(palette.secondary, 0.12)}" />
      <stop offset="40%" stop-color="${lighten(palette.quaternary, 0.05)}" />
      <stop offset="55%" stop-color="rgb(${mix(r2, 40, 0.4)}, ${mix(g2, 40, 0.4)}, ${mix(b2, 50, 0.4)})" />
      <stop offset="100%" stop-color="${darken(palette.tertiary, 0.5)}" />
    </radialGradient>`
    : `<linearGradient id="heroBg" x1="${gradVec.x1}" y1="${gradVec.y1}" x2="${gradVec.x2}" y2="${gradVec.y2}">
      <stop offset="0%" stop-color="${lighten(palette.secondary, 0.1)}" />
      <stop offset="30%" stop-color="${lighten(palette.quaternary, 0.06)}" />
      <stop offset="45%" stop-color="rgb(${mix(r, 30, 0.45)}, ${mix(g, 30, 0.45)}, ${mix(b, 40, 0.45)})" />
      <stop offset="100%" stop-color="${darken(palette.tertiary, 0.55)}" />
    </linearGradient>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    ${interFontFaceDefs()}
    ${heroBgDef}
    <linearGradient id="skyWash" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="${palette.primary}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="skyWash2" x1="1" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${palette.tertiary}" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="${palette.secondary}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0f172a" stop-opacity="0"/>
      <stop offset="35%" stop-color="#0f172a" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0.88"/>
    </linearGradient>
    <linearGradient id="scrimTop" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0f172a" stop-opacity="0.88"/>
      <stop offset="65%" stop-color="#0f172a" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="scrimCenter" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0f172a" stop-opacity="0.72"/>
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0.72"/>
    </linearGradient>
    <linearGradient id="scrimSide" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#0f172a" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="scrimSideRight" x1="1" y1="0" x2="0" y2="0">
      <stop offset="0%" stop-color="#0f172a" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0"/>
    </linearGradient>
    <filter id="titleShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000000" flood-opacity="0.65"/>
    </filter>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#heroBg)"/>
  <rect width="${w}" height="${h}" fill="url(#skyWash2)" opacity="0.6"/>
  ${art}
  ${decorThemeLayer(palette.decorTheme, palette, w, h)}
  ${stickers}
  ${scrimSvg}
  ${categoryPill(input.categoryLabel, textX, catY, pillAccent, textLayout.anchor)}
  <text x="${textX}" y="${titleStartY}" font-family="${FONT_FAMILY}" text-anchor="${anchorAttr}" filter="url(#titleShadow)">${titleSvg}</text>
  ${
    showExcerpt
      ? `<text x="${textX}" y="${excerptY}" font-family="${FONT_FAMILY}" font-size="18" font-weight="400" fill="#e2e8f0" text-anchor="${anchorAttr}" filter="url(#titleShadow)">${escapeXml(excerptLine)}</text>`
      : ''
  }
  <text x="${textX}" y="${authorY}" font-family="${FONT_FAMILY}" font-size="15" font-weight="600" fill="#cbd5e1" text-anchor="${anchorAttr}" opacity="0.95">${escapeXml(input.author)}</text>
</svg>`;
}
