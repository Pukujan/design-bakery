/**
 * Colorful flat sticker icons (OpenMoji-inspired, simplified for server SVG).
 * viewBox 0 0 36 36 — multicolor fills inside soft badge circles.
 */

export type TechIconId =
  | 'code'
  | 'terminal'
  | 'cpu'
  | 'database'
  | 'cloud'
  | 'git-branch'
  | 'brackets'
  | 'workflow'
  | 'bot'
  | 'sparkles'
  | 'layers'
  | 'server';

type TechIconDef = {
  id: TechIconId;
  /** Inner SVG markup (paths), no outer svg tag */
  markup: string;
};

/** Curated tech / engineering icons — vivid flat fills */
export const TECH_ICONS: TechIconDef[] = [
  {
    id: 'code',
    markup: `<path d="M12 10l-6 8 6 8" fill="none" stroke="#f97316" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M24 10l6 8-6 8" fill="none" stroke="#fb923c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="14" y="8" width="8" height="20" rx="2" fill="#fdba74" opacity="0.35"/>`,
  },
  {
    id: 'terminal',
    markup: `<rect x="5" y="8" width="26" height="20" rx="4" fill="#1e293b"/>
      <path d="M10 16l5 4-5 4" fill="none" stroke="#4ade80" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="17" y="21" width="10" height="2.5" rx="1.2" fill="#86efac"/>`,
  },
  {
    id: 'cpu',
    markup: `<rect x="10" y="10" width="16" height="16" rx="3" fill="#6366f1"/>
      <rect x="14" y="14" width="8" height="8" rx="1.5" fill="#c7d2fe"/>
      <rect x="16" y="4" width="4" height="4" rx="1" fill="#818cf8"/>
      <rect x="16" y="28" width="4" height="4" rx="1" fill="#818cf8"/>
      <rect x="4" y="16" width="4" height="4" rx="1" fill="#818cf8"/>
      <rect x="28" y="16" width="4" height="4" rx="1" fill="#818cf8"/>`,
  },
  {
    id: 'database',
    markup: `<ellipse cx="18" cy="11" rx="11" ry="4" fill="#a855f7"/>
      <path d="M7 11v14c0 2.2 4.9 4 11 4s11-1.8 11-4V11" fill="#9333ea"/>
      <ellipse cx="18" cy="18" rx="11" ry="4" fill="#c084fc" opacity="0.55"/>
      <ellipse cx="18" cy="25" rx="11" ry="4" fill="#e9d5ff" opacity="0.45"/>`,
  },
  {
    id: 'cloud',
    markup: `<path d="M26 24H12a6 6 0 1 1 1.2-11.9A7.5 7.5 0 0 1 27 14a5.5 5.5 0 0 1 1 10.8" fill="#38bdf8"/>
      <circle cx="14" cy="20" r="2.5" fill="#ffffff" opacity="0.55"/>
      <circle cx="22" cy="18" r="3" fill="#ffffff" opacity="0.4"/>`,
  },
  {
    id: 'git-branch',
    markup: `<circle cx="11" cy="26" r="4" fill="#22c55e"/>
      <circle cx="25" cy="12" r="4" fill="#16a34a"/>
      <path d="M11 22V14a6 6 0 0 1 6-6h4" fill="none" stroke="#15803d" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="25" cy="26" r="4" fill="#4ade80"/>`,
  },
  {
    id: 'brackets',
    markup: `<path d="M12 8H8a3 3 0 0 0-3 3v5a3 3 0 0 1 0 6v5a3 3 0 0 0 3 3h4" fill="none" stroke="#0ea5e9" stroke-width="2.8" stroke-linecap="round"/>
      <path d="M24 8h4a3 3 0 0 1 3 3v5a3 3 0 0 0 0 6v5a3 3 0 0 1-3 3h-4" fill="none" stroke="#38bdf8" stroke-width="2.8" stroke-linecap="round"/>
      <rect x="15" y="14" width="6" height="8" rx="1.5" fill="#7dd3fc" opacity="0.5"/>`,
  },
  {
    id: 'workflow',
    markup: `<rect x="6" y="8" width="10" height="10" rx="2.5" fill="#f59e0b"/>
      <rect x="20" y="18" width="10" height="10" rx="2.5" fill="#fb7185"/>
      <path d="M16 13h4v8" fill="none" stroke="#ea580c" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="16" cy="13" r="2" fill="#fcd34d"/>
      <circle cx="20" cy="21" r="2" fill="#fda4af"/>`,
  },
  {
    id: 'bot',
    markup: `<rect x="8" y="12" width="20" height="16" rx="4" fill="#3b82f6"/>
      <rect x="12" y="16" width="5" height="5" rx="1.5" fill="#ffffff"/>
      <rect x="19" y="16" width="5" height="5" rx="1.5" fill="#ffffff"/>
      <circle cx="14.5" cy="18.5" r="1.2" fill="#1d4ed8"/>
      <circle cx="21.5" cy="18.5" r="1.2" fill="#1d4ed8"/>
      <rect x="13" y="24" width="10" height="2" rx="1" fill="#93c5fd"/>
      <rect x="16" y="6" width="4" height="6" rx="2" fill="#60a5fa"/>
      <circle cx="18" cy="6" r="2" fill="#fbbf24"/>`,
  },
  {
    id: 'sparkles',
    markup: `<path d="M18 6l1.8 5.5L25 13l-5.2 1.8L18 20l-1.8-5.2L11 13l5.2-1.5L18 6z" fill="#fbbf24"/>
      <path d="M27 22l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" fill="#f472b6"/>
      <path d="M9 24l0.8 2.4 2.4 0.8-2.4 0.8L9 30l-0.8-2.4L5.8 26.8l2.4-0.8L9 24z" fill="#a78bfa"/>`,
  },
  {
    id: 'layers',
    markup: `<path d="M18 7L6 13l12 6 12-6-12-6z" fill="#14b8a6"/>
      <path d="M6 19l12 6 12-6" fill="none" stroke="#0d9488" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M6 25l12 6 12-6" fill="none" stroke="#5eead4" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M18 13v12" stroke="#99f6e4" stroke-width="1.5" opacity="0.6"/>`,
  },
  {
    id: 'server',
    markup: `<rect x="7" y="7" width="22" height="9" rx="2.5" fill="#64748b"/>
      <rect x="7" y="20" width="22" height="9" rx="2.5" fill="#475569"/>
      <circle cx="12" cy="11.5" r="1.8" fill="#4ade80"/>
      <circle cx="12" cy="24.5" r="1.8" fill="#38bdf8"/>
      <rect x="16" y="10" width="9" height="3" rx="1.5" fill="#cbd5e1"/>
      <rect x="16" y="23" width="9" height="3" rx="1.5" fill="#cbd5e1"/>`,
  },
];

