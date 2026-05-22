import type { AGENT_API_VERSION } from './config';
import type { BlogSeo } from '@/modules/blog/seo/blogSeo';

export type AgentAction = 'promo' | 'seo_ai' | 'council';

export type AgentErrorCode = 'AUTH' | 'COOLDOWN' | 'QUOTA' | 'VALIDATION' | 'INTERNAL';

export type AgentBlogPayload = {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  category: string;
  author: string;
  publicUrl: string;
  seo?: BlogSeo;
};

export type AgentBlogSnapshot = {
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  category: string;
  author: string;
};

export type AgentInvokeRequest = {
  version: typeof AGENT_API_VERSION;
  action: AgentAction;
  blogId: number;
  theme?: string;
  audienceTheme?: string;
  customInstructions?: string;
  publicUrl?: string;
  blogSnapshot?: AgentBlogSnapshot;
};

export type AgentInvokeSuccess = {
  ok: true;
  action: AgentAction;
  data: Record<string, unknown>;
  usage?: { inputTokens: number; outputTokens: number };
  remainingDailyCalls?: number;
  remainingDailyTokens?: number;
};

export type AgentInvokeFailure = {
  ok: false;
  code: AgentErrorCode;
  message: string;
  retryAfterMs?: number;
};

export type AgentInvokeResponse = AgentInvokeSuccess | AgentInvokeFailure;
