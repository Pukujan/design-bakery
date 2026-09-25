import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { CompiledRules } from '../rules.js';
import type { ResolvedTarget } from '../config.js';
import type { Finding, LintReport } from '../types.js';
import { lintMarkdown } from './markdown.js';
import { lintChart } from './chart.js';

export interface LintOptions {
  root: string;
  rules: CompiledRules;
}

export function lintTarget(target: ResolvedTarget, options: LintOptions): LintReport {
  const absolute = join(options.root, target.file);
  let text: string;
  try {
    text = readFileSync(absolute, 'utf8');
  } catch (error) {
    return {
      file: target.file,
      profile: target.profile,
      kind: target.kind,
      findings: [{
        file: target.file,
        line: 1,
        column: 1,
        ruleId: 'io:unreadable',
        severity: 'error',
        category: 'chart',
        message: `Could not read the file (${String(error)}).`,
        excerpt: '',
        profile: target.profile,
      }],
    };
  }

  const findings: Finding[] = target.kind === 'markdown' || target.kind === 'html'
    ? lintMarkdown({ file: target.file, text, profile: target.profile, rules: options.rules, settings: target.settings })
    : target.settings.chartChecks
      ? lintChart({ file: target.file, text, profile: target.profile, rules: options.rules })
      : [];

  return { file: target.file, profile: target.profile, kind: target.kind, findings };
}

export function lintTargets(targets: ResolvedTarget[], options: LintOptions): LintReport[] {
  return targets.map((target) => lintTarget(target, options));
}

export function countBySeverity(reports: LintReport[]): Record<Finding['severity'], number> {
  const counts = { error: 0, warn: 0, info: 0 };
  for (const report of reports) {
    for (const finding of report.findings) counts[finding.severity] += 1;
  }
  return counts;
}

export function countByRule(reports: LintReport[]): { ruleId: string; severity: Finding['severity']; count: number }[] {
  const map = new Map<string, { ruleId: string; severity: Finding['severity']; count: number }>();
  for (const report of reports) {
    for (const finding of report.findings) {
      const entry = map.get(finding.ruleId);
      if (entry) entry.count += 1;
      else map.set(finding.ruleId, { ruleId: finding.ruleId, severity: finding.severity, count: 1 });
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.ruleId.localeCompare(b.ruleId));
}
