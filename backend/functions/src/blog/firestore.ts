import { getFirestore } from 'firebase-admin/firestore';
import { isFunctionsEmulator } from '../emulator.js';
import type { AgentBlogSnapshot } from '../types.js';

export type FirestoreBlog = {
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
  blog: FirestoreBlog;
}> {
  const db = getFirestore();
  const snap = await db
    .collection('blog_posts')
    .where('numericId', '==', blogId)
    .limit(1)
    .get();

  if (snap.empty) {
    throw new Error(`Blog ${blogId} not found`);
  }

  const doc = snap.docs[0];
  return { docId: doc.id, blog: doc.data() as FirestoreBlog };
}

export async function resolveBlogForPromo(
  blogId: number,
  snapshot?: AgentBlogSnapshot
): Promise<FirestoreBlog> {
  if (!snapshot) {
    if (isFunctionsEmulator()) {
      throw new Error(
        `Blog ${blogId}: no editor snapshot. Open the post in Blog Posts and try again.`,
      );
    }
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
