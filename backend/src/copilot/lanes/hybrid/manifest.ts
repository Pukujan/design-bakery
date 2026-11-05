import type { LaneManifest } from '../types.js';

/** The chain as it ran before lanes: hosted models by health, the free one last, LFM3 as the final fallback. */
export const manifest: LaneManifest = {
  name: 'hybrid',
  description: 'Hosted models by health, free model last, local LFM3 as the final fallback.',
  providers: ['deepseek', 'deepseek-b', 'qwen', 'workbuddy', 'openrouter', 'dev'],
  tools: 'all',
  limits: { maxSteps: { voice: 5, chat: 6 }, maxOutputTokens: { voice: 600, chat: 600 }, startMs: { voice: 4000, chat: 6000 } },
  tables: { prefix: 'copilot_hybrid' },
  embedder: 'default',
  reranker: 'default',
};
