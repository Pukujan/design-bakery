#!/usr/bin/env node
/**
 * Find orphaned source files: modules under a scanned root that nothing in the
 * repository imports.
 *
 * Why this exists: `eslint`'s `no-unused-vars` only sees unused *locals* inside a
 * file, and `frontend/extras/**` is ignored by ESLint entirely, so a whole
 * unreferenced component tree is invisible to lint. This walks the import graph
 * from explicit entry points and reports anything it never reaches.
 *
 * It resolves relative specifiers and the `frontend/tsconfig.json` path aliases
 * (which the Vite config mirrors). Bare npm specifiers are treated as external.
 *
 * Usage:
 *   node scripts/find-orphans.mjs            # report; exit 0
 *   node scripts/find-orphans.mjs --strict   # exit 1 if any orphan is found
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const strict = process.argv.includes('--strict');

const CODE_EXT = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.mts', '.cts'];
const RESOLVE_EXT = [...CODE_EXT, '.json'];

/** Roots that are scanned for orphaned files, with their entry points. */
const ROOTS = [
  {
    dir: 'frontend/src',
    entries: ['frontend/src/main.tsx'],
  },
  {
    dir: 'frontend/extras',
    entries: [
      'frontend/extras/Create Presentation Case Study/src/app/App.tsx',
      'frontend/extras/invest-ai-case-study/src/app/App.tsx',
      'frontend/extras/oni_agent_interactive_page_svg_darkmode_src/app/App.tsx',
      'frontend/extras/oni_agent_interactive_page_svg_darkmode_v4_src/app/App.tsx',
    ],
  },
  {
    dir: 'backend/src',
    entries: ['backend/src/server.ts'],
  },
  {
    dir: 'backend/services/src',
    entries: ['backend/services/src/blog/publishKit/handler.ts'],
  },
  {
    dir: 'packages',
    entries: [],
  },
];

/** Vite/tsconfig aliases that point inside a scanned root. */
function loadAliases() {
  const tsconfigPath = path.join(repoRoot, 'frontend', 'tsconfig.json');
  const raw = fs.readFileSync(tsconfigPath, 'utf8').replace(/\/\/.*$/gm, '');
  const paths = JSON.parse(raw).compilerOptions.paths ?? {};
  const aliases = [];
  for (const [key, targets] of Object.entries(paths)) {
    const target = Array.isArray(targets) ? targets[0] : targets;
    // `@/*` -> `./src/app/*`; resolve relative to frontend/.
    const prefix = key.replace(/\*$/, '');
    const mapped = path.join('frontend', target.replace(/\*$/, ''));
    aliases.push({ prefix, mapped });
  }
  // Workspace package alias declared only in vite.config.ts.
  aliases.push({
    prefix: '@design-bakery/cover-studio-kit/',
    mapped: 'packages/cover-studio-kit/src/',
  });
  return aliases.sort((a, b) => b.prefix.length - a.prefix.length);
}

const ALIASES = loadAliases();

/** Repo-root files that are entry points but live outside any scanned root. */
const EXTRA_ENTRIES = ['middleware.ts'];

/** Paths that are never reported (archives, type declarations, build output). */
const IGNORE = [
  /(^|\/)(archive|archive-[^/]+)\//,
  /\.d\.ts$/,
  /(^|\/)(dist|lib|node_modules)\//,
];

/** Collect every string target from a package.json `exports` field. */
function flattenExports(exportsField) {
  if (!exportsField) return [];
  if (typeof exportsField === 'string') return [exportsField];
  if (Array.isArray(exportsField)) return exportsField.flatMap(flattenExports);
  if (typeof exportsField === 'object') return Object.values(exportsField).flatMap(flattenExports);
  return [];
}

