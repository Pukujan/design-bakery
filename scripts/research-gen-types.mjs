#!/usr/bin/env node
/**
 * research:gen-types — turn Eval Lab's published JSON Schema into TypeScript.
 *
 * `frontend/src/app/modules/research/chart/schema/research-chart-data.v1.schema.json`
 * is the contract for every dataset and chart file the site renders. It is
 * vendored by `research:sync-data` (verified against its sha256), and this
 * script compiles it into `chart/types.generated.ts` so the chart code is
 * type-checked against the real contract instead of a hand-copied guess that
 * drifts the moment upstream adds a field.
 *
 * It is a deliberately small compiler: it covers the draft 2020-12 subset that
 * schema actually uses (`type`, `enum`, `const`, `$ref`, `oneOf`, `required`,
 * `properties`, `items`, `additionalProperties`, nullable `type` arrays).
 * Keywords that only affect validation, not shape — `pattern`, `format`,
 * `minItems`, `minLength`, `minimum`, `maxLength` — are ignored here; the
 * build-time validator and `research:sync-data` are what enforce them.
 *
 * Usage:
 *   node scripts/research-gen-types.mjs           # write the file
 *   node scripts/research-gen-types.mjs --check   # fail if it is out of date
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCHEMA_PATH = path.join(
  ROOT,
  'frontend/src/app/modules/research/chart/schema/research-chart-data.v1.schema.json',
);
const OUTPUT_PATH = path.join(
  ROOT,
  'frontend/src/app/modules/research/chart/types.generated.ts',
);

const checkOnly = process.argv.includes('--check');

/** `nullableNumber` → `NullableNumber`, `sha256` → `Sha256`. */
function typeName(key) {
  const pascal = key
    .replace(/[^A-Za-z0-9]+(.)?/g, (_, chr) => (chr ? chr.toUpperCase() : ''))
    .replace(/^[a-z]/, (chr) => chr.toUpperCase());
  return /^[0-9]/.test(pascal) ? `T${pascal}` : pascal;
}

function isIdentifier(key) {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key);
}

function propertyKey(key) {
  return isIdentifier(key) ? key : `'${key.replace(/'/g, "\\'")}'`;
}

function literal(value) {
  if (typeof value === 'string') return `'${value.replace(/'/g, "\\'")}'`;
  return JSON.stringify(value);
}

/** JSON Schema `type` may be a string or an array that includes "null". */
function typeList(schema) {
  if (typeof schema.type === 'string') return [schema.type];
  if (Array.isArray(schema.type)) return schema.type;
  return [];
}

/** A `Record<...>` for `additionalProperties` that carry a shape. */
function additionalPropertiesType(value) {
  if (!value || value === true) return 'unknown';
  const scalar = { string: 'string', integer: 'number', number: 'number', boolean: 'boolean' };
  if (typeof value.type === 'string' && scalar[value.type]) return scalar[value.type];
  return inlineType(value);
}

/** Render a subschema as a TypeScript type expression. */
function inlineType(schema) {
  if (!schema || typeof schema !== 'object') return 'unknown';

  if (schema.$ref) return typeName(schema.$ref.split('/').pop());

  if (schema.const !== undefined) return literal(schema.const);

  if (Array.isArray(schema.enum)) {
    return schema.enum.map(literal).join(' | ');
  }

  if (Array.isArray(schema.oneOf) || Array.isArray(schema.anyOf)) {
    const branches = (schema.oneOf ?? schema.anyOf).map(inlineType);
    return [...new Set(branches)].join(' | ');
  }

  const types = typeList(schema);
  const nullable = types.includes('null');
  const primary = types.filter((entry) => entry !== 'null');

  let base;
  if (primary.length === 0) {
    if (schema.properties || schema.additionalProperties !== undefined) base = inlineObject(schema);
    else base = 'unknown';
  } else if (primary.length > 1) {
    base = primary.map((entry) => inlineType({ ...schema, type: entry })).join(' | ');
  } else {
    switch (primary[0]) {
      case 'array': {
        const items = inlineType(schema.items ?? {});
        // Parenthesise unions so `(A | B)[]` does not silently become `A | B[]`.
        base = items.includes(' | ') ? `(${items})[]` : `${items}[]`;
        break;
      }
      case 'object':
        base = inlineObject(schema);
        break;
      case 'integer':
      case 'number':
        base = 'number';
        break;
      case 'string':
        base = 'string';
        break;
      case 'boolean':
        base = 'boolean';
        break;
      case 'null':
        base = 'null';
        break;
      default:
        base = 'unknown';
    }
  }

  return nullable ? `${base} | null` : base;
}

function inlineObject(schema) {
  const properties = schema.properties ?? {};
  const required = new Set(schema.required ?? []);
  const lines = Object.entries(properties).map(
    ([key, value]) => `${propertyKey(key)}${required.has(key) ? '' : '?'}: ${inlineType(value)};`,
  );

  const additional = schema.additionalProperties;
  if (additional && additional !== false) {
    lines.push(`[key: string]: ${additionalPropertiesType(additional)};`);
  }

  if (lines.length === 0) {
    return additional === false ? 'Record<string, never>' : 'Record<string, unknown>';
  }
  return `{ ${lines.join(' ')} }`;
}

