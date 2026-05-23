import { getBlogByNumericId as getBlogByNumericIdPg } from '../content/blogPosts.js';
import type { AgentBlogSnapshot } from '../types.js';

export type ResolvedBlogPost = {
  numericId?: number;
  title: string;
  excerpt: string;
  content: string;
  tags?: string[];
  category: string;
  author: string;
  color?: string;
  coverImageUrl?: string;
  thumbnailImageUrl?: string;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    ogImageUrl?: string;
    ogImageThumbUrl?: string;
    ogImage?: string;
  };
};

export async function getBlogByNumericId(blogId: number): Promise<{
  docId: string;
  blog: ResolvedBlogPost;
}> {
  const { docId, blog } = await getBlogByNumericIdPg(blogId);
  return { docId, blog: blog as ResolvedBlogPost };
}

export async function resolveBlogForPublishKit(
  blogId: number,
  snapshot?: AgentBlogSnapshot,
): Promise<ResolvedBlogPost> {
  if (!snapshot) {
    const { blog } = await getBlogByNumericId(blogId);
    return blog;
  }

  const title = snapshot.title?.trim() ?? '';
  const content = snapshot.content?.trim() ?? '';

  if (title && content) {
    const ext = snapshot as AgentBlogSnapshot & { color?: string; numericId?: number };
    return {
      title: snapshot.title,
      excerpt: snapshot.excerpt ?? '',
      content: snapshot.content,
      tags: snapshot.tags ?? [],
      category: snapshot.category ?? '',
      author: snapshot.author ?? '',
      color: ext.color,
      numericId: ext.numericId ?? blogId,
    };
  }

  if (!title && !content) {
    throw new Error(
      'Post snapshot is empty. Wait for the editor to finish loading (title + markdown visible), then try again.',
    );
  }
  if (!content) {
    throw new Error(
      'Post content is missing from the editor. Add markdown content before generating SEO text or images.',
    );
  }
  throw new Error('Post title is missing from the editor. Add a title, then try again.');
}
