import type { CompiledRules } from '../rules.js';
import {
  buildDocument,
  countWords,
  maskDocument,
  positionAt,
  splitSentences,
  tokenize,
  type Block,
  type DocumentModel,
} from '../text.js';
import type { Finding, FindingCategory, Severity } from '../types.js';
import type { ProfileSettings } from '../config.js';

export interface MarkdownLintInput {
  file: string;
  text: string;
  profile: string;
  rules: CompiledRules;
  settings: ProfileSettings;
}

interface LineInfo {
  inMethods: boolean;
  sectionId: number;
}

/** Matcher-level supplements for rules whose regex is deliberately coarse. */
const WORD_EXCEPTIONS: Record<string, (ctx: { before: string; after: string; around: string; inMethods: boolean }) => boolean> = {
  // "key" is only a tell as an adjective ("key question"). An answer key is a thing.
  key: (ctx) => /(?:answer|answers|answer's)\s+$/i.test(ctx.before),
  // "significant" is correct English in a statistical test; GUIDE rule 18 allows that.
  significant: (ctx) => ctx.inMethods || /\bstatistic|p\s*[<=]|significan\w+\s+(?:at|level|difference)|test\b|0\.05/i.test(ctx.around),
  significantly: (ctx) => ctx.inMethods || /\bstatistic|p\s*[<=]|test\b|0\.05/i.test(ctx.around),
};

/**
 * Patterns that are allowed inside a Methods / Full data / Appendix section,
 * because that is exactly where the guide says to put them (GUIDE rule 10).
 */
const METHODS_EXEMPT_PATTERNS = new Set(['internal_ids']);

export function lintMarkdown(input: MarkdownLintInput): Finding[] {
  const { file, profile, rules, settings } = input;
  const lines = input.text.split(/\r?\n/);
  const maskedLines = maskDocument(lines);
  const model = buildDocument(lines, maskedLines);
  const lineInfo = buildLineInfo(model, lines.length);

  const findings: Finding[] = [];
  const push = (
    offset: number,
    ruleId: string,
    severity: Severity,
    category: FindingCategory,
    message: string,
    excerpt: string,
    fix?: string,
    sources?: string[],
    matched?: string,
  ): void => {
    const { line, column } = positionAt(model, offset);
    const finding: Finding = {
      file,
      line,
      column,
      ruleId,
      severity,
      category,
      message,
      excerpt: clean(excerpt),
      profile,
    };
    if (fix) finding.fix = fix;
    if (sources) finding.sources = sources;
    if (matched) finding.matched = matched;
    findings.push(finding);
  };

  if (settings.checks.includes('words')) {
    lintWords(model, lineInfo, rules, settings, push);
  }
  if (settings.checks.includes('patterns')) {
    lintPatterns(model, rules, push);
  }
  if (settings.checks.includes('readability')) {
    lintReadability(model, lineInfo, rules, settings, push);
  }
  if (settings.chartDescription) {
    lintFigureCaptions(model, push);
  }

  return escalateRepeats(dedupe(findings), settings.suspiciousWordMaxPerPage);
}

type Push = (
  offset: number,
  ruleId: string,
  severity: Severity,
  category: FindingCategory,
  message: string,
  excerpt: string,
  fix?: string,
  sources?: string[],
  matched?: string,
) => void;

function buildLineInfo(model: DocumentModel, lineCount: number): LineInfo[] {
  const info: LineInfo[] = Array.from({ length: lineCount }, () => ({ inMethods: false, sectionId: 0 }));
  for (const block of model.blocks) {
    for (let line = block.startLine; line <= block.endLine && line < lineCount; line += 1) {
      info[line] = { inMethods: block.inMethods, sectionId: block.sectionId };
    }
  }
  return info;
}

function clean(text: string): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, 160);
}

/* ------------------------------------------------------------------ */
/* Words                                                               */
/* ------------------------------------------------------------------ */

