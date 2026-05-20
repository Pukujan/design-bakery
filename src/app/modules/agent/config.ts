/** Phase 1+ — off by default until OpenRouter Functions ship (Phase 4). */
export const BLOG_AGENTS_ENABLED = import.meta.env.VITE_ENABLE_BLOG_AGENTS === 'true';

export const AGENT_API_VERSION = 1 as const;
