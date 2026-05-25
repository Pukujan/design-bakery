import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);

const INTER_MARK = '.inter-fonts';

/** Prefer TTF for fontconfig/librsvg on Linux (WOFF support varies). */
const BUNDLED_TTF = 'inter-ttf/Inter-Variable.ttf';

const FONT_FILES: Array<[destName: string, packagePath: string]> = [
  ['inter-latin-400-normal.woff', '@fontsource/inter/files/inter-latin-400-normal.woff'],
  ['inter-latin-600-normal.woff', '@fontsource/inter/files/inter-latin-600-normal.woff'],
  ['inter-latin-700-normal.woff', '@fontsource/inter/files/inter-latin-700-normal.woff'],
];

let initialized = false;

function refreshFontCache(fontDir: string): void {
  try {
    spawnSync('fc-cache', ['-f', fontDir], { stdio: 'ignore', timeout: 15_000 });
  } catch {
    // fc-cache optional locally when fontconfig CLI is not installed
  }
}

/**
 * Register bundled Inter via fontconfig before sharp/librsvg rasterizes SVG text.
 * Embedded @font-face data URLs in SVG are ignored by librsvg — see sharp#2838.
 */
export function ensurePublishKitFontconfig(): void {
  if (initialized) return;

  const moduleDir = dirname(fileURLToPath(import.meta.url));
  const fontDir = join(moduleDir, INTER_MARK);

  if (process.env.FONTCONFIG_PATH?.includes(INTER_MARK)) {
    initialized = true;
    return;
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
  initialized = true;
}

ensurePublishKitFontconfig();