export type TextVerticalZone = 'top' | 'upper' | 'center' | 'lower' | 'bottom';

export type TextBoundsNorm = {
  /** Text block top (0–1) */
  y: number;
  /** Text block height (0–1) */
  h: number;
  /** Text block left (0–1) */
  x: number;
  /** Text block width (0–1) */
  w: number;
};

export type StickerLayoutInput = {
  designSeed: number;
  primary: string;
  secondary: string;
  tertiary: string;
  w: number;
  h: number;
  /** Actual rendered text bounds (preferred over coarse zone). */
  textBounds?: TextBoundsNorm;
  /** Legacy coarse zone — used when textBounds omitted */
  textZoneY?: number;
  textZoneH?: number;
  /** Contextual icons from agent/heuristic; shuffle picks a subset. */
  iconPool?: TechIconId[];
};

const STICKER_SLOTS: { x: number; y: number; side: 'left' | 'right' | 'any' }[] = [
  { x: 0.9, y: 0.1, side: 'right' },
  { x: 0.1, y: 0.12, side: 'left' },
  { x: 0.88, y: 0.38, side: 'right' },
  { x: 0.12, y: 0.42, side: 'left' },
  { x: 0.92, y: 0.62, side: 'right' },
  { x: 0.08, y: 0.68, side: 'left' },
  { x: 0.78, y: 0.86, side: 'right' },
  { x: 0.2, y: 0.88, side: 'left' },
  { x: 0.5, y: 0.08, side: 'any' },
  { x: 0.5, y: 0.92, side: 'any' },
];

const BADGE_FILLS = ['#fff7ed', '#eff6ff', '#f0fdf4', '#fdf4ff', '#fef2f2', '#ecfeff'];
const BADGE_STROKES = ['#fdba74', '#93c5fd', '#86efac', '#d8b4fe', '#fca5a5', '#67e8f9'];

function resolveTextBounds(input: StickerLayoutInput): TextBoundsNorm {
  if (input.textBounds) return input.textBounds;
  return {
    y: input.textZoneY ?? 0.52,
    h: input.textZoneH ?? 0.42,
    x: 0.08,
    w: 0.84,
  };
}

function overlapsTextBlock(
  slotX: number,
  slotY: number,
  stickerRadiusNorm: number,
  bounds: TextBoundsNorm,
  margin: number,
): boolean {
  const pad = margin + stickerRadiusNorm;
  const loX = bounds.x - pad;
  const hiX = bounds.x + bounds.w + pad;
  const loY = bounds.y - pad;
  const hiY = bounds.y + bounds.h + pad;
  return slotX >= loX && slotX <= hiX && slotY >= loY && slotY <= hiY;
}

