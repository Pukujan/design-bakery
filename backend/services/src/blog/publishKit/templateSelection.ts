export type TemplateFamily = 'editorial' | 'diagram' | 'nodes' | 'grid';
export type LayoutVariant =
  | 'a'
  | 'b'
  | 'c'
  | 'd'
  | 'e'
  | 'f'
  | 'g'
  | 'h'
  | 'i'
  | 'j'
  | 'k'
  | 'l';

export const LAYOUT_VARIANTS: LayoutVariant[] = [
  'a',
  'b',
  'c',
  'd',
  'e',
  'f',
  'g',
  'h',
  'i',
  'j',
  'k',
  'l',
];
export type PanelMode = 'light' | 'dark';

const CATEGORY_FAMILY: Record<string, TemplateFamily> = {
  'ai-ml': 'nodes',
  architecture: 'diagram',
  systems: 'grid',
  'product-design': 'editorial',
  engineering: 'editorial',
  default: 'editorial',
};

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.replace(/^#/, '');
  if (h.length !== 6) return null;
  const n = parseInt(h, 16);
  if (Number.isNaN(n)) return null;
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function pickPanelMode(accentHex: string): PanelMode {
  const rgb = hexToRgb(accentHex);
  if (!rgb) return 'light';
  return relativeLuminance(rgb.r, rgb.g, rgb.b) > 0.45 ? 'dark' : 'light';
}

export function resolveTemplateFamily(category: string): TemplateFamily {
  const key = category.trim().toLowerCase().replace(/\s+/g, '-');
  return CATEGORY_FAMILY[key] ?? CATEGORY_FAMILY.default;
}

export function resolveLayoutVariant(seed: number, offset = 0): LayoutVariant {
  const idx = Math.abs(Math.floor(seed) + offset) % LAYOUT_VARIANTS.length;
  return LAYOUT_VARIANTS[idx];
}

export function resolveSeed(blogId: number, numericId?: number): number {
  return numericId ?? blogId;
}
