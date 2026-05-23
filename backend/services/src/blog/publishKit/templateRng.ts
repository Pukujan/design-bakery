/** Seeded variation for template-only covers (gradients, hues, art patterns). */

export type TemplatePalette = {
  primary: string;
  secondary: string;
  tertiary: string;
  /** Optional fourth accent for richer gradients */
  quaternary: string;
  /** 0–315 in 45° steps */
  gradAngleDeg: number;
  useRadialBg: boolean;
  /** 0–5 — picks art pattern within template family */
  artVariant: number;
  /** 0–7 — extra decor layer (mesh, rings, dots, …) */
  decorTheme: number;
  /** 0–7 — vertical text band (top → bottom) */
  textZone: number;
  /** 0.48–0.92 — title block width as fraction of canvas */
  textWidthFrac: number;
  /** -0.04–0.04 — vertical nudge for text block (fraction of canvas height) */
  textYJitter: number;
  /** 0–3 — typography emphasis (size/line-height mix) */
  textStyleVariant: number;
};

export function resolveDesignSeed(
  blogSeed: number,
  variationOffset: number,
  stylePreset: string,
  templateSalt = 0,
): number {
  let h = (Math.abs(Math.floor(blogSeed)) + variationOffset * 9973) | 0;
  for (let i = 0; i < stylePreset.length; i++) {
    h = (Math.imul(31, h) + stylePreset.charCodeAt(i)) | 0;
  }
  if (templateSalt) {
    h = (Math.imul(h, 2654435761) + (templateSalt | 0)) | 0;
  }
  return h >>> 0;
}

export function makeTemplateRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      default:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  return [h * 360, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

export function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((n) => clamp(n, 0, 255).toString(16).padStart(2, '0')).join('')}`;
}

export function shiftAccentHex(
  hex: string,
  hueDeg: number,
  satMult: number,
  lightDelta: number,
): string {
  const h = hex.replace(/^#/, '');
  if (h.length !== 6) return hex;
  const n = parseInt(h, 16);
  if (Number.isNaN(n)) return hex;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  let [hue, sat, light] = rgbToHsl(r, g, b);
  hue += hueDeg;
  sat = clamp(sat * satMult, 0.12, 1);
  light = clamp(light + lightDelta, 0.08, 0.92);
  const [nr, ng, nb] = hslToRgb(hue, sat, light);
  return rgbToHex(nr, ng, nb);
}

export function deriveTemplatePalette(accentHex: string, designSeed: number): TemplatePalette {
  const base = accentHex.trim().startsWith('#') ? accentHex.trim() : `#${accentHex.trim()}`;
  const rng = makeTemplateRng(designSeed);
  const paletteSpin = Math.floor(rng() * 8) * 45;
  const useComplement = rng() > 0.42;
  const primaryBase = useComplement ? shiftAccentHex(base, 150 + paletteSpin * 0.15, 1.05, 0) : base;
  const hueShift = (rng() - 0.5) * 140 + paletteSpin * 0.35;
  const hueShift2 = (rng() - 0.5) * 160 - paletteSpin * 0.25;
  const satMult = 0.55 + rng() * 0.85;
  const lightA = (rng() - 0.5) * 0.28;
  const lightB = (rng() - 0.5) * 0.32;
  const lightC = (rng() - 0.5) * 0.24;
  return {
    primary: shiftAccentHex(primaryBase, (rng() - 0.5) * 24, 0.95 + rng() * 0.2, (rng() - 0.5) * 0.08),
    secondary: shiftAccentHex(primaryBase, hueShift, satMult, lightA),
    tertiary: shiftAccentHex(primaryBase, hueShift2, satMult * 1.1, lightB),
    quaternary: shiftAccentHex(primaryBase, hueShift * 0.5 + 90, satMult * 0.9, lightC),
    gradAngleDeg: Math.floor(rng() * 24) * 15,
    useRadialBg: rng() > 0.38,
    artVariant: Math.floor(rng() * 18),
    decorTheme: Math.floor(rng() * 12),
    textZone: Math.floor(rng() * 8),
    textWidthFrac: 0.48 + rng() * 0.44,
    textYJitter: (rng() - 0.5) * 0.08,
    textStyleVariant: Math.floor(rng() * 4),
  };
}

/** Linear gradient vector from angle in degrees (SVG 0–1 coords). */
export function linearGradientVector(angleDeg: number): {
  x1: string;
  y1: string;
  x2: string;
  y2: string;
} {
  const rad = (angleDeg * Math.PI) / 180;
  const x2 = 0.5 + 0.5 * Math.sin(rad);
  const y2 = 0.5 + 0.5 * Math.cos(rad);
  const x1 = 1 - x2;
  const y1 = 1 - y2;
  return {
    x1: x1.toFixed(3),
    y1: y1.toFixed(3),
    x2: x2.toFixed(3),
    y2: y2.toFixed(3),
  };
}