function lintWords(
  model: DocumentModel,
  lineInfo: LineInfo[],
  rules: CompiledRules,
  settings: ProfileSettings,
  push: Push,
): void {
  const suspiciousCounts = new Map<string, number>();

  for (const rule of rules.words) {
    for (let line = 0; line < model.maskedLines.length; line += 1) {
      const masked = model.maskedLines[line] ?? '';
      if (masked.trim() === '') continue;
      const info = lineInfo[line] ?? { inMethods: false, sectionId: 0 };
      if (rule.kind === 'term_outside_methods' && info.inMethods) continue;

      for (const match of masked.matchAll(rule.regex)) {
        const start = match.index ?? 0;
        const before = masked.slice(Math.max(0, start - 24), start);
        const after = masked.slice(start + match[0].length, start + match[0].length + 24);
        const around = masked.slice(Math.max(0, start - 70), start + match[0].length + 70);
        const exception = WORD_EXCEPTIONS[rule.term.toLowerCase()];
        if (exception && exception({ before, after, around, inMethods: info.inMethods })) continue;

        const isSuspicious = rule.severity === 'warn' && rule.kind !== 'term_outside_methods';
        if (isSuspicious) {
          const count = (suspiciousCounts.get(rule.term.toLowerCase()) ?? 0) + 1;
          suspiciousCounts.set(rule.term.toLowerCase(), count);
        }

        const category: FindingCategory = rule.kind === 'term_outside_methods' ? 'jargon' : 'word';
        const lineStart = model.lineStarts[line] ?? 0;
        const offset = lineStart + start;
        const kindLabel =
          rule.kind === 'term_outside_methods'
            ? 'Jargon outside a methods section'
            : rule.severity === 'error'
              ? 'Banned word or phrase'
              : 'Suspicious word or phrase';

        push(
          offset,
          `${category}:${rule.term}`,
          rule.severity,
          category,
          `${kindLabel} "${match[0]}".`,
          model.lines[line] ?? '',
          rule.fix,
          rule.sources,
          match[0],
        );
      }
    }
  }

  // GUIDE rule: suspicious words are allowed at most once per page. The repeat
  // budget is applied once every finding is known (see escalateRepeats).
}

/* ------------------------------------------------------------------ */
/* Patterns                                                            */
/* ------------------------------------------------------------------ */

function lintPatterns(model: DocumentModel, rules: CompiledRules, push: Push): void {
  for (const rule of rules.patterns) {
    switch (rule.scope) {
      case 'title': {
        for (const block of model.blocks) {
          if (block.kind !== 'heading') continue;
          const offset = model.lineStarts[block.startLine] ?? 0;
          for (const match of block.text.matchAll(rule.compiled)) {
            push(
              offset,
              `pattern:${rule.id}`,
              rule.severity,
              'pattern',
              `${rule.description} — "${clean(match[0])}".`,
              model.lines[block.startLine] ?? '',
              rule.fix,
              rule.sources,
              match[0],
            );
          }
        }
        break;
      }
      case 'sentence': {
        for (const block of proseBlocks(model)) {
          if (METHODS_EXEMPT_PATTERNS.has(rule.id) && block.inMethods) continue;
          for (const sentence of splitSentences(block.text)) {
            for (const match of sentence.text.matchAll(rule.compiled)) {
              const offset = block.map[sentence.start + (match.index ?? 0)];
              if (offset === undefined) continue;
              push(offset, `pattern:${rule.id}`, rule.severity, 'pattern',
                `${rule.description} — "${clean(match[0])}".`, sentence.text, rule.fix, rule.sources, match[0]);
            }
          }
        }
        break;
      }
      case 'paragraph': {
        for (const block of proseBlocks(model)) {
          if (METHODS_EXEMPT_PATTERNS.has(rule.id) && block.inMethods) continue;
          for (const match of block.text.matchAll(rule.compiled)) {
            const offset = block.map[match.index ?? 0];
            if (offset === undefined) continue;
            push(offset, `pattern:${rule.id}`, rule.severity, 'pattern',
              `${rule.description} — "${clean(match[0])}".`, block.text, rule.fix, rule.sources, match[0]);
          }
        }
        break;
      }
      case 'line': {
        for (let line = 0; line < model.maskedLines.length; line += 1) {
          if (METHODS_EXEMPT_PATTERNS.has(rule.id) && (lineInfo[line]?.inMethods ?? false)) continue;
          const masked = model.maskedLines[line] ?? '';
          for (const match of masked.matchAll(rule.compiled)) {
            push((model.lineStarts[line] ?? 0) + (match.index ?? 0), `pattern:${rule.id}`, rule.severity,
              'pattern', `${rule.description} — "${clean(match[0])}".`, model.lines[line] ?? '',
              rule.fix, rule.sources, match[0]);
          }
        }
        break;
      }
      case 'document': {
        lintDocumentPattern(model, lineInfo, rule, push);
        break;
      }
    }
  }
}

