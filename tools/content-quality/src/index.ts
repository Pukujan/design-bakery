/**
 * Public entry points, so another repo can import the linter instead of
 * shelling out to the CLI.
 */
export { loadConfig, collectTargets, resolveSettings, DEFAULT_PROFILES, type ContentQualityConfig, type ProfileSettings, type ResolvedTarget } from './config.js';
export { loadRules, isMethodsSection, DEFAULT_RULES_PATH, DEFAULT_GUIDE_PATH, type CompiledRules } from './rules.js';
export { lintTarget, lintTargets, countBySeverity, countByRule } from './lint/index.js';
export { lintMarkdown } from './lint/markdown.js';
export { lintChart } from './lint/chart.js';
export { inspectSvg, type SvgInfo, type SvgText } from './lint/svg.js';
export { renderJson, renderMarkdownSummary, renderText, summarize, type ReportBundle, type ReportSummary } from './report.js';
export { runFix, buildMessages, type FileFixResult, type FixOptions } from './fix/run.js';
export { guardRewrite, type GuardResult } from './fix/guard.js';
export { unifiedDiff } from './fix/diff.js';
export { createComplete, modelConfigFromEnv, DEFAULT_BASE_URL, DEFAULT_MODEL, type Complete, type ModelConfig } from './fix/client.js';
export * from './types.js';
