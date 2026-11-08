import type { LaneManifest } from '../types.js';

/** LFM3 alone, on the Pro: cheap and fast, so few tools, few steps, and a closed list of what it can do. */
export const manifest: LaneManifest = {
  name: 'small',
  description: 'LFM3 only, a short closed tool list and few steps.',
  providers: ['dev'],
  tools: ['navigate', 'step_list', 'tour_next', 'show_projects', 'not_for_me', 'booking_start', 'booking_give_name', 'booking_confirm_name', 'booking_give_pronunciation', 'booking_give_email', 'booking_confirm_email', 'booking_give_area', 'booking_repeat', 'booking_cancel', 'summarize_page', 'cite_section', 'outline_passages', 'read_paper', 'read_blog'],
  limits: { maxSteps: { voice: 3, chat: 4 }, maxOutputTokens: { voice: 300, chat: 400 }, startMs: { voice: 6000, chat: 8000 } },
  tables: { prefix: 'copilot_small' },
  embedder: 'default',
  reranker: 'default',
};
