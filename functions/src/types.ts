export const AGENT_API_VERSION = 1;

export type AgentAction = 'promo' | 'seo_ai' | 'council';

export type AgentBlogSnapshot = {
  title: string;
  excerpt: string;
  content: string;
  tags?: string[];
  category: string;
  author: string;
};

export type AgentInvokeRequest = {
  version: number;
  action: AgentAction;
  blogId: number;
  theme?: string;
  audienceTheme?: string;
  customInstructions?: string;
  publicUrl?: string;
  /** Admin client sends post body when Firestore doc is missing (local JSON fallback). */
  blogSnapshot?: AgentBlogSnapshot;
};

export type PromoAgentData = {
  linkedInPost: string;
  hashtags: string[];
  hooks: string[];
};
