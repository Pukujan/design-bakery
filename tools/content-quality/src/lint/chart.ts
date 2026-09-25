import type { CompiledRules } from '../rules.js';
import type { ChartRule, Finding, Severity } from '../types.js';
import { inspectSvg, type SvgInfo, type SvgText } from './svg.js';
import { positionAt } from '../text.js';
import type { DocumentModel } from '../text.js';
import { maskDocument, buildDocument } from '../text.js';

export interface ChartLintInput {
  file: string;
  text: string;
  profile: string;
  rules: CompiledRules;
}

/**
 * `title_states_takeaway.must_match` is a deliberately short verb list. Real
 * sentences such as "No request format fixed Grok Build's failure" carry a verb
 * that the list misses, so the matcher accepts this wider fallback too.
 */
const TITLE_VERB_FALLBACK =
  /\b(?:fixed|fixes|shows?|showed|shown|hides?|hid|hidden|works?|worked|makes?|made|keeps?|kept|cuts?|cut|adds?|added|wins?|won|beats?|beat|loses?|lost|doubles?|halves?|triples?|saves?|saved|costs?|helps?|hurt|changes?|changed|moves?|moved|holds?|held|means?|meant|comes?|came|goes?|went|takes?|took|gives?|gave|needs?|needed|falls?|fell|rises?|rose|grows?|grew|stays?|stayed|remains?|remained|points?|stands?|sits?|runs?|ran|writes?|wrote|says?|said|finds?|found|tells?|told|leaves?|left|picks?|picked|ranks?|ranked|counts?|counted|hits?|misses|spends?|spent|splits?|split|tracks?|tracked|looks?|dropped)\b/i;

export function lintChart(input: ChartLintInput): Finding[] {
  return input.file.toLowerCase().endsWith('.svg')
    ? lintSvgChart(input)
    : lintChartData(input);
}

function rule(input: ChartLintInput, id: string): ChartRule | undefined {
  return input.rules.chartRules.get(id);
}

/* ------------------------------------------------------------------ */
/* SVG                                                                 */
/* ------------------------------------------------------------------ */

interface SvgContext {
  input: ChartLintInput;
  svg: SvgInfo;
  model: DocumentModel;
  raw: string;
}

