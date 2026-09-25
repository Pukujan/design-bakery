#!/usr/bin/env node
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { collectTargets, loadConfig, type ContentQualityConfig, type ResolvedTarget } from './config.js';
import { loadRules, type CompiledRules } from './rules.js';
import { lintTargets } from './lint/index.js';
import { renderJson, renderMarkdownSummary, renderText, summarize } from './report.js';
import { runFix } from './fix/run.js';
import { createComplete, modelConfigFromEnv, DEFAULT_BASE_URL, DEFAULT_MODEL } from './fix/client.js';
import { PACKAGE_ROOT } from './rules.js';
import { fileURLToPath } from 'node:url';

interface CliOptions {
  command: 'check' | 'fix' | 'help';
  files: string[];
  filesFrom?: string;
  config?: string;
  rules?: string;
  root: string;
  profile?: string;
  json: boolean;
  quiet: boolean;
  failOnWarn: boolean;
  markdownSummary: boolean;
  maxIterations: number;
  write: boolean;
  out?: string;
  dryRun: boolean;
}

const USAGE = `content-quality — de-AI writing and chart linter

Usage:
  content-quality check [files...] [options]
  content-quality fix   [files...] [options]

Options:
  --config <path>        Config file (default: content-quality.config.json in --root)
  --rules <path>         rules.json to use (default: the one bundled with this package)
  --root <path>          Repository root (default: current directory)
  --profile <name>       Force one profile for the files given on the command line
  --files-from <path>    Read a newline-separated file list (used by CI)
  --json                 Machine-readable report on stdout
  --markdown-summary     Print a Markdown table of rule counts (for PR bodies)
  --quiet                Only file:line, rule id and message
  --fail-on-warn         Exit non-zero on warnings too (errors always exit non-zero)

fix options:
  --max-iterations <n>   Model passes per paragraph (default 3)
  --write                Overwrite the source file (default: write <name>.fixed.md + .diff)
  --out <dir>            Directory for .fixed.md / .fixed.diff output
  --dry-run              Print the diff without writing anything

Environment for fix:
  CQ_BASE_URL   default ${DEFAULT_BASE_URL}
  CQ_API_KEY    required (never printed)
  CQ_MODEL      default ${DEFAULT_MODEL}
  CQ_PROVIDER   "anthropic" for an Anthropic-compatible endpoint
`;

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    command: 'help',
    files: [],
    root: process.cwd(),
    json: false,
    quiet: false,
    failOnWarn: false,
    markdownSummary: false,
    maxIterations: 3,
    write: false,
    dryRun: false,
  };

  const args = [...argv];
  const first = args.shift();
  if (first === 'check' || first === 'fix') options.command = first;
  else if (first === 'help' || first === '--help' || first === '-h' || first === undefined) return options;
  else throw new Error(`Unknown command "${first}". Run with --help.`);

  while (args.length > 0) {
    const arg = args.shift() ?? '';
    const next = (): string => {
      const value = args.shift();
      if (value === undefined) throw new Error(`Missing value for ${arg}`);
      return value;
    };
    switch (arg) {
      case '--config': options.config = next(); break;
      case '--rules': options.rules = next(); break;
      case '--root': options.root = resolve(next()); break;
      case '--profile': options.profile = next(); break;
      case '--files-from': options.filesFrom = next(); break;
      case '--max-iterations': options.maxIterations = Number.parseInt(next(), 10) || 3; break;
      case '--out': options.out = next(); break;
      case '--json': options.json = true; break;
      case '--quiet': options.quiet = true; break;
      case '--fail-on-warn': options.failOnWarn = true; break;
      case '--markdown-summary': options.markdownSummary = true; break;
      case '--write': options.write = true; break;
      case '--dry-run': options.dryRun = true; break;
      case '--help': case '-h': options.command = 'help'; break;
      default:
        if (arg.startsWith('-')) throw new Error(`Unknown option "${arg}". Run with --help.`);
        options.files.push(arg);
    }
  }
  return options;
}

