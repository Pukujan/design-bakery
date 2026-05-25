import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);

const INTER_MARK = '.inter-fonts';
const SYSTEM_FONT = 'DejaVu Sans';

/** Prefer TTF for fontconfig/librsvg on Linux (WOFF support varies). */
const BUNDLED_TTF = 'inter-ttf/Inter-Variable.ttf';

const FONT_FILES: Array<[destName: string, packagePath: string]> = [
  ['inter-latin-400-normal.woff', '@fontsource/inter/files/inter-latin-400-normal.woff'],
  ['inter-latin-600-normal.woff', '@fontsource/inter/files/inter-latin-600-normal.woff'],
  ['inter-latin-700-normal.woff', '@fontsource/inter/files/inter-latin-700-normal.woff'],
];

export type PublishKitFontMode = 'system-dejavu' | 'bundled-inter';

let initialized = false;
let fontMode: PublishKitFontMode = 'bundled-inter';

function refreshFontCache(fontDir?: string): void {
  try {
    const args = fontDir ? ['-f', fontDir] : ['-f'];
    spawnSync('fc-cache', args, { stdio: 'ignore', timeout: 15_000 });
  } catch {
    // fc-cache optional locally when fontconfig CLI is not installed
  }
}

function systemHasDejaVu(): boolean {
  try {
    const result = spawnSync('fc-list', [':', 'family'], {
      encoding: 'utf8',
      timeout: 10_000,
    });
    if (result.status !== 0 && result.status !== null) return false;
    return (result.stdout ?? '').includes(SYSTEM_FONT);
  } catch {
    return false;
  }
}

function clearBundledFontconfigEnv(): void {
  delete process.env.FONTCONFIG_PATH;
  delete process.env.FONTCONFIG_FILE;
}

function ensureBundledInterFontconfig(): void {
  const moduleDir = dirname(fileURLToPath(import.meta.url));
  const fontDir = join(moduleDir, INTER_MARK);

  if (process.env.FONTCONFIG_PATH?.includes(INTER_MARK)) {
    fontMode = 'bundled-inter';
    initialized = true;
    return;
  }

  if (process.env.FONTCONFIG_PATH?.trim() && !process.env.FONTCONFIG_PATH.includes(INTER_MARK)) {
    console.warn(
      '[publish-kit:fonts] FONTCONFIG_PATH was preset without bundled Inter; replacing with publish-kit fonts',
      { previous: process.env.FONTCONFIG_PATH },
    );
  }

  mkdirSync(fontDir, { recursive: true });

  const bundledTtf = join(moduleDir, BUNDLED_TTF);
  const ttfDest = join(fontDir, 'Inter-Variable.ttf');
  if (existsSync(bundledTtf) && !existsSync(ttfDest)) {
    copyFileSync(bundledTtf, ttfDest);
  }

  for (const [destName, packagePath] of FONT_FILES) {
    const dest = join(fontDir, destName);
    if (existsSync(dest)) continue;
    copyFileSync(require.resolve(packagePath), dest);
  }

  const confPath = join(fontDir, 'fonts.conf');
  if (!existsSync(confPath)) {
    writeFileSync(
      confPath,
      `<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <dir>${fontDir}</dir>
  <cachedir>/tmp/design-bakery-fontconfig-cache</cachedir>
  <alias>
    <family>sans-serif</family>
    <prefer><family>Inter</family></prefer>
  </alias>
</fontconfig>
`,
    );
  }

  process.env.FONTCONFIG_PATH = fontDir;
  process.env.FONTCONFIG_FILE = confPath;
  refreshFontCache(fontDir);
  fontMode = 'bundled-inter';
  initialized = true;
}

function ensureSystemDejaVuFontconfig(): void {
  if (process.env.FONTCONFIG_PATH?.trim()) {
    console.warn(
      '[publish-kit:fonts] FONTCONFIG_PATH ignored — using system DejaVu Sans from nixpacks',
      { previous: process.env.FONTCONFIG_PATH },
    );
  }
  clearBundledFontconfigEnv();
  refreshFontCache();
  fontMode = 'system-dejavu';
  initialized = true;
  console.log(`[publish-kit:fonts] using system ${SYSTEM_FONT} (Railway/nixpacks)`);
}

/**
 * Register fonts before sharp/librsvg rasterizes SVG text.
 * Railway: DejaVu Sans via nixpacks `dejavu_fonts` (no bundled Inter).
 * Local macOS: bundled Inter fallback when DejaVu is not installed.
 */
export function ensurePublishKitFontconfig(): void {
  if (initialized) return;

  if (systemHasDejaVu()) {
    ensureSystemDejaVuFontconfig();
    return;
  }

  ensureBundledInterFontconfig();
}

export function getPublishKitFontMode(): PublishKitFontMode {
  ensurePublishKitFontconfig();
  return fontMode;
}

export function usesSystemPublishKitFonts(): boolean {
  return getPublishKitFontMode() === 'system-dejavu';
}

ensurePublishKitFontconfig();