function lintSvgChart(input: ChartLintInput): Finding[] {
  const svg = inspectSvg(input.text);
  const lines = input.text.split(/\r?\n/);
  const model = buildDocument(lines, maskDocument(lines));
  const ctx: SvgContext = { input, svg, model, raw: input.text };
  const findings: Finding[] = [];
  const push = makePush(input, model, (offset) => offset, findings);

  const title = svg.title?.text;
  const subtitles = svg.subtitle.map((text) => text.text);
  const allText = svg.texts;

  // title_states_takeaway
  const titleRule = rule(input, 'title_states_takeaway');
  if (titleRule) {
    if (!title) {
      push(svg.title?.offset ?? 0, 'chart:title_states_takeaway', 'error', 'chart',
        'Chart has no title; every chart needs a takeaway title.', input.text.slice(0, 120),
        'Write the message as a plain sentence.', titleRule.sources);
    } else {
      const hasVerb = new RegExp(titleRule.must_match ?? '', 'i').test(title) || TITLE_VERB_FALLBACK.test(title);
      const isLabel = titleRule.must_not_match ? new RegExp(titleRule.must_not_match, 'i').test(title) : false;
      if (!hasVerb) {
        push(svg.title?.offset ?? 0, 'chart:title_states_takeaway', 'error', 'chart',
          `Chart title "${title}" has no verb; it reads as a label, not a takeaway.`,
          title, titleRule.check, titleRule.sources);
      }
      if (isLabel) {
        push(svg.title?.offset ?? 0, 'chart:title_states_takeaway', 'error', 'chart',
          `Chart title "${title}" names a variable instead of stating the takeaway.`,
          title, titleRule.check, titleRule.sources);
      }
    }
  }

  // no_colon_title
  const colonRule = rule(input, 'no_colon_title');
  if (colonRule && title && colonRule.must_not_match && new RegExp(colonRule.must_not_match).test(title)) {
    push(svg.title?.offset ?? 0, 'chart:no_colon_title', colonRule.severity, 'chart',
      `Chart title uses a colon reveal: "${title}".`, title, 'Write one plain sentence.', colonRule.sources);
  }

  // no_internal_ids_visible
  const idRule = rule(input, 'no_internal_ids_visible');
  if (idRule?.must_not_match) {
    const regex = new RegExp(idRule.must_not_match, 'g');
    for (const text of allText) {
      for (const match of text.text.matchAll(regex)) {
        push(text.offset, 'chart:no_internal_ids_visible', idRule.severity, 'chart',
          `Chart shows an internal id, path or version tag: "${match[0]}".`, text.text,
          'Describe the thing in plain words; keep ids in the methods section.', idRule.sources, match[0]);
      }
    }
  }

  // no_stats_jargon_in_title_subtitle
  const jargonRule = rule(input, 'no_stats_jargon_in_title_subtitle');
  if (jargonRule?.must_not_match) {
    const regex = new RegExp(jargonRule.must_not_match, 'g');
    const candidates = [...(svg.title ? [svg.title] : []), ...svg.subtitle];
    for (const text of candidates) {
      for (const match of text.text.matchAll(regex)) {
        push(text.offset, 'chart:no_stats_jargon_in_title_subtitle', jargonRule.severity, 'chart',
          `Statistics jargon in a chart title or subtitle: "${match[0]}".`, text.text,
          'Move it to the methods section and say it in words here.', jargonRule.sources, match[0]);
      }
    }
  }

  // max_series
  const seriesRule = rule(input, 'max_series');
  if (seriesRule && svg.colors.length > (seriesRule.max ?? 4)) {
    push(0, 'chart:max_series', seriesRule.severity, 'chart',
      `Chart uses ${svg.colors.length} data colours (${svg.colors.join(', ')}); the limit is ${seriesRule.max}.`,
      input.text.slice(0, 120), 'Use at most 3 colours plus grey, and one highlight colour.', seriesRule.sources);
  }

  // max_rows
  const rowsRule = rule(input, 'max_rows');
  const rowCount = countRows(svg);
  if (rowsRule && rowCount > (rowsRule.max ?? 15)) {
    push(0, 'chart:max_rows', rowsRule.severity, 'chart',
      `Chart has about ${rowCount} rows; the limit for a main-text chart is ${rowsRule.max}.`,
      input.text.slice(0, 120), 'Show the top rows and put the full list in a table.', rowsRule.sources);
  }

  // direct_labels_no_legend
  const legendRule = rule(input, 'direct_labels_no_legend');
  if (legendRule && svg.legend) {
    push(0, 'chart:direct_labels_no_legend', legendRule.severity, 'chart',
      'Chart has a separate legend; label the data directly instead.',
      input.text.slice(0, 120), 'Put names beside the bars and values at the bar ends.', legendRule.sources);
  }

  // forbidden_chart_types
  const typeRule = rule(input, 'forbidden_chart_types');
  if (typeRule) {
    const detected = detectForbiddenType(svg);
    for (const kind of detected) {
      push(0, 'chart:forbidden_chart_types', typeRule.severity, 'chart',
        `Chart looks like a ${kind}; the guide keeps these out of the main text.`,
        input.text.slice(0, 120), 'Use an ordered bar chart, or a 100% stacked bar for shares.', typeRule.sources);
    }
  }

  // reference_line_labelled_in_words
  const refRule = rule(input, 'reference_line_labelled_in_words');
  if (refRule) {
    for (const reference of svg.referenceLines) {
      if (!reference.label) continue;
      const words = reference.label.text.trim().split(/\s+/).filter(Boolean).length;
      if (words < (refRule.min_words ?? 4)) {
        push(reference.label.offset, 'chart:reference_line_labelled_in_words', refRule.severity, 'chart',
          `Reference line is labelled "${reference.label.text}"; give it a sentence of at least ${refRule.min_words} words.`,
          reference.label.text, 'Say what the line means, e.g. "Always giving the same answer scores 50.3%".', refRule.sources);
      }
    }
  }

  // annotation_count
  const annotationRule = rule(input, 'annotation_count');
  const annotations = svg.texts.filter((text) => text.role === 'annotation');
  if (annotationRule && annotations.length > 0) {
    const max = annotationRule.max ?? 3;
    if (annotations.length > max) {
      push(annotations[max]?.offset ?? 0, 'chart:annotation_count', annotationRule.severity, 'chart',
        `Chart has ${annotations.length} annotations; the guide asks for 1 to ${max}.`,
        annotations.map((text) => text.text).join(' | '), 'Keep the 1 to 3 things you want people to see.', annotationRule.sources);
    }
  }

  // no_rotated_text
  const rotateRule = rule(input, 'no_rotated_text');
  if (rotateRule) {
    for (const text of svg.rotatedText) {
      push(text.offset, 'chart:no_rotated_text', rotateRule.severity, 'chart',
        `Chart rotates the text "${text.text}".`, text.text, 'Shorten the label instead of rotating it.', rotateRule.sources);
    }
  }

  // source_line_usable
  const sourceRule = rule(input, 'source_line_usable');
  if (sourceRule && svg.footer) {
    const footer = svg.footer.text;
    if (!/^Source:\s/i.test(footer)) {
      push(svg.footer.offset, 'chart:source_line_usable', sourceRule.severity, 'chart',
        `Chart footer is "${footer}"; it should start with "Source:".`, footer,
        'Name a dataset a reader can find, with a link.', sourceRule.sources);
    } else if (/\b[\w./-]+\.(?:py|ipynb|json|csv|ts|js)\b|scripts\//.test(footer)) {
      push(svg.footer.offset, 'chart:source_line_usable', sourceRule.severity, 'chart',
        `Chart footer names a script instead of a dataset: "${footer}".`, footer,
        'Link the data, not the script.', sourceRule.sources);
    }
  }

  // number_format
  const numberRule = rule(input, 'number_format');
  if (numberRule?.must_not_match) {
    const regex = new RegExp(numberRule.must_not_match, 'g');
    for (const text of allText) {
      for (const match of text.text.matchAll(regex)) {
        push(text.offset, 'chart:number_format', numberRule.severity, 'chart',
          `Label "${match[0]}" has more than 1 decimal place.`, text.text,
          'Round labels to at most 1 decimal place.', numberRule.sources, match[0]);
      }
    }
  }

  void subtitles;
  return findings;
}

