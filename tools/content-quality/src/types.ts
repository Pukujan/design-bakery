/** Shared types for the content-quality linter. */

export type Severity = 'error' | 'warn' | 'info';

/** A lint finding, positioned in the original file. */
export interface Finding {
  /** Repo-relative path, using forward slashes. */
  file: string;
  /** 1-based line number in the original file. */
  line: number;
  /** 1-based column number in the original file. */
  column: number;
  /** Stable rule id, e.g. `word:delve`, `pattern:ing_tail_clause`, `readability:sentence_length`. */
  ruleId: string;
  severity: Severity;
  category: FindingCategory;
  /** What was found, in plain words. */
  message: string;
  /** The offending text, trimmed for display. */
  excerpt: string;
  /** Suggested fix, from rules.json when the rule provides one. */
  fix?: string;
  /** Source keys from rules.json (`kobak`, `wp_aisigns`, ...). */
  sources?: string[];
  /** Content profile the file was linted with. */
  profile: string;
  /** The exact matched text, used by the fixer to rebuild the prompt. */
  matched?: string;
}

export type FindingCategory =
  | 'word'
  | 'pattern'
  | 'readability'
  | 'jargon'
  | 'chart';

/** A file that was linted. */
export interface LintReport {
  file: string;
  profile: string;
  kind: TargetKind;
  findings: Finding[];
}

export type TargetKind = 'markdown' | 'html' | 'svg' | 'chart-data';

export interface SourceRef {
  title: string;
  url: string;
}

/** One entry of `rules.json > words`. */
export interface WordRule {
  term: string;
  match: 'word' | 'phrase' | 'term_outside_methods';
  severity: Severity;
  fix: string;
  sources: string[];
  note?: string;
}

/** One entry of `rules.json > patterns`. */
export interface PatternRule {
  id: string;
  description: string;
  regex: string;
  flags: string;
  scope: 'sentence' | 'paragraph' | 'title' | 'line' | 'document';
  severity: Severity;
  fix: string;
  sources: string[];
  max_per_section?: number;
  max_per_1000_words?: number;
}

export interface SentenceLengthRules {
  mean_min: number;
  mean_max: number;
  stdev_min: number;
  max: number;
  short_sentence_max_words: number;
  short_sentence_share_min: number;
  max_run_similar_length: number;
  similar_length_tolerance_words: number;
  sources: string[];
  why?: string;
}

export interface ParagraphRules {
  warn_above: number;
  error_above: number;
  sources: string[];
}

export interface SubjectVerbGapRules {
  warn_above: number;
  sources: string[];
  why?: string;
}

export interface PassiveVoiceRules {
  warn_above: number;
  regex: string;
  sources: string[];
}

export interface FirstPersonRules {
  regex: string;
  min_in_first_n_sentences: number;
  n: number;
  sources: string[];
  why?: string;
}

export interface NumbersPerParagraphRules {
  min: number;
  applies_to: string;
  sources: string[];
  why?: string;
}

export interface DecimalPlacesRules {
  value: number;
  sources: string[];
}

export interface ReadabilityRules {
  sentence_length_words: SentenceLengthRules;
  paragraph_words: ParagraphRules;
  subject_verb_gap_words: SubjectVerbGapRules;
  passive_voice_share: PassiveVoiceRules;
  first_person_required: FirstPersonRules;
  numbers_per_paragraph: NumbersPerParagraphRules;
  decimal_places_max: DecimalPlacesRules;
}

/** One entry of `rules.json > charts`. */
export interface ChartRule {
  id: string;
  check: string;
  target?: string;
  must_match?: string;
  must_not_match?: string;
  max?: number;
  min?: number;
  min_words?: number;
  max_per_1000_words?: number;
  forbidden?: string[];
  allowed?: Record<string, string[]>;
  severity: Severity;
  sources: string[];
}

export interface RulesFile {
  name: string;
  version: string;
  generated: string;
  notes: string;
  sources: Record<string, SourceRef>;
  words: WordRule[];
  patterns: PatternRule[];
  readability: ReadabilityRules;
  charts: ChartRule[];
}