/** Workspace-package entry points declared in their package.json. */
function packageEntries() {
  const out = [];
  const packagesDir = path.join(repoRoot, 'packages');
  if (!fs.existsSync(packagesDir)) return out;
  for (const entry of fs.readdirSync(packagesDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const pkgPath = path.join(packagesDir, entry.name, 'package.json');
    if (!fs.existsSync(pkgPath)) continue;
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const declared = [pkg.main, pkg.module, pkg.types, ...flattenExports(pkg.exports)].filter(
      Boolean,
    );
    for (const value of declared) {
      // `lib/index.js` -> `src/index.ts`
      const asSource = value
        .replace(/^\.\//, '')
        .replace(/^lib\//, 'src/')
        .replace(/\.(js|jsx|mjs|cjs|d\.ts|ts)$/, '.ts');
      const rel = `packages/${entry.name}/${asSource}`;
      if (fs.existsSync(path.join(repoRoot, rel))) out.push(rel);
    }
  }
  return out;
}

function walk(dir, out = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'lib') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (CODE_EXT.includes(path.extname(entry.name))) out.push(full);
  }
  return out;
}

function toRepoPath(abs) {
  return path.relative(repoRoot, abs).split(path.sep).join('/');
}

/** Resolve an import specifier from `importer` to a repo-relative file, or null. */
function resolveSpecifier(spec, importerAbs) {
  let base = null;
  if (spec.startsWith('.')) {
    base = path.resolve(path.dirname(importerAbs), spec);
  } else {
    const alias = ALIASES.find((a) => spec.startsWith(a.prefix));
    if (alias) base = path.join(repoRoot, alias.mapped + spec.slice(alias.prefix.length));
  }
  if (!base) return null;

  // NodeNext imports carry a `.js` extension while the source is `.ts`, and the
  // backend imports the compiled `services/lib/...` output. Try the exact path,
  // the extension-swapped source, and the `lib` -> `src` source tree.
  const stems = [base, base.replace(/\.(js|jsx|mjs|cjs|mts|cts)$/, '')];
  const candidates = [];
  for (const stem of stems) {
    candidates.push(stem);
    for (const ext of RESOLVE_EXT) candidates.push(stem + ext);
    for (const ext of RESOLVE_EXT) candidates.push(path.join(stem, 'index' + ext));
  }
  // `services/lib` -> `services/src`. Match on forward slashes so this works on
  // Windows, where path.join produces backslashes. The `src` variants are tried
  // first: the compiled `lib/` output may exist locally, and resolving to it
  // would hide the real source file from the graph.
  const preferred = [];
  for (const candidate of candidates) {
    const fwd = candidate.split(path.sep).join('/');
    if (fwd.includes('/services/lib/')) {
      preferred.push(
        fwd.replace('/services/lib/', '/services/src/').split('/').join(path.sep),
      );
    }
  }
  for (const candidate of [...preferred, ...candidates]) {
    try {
      if (fs.statSync(candidate).isFile()) return toRepoPath(candidate);
    } catch {
      /* not a file */
    }
  }
  return null;
}

const IMPORT_RE =
  /(?:^|[^\w$.])(?:import|export)\s[^;'"]*?from\s*['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)|require\s*\(\s*['"]([^'"]+)['"]\s*\)/gm;

function importsOf(absFile) {
  let src;
  try {
    src = fs.readFileSync(absFile, 'utf8');
  } catch {
    return [];
  }
  const specs = [];
  for (const match of src.matchAll(IMPORT_RE)) {
    const spec = match[1] ?? match[2] ?? match[3];
    if (spec) specs.push(spec);
  }
  return specs;
}

function main() {
  const scanned = new Set();
  const entries = [];
  for (const root of ROOTS) {
    const dirAbs = path.join(repoRoot, root.dir);
    if (!fs.existsSync(dirAbs)) continue;
    for (const file of walk(dirAbs)) scanned.add(toRepoPath(file));
    for (const entry of root.entries) {
      if (fs.existsSync(path.join(repoRoot, entry))) entries.push(entry);
    }
  }
  // Root CLI scripts are entry points (invoked from package.json).
  for (const file of walk(path.join(repoRoot, 'scripts'))) {
    const rel = toRepoPath(file);
    if (rel.startsWith('scripts/')) entries.push(rel);
  }
  // Repo-root entry files (Vercel Edge middleware) and workspace-package mains.
  for (const rel of [...EXTRA_ENTRIES, ...packageEntries()]) {
    if (fs.existsSync(path.join(repoRoot, rel))) entries.push(rel);
  }
  // Test files are entry points too.
  for (const rel of scanned) {
    if (/\.(test|spec)\.[cm]?[jt]sx?$/.test(rel)) entries.push(rel);
  }

  const reached = new Set();
  const queue = [...entries];
  while (queue.length) {
    const rel = queue.pop();
    if (reached.has(rel)) continue;
    reached.add(rel);
    for (const spec of importsOf(path.join(repoRoot, rel))) {
      const resolved = resolveSpecifier(spec, path.join(repoRoot, rel));
      if (resolved && !reached.has(resolved)) queue.push(resolved);
    }
  }

  const orphans = [...scanned]
    .filter((rel) => !reached.has(rel))
    .filter((rel) => !IGNORE.some((re) => re.test(rel)))
    .sort();
  console.log(`Scanned ${scanned.size} files; ${reached.size} reachable from ${entries.length} entries.`);
  if (orphans.length === 0) {
    console.log('No orphaned files found.');
    return 0;
  }
  console.log(`\n${orphans.length} orphaned file(s) — nothing imports these:\n`);
  for (const rel of orphans) console.log(`  ${rel}`);
  return strict ? 1 : 0;
}

process.exit(main());