function countRows(svg: SvgInfo): number {
  if (svg.marks.length === 0) return svg.circles.length;
  const rows = new Set<number>();
  for (const mark of svg.marks) rows.add(Math.round(mark.y));
  return rows.size;
}

function detectForbiddenType(svg: SvgInfo): string[] {
  const detected: string[] = [];
  const rows = new Map<number, Set<number>>();
  for (const mark of svg.marks) {
    const key = Math.round(mark.y);
    const set = rows.get(key) ?? new Set<number>();
    set.add(mark.series);
    rows.set(key, set);
  }
  const pairedRows = [...rows.values()].filter((series) => series.size >= 2).length;
  const horizontalConnectors = svg.connectors.filter((line) => Math.abs(line.y1 - line.y2) < 2).length;
  const pairedCircles = svg.circles.length > 0 && svg.circles.length % 2 === 0 && horizontalConnectors > 0;

  if (pairedRows > 0 && (horizontalConnectors > 0 || svg.markerSeries >= 2 || svg.hollowTell)) {
    detected.push('dumbbell or paired-dot chart');
  } else if (pairedCircles) {
    detected.push('dumbbell or paired-dot chart');
  } else if (svg.hollowTell && svg.circles.length >= 2) {
    detected.push('hollow-versus-filled dot chart');
  }

  if (svg.intervalTell && !detected.includes('dumbbell or paired-dot chart')) {
    detected.push('error-bar, whisker or dot-interval chart');
  }
  return detected;
}

