import { readFileSync } from 'node:fs';
import type { PatternRule, RulesFile, WordRule } from './types.js';

/** Where the bundled guide + rules live, relative to this package. */
export const PACKAGE_ROOT = new URL('../', import.meta.url);
export const DEFAULT_RULES_PATH = new URL('rules.json', PACKAGE_ROOT);
export const DEFAULT_GUIDE_PATH = new URL('GUIDE.md', PACKAGE_ROOT);

export interface CompiledWordRule extends WordRule {
  regex: RegExp;
  /** `phrase` and `term_outside_methods` rules need a boundary at both ends. */
  kind: WordRule['match'];
}

export interface CompiledPatternRule extends PatternRule {
  compiled: RegExp;
}

export interface CompiledRules {
  raw: RulesFile;
  words: CompiledWordRule[];
  patterns: CompiledPatternRule[];
  chartRules: Map<string, RulesFile['charts'][number]>;
  sources: RulesFile['sources'];
  guide: string;
}

export function readRulesFile(path: string | URL = DEFAULT_RULES_PATH): RulesFile {
  const text = readFileSync(path, 'utf8');
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new Error(`rules.json is not valid JSON (${String(error)})`);
  }
  return validateRules(parsed);
}

function validateRules(value: unknown): RulesFile {
  if (typeof value !== 'object' || value === null) {
    throw new Error('rules.json must be a JSON object');
  }
  const rules = value as Partial<RulesFile>;
  for (const key of ['words', 'patterns', 'charts'] as const) {
    if (!Array.isArray(rules[key])) {
      throw new Error(`rules.json: "${key}" must be an array`);
    }
  }
  if (typeof rules.readability !== 'object' || rules.readability === null) {
    throw new Error('rules.json: "readability" must be an object');
  }
  return rules as RulesFile;
}

/**
 * Escape a literal term for use inside a RegExp.
 */
export function escapeRegExp(term: string): string {
  return term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Build the matcher for one word rule.
 *
 * Plain terms are matched on word boundaries, so "not un" (a litotes rule) does
 * not fire inside "not understand", and "CI" does not fire inside "CIs".
 * Boundaries are only added on ends that are word characters — "EXP-" ends with
 * a hyphen, where a trailing `\b` would never match.
 */
export function compileWordRule(rule: WordRule): CompiledWordRule {
  const body = escapeRegExp(rule.term).replace(/\\?\s+/g, '\\s+');
  const startsWord = /^[A-Za-z0-9_]/.test(rule.term);
  const endsWord = /[A-Za-z0-9_]$/.test(rule.term);
  const pattern = `${startsWord ? '\\b' : ''}${body}${endsWord ? '\\b' : ''}`;
  return { ...rule, regex: new RegExp(pattern, 'gi'), kind: rule.match };
}

export function loadRules(path?: string | URL): CompiledRules {
  const rulesPath = path ?? DEFAULT_RULES_PATH;
  const raw = readRulesFile(rulesPath);
  const words = raw.words.map(compileWordRule);
  const patterns: CompiledPatternRule[] = raw.patterns.map((rule) => {
    let compiled: RegExp;
    try {
      compiled = new RegExp(rule.regex, rule.flags);
    } catch (error) {
      throw new Error(`rules.json: pattern "${rule.id}" has an invalid regex (${String(error)})`);
    }
    return { ...rule, compiled };
  });
  const chartRules = new Map(raw.charts.map((rule) => [rule.id, rule]));
  const guide = readFileSync(DEFAULT_GUIDE_PATH, 'utf8');
  return { raw, words, patterns, chartRules, sources: raw.sources, guide };
}

/** Headings whose content may use jargon and internal names (GUIDE rule 10). */
export const METHODS_SECTION_PATTERN =
  /\b(?:methods?|methodology|full data|data and methods|appendix|appendices|deep[\s-]?dive|deep dive|technical (?:details|notes|appendix)|footnotes?|reproducibility|statistical (?:notes|tests))\b/i;

export function isMethodsSection(heading: string): boolean {
  return METHODS_SECTION_PATTERN.test(heading);
}