function toRelative(root: string, file: string): string {
  const absolute = resolve(file);
  const rel = relative(root, absolute).split(sep).join('/');
  return rel.startsWith('..') ? absolute.split(sep).join('/') : rel;
}

function gatherTargets(options: CliOptions, config: ContentQualityConfig): ResolvedTarget[] {
  const files: string[] = [...options.files];
  if (options.filesFrom) {
    const list = readFileSync(options.filesFrom, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    files.push(...list);
  }

  const explicit = files
    .map((file) => toRelative(options.root, file))
    .filter((file) => existsSync(join(options.root, file)) && statSync(join(options.root, file)).isFile());

  if (explicit.length === 0) return collectTargets(options.root, config);
  return collectTargets(options.root, config, explicit, options.profile);
}

async function main(): Promise<number> {
  let options: CliOptions;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${String(error instanceof Error ? error.message : error)}\n`);
    return 2;
  }

  if (options.command === 'help') {
    process.stdout.write(USAGE);
    return 0;
  }

  const { config, path: configPath } = loadConfig(options.config);
  const rulesPath = options.rules ? resolve(options.rules) : fileURLToPath(new URL('rules.json', PACKAGE_ROOT));
  const rules = loadRules(rulesPath);
  if (configPath === null && !options.config) {
    process.stderr.write('No content-quality.config.json found; using built-in profiles and no targets.\n');
  }

  const targets = gatherTargets(options, config);
  if (targets.length === 0) {
    process.stderr.write('No files matched. Check "targets" in the config file.\n');
    return 2;
  }

  if (options.command === 'check') {
    const reports = lintTargets(targets, { root: options.root, rules });
    if (options.json) process.stdout.write(renderJson(reports, rules.raw));
    else {
      process.stdout.write(`${renderText(reports, rules.raw, { quiet: options.quiet })}\n`);
      if (options.markdownSummary) process.stdout.write(`\n${renderMarkdownSummary(reports)}\n`);
    }
    const summary = summarize(reports);
    if (summary.errors > 0) return 1;
    if (options.failOnWarn && summary.warnings > 0) return 1;
    return 0;
  }

  const modelConfig = modelConfigFromEnv();
  const complete = createComplete(modelConfig);
  process.stdout.write(
    `Fixing with ${modelConfig.model} at ${modelConfig.baseUrl} (key ${modelConfig.apiKey ? 'set' : 'MISSING'}).\n`,
  );
  if (options.dryRun) process.stdout.write('Dry run: nothing will be written.\n');

  const results = await runFix({
    root: options.root,
    rules,
    targets,
    complete,
    maxIterations: options.maxIterations,
    write: options.write && !options.dryRun,
    dryRun: options.dryRun,
    ...(options.out ? { outDir: options.out } : {}),
    onProgress: (message) => process.stdout.write(`${message}\n`),
  });

  let failures = 0;
  for (const result of results) {
    if (!result.changed) {
      process.stdout.write(`${result.file}: nothing to fix.\n`);
      for (const note of result.skipped) process.stdout.write(`  ${note}\n`);
      continue;
    }
    process.stdout.write(`${result.file}: rewrote ${result.blocks.length} paragraph(s).\n`);
    for (const block of result.blocks) {
      process.stdout.write(`  line ${block.startLine + 1} (${block.iterations} pass(es)): ${block.ruleIds.join(', ')}\n`);
    }
    for (const note of result.skipped) process.stdout.write(`  kept original — ${note}\n`);
    if (result.fixedPath) process.stdout.write(`  ${result.fixedPath}\n  ${result.diffPath}\n`);
    if (options.dryRun) {
      for (const block of result.blocks) {
        process.stdout.write(`\n--- line ${block.startLine + 1}\n- ${block.before.split('\n').join('\n- ')}\n+ ${block.after.split('\n').join('\n+ ')}\n`);
      }
    }
    if (result.blocks.length === 0) failures += 1;
  }

  const totalBlocks = results.reduce((sum, result) => sum + result.blocks.length, 0);
  process.stdout.write(`${totalBlocks} paragraph(s) rewritten across ${results.length} file(s).\n`);
  return failures > 0 ? 1 : 0;
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