/* ------------------------------------------------------------------ */
/* *.data.json                                                         */
/* ------------------------------------------------------------------ */

interface ChartData {
  title?: string;
  subtitle?: string;
  footer?: string;
  source?: string;
  type?: string;
  relationship?: string;
  legend?: boolean;
  unit?: string;
  rows?: unknown[];
  series?: unknown[];
  annotations?: unknown[];
  baseline?: { label?: string; value?: number };
  blind_baseline?: unknown;
  domain?: unknown;
  y_domain?: unknown;
  axis?: unknown;
}

function lintChartData(input: ChartLintInput): Finding[] {
  let data: ChartData;
  try {
    data = JSON.parse(input.text) as ChartData;
  } catch (error) {
    return [{
      file: input.file,
      line: 1,
      column: 1,
      ruleId: 'chart:invalid_json',
      severity: 'error',
      category: 'chart',
      message: `Chart data file is not valid JSON (${String(error)}).`,
      excerpt: input.text.slice(0, 120),
      profile: input.profile,
    }];
  }

  const lines = input.text.split(/\r?\n/);
  const model = buildDocument(lines, maskDocument(lines));
  const findings: Finding[] = [];
  const locate = (value: string | undefined): number => {
    if (!value) return 0;
    const needle = JSON.stringify(value).slice(1, -1);
    const index = input.text.indexOf(needle);
    return index >= 0 ? index : 0;
  };
  const push = makePush(input, model, locate, findings);

  const title = data.title;
  const subtitles = [data.subtitle].filter((value): value is string => Boolean(value));
  const footer = data.footer ?? data.source;

  const titleRule = rule(input, 'title_states_takeaway');
  if (titleRule) {
    if (!title) {
      push(0, 'chart:title_states_takeaway', 'error', 'chart',
        'Chart data has no "title"; every chart needs a takeaway title.', input.text.slice(0, 120),
        'Write the message as a plain sentence.', titleRule.sources);
    } else {
      const hasVerb = new RegExp(titleRule.must_match ?? '', 'i').test(title) || TITLE_VERB_FALLBACK.test(title);
      if (!hasVerb) {
        push(locate(title), 'chart:title_states_takeaway', 'error', 'chart',
          `Chart title "${title}" has no verb; it reads as a label, not a takeaway.`,
          title, titleRule.check, titleRule.sources);
      }
      if (titleRule.must_not_match && new RegExp(titleRule.must_not_match, 'i').test(title)) {
        push(locate(title), 'chart:title_states_takeaway', 'error', 'chart',
          `Chart title "${title}" names a variable instead of stating the takeaway.`,
          title, titleRule.check, titleRule.sources);
      }
    }
  }

  const colonRule = rule(input, 'no_colon_title');
  if (colonRule?.must_not_match && title && new RegExp(colonRule.must_not_match).test(title)) {
    push(locate(title), 'chart:no_colon_title', colonRule.severity, 'chart',
      `Chart title uses a colon reveal: "${title}".`, title, 'Write one plain sentence.', colonRule.sources);
  }

  const idRule = rule(input, 'no_internal_ids_visible');
  if (idRule?.must_not_match) {
    const regex = new RegExp(idRule.must_not_match, 'g');
    for (const value of stringFields(data)) {
      for (const match of value.text.matchAll(regex)) {
        push(locate(value.text), 'chart:no_internal_ids_visible', idRule.severity, 'chart',
          `Chart data shows an internal id, path or version tag: "${match[0]}".`, value.text,
          'Describe the thing in plain words; keep ids in the methods section.', idRule.sources, match[0]);
      }
    }
  }

  const jargonRule = rule(input, 'no_stats_jargon_in_title_subtitle');
  if (jargonRule?.must_not_match) {
    const regex = new RegExp(jargonRule.must_not_match, 'g');
    for (const value of [...(title ? [title] : []), ...subtitles]) {
      for (const match of value.matchAll(regex)) {
        push(locate(value), 'chart:no_stats_jargon_in_title_subtitle', jargonRule.severity, 'chart',
          `Statistics jargon in a chart title or subtitle: "${match[0]}".`, value,
          'Move it to the methods section and say it in words here.', jargonRule.sources, match[0]);
      }
    }
  }

  const seriesRule = rule(input, 'max_series');
  if (seriesRule && Array.isArray(data.series) && data.series.length > (seriesRule.max ?? 4)) {
    push(0, 'chart:max_series', seriesRule.severity, 'chart',
      `Chart data declares ${data.series.length} series; the limit is ${seriesRule.max}.`,
      JSON.stringify(data.series).slice(0, 120), 'Use at most 3 colours plus grey.', seriesRule.sources);
  }

  const rowsRule = rule(input, 'max_rows');
  if (rowsRule && Array.isArray(data.rows) && data.rows.length > (rowsRule.max ?? 15)) {
    push(0, 'chart:max_rows', rowsRule.severity, 'chart',
      `Chart data has ${data.rows.length} rows; the limit for a main-text chart is ${rowsRule.max}.`,
      `${data.rows.length} rows`, 'Show the top rows and put the full list in a table.', rowsRule.sources);
  }

  const legendRule = rule(input, 'direct_labels_no_legend');
  if (legendRule && data.legend === true) {
    push(0, 'chart:direct_labels_no_legend', legendRule.severity, 'chart',
      'Chart data sets "legend": true; label the data directly instead.',
      '"legend": true', 'Put names beside the bars and values at the bar ends.', legendRule.sources);
  }

  const typeRule = rule(input, 'forbidden_chart_types');
  if (typeRule && data.type) {
    const forbidden = typeRule.forbidden ?? [];
    const normalised = data.type.toLowerCase().replace(/[\s-]/g, '_');
    const hit = forbidden.find((entry) => entry !== 'pie>5' && normalised.includes(entry.replace(/[\s-]/g, '_')));
    if (hit) {
      push(locate(data.type), 'chart:forbidden_chart_types', typeRule.severity, 'chart',
        `Chart type "${data.type}" is not allowed in the main text.`, data.type,
        'Use an ordered bar chart, or a 100% stacked bar for shares.', typeRule.sources);
    }
  }

  const relationshipRule = rule(input, 'chart_type_matches_relationship');
  if (relationshipRule && data.relationship && data.type) {
    const allowed = relationshipRule.allowed?.[data.relationship];
    if (allowed && !allowed.includes(data.type)) {
      push(locate(data.type), 'chart:chart_type_matches_relationship', relationshipRule.severity, 'chart',
        `Relationship "${data.relationship}" is best shown as ${allowed.join(' or ')}, not "${data.type}".`,
        data.type, 'Pick the type from the relationship.', relationshipRule.sources);
    }
  }

  const sortedRule = rule(input, 'bars_sorted');
  if (sortedRule && data.relationship === 'ranking' && Array.isArray(data.rows)) {
    const values = data.rows
      .map((row) => (typeof row === 'object' && row !== null ? (row as { value?: unknown }).value : undefined))
      .filter((value): value is number => typeof value === 'number');
    if (values.length > 1) {
      const descending = values.every((value, index) => index === 0 || value <= (values[index - 1] ?? value));
      if (!descending) {
        push(0, 'chart:bars_sorted', sortedRule.severity, 'chart',
          'Ranking rows are not sorted by value (largest first).', `${values.length} rows`,
          'Sort the bars by the number that matters.', sortedRule.sources);
      }
    }
  }

  const zeroRule = rule(input, 'bars_start_at_zero');
  if (zeroRule) {
    const domain = readDomain(data);
    if (domain && domain[0] !== 0) {
      push(0, 'chart:bars_start_at_zero', zeroRule.severity, 'chart',
        `Bar axis starts at ${domain[0]}, not 0.`, JSON.stringify(domain),
        'Start bar axes at zero and never break them.', zeroRule.sources);
    }
  }

  const annotationRule = rule(input, 'annotation_count');
  if (annotationRule && Array.isArray(data.annotations)) {
    const max = annotationRule.max ?? 3;
    const min = annotationRule.min ?? 1;
    if (data.annotations.length > max) {
      push(0, 'chart:annotation_count', annotationRule.severity, 'chart',
        `Chart has ${data.annotations.length} annotations; the guide asks for ${min} to ${max}.`,
        JSON.stringify(data.annotations).slice(0, 120), 'Keep the 1 to 3 things you want people to see.', annotationRule.sources);
    }
  }

  const numberRule = rule(input, 'number_format');
  if (numberRule?.must_not_match) {
    const regex = new RegExp(numberRule.must_not_match, 'g');
    for (const value of stringFields(data)) {
      for (const match of value.text.matchAll(regex)) {
        push(locate(value.text), 'chart:number_format', numberRule.severity, 'chart',
          `Label "${match[0]}" has more than 1 decimal place.`, value.text,
          'Round labels to at most 1 decimal place.', numberRule.sources, match[0]);
      }
    }
  }

  void footer;
  return findings;
}

