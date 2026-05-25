import { existsSync, readdirSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from './sharpWithFonts.js';
import { ensurePublishKitFontconfig, getPublishKitFontMode } from './fontconfigSetup.js';
import { FONT_FAMILY } from './fonts.js';

const LOG_PREFIX = '[publish-kit:fonts]';
const INTER_MARK = '.inter-fonts';
const BUNDLED_TTF = 'inter-ttf/Inter-Variable.ttf';

export type PublishKitFontDiagnostics = {
  context: string;
  platform: string;
  node: string;
  sharpVersion: string;
  fontMode: 'system-dejavu' | 'bundled-inter';
  svgFontFamily: string;
  fontconfigPath: string | null;
  fontconfigFile: string | null;
  fontDir: string;
  setupSkipped: boolean;
  fontFiles: Array<{ name: string; bytes: number }>;
  bundledTtfSourceExists: boolean;
  fcCache: { attempted: boolean; exitCode: number | null; error: string | null };
  fcMatch: Record<string, string | null>;
  svgProbe: {
    label: string;
    ok: boolean;
    pngBytes: number;
    error: string | null;
  } | null;
};

function moduleFontDir(): string {
  return join(dirname(fileURLToPath(import.meta.url)), INTER_MARK);
}

function listFontFiles(fontDir: string): PublishKitFontDiagnostics['fontFiles'] {
  if (!existsSync(fontDir)) return [];
  return readdirSync(fontDir)
    .filter((name) => !name.endsWith('.conf'))
    .map((name) => {
      const path = join(fontDir, name);
      return { name, bytes: statSync(path).size };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function runFcMatch(query: string): string | null {
  try {
    const env = { ...process.env };
    if (process.env.PUBLISH_KIT_FONT_DEBUG === 'true' || process.env.PUBLISH_KIT_FONT_DEBUG === '1') {
      env.FC_DEBUG = '1';
    }
    const result = spawnSync('fc-match', ['-s', query], {
      env,
      encoding: 'utf8',
      timeout: 10_000,
    });
    if ((result.error as NodeJS.ErrnoException | undefined)?.code === 'ENOENT') {
      return '(fc-match not installed — install fontconfig package on Linux/Railway)';
    }
    if (result.status !== 0 && result.status !== null) {
      const err = (result.stderr || result.stdout || '').trim();
      return err ? `fc-match failed: ${err}` : `fc-match exit ${result.status}`;
    }
    return (result.stdout || '').trim() || null;
  } catch (e) {
    return `fc-match unavailable: ${e instanceof Error ? e.message : String(e)}`;
  }
}

async function probeSvgRasterize(fontDir: string): Promise<PublishKitFontDiagnostics['svgProbe']> {
  const label = `${FONT_FAMILY} overlay probe`;
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="80">
  <rect width="400" height="80" fill="#1e293b"/>
  <text x="20" y="52" font-family="${FONT_FAMILY}" font-size="36" font-weight="700" fill="#ffffff">Readable ABC 123</text>
</svg>`;
  try {
    ensurePublishKitFontconfig();
    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    return { label, ok: true, pngBytes: png.length, error: null };
  } catch (e) {
    return {
      label,
      ok: false,
      pngBytes: 0,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export function collectPublishKitFontDiagnostics(context: string): PublishKitFontDiagnostics {
  ensurePublishKitFontconfig();

  const moduleDir = dirname(fileURLToPath(import.meta.url));
  const fontDir = process.env.FONTCONFIG_PATH?.trim() || moduleFontDir();
  const fontMode = getPublishKitFontMode();
  const setupSkipped = fontMode === 'system-dejavu';

  const fcCacheAttempted = existsSync(fontDir);
  let fcCacheExit: number | null = null;
  let fcCacheError: string | null = null;
  if (fcCacheAttempted) {
    try {
      const r = spawnSync('fc-cache', ['-f', fontDir], { stdio: 'pipe', timeout: 15_000 });
      if ((r.error as NodeJS.ErrnoException | undefined)?.code === 'ENOENT') {
        fcCacheError = 'fc-cache not installed (expected on macOS dev; Railway has fontconfig)';
        fcCacheExit = null;
      } else {
        fcCacheExit = r.status;
        if (r.status !== 0 && r.status !== null) {
          fcCacheError =
            (r.stderr?.toString() || r.stdout?.toString() || '').trim() || `exit ${r.status}`;
        }
      }
    } catch (e) {
      fcCacheError = e instanceof Error ? e.message : String(e);
    }
  }

  return {
    context,
    platform: process.platform,
    node: process.version,
    sharpVersion: sharp.versions.sharp ?? 'unknown',
    fontMode,
    svgFontFamily: FONT_FAMILY,
    fontconfigPath: process.env.FONTCONFIG_PATH ?? null,
    fontconfigFile: process.env.FONTCONFIG_FILE ?? null,
    fontDir,
    setupSkipped,
    fontFiles: listFontFiles(fontDir),
    bundledTtfSourceExists: existsSync(join(moduleDir, BUNDLED_TTF)),
    fcCache: {
      attempted: fcCacheAttempted,
      exitCode: fcCacheExit,
      error: fcCacheError,
    },
    fcMatch: {
      dejaVuSans: runFcMatch("'DejaVu Sans'"),
      dejaVuBold: runFcMatch("'DejaVu Sans':style=Bold"),
      interRegular: runFcMatch('Inter:style=Regular'),
      sansSerif: runFcMatch('sans-serif'),
    },
    svgProbe: null,
  };
}

export async function collectPublishKitFontDiagnosticsAsync(
  context: string,
  options?: { runSvgProbe?: boolean },
): Promise<PublishKitFontDiagnostics> {
  const base = collectPublishKitFontDiagnostics(context);
  if (options?.runSvgProbe !== false) {
    base.svgProbe = await probeSvgRasterize(base.fontDir);
  }
  return base;
}

export function logPublishKitFontDiagnostics(diag: PublishKitFontDiagnostics): void {
  console.log(`${LOG_PREFIX} ── ${diag.context} ──`);
  console.log(`${LOG_PREFIX} platform=${diag.platform} node=${diag.node} sharp=${diag.sharpVersion}`);
  console.log(`${LOG_PREFIX} fontMode=${diag.fontMode}`);
  console.log(`${LOG_PREFIX} svg font-family=${diag.svgFontFamily}`);
  console.log(`${LOG_PREFIX} FONTCONFIG_PATH=${diag.fontconfigPath ?? '(unset)'}`);
  console.log(`${LOG_PREFIX} FONTCONFIG_FILE=${diag.fontconfigFile ?? '(unset)'}`);
  console.log(`${LOG_PREFIX} fontDir=${diag.fontDir} setupSkipped=${diag.setupSkipped}`);
  console.log(`${LOG_PREFIX} bundled TTF source exists=${diag.bundledTtfSourceExists}`);
  if (diag.fontFiles.length === 0) {
    console.warn(`${LOG_PREFIX} WARNING: no font files in fontDir — text may render as tofu blocks`);
  } else {
    for (const f of diag.fontFiles) {
      console.log(`${LOG_PREFIX}   file ${f.name} (${f.bytes} bytes)`);
    }
  }
  console.log(
    `${LOG_PREFIX} fc-cache attempted=${diag.fcCache.attempted} exit=${diag.fcCache.exitCode} ${diag.fcCache.error ? `error=${diag.fcCache.error}` : 'ok'}`,
  );
  for (const [key, value] of Object.entries(diag.fcMatch)) {
    console.log(`${LOG_PREFIX} fc-match ${key} → ${value ?? '(no match)'}`);
    if (!value || value.startsWith('fc-match') || value.includes('not installed')) continue;
    if (diag.fontMode === 'system-dejavu' && key.startsWith('dejaVu') && !/dejavu/i.test(value)) {
      console.warn(`${LOG_PREFIX} WARNING: ${key} did not resolve to DejaVu — got: ${value}`);
    }
    if (diag.fontMode === 'bundled-inter' && key.startsWith('inter') && !/Inter/i.test(value)) {
      console.warn(`${LOG_PREFIX} WARNING: ${key} did not resolve to Inter — got: ${value}`);
    }
  }
  if (diag.svgProbe) {
    const p = diag.svgProbe;
    console.log(
      `${LOG_PREFIX} svg probe "${p.label}": ${p.ok ? `ok (${p.pngBytes} bytes PNG)` : `FAIL ${p.error}`}`,
    );
    if (p.ok && p.pngBytes < 500) {
      console.warn(`${LOG_PREFIX} WARNING: probe PNG unusually small — check font rendering`);
    }
  }
  console.log(`${LOG_PREFIX} tip: set PUBLISH_KIT_FONT_DEBUG=1 for fc-match FC_DEBUG=1 on Railway`);
}

export async function logPublishKitFontsForContext(
  context: string,
  options?: { runSvgProbe?: boolean },
): Promise<PublishKitFontDiagnostics> {
  const diag = await collectPublishKitFontDiagnosticsAsync(context, options);
  logPublishKitFontDiagnostics(diag);
  return diag;
}

function fontDebugVerbose(): boolean {
  const v = process.env.PUBLISH_KIT_FONT_DEBUG?.trim();
  return v === '1' || v === 'true';
}

/** Rasterize SVG → PNG; logs font context (verbose when PUBLISH_KIT_FONT_DEBUG=1). */
export async function rasterizePublishKitSvg(svg: string, label: string): Promise<Buffer> {
  if (process.env.PUBLISH_KIT_FONT_LOG !== '0') {
    if (fontDebugVerbose()) {
      await logPublishKitFontsForContext(`rasterize: ${label}`, { runSvgProbe: false });
    } else {
      console.log(
        `${LOG_PREFIX} rasterize ${label} → FONTCONFIG_PATH=${process.env.FONTCONFIG_PATH ?? '(unset)'} family=${FONT_FAMILY}`,
      );
    }
  }
  return sharp(Buffer.from(svg)).png().toBuffer();
}