function lintDocumentPattern(
  model: DocumentModel,
  lineInfo: LineInfo[],
  rule: CompiledRules['patterns'][number],
  push: Push,
): void {
  const matches: { offset: number; text: string; sectionId: number }[] = [];
  for (let line = 0; line < model.maskedLines.length; line += 1) {
    const masked = model.maskedLines[line] ?? '';
    for (const match of masked.matchAll(rule.compiled)) {
      matches.push({
        offset: (model.lineStarts[line] ?? 0) + (match.index ?? 0),
        text: match[0],
        sectionId: lineInfo[line]?.sectionId ?? 0,
      });
    }
  }
  if (matches.length === 0) return;

  const per1000 = rule.max_per_1000_words;
  const perSection = rule.max_per_section;
  const allowed = per1000 !== undefined ? Math.max(1, Math.floor((per1000 * model.wordCount) / 1000)) : undefined;
  const seenPerSection = new Map<number, number>();

  matches.forEach((match, index) => {
    if (allowed !== undefined && index < allowed) return;
    if (allowed === undefined && perSection !== undefined) {
      const seen = (seenPerSection.get(match.sectionId) ?? 0) + 1;
      seenPerSection.set(match.sectionId, seen);
      if (seen <= perSection) return;
    }
    const budget = allowed ?? perSection ?? 0;
    push(match.offset, `pattern:${rule.id}`, rule.severity, 'pattern',
      `${rule.description} — "${clean(match.text)}". Budget for this document is ${budget}; this is number ${index + 1}.`,
      model.lines[positionAt(model, match.offset).line - 1] ?? '', rule.fix, rule.sources, match.text);
  });
}

function proseBlocks(model: DocumentModel): Block[] {
  return model.blocks.filter((block) => block.kind === 'paragraph' || block.kind === 'list' || block.kind === 'quote');
}

/* ------------------------------------------------------------------ */
/* Readability                                                         */
/* ------------------------------------------------------------------ */

interface SentenceStat {
  text: string;
  offset: number;
  words: number;
  block: Block;
}

