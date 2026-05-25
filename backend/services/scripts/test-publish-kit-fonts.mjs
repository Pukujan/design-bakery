#!/usr/bin/env node
/**
 * Print publish-kit font diagnostics (same logs as Railway on visual generate).
 * Run from repo root: pnpm run test:publish-kit-fonts
 */
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const servicesDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const build = spawnSync('npm', ['run', 'build'], { cwd: servicesDir, stdio: 'inherit' });
if (build.status !== 0) process.exit(build.status ?? 1);

const { logPublishKitFontsForContext } = await import('../lib/blog/publishKit/fontDiagnostics.js');
await logPublishKitFontsForContext('cli test-publish-kit-fonts', { runSvgProbe: true });
console.log('\nDone. On Railway: Deploy → Generate visual → Logs tab → filter publish-kit:fonts');
