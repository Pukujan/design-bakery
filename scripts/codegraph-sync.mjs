#!/usr/bin/env node
/**
 * Run `codegraph sync` when this repo is initialized.
 * Used by `predev` and Cursor sessionStart hook — never blocks dev on failure.
 */
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const quiet = process.argv.includes('--quiet');
const configPath = resolve(root, '.codegraph/config.json');

if (!existsSync(configPath)) {
  if (!quiet) {
    console.log('[codegraph] skip sync — run `npm run codegraph:init` to enable');
  }
  process.exit(0);
}

const result = spawnSync('codegraph', ['sync'], {
  cwd: root,
  stdio: quiet ? 'pipe' : 'inherit',
  encoding: 'utf8',
});

if (result.status !== 0) {
  const hint = result.stderr?.trim().slice(0, 240) || result.stdout?.trim().slice(0, 240);
  console.warn(`[codegraph] sync failed (continuing)${hint ? `: ${hint}` : ''}`);
}

process.exit(0);