function lintReadability(
  model: DocumentModel,
  lineInfo: LineInfo[],
  rules: CompiledRules,
  settings: ProfileSettings,
  push: Push,
): void {
  const readable = rules.readability;
  const body: Block[] = proseBlocks(model).filter((block) => !block.inMethods && block.text.trim().length > 0);
  const sentences: SentenceStat[] = [];
  for (const block of body) {
    for (const sentence of splitSentences(block.text)) {
      const offset = block.map[sentence.start];
      if (offset === undefined) continue;
      sentences.push({ text: sentence.text.trim(), offset, words: countWords(sentence.text), block });
    }
  }

  if (settings.sentenceLength && sentences.length > 0) {
    const lengths = sentences.map((sentence) => sentence.words);
    const mean = lengths.reduce((sum, value) => sum + value, 0) / lengths.length;
    const stdev = Math.sqrt(lengths.reduce((sum, value) => sum + (value - mean) ** 2, 0) / lengths.length);
    const shortMax = readable.sentence_length_words.short_sentence_max_words;
    const shortShare = lengths.filter((value) => value <= shortMax).length / lengths.length;
    const anchor = sentences[0];
    if (anchor) {
      const sl = readable.sentence_length_words;
      if (mean < sl.mean_min || mean > sl.mean_max) {
        push(anchor.offset, 'readability:sentence_length_mean', 'warn', 'readability',
          `Mean sentence length is ${mean.toFixed(1)} words; the guide asks for ${sl.mean_min} to ${sl.mean_max}.`,
          anchor.text, 'Split long sentences and add a few short ones.', sl.sources);
      }
      if (stdev < sl.stdev_min) {
        push(anchor.offset, 'readability:sentence_length_stdev', 'warn', 'readability',
          `Sentence lengths vary by only ${stdev.toFixed(1)} words (target at least ${sl.stdev_min}); machine prose runs even.`,
          anchor.text, 'Mix a very short sentence with a long one.', sl.sources);
      }
      if (shortShare < sl.short_sentence_share_min) {
        push(anchor.offset, 'readability:short_sentence_share', 'warn', 'readability',
          `Only ${(shortShare * 100).toFixed(0)}% of sentences are ${shortMax} words or fewer; the guide asks for at least ${(sl.short_sentence_share_min * 100).toFixed(0)}%.`,
          anchor.text, 'Add short sentences that land a fact.', sl.sources);
      }
    }

    for (const sentence of sentences) {
      if (sentence.words > readable.sentence_length_words.max) {
        push(sentence.offset, 'readability:sentence_too_long', 'warn', 'readability',
          `Sentence runs ${sentence.words} words; the limit is ${readable.sentence_length_words.max}.`,
          sentence.text, 'Cut it into two sentences, or drop a clause.', readable.sentence_length_words.sources);
      }
    }

    const run = readable.sentence_length_words.max_run_similar_length;
    const tolerance = readable.sentence_length_words.similar_length_tolerance_words;
    for (let index = run - 1; index < sentences.length; index += 1) {
      const window = sentences.slice(index - run + 1, index + 1);
      const values = window.map((sentence) => sentence.words);
      if (Math.max(...values) - Math.min(...values) > tolerance) continue;
      const last = window[window.length - 1];
      if (!last) continue;
      push(last.offset, 'readability:uniform_sentence_run', 'info', 'readability',
        `${run} sentences in a row are ${Math.min(...values)}-${Math.max(...values)} words long; that rhythm reads as machine prose.`,
        last.text, 'Change the length of one of them.', readable.sentence_length_words.sources);
    }
  }

  for (const block of body) {
    const words = countWords(block.text);
    const offset = model.lineStarts[block.startLine] ?? 0;
    if (words > readable.paragraph_words.error_above) {
      push(offset, 'readability:paragraph_too_long', 'error', 'readability',
        `Paragraph runs ${words} words; the hard limit is ${readable.paragraph_words.error_above}.`,
        block.text, 'Split it into two paragraphs.', readable.paragraph_words.sources);
    } else if (words > readable.paragraph_words.warn_above) {
      push(offset, 'readability:paragraph_long', 'warn', 'readability',
        `Paragraph runs ${words} words; the guide asks for under ${readable.paragraph_words.warn_above}.`,
        block.text, 'Split it into two paragraphs.', readable.paragraph_words.sources);
    }

    if (settings.numbersPerParagraph && words >= settings.numbersPerParagraphMinWords) {
      if (!/\d/.test(block.text)) {
        push(offset, 'readability:paragraph_without_number', 'info', 'readability',
          'Paragraph has no number, and the guide asks every claim to carry one (or a named model or an example).',
          block.text, 'Add the number from the results file, or name the model or example.', readable.numbers_per_paragraph.sources);
      }
    }
  }

  if (settings.firstPerson && sentences.length > 0) {
    const n = readable.first_person_required.n;
    const head = sentences.slice(0, n).map((sentence) => sentence.text).join(' ');
    const regex = new RegExp(readable.first_person_required.regex, 'i');
    if (!regex.test(head)) {
      const anchor = sentences[0];
      if (anchor) {
        push(anchor.offset, 'readability:first_person_missing', 'warn', 'readability',
          `"We" or "our" does not appear in the first ${n} sentences; AI drafts have no narrator.`,
          head, 'Say who did the work.', readable.first_person_required.sources);
      }
    }
  }

  if (settings.passiveVoice) {
    const regex = new RegExp(readable.passive_voice_share.regex, 'i');
    const total = sentences.length;
    if (total > 0) {
      const passive = sentences.filter((sentence) => regex.test(sentence.text));
      const share = passive.length / total;
      if (share > readable.passive_voice_share.warn_above) {
        const first = passive[0];
        if (first) {
          push(first.offset, 'readability:passive_voice', 'warn', 'readability',
            `${(share * 100).toFixed(0)}% of sentences look passive (limit ${(readable.passive_voice_share.warn_above * 100).toFixed(0)}%).`,
            first.text, 'Name the actor and use an active verb.', readable.passive_voice_share.sources);
        }
      }
    }
  }

  if (settings.subjectVerbGap) {
    for (const sentence of sentences) {
      const gap = subjectVerbGap(sentence.text);
      if (gap !== null && gap > readable.subject_verb_gap_words.warn_above) {
        push(sentence.offset, 'readability:subject_verb_gap', 'info', 'readability',
          `The verb arrives ${gap} words after the start of the sentence (limit ${readable.subject_verb_gap_words.warn_above}).`,
          sentence.text, 'Put the verb closer to its subject.', readable.subject_verb_gap_words.sources);
      }
    }
  }

  if (settings.decimalPlaces) {
    const limit = readable.decimal_places_max.value;
    const regex = new RegExp(`\\d+\\.\\d{${limit + 1},}`, 'g');
    for (let line = 0; line < model.maskedLines.length; line += 1) {
      const masked = model.maskedLines[line] ?? '';
      const info = lineInfo[line] ?? { inMethods: false, sectionId: 0 };
      if (info.inMethods) continue;
      for (const match of masked.matchAll(regex)) {
        push((model.lineStarts[line] ?? 0) + (match.index ?? 0), 'readability:decimal_places', 'warn', 'readability',
          `"${match[0]}" has more than ${limit} decimal place${limit === 1 ? '' : 's'}; the guide asks for at most ${limit} in body text.`,
          model.lines[line] ?? '', 'Round it.', readable.decimal_places_max.sources, match[0]);
      }
    }
  }
}

