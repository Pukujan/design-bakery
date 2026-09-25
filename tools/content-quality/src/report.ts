import type { Finding, LintReport } from './types.js';
import type { RulesFile } from './types.js';

export interface ReportSummary {
  files: number;
  filesWithFindings: number;
  errors: number;
  warnings: number;
  info: number;
  byRule: { ruleId: string; severity: Finding['severity']; count: number }[];
}

export interface ReportBundle {
  generated: string;
  rulesVersion: string;
  summary: ReportSummary;
  reports: LintReport[];
}

const SEVERITY_ORDER: Record<Finding['severity'], number> = { error: 0, warn: 1, info: 2 };

export function summarize(reports: LintReport[]): ReportSummary {
  const counts = { error: 0, warn: 0, info: 0 };
  const byRule = new Map<string, { ruleId: string; severity: Finding['severity']; count: number }>();
  let filesWithFindings = 0;
  for (const report of reports) {
    if (report.findings.length > 0) filesWithFindings += 1;
    for (const finding of report.findings) {
      counts[finding.severity] += 1;
      const entry = byRule.get(finding.ruleId);
      if (entry) entry.count += 1;
      else byRule.set(finding.ruleId, { ruleId: finding.ruleId, severity: finding.severity, count: 1 });
    }
  }
  return {
    files: reports.length,
    filesWithFindings,
    errors: counts.error,
    warnings: counts.warn,
    info: counts.info,
    byRule: [...byRule.values()].sort((a, b) => b.count - a.count || a.ruleId.localeCompare(b.ruleId)),
  };
}

export function renderText(
  reports: LintReport[],
  rules: RulesFile,
  options: { quiet?: boolean } = {},
): string {
  const summary = summarize(reports);
  const lines: string[] = [];
  const verbose = !options.quiet;

  for (const report of reports) {
    if (report.findings.length === 0) continue;
    lines.push('');
    lines.push(`${report.file}  [${report.profile}]`);
    const sorted = [...report.findings].sort(
      (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || a.line - b.line || a.column - b.column,
    );
    for (const finding of sorted) {
      const where = `${String(finding.line).padStart(4)}:${String(finding.column).padEnd(3)}`;
      lines.push(`  ${where} ${finding.severity.padEnd(5)} ${finding.ruleId}`);
      lines.push(`        ${finding.message}`);
      if (finding.excerpt) lines.push(`        in: ${finding.excerpt}`);
      if (verbose && finding.fix) lines.push(`        fix: ${finding.fix}`);
      if (verbose && finding.sources && finding.sources.length > 0) {
        lines.push(`        source: ${finding.sources.map((key) => describeSource(rules, key)).join('; ')}`);
      }
    }
  }

  lines.push('');
  lines.push(
    `${summary.files} file(s) checked, ${summary.filesWithFindings} with findings: ` +
      `${summary.errors} error(s), ${summary.warnings} warning(s), ${summary.info} info.`,
  );

  if (summary.byRule.length > 0) {
    lines.push('');
    lines.push('Top rules:');
    for (const entry of summary.byRule.slice(0, 15)) {
      lines.push(`  ${String(entry.count).padStart(5)}  ${entry.severity.padEnd(5)} ${entry.ruleId}`);
    }
  }

  return lines.join('\n');
}

function describeSource(rules: RulesFile, key: string): string {
  const source = rules.sources[key];
  if (!source) return key;
  return `${key} (${source.title})`;
}

export function renderJson(reports: LintReport[], rules: RulesFile): string {
  const bundle: ReportBundle = {
    generated: new Date().toISOString(),
    rulesVersion: rules.version,
    summary: summarize(reports),
    reports: reports
      .filter((report) => report.findings.length > 0)
      .map((report) => ({
        ...report,
        findings: [...report.findings].sort(
          (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || a.line - b.line,
        ),
      })),
  };
  return `${JSON.stringify(bundle, null, 2)}\n`;
}

export function renderMarkdownSummary(reports: LintReport[]): string {
  const summary = summarize(reports);
  const lines: string[] = [];
  lines.push(`Checked ${summary.files} file(s): **${summary.errors} error(s)**, ${summary.warnings} warning(s), ${summary.info} info.`);
  lines.push('');
  lines.push('| count | severity | rule |');
  lines.push('| ---: | --- | --- |');
  for (const entry of summary.byRule.slice(0, 25)) {
    lines.push(`| ${entry.count} | ${entry.severity} | \`${entry.ruleId}\` |`);
  }
  return lines.join('\n');
}
