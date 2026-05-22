import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

let cachedDefs: string | null = null;

/** Embedded Inter WOFF for consistent PNG output in Functions / sharp. */
export function interFontFaceDefs(): string {
  if (cachedDefs) return cachedDefs;
  const w400Path = require.resolve('@fontsource/inter/files/inter-latin-400-normal.woff');
  const w700Path = require.resolve('@fontsource/inter/files/inter-latin-700-normal.woff');
  const w400 = readFileSync(w400Path);
  const w700 = readFileSync(w700Path);
  const b400 = w400.toString('base64');
  const b700 = w700.toString('base64');
  cachedDefs = `
  <style type="text/css">
    @font-face {
      font-family: 'Inter';
      font-style: normal;
      font-weight: 400;
      src: url(data:font/woff;base64,${b400}) format('woff');
    }
    @font-face {
      font-family: 'Inter';
      font-style: normal;
      font-weight: 700;
      src: url(data:font/woff;base64,${b700}) format('woff');
    }
  </style>`;
  return cachedDefs;
}

export const FONT_FAMILY = 'Inter, DejaVu Sans, Liberation Sans, sans-serif';
