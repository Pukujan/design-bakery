import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);

const FONT_FILES: Array<[destName: string, packagePath: string]> = [
  ['inter-latin-400-normal.woff', '@fontsource/inter/files/inter-latin-400-normal.woff'],
  ['inter-latin-600-normal.woff', '@fontsource/inter/files/inter-latin-600-normal.woff'],
  ['inter-latin-700-normal.woff', '@fontsource/inter/files/inter-latin-700-normal.woff'],
];

let initialized = false;

/**
 * Register bundled Inter via fontconfig before sharp/librsvg rasterizes SVG text.
 * Embedded @font-face data URLs in SVG are ignored by librsvg — see sharp#2838.
 */
export function ensurePublishKitFontconfig(): void {
  if (initialized) return;
  initialized = true;

  if (process.env.FONTCONFIG_PATH?.trim()) return;

  const moduleDir = dirname(fileURLToPath(import.meta.url));
  const fontDir = join(moduleDir, '.inter-fonts');
  mkdirSync(fontDir, { recursive: true });

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
</fontconfig>
`,
    );
  }

  process.env.FONTCONFIG_PATH = fontDir;
  process.env.FONTCONFIG_FILE = confPath;
}

ensurePublishKitFontconfig();
