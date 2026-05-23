import type { PanelMode } from './templateSelection.js';

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

function contrastRatio(l1: number, l2: number): number {
  const a = Math.max(l1, l2);
  const b = Math.min(l1, l2);
  return (a + 0.05) / (b + 0.05);
}

export function pickReadablePanelMode(accentHex: string): PanelMode {
  const rgb = hexToRgb(accentHex);
  if (!rgb) return 'light';
  const accentL = relativeLuminance(rgb.r, rgb.g, rgb.b);
  const lightPanel = { bg: '#ffffff', fg: '#111827', muted: '#374151' };
  const darkPanel = { bg: '#111827', fg: '#f9fafb', muted: '#d1d5db' };

  const preferDark = accentL > 0.45;
  const panel = preferDark ? darkPanel : lightPanel;
  const bgRgb = hexToRgb(panel.bg)!;
  const bgL = relativeLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
  const fgRgb = hexToRgb(panel.fg)!;
  const mutedRgb = hexToRgb(panel.muted)!;
  const fgL = relativeLuminance(fgRgb.r, fgRgb.g, fgRgb.b);
  const mutedL = relativeLuminance(mutedRgb.r, mutedRgb.g, mutedRgb.b);

  const mode: PanelMode = preferDark ? 'dark' : 'light';
  if (contrastRatio(bgL, fgL) >= 4.5 && contrastRatio(bgL, mutedL) >= 3) {
    return mode;
  }
  return mode === 'light' ? 'dark' : 'light';
}
