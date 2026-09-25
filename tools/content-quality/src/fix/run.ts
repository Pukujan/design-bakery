import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { CompiledRules } from '../rules.js';
import type { ResolvedTarget } from '../config.js';
import type { Finding } from '../types.js';
import { buildDocument, maskDocument } from '../text.js';
import { lintMarkdown } from '../lint/markdown.js';
import { unifiedDiff } from './diff.js';
import { guardRewrite } from './guard.js';
import type { ChatMessage, Complete } from './client.js';

export interface FixOptions {
  root: string;
  rules: CompiledRules;
  targets: ResolvedTarget[];
  complete: Complete;
  /** How many times to ask the model to fix one paragraph. */
  maxIterations: number;
  /** Overwrite the source file instead of writing `<name>.fixed.md`. */
  write: boolean;
  /** Report what would change without writing anything. */
  dryRun?: boolean;
  /** Where to put `.fixed.md` / `.fixed.diff` files (default: next to the source). */
  outDir?: string;
  onProgress?: (message: string) => void;
}

export interface BlockFix {
  startLine: number;
  endLine: number;
  before: string;
  after: string;
  iterations: number;
  rejected: string[];
  ruleIds: string[];
}

export interface FileFixResult {
  file: string;
  profile: string;
  changed: boolean;
  blocks: BlockFix[];
  skipped: string[];
  fixedPath?: string;
  diffPath?: string;
}

/** Findings the fixer can act on: prose-level problems inside one block. */
const BLOCK_LEVEL_RULES = /^(?:word|jargon|pattern):/;
const BLOCK_LEVEL_READABILITY = new Set([
  'readability:sentence_too_long',
  'readability:paragraph_long',
  'readability:paragraph_too_long',
  'readability:paragraph_without_number',
  'readability:decimal_places',
  'readability:subject_verb_gap',
]);

function isBlockLevel(finding: Finding): boolean {
  if (BLOCK_LEVEL_RULES.test(finding.ruleId)) return true;
  return BLOCK_LEVEL_READABILITY.has(finding.ruleId);
}

export async function runFix(options: FixOptions): Promise<FileFixResult[]> {
  const results: FileFixResult[] = [];
  for (const target of options.targets) {
    if (target.kind !== 'markdown') {
      results.push({
        file: target.file,
        profile: target.profile,
        changed: false,
        blocks: [],
        skipped: ['only Markdown/MDX is rewritten; chart files are reported by `content:check`'],
      });
      continue;
    }
    results.push(await fixFile(target, options));
  }
  return results;
}