/**
 * Shapes the schema leaves under-specified.
 *
 * Upstream declares `required` on several sub-objects without declaring their
 * `properties`, so the mechanical result is `Record<string, unknown>` and the
 * chart code would have to cast at every use. These overrides restate those
 * shapes as reviewed, literal TypeScript. They are the only hand-written types
 * in the output, they are checked by `tsc` like everything else, and if
 * upstream ever adds real `properties` the override should be deleted rather
 * than silently kept.
 *
 * Keyed by `$defs` name (whole type) or `$defsName.property` (one property).
 * `@envelope` is the root: the keys every file shares, which no `$def` repeats.
 */
const OVERRIDES = {
  '@envelope': `{
  '@context': Record<string, unknown>;
  id: string;
  type: string[];
  kind: 'dataset' | 'chart';
  schemaVersion: '1.0';
  title: string;
  description?: string;
  experimentId: string;
  provenance: Provenance;
}`,
  'dataset.levels': '{ key: string; label: string; description: string }[]',
  'dataset.aggregates':
    '{ key: string; metric: string; method: string; over: string; value: unknown }[]',
  'dataset.comparisons': `{
    left: string;
    right: string;
    view: 'all' | 'shared';
    n: number;
    leftOnlyCorrect: number;
    rightOnlyCorrect: number;
    pExact: number;
    pHolm: number;
  }[]`,
  'dataset.experiments': `{
    id: string;
    experimentId: string;
    directory: string;
    status: string;
    entities: string[];
  }[]`,
  'dataset.runs': `{
    entity: string;
    experiment: string;
    experimentDirectory: string;
    runPath: string;
    path: RepoPath;
    sha256: Sha256;
    mergeOrder: number;
  }[]`,
  'dataset.notes': `{
    definitions?: Record<string, string>;
    excluded?: Record<string, string>;
    notRun?: Record<string, string>;
  }`,
  'chart.data': `{
    rows: Record<string, unknown>[];
    title?: string;
    subtitle?: string;
    unit?: string;
    baseline?: number;
  }`,
};

/** Named `$defs` become exported interfaces; anonymous objects stay inline. */
function emitNamedType(key, schema) {
  const name = typeName(key);
  if (OVERRIDES[key]) {
    return { name, code: `export interface ${name} ${OVERRIDES[key]}` };
  }
  if (typeList(schema).includes('object') && schema.properties) {
    const required = new Set(schema.required ?? []);
    const lines = Object.entries(schema.properties).map(
      ([prop, value]) =>
        `  ${propertyKey(prop)}${required.has(prop) ? '' : '?'}: ${
          OVERRIDES[`${key}.${prop}`] ?? inlineType(value)
        };`,
    );
    const additional = schema.additionalProperties;
    if (additional && additional !== false) {
      lines.push(`  [key: string]: ${additionalPropertiesType(additional)};`);
    }
    return { name, code: `export interface ${name} {\n${lines.join('\n')}\n}` };
  }
  return { name, code: `export type ${name} = ${inlineType(schema)};` };
}

function generate(schema) {
  const defs = schema.$defs ?? {};
  const parts = [];

  for (const [key, value] of Object.entries(defs)) {
    parts.push(emitNamedType(key, value).code);
  }

  // The root is `oneOf: [dataset, chart]` plus the envelope every file shares
  // (`@context`, `id`, `type`, `schemaVersion`, `title`, `experimentId`,
  // `provenance`). Neither `$def` repeats the envelope, so intersect it in.
  const variants = (schema.oneOf ?? []).map((branch) => inlineType(branch));
  const envelope = 'ChartDataEnvelope';

  parts.push(`export interface ${envelope} ${OVERRIDES['@envelope']}`);
  parts.push(
    `/** A dataset (kind: "dataset") or a pre-rendered figure (kind: "chart") file. */\nexport type ResearchChartDataFile = ${variants
      .map((variant) => `(${variant} & ${envelope})`)
      .join(' | ')};`,
  );

  const header = `/**
 * GENERATED FILE — do not edit by hand.
 *
 * Source: frontend/src/app/modules/research/chart/schema/research-chart-data.v1.schema.json
 * (Eval Lab, schemas/research-chart-data.v1.schema.json, vendored by \`pnpm research:sync-data\`
 * and verified against the sha256 in \`paper/data/index.json\`).
 *
 * Regenerate with \`pnpm research:gen-types\`; CI fails when this file is stale.
 */
/* eslint-disable @typescript-eslint/no-empty-object-type */

`;

  return `${header}${parts.join('\n\n')}\n`;
}

async function main() {
  const schema = JSON.parse(await readFile(SCHEMA_PATH, 'utf8'));
  const output = generate(schema);

  if (checkOnly) {
    let current = null;
    try {
      current = await readFile(OUTPUT_PATH, 'utf8');
    } catch {
      // Missing counts as stale.
    }
    if (current !== output) {
      console.error(
        'research:gen-types — types.generated.ts is out of date; run `pnpm research:gen-types`.',
      );
      process.exitCode = 1;
      return;
    }
    console.log('research:gen-types — types.generated.ts is up to date');
    return;
  }

  await writeFile(OUTPUT_PATH, output);
  console.log(
    `research:gen-types — wrote ${path.relative(ROOT, OUTPUT_PATH).split(path.sep).join('/')} (${output.split('\n').length} lines)`,
  );
}

main().catch((error) => {
  console.error(`research:gen-types — ${error.message}`);
  process.exitCode = 1;
});
