/** Blog body sent from admin when resolving publish-kit context. */
export type AgentBlogSnapshot = {
  title: string;
  excerpt: string;
  content: string;
  tags?: string[];
  category: string;
  author: string;
};