function textAnchorSide(bounds: TextBoundsNorm): 'left' | 'right' | 'center' {
  const center = bounds.x + bounds.w / 2;
  if (center < 0.38) return 'left';
  if (center > 0.62) return 'right';
  return 'center';
}

function slotMatchesSide(
  slotSide: 'left' | 'right' | 'any',
  textSide: 'left' | 'right' | 'center',
): boolean {
  if (slotSide === 'any') return true;
  if (textSide === 'center') return true;
  return slotSide !== textSide;
}

function singleSticker(
  icon: TechIconDef,
  cx: number,
  cy: number,
  size: number,
  rotation: number,
  fill: string,
  stroke: string,
): string {
  const half = size / 2;
  const iconScale = (size * 0.62) / 36;
  const iconOffset = 18 * iconScale;
  return `<g transform="translate(${cx.toFixed(1)}, ${cy.toFixed(1)}) rotate(${rotation.toFixed(1)})">
    <circle cx="0" cy="0" r="${(half * 1.05).toFixed(1)}" fill="#0f172a" opacity="0.12"/>
    <rect x="${(-half).toFixed(1)}" y="${(-half).toFixed(1)}" width="${size}" height="${size}" rx="${(size * 0.28).toFixed(1)}"
      fill="${fill}" opacity="0.96"/>
    <rect x="${(-half).toFixed(1)}" y="${(-half).toFixed(1)}" width="${size}" height="${size}" rx="${(size * 0.28).toFixed(1)}"
      fill="none" stroke="${stroke}" stroke-width="2" opacity="0.55"/>
    <g transform="scale(${iconScale.toFixed(4)}) translate(${(-iconOffset).toFixed(2)}, ${(-iconOffset).toFixed(2)})">
      ${icon.markup}
    </g>
  </g>`;
}

/** Pick a varied subset from the icon pool using designSeed. */
function pickPoolSubset(pool: TechIconDef[], designSeed: number, count: number): TechIconDef[] {
  if (pool.length === 0) return TECH_ICONS.slice(0, count);
  let s = (designSeed ^ 0x85ebca6b) >>> 0;
  const rand = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  const want = Math.min(Math.max(2, count), shuffled.length);
  return shuffled.slice(0, want);
}

/** Floating colorful stickers — placement varies with designSeed; avoids text block. */
export function renderTechStickers(input: StickerLayoutInput): string {
  const { designSeed, w, h, iconPool } = input;
  let s = (designSeed ^ 0x9e3779b9) >>> 0;
  const rand = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const bounds = resolveTextBounds(input);
  const textSide = textAnchorSide(bounds);
  const count = 3 + Math.floor(rand() * 3);
  const minDim = Math.min(w, h);
  const stickerSize = minDim * (0.11 + rand() * 0.05);
  const stickerRadiusNorm = (stickerSize / 2) / h;

  const poolIcons =
    iconPool && iconPool.length > 0
      ? iconPool
          .map((id) => TECH_ICONS.find((i) => i.id === id))
          .filter((i): i is TechIconDef => Boolean(i))
      : TECH_ICONS;

  const iconSubset = pickPoolSubset(poolIcons, designSeed, count);

  const slots = [...STICKER_SLOTS].filter((slot) => slotMatchesSide(slot.side, textSide));
  for (let i = slots.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [slots[i], slots[j]] = [slots[j]!, slots[i]!];
  }

  let svg = '';
  let placed = 0;
  for (const slot of slots) {
    if (placed >= count) break;
    const slotY = slot.y + (rand() - 0.5) * 0.03;
    const slotX = slot.x + (rand() - 0.5) * 0.03;
    if (overlapsTextBlock(slotX, slotY, stickerRadiusNorm, bounds, 0.06)) continue;

    const icon = iconSubset[placed % iconSubset.length]!;
    const cx = w * slotX;
    const cy = h * slotY;
    const rot = (rand() - 0.5) * 16;
    const fill = BADGE_FILLS[(placed + designSeed) % BADGE_FILLS.length]!;
    const stroke = BADGE_STROKES[(placed + designSeed) % BADGE_STROKES.length]!;

    svg += singleSticker(icon, cx, cy, stickerSize, rot, fill, stroke);
    placed++;
  }

  return svg;
}

export function zoneFromIndex(idx: number): TextVerticalZone {
  const zones: TextVerticalZone[] = [
    'top',
    'upper',
    'top',
    'center',
    'center',
    'lower',
    'bottom',
    'lower',
  ];
  return zones[Math.abs(idx) % zones.length]!;
}
