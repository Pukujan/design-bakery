import type { Blog } from '@/modules/blog/data/blogData';
import type { AgentBlogPayload } from './contracts';

/** Read-only bridge — agent module must not import blog UI components. */
export function toAgentBlogPayload(blog: Blog, publicUrl: string): AgentBlogPayload {
  return {
    id: blog.id,
    title: blog.title,
    excerpt: blog.excerpt,
    content: blog.content,
    tags: blog.tags,
    category: blog.category,
    author: blog.author,
    publicUrl,
    seo: blog.seo,
  };
}
