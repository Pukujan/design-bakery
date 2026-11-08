import type { LaneManifest } from '../types.js';

/** The best hosted models, nothing smaller behind them: for the questions where quality matters more than a second. */
export const manifest: LaneManifest = {
  name: 'strong',
  description: 'Hosted models only (Haiku when its key is set, DeepSeek, then Qwen), generous limits.',
  providers: ['haiku', 'deepseek', 'deepseek-b', 'qwen'],
  tools: 'all',
  limits: { maxSteps: { voice: 5, chat: 6 }, maxOutputTokens: { voice: 600, chat: 600 }, startMs: { voice: 4000, chat: 6000 } },
  tables: { prefix: 'copilot_strong' },
  embedder: 'default',
  reranker: 'default',
};