function readDomain(data: ChartData): [number, number] | null {
  for (const candidate of [data.y_domain, data.domain, data.axis]) {
    if (Array.isArray(candidate) && candidate.length >= 2) {
      const [min, max] = candidate;
      if (typeof min === 'number' && typeof max === 'number') return [min, max];
    }
    if (typeof candidate === 'object' && candidate !== null) {
      const domain = (candidate as { domain?: unknown }).domain;
      if (Array.isArray(domain) && typeof domain[0] === 'number' && typeof domain[1] === 'number') {
        return [domain[0], domain[1]];
      }
    }
  }
  return null;
}

/** Text-bearing fields of a chart data file (numbers are values, not labels). */
function stringFields(data: ChartData): { text: string }[] {
  const out: { text: string }[] = [];
  const add = (value: unknown): void => {
    if (typeof value === 'string') out.push({ text: value });
  };
  add(data.title);
  add(data.subtitle);
  add(data.footer);
  add(data.source);
  add(data.type);
  if (data.baseline) add(data.baseline.label);
  for (const row of data.rows ?? []) {
    if (typeof row === 'object' && row !== null) {
      for (const [key, value] of Object.entries(row as Record<string, unknown>)) {
        if (key === 'key') continue;
        add(value);
      }
    }
  }
  for (const series of data.series ?? []) {
    if (typeof series === 'object' && series !== null) {
      const record = series as Record<string, unknown>;
      add(record.label);
      add(record.title);
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Shared helpers                                                      */
/* ------------------------------------------------------------------ */

function makePush(
  input: ChartLintInput,
  model: DocumentModel,
  locate: (value: string | undefined) => number,
  findings: Finding[],
): (
  offset: number,
  ruleId: string,
  severity: Severity,
  category: 'chart',
  message: string,
  excerpt: string,
  fix?: string,
  sources?: string[],
  matched?: string,
) => void {
  return (offset, ruleId, severity, category, message, excerpt, fix, sources, matched) => {
    const position = offset > 0 ? positionAt(model, offset) : { line: 1, column: 1 };
    const finding: Finding = {
      file: input.file,
      line: position.line,
      column: position.column,
      ruleId,
      severity,
      category,
      message,
      excerpt: excerpt.replace(/\s+/g, ' ').trim().slice(0, 160),
      profile: input.profile,
    };
    if (fix) finding.fix = fix;
    if (sources) finding.sources = sources;
    if (matched) finding.matched = matched;
    findings.push(finding);
    void locate;
  };
}

export type { SvgText };