async function fixFile(target: ResolvedTarget, options: FixOptions): Promise<FileFixResult> {
  const progress = options.onProgress ?? ((): void => {});
  const absolute = join(options.root, target.file);
  const original = readFileSync(absolute, 'utf8');
  const lines = original.split(/\r?\n/);
  const maskedLines = maskDocument(lines);
  const model = buildDocument(lines, maskedLines);

  const report = lintMarkdown({
    file: target.file,
    text: original,
    profile: target.profile,
    rules: options.rules,
    settings: target.settings,
  });
  const actionable = report.filter(isBlockLevel);

  const byBlock = new Map<number, Finding[]>();
  for (const finding of actionable) {
    const index = model.blocks.findIndex((block) => finding.line >= block.startLine + 1 && finding.line <= block.endLine + 1);
    if (index < 0) continue;
    const block = model.blocks[index];
    if (!block || (block.kind !== 'paragraph' && block.kind !== 'list' && block.kind !== 'quote')) continue;
    const list = byBlock.get(index) ?? [];
    list.push(finding);
    byBlock.set(index, list);
  }

  const blockFixes: BlockFix[] = [];
  const edited = [...lines];
  const skipped: string[] = [];

  const ordered = [...byBlock.keys()].sort((a, b) => (model.blocks[b]?.startLine ?? 0) - (model.blocks[a]?.startLine ?? 0));

  for (const index of ordered) {
    const block = model.blocks[index];
    const findings = byBlock.get(index);
    if (!block || !findings || findings.length === 0) continue;
    const before = lines.slice(block.startLine, block.endLine + 1).join('\n');
    progress(`  ${target.file}:${block.startLine + 1} — ${findings.length} finding(s)`);

    let current = before;
    let iterations = 0;
    let accepted = false;
    const rejected: string[] = [];
    let remaining = findings;

    while (iterations < options.maxIterations) {
      iterations += 1;
      const messages = buildMessages(options.rules, current, remaining, target.profile);
      let candidate: string;
      try {
        candidate = cleanModelOutput(await options.complete(messages));
      } catch (error) {
        rejected.push(`model error: ${String(error)}`);
        break;
      }
      if (!candidate) {
        rejected.push('model returned an empty rewrite');
        break;
      }
      const guard = guardRewrite(current, candidate);
      if (!guard.ok) {
        rejected.push(`guard rejected the rewrite (${guard.reasons.join('; ')})`);
        remaining = findings;
        continue;
      }
      const recheck = recheckBlock(candidate, target, options.rules);
      const finalGuard = guardRewrite(before, candidate);
      if (recheck.length === 0 && finalGuard.ok) {
        current = candidate;
        accepted = true;
        break;
      }
      current = candidate;
      remaining = recheck.length > 0 ? recheck : findings;
      if (!finalGuard.ok) {
        rejected.push(`guard rejected the rewrite against the original (${finalGuard.reasons.join('; ')})`);
      } else {
        rejected.push(`still flagged after pass ${iterations}: ${recheck.map((finding) => finding.ruleId).join(', ')}`);
      }
    }

    if (!accepted) {
      skipped.push(`line ${block.startLine + 1}: kept the original (${rejected.join(' | ') || 'no passing rewrite'})`);
      continue;
    }

    blockFixes.push({
      startLine: block.startLine,
      endLine: block.endLine,
      before,
      after: current,
      iterations,
      rejected,
      ruleIds: [...new Set(findings.map((finding) => finding.ruleId))],
    });
    edited.splice(block.startLine, block.endLine - block.startLine + 1, ...current.split('\n'));
  }

  const fixedText = edited.join('\n');
  const changed = fixedText !== original;
  const result: FileFixResult = {
    file: target.file,
    profile: target.profile,
    changed,
    blocks: blockFixes,
    skipped,
  };
  if (!changed) return result;
  if (options.dryRun) return result;

  if (options.write) {
    writeFileSync(absolute, fixedText, 'utf8');
    progress(`  wrote ${target.file}`);
    return result;
  }

  const outDir = options.outDir
    ? join(options.root, options.outDir, dirname(target.file))
    : dirname(absolute);
  mkdirSync(outDir, { recursive: true });
  const base = target.file.replace(/\.(md|mdx)$/i, '');
  const fixedPath = join(outDir, `${base.split('/').pop() ?? 'file'}.fixed.md`);
  const diffPath = join(outDir, `${base.split('/').pop() ?? 'file'}.fixed.diff`);
  writeFileSync(fixedPath, fixedText, 'utf8');
  writeFileSync(diffPath, unifiedDiff(original, fixedText, { oldPath: target.file, newPath: target.file }), 'utf8');
  result.fixedPath = fixedPath;
  result.diffPath = diffPath;
  progress(`  wrote ${fixedPath} and ${diffPath}`);
  return result;
}

function recheckBlock(text: string, target: ResolvedTarget, rules: CompiledRules): Finding[] {
  return lintMarkdown({
    file: target.file,
    text,
    profile: target.profile,
    rules,
    settings: target.settings,
  }).filter(isBlockLevel);
}

export function buildMessages(
  rules: CompiledRules,
  paragraph: string,
  findings: Finding[],
  profile: string,
): ChatMessage[] {
  const banned = rules.raw.words
    .filter((word) => word.severity === 'error')
    .map((word) => word.term)
    .join(', ');
  const violations = findings
    .map((finding) => `- [${finding.ruleId}] ${finding.message}${finding.fix ? ` Fix: ${finding.fix}` : ''}`)
    .join('\n');

  const system = [
    'You are an editor rewriting one paragraph of a published article so it does not read as AI-written.',
    'Follow the writing guide below exactly.',
    '',
    'Hard rules for your rewrite:',
    '1. Keep every number exactly as it is. Do not round, drop, add or reorder numbers.',
    '2. Keep every link and URL exactly as it is.',
    '3. Do not add facts, names, numbers or claims that are not in the paragraph already.',
    '4. Keep the same meaning and the same language.',
    '5. Return only the rewritten paragraph as plain text or Markdown. No preamble, no explanation, no code fences.',
    '',
    'Banned words and phrases (never use any of these):',
    banned,
    '',
    '--- WRITING AND CHARTS GUIDE ---',
    rules.guide,
  ].join('\n');

  const user = [
    `Content profile: ${profile}.`,
    '',
    'Paragraph to rewrite:',
    '<<<',
    paragraph,
    '>>>',
    '',
    'Problems the linter found in this paragraph:',
    violations || '- (none listed)',
    '',
    'Rewrite the paragraph so every problem above is gone, following the guide. Keep all numbers and links.',
  ].join('\n');

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}

function cleanModelOutput(text: string): string {
  let out = text.trim();
  const fence = /^```[a-zA-Z]*\n([\s\S]*?)\n```$/.exec(out);
  if (fence?.[1] !== undefined) out = fence[1].trim();
  return out;
}
