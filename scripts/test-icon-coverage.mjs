import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Guards the icon allowlist in frontend/src/app/lib/iconResolver.ts. That file used
// to `import * as LucideIcons from 'lucide-react'`, pulling the whole icon set into
// the entry chunk. It now resolves only the names below. If content adds an icon
// name that is not listed, this fails so it is never a silent fallback to ExternalLink.

const root = new URL('..', import.meta.url);

async function readJson(pathname) {
  return JSON.parse(await readFile(new URL(pathname, root), 'utf8'));
}

function collectIconNames(value, out = new Set()) {
  if (Array.isArray(value)) {
    for (const v of value) collectIconNames(v, out);
  } else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (k === 'icon' && typeof v === 'string' && v.trim()) out.add(v.trim());
      else collectIconNames(v, out);
    }
  }
  return out;
}

const resolverSource = await readFile(
  new URL('./frontend/src/app/lib/iconResolver.ts', root),
  'utf8',
);
const block = resolverSource.match(/const ICONS[^{]*\{([\s\S]*?)\}/)?.[1] ?? '';
const allowed = new Set(
  block
    .split(/[\s,]+/)
    .filter((token) => /^[A-Z][A-Za-z0-9]*$/.test(token)),
);
assert.ok(allowed.size > 0, 'could not read the ICONS allowlist from iconResolver.ts');

// Behance resolves to a local brand icon, not a Lucide export.
const SPECIAL = new Set(['Behance']);
const normalize = (name) =>
  name === 'LinkedIn' ? 'Linkedin' : name === 'GitHub' ? 'Github' : name;

const sources = [
  './frontend/src/app/portfolios/endtoend-engineer/engineering/relevant-experience.json',
  './frontend/src/app/portfolios/endtoend-engineer/engineering/relevant-experience-rendered-list.json',
  './frontend/src/app/components/social-links.json',
];

const used = new Set();
for (const path of sources) collectIconNames(await readJson(path), used);

const missing = [...used].filter((name) => !SPECIAL.has(name) && !allowed.has(normalize(name)));
assert.deepEqual(
  missing,
  [],
  `content icon names missing from iconResolver's ICONS allowlist: ${missing.join(', ')}`,
);

console.log(`icon coverage ok — ${used.size} content icon names, ${allowed.size} allowlisted.`);
