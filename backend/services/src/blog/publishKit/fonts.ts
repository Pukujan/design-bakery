import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import {
  ensurePublishKitFontconfig,
  getPublishKitFontMode,
  usesSystemPublishKitFonts,
} from './fontconfigSetup.js';

const require = createRequire(import.meta.url);

let cachedDefs: string | null = null;

/** Ensure fontconfig is ready before any sharp SVG rasterization. */
export { ensurePublishKitFontconfig, getPublishKitFontMode, usesSystemPublishKitFonts };

/**
 * Embedded @font-face for Inkscape/browsers only — librsvg uses fontconfig, not these defs.
 * Empty on Railway when system DejaVu is used.
 */
export function interFontFaceDefs(): string {
  if (cachedDefs !== null) return cachedDefs;
  if (usesSystemPublishKitFonts()) {
    cachedDefs = '';
    return cachedDefs;
  }

  const weights = [
    ['400', '@fontsource/inter/files/inter-latin-400-normal.woff'],
    ['600', '@fontsource/inter/files/inter-latin-600-normal.woff'],
    ['700', '@fontsource/inter/files/inter-latin-700-normal.woff'],
  ] as const;
  const faces = weights
    .map(([weight, pkgPath]) => {
      const woff = readFileSync(require.resolve(pkgPath));
      const b64 = woff.toString('base64');
      return `    @font-face {
      font-family: 'Inter';
      font-style: normal;
      font-weight: ${weight};
      src: url(data:font/woff;base64,${b64}) format('woff');
    }`;
    })
    .join('\n');
  cachedDefs = `
  <style type="text/css">
${faces}
  </style>`;
  return cachedDefs;
}

/** Quoted family name — required when the name contains spaces (sharp#1220). */
export const FONT_FAMILY = usesSystemPublishKitFonts()
  ? "'DejaVu Sans', sans-serif"
  : "'Inter', sans-serif";
