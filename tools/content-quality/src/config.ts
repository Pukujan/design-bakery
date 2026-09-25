import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { matchAny, matchGlob } from './glob.js';
import type { TargetKind } from './types.js';

export interface ProfileSettings {
  /** Rule families to run on prose. */
  checks: ('words' | 'patterns' | 'readability' | 'jargon')[];
  /** Apply the chart rules to SVG and `*.data.json` targets. */
  chartChecks: boolean;
  /** Check that every figure in a document has a text description. */
  chartDescription: boolean;
  sentenceLength: boolean;
  paragraphLength: boolean;
  subjectVerbGap: boolean;
  passiveVoice: boolean;
  firstPerson: boolean;
  numbersPerParagraph: boolean;
  numbersPerParagraphMinWords: number;
  decimalPlaces: boolean;
  /** GUIDE: suspicious words are allowed at most this often per page. */
  suspiciousWordMaxPerPage: number;
  /** Rule ids to switch off for this profile. */
  disabledRules: string[];
}

export interface TargetRule {
  glob: string;
  profile: string;
}

export interface ContentQualityConfig {
  profiles: Record<string, Partial<ProfileSettings>>;
  targets: TargetRule[];
  exclude: string[];
}

export interface ResolvedTarget {
  /** Repo-relative path with forward slashes. */
  file: string;
  profile: string;
  settings: ProfileSettings;
  kind: TargetKind;
}

const FULL: ProfileSettings = {
  checks: ['words', 'patterns', 'readability', 'jargon'],
  chartChecks: false,
  chartDescription: false,
  sentenceLength: true,
  paragraphLength: true,
  subjectVerbGap: true,
  passiveVoice: true,
  firstPerson: true,
  numbersPerParagraph: true,
  numbersPerParagraphMinWords: 40,
  decimalPlaces: true,
  suspiciousWordMaxPerPage: 1,
  disabledRules: [],
};

/** Profiles tuned per content type; a config file may override any field. */
export const DEFAULT_PROFILES: Record<string, Partial<ProfileSettings>> = {
  // Research papers: the full guide, narrator required, every claim earned.
  paper: { ...FULL, chartDescription: true },
  // Blog posts: same writing rules, but a post may be written without "we".
  blog: { ...FULL, firstPerson: false, numbersPerParagraph: false },
  // Project / case-study pages: shorter, more scannable, no paper expectations.
  page: {
    ...FULL,
    firstPerson: false,
    numbersPerParagraph: false,
    subjectVerbGap: false,
    chartDescription: true,
  },
  // Chart files (SVG, *.data.json): only the chart rules apply.
  chart: {
    ...FULL,
    checks: [],
    chartChecks: true,
    sentenceLength: false,
    paragraphLength: false,
    subjectVerbGap: false,
    passiveVoice: false,
    firstPerson: false,
    numbersPerParagraph: false,
    decimalPlaces: false,
  },
};

export const DEFAULT_CONFIG: ContentQualityConfig = {
  profiles: DEFAULT_PROFILES,
  targets: [],
  exclude: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
};

export const CONFIG_FILENAME = 'content-quality.config.json';

export function resolveSettings(
  profile: string,
  config: ContentQualityConfig,
): ProfileSettings {
  const overrides = config.profiles[profile] ?? config.profiles[profile.toLowerCase()] ?? {};
  const merged = { ...FULL, ...overrides };
  merged.disabledRules = [...(overrides.disabledRules ?? [])];
  return merged;
}

export function loadConfig(path?: string): { config: ContentQualityConfig; path: string | null } {
  const candidate = path ?? CONFIG_FILENAME;
  const resolved = resolve(candidate);
  if (!existsSync(resolved)) {
    if (path) throw new Error(`Config file not found: ${resolved}`);
    return { config: DEFAULT_CONFIG, path: null };
  }
  const parsed = JSON.parse(readFileSync(resolved, 'utf8')) as Partial<ContentQualityConfig>;
  return {
    config: {
      profiles: { ...DEFAULT_PROFILES, ...(parsed.profiles ?? {}) },
      targets: parsed.targets ?? [],
      exclude: [...DEFAULT_CONFIG.exclude, ...(parsed.exclude ?? [])],
    },
    path: resolved,
  };
}

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'lib', 'coverage', '.next', 'build']);

/** Walk a directory tree, returning repo-relative POSIX paths. */
export function walkFiles(root: string, exclude: string[] = []): string[] {
  const out: string[] = [];
  const visit = (dir: string): void => {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = join(dir, entry.name);
      const rel = relative(root, full).split(sep).join('/');
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
        if (matchAny(exclude, `${rel}/**`)) continue;
        visit(full);
        continue;
      }
      if (!entry.isFile()) continue;
      if (matchAny(exclude, rel)) continue;
      out.push(rel);
    }
  };
  visit(root);
  return out.sort();
}

export function kindOf(file: string): TargetKind | null {
  const lower = file.toLowerCase();
  if (lower.endsWith('.svg')) return 'svg';
  if (lower.endsWith('.data.json')) return 'chart-data';
  if (lower.endsWith('.md') || lower.endsWith('.mdx')) return 'markdown';
  if (lower.endsWith('.html') || lower.endsWith('.htm')) return 'html';
  return null;
}

export function collectTargets(
  root: string,
  config: ContentQualityConfig,
  explicit: string[] = [],
  forcedProfile?: string,
): ResolvedTarget[] {
  const all = walkFiles(root, config.exclude);
  const targets: ResolvedTarget[] = [];
  const seen = new Set<string>();

  const add = (file: string, profile: string): void => {
    const kind = kindOf(file);
    if (!kind) return;
    const key = `${file}::${profile}`;
    if (seen.has(key)) return;
    seen.add(key);
    targets.push({ file, profile, settings: resolveSettings(profile, config), kind });
  };

  for (const target of config.targets) {
    for (const file of all) {
      if (matchGlob(target.glob, file)) add(file, target.profile);
    }
  }

  for (const file of explicit) {
    const rel = file.split(sep).join('/');
    const matched = config.targets.find((target) => matchGlob(target.glob, rel));
    add(rel, forcedProfile ?? matched?.profile ?? 'paper');
  }

  return targets;
}
