export const AGENT_API_VERSION = 1;

export type AgentAction = 'promo' | 'seo_ai' | 'council';

export type AgentInvokeRequest = {
  version: number;
  action: AgentAction;
  blogId: number;
  theme?: string;
  audienceTheme?: string;
  customInstructions?: string;
  publicUrl?: string;
};

export type PromoAgentData = {
  linkedInPost: string;
  hashtags: string[];
  hooks: string[];
};