const VERB_HINT = /\b(?:is|are|was|were|be|been|being|has|have|had|do|does|did|can|could|will|would|may|might|must|should)\b|\b\w+(?:ed|es|s)\b/i;

function subjectVerbGap(sentence: string): number | null {
  const tokens = tokenize(sentence);
  if (tokens.length < 18) return null;
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (!token) continue;
    if (index === 0) continue;
    if (VERB_HINT.test(token.word)) return index;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Figure captions                                                     */
/* ------------------------------------------------------------------ */

function lintFigureCaptions(model: DocumentModel, push: Push): void {
  for (const block of model.blocks) {
    if (block.kind !== 'figure') continue;
    const raw = model.lines.slice(block.startLine, block.endLine + 1).join('\n');
    const offset = model.lineStarts[block.startLine] ?? 0;
    const caption = /<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i.exec(raw)?.[1] ?? '';
    if (caption.trim().length === 0) {
      push(offset, 'chart:text_description_missing', 'warn', 'chart',
        'Figure has no <figcaption>; every chart needs a 1 to 3 sentence description under it.',
        raw, 'Add a caption that says why the chart matters, without repeating the title.',
        ['uk_af']);
      continue;
    }
    if (caption.replace(/<[^>]*>/g, '').trim().split(/\s+/).length < 12) {
      push(offset, 'chart:text_description_short', 'info', 'chart',
        'Figure caption is shorter than one sentence; the guide asks for 1 to 3 sentences.',
        caption, 'Say what the reader should take from the chart.', ['uk_af']);
    }
  }
}

/* ------------------------------------------------------------------ */
/* Post-processing                                                     */
/* ------------------------------------------------------------------ */

function dedupe(findings: Finding[]): Finding[] {
  const seen = new Set<string>();
  const out: Finding[] = [];
  for (const finding of findings) {
    const key = `${finding.line}:${finding.column}:${finding.ruleId}:${finding.matched ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(finding);
  }
  return out.sort((a, b) => a.line - b.line || a.column - b.column || a.ruleId.localeCompare(b.ruleId));
}

/**
 * Apply the "suspicious words appear at most once per page" rule: every repeat
 * after the first is escalated to an error.
 */
export function escalateRepeats(findings: Finding[], maxPerPage: number): Finding[] {
  const counts = new Map<string, number>();
  return findings.map((finding) => {
    if (finding.category !== 'word' || finding.severity !== 'warn') return finding;
    const key = finding.ruleId;
    const count = (counts.get(key) ?? 0) + 1;
    counts.set(key, count);
    if (count <= maxPerPage) return finding;
    return {
      ...finding,
      severity: 'error' as Severity,
      message: `${finding.message} This is occurrence ${count}; the guide allows ${maxPerPage} per page.`,
    };
  });
}
