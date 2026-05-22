import { getFirestore } from 'firebase-admin/firestore';
import { isFunctionsEmulator } from './emulator.js';
import type { AgentBlogSnapshot } from './types.js';

export type FirestoreBlog = {
  numericId?: number;
  title: string;
  excerpt: string;
  content: string;
  tags?: string[];
  category: string;
  author: string;
  coverImageUrl?: string;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    ogImageUrl?: string;
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
  if (snapshot?.title?.trim() && snapshot.content?.trim()) {
    return {
      title: snapshot.title,
      excerpt: snapshot.excerpt ?? '',
      content: snapshot.content,
      tags: snapshot.tags ?? [],
      category: snapshot.category ?? '',
      author: snapshot.author ?? '',
    };
  }

  if (isFunctionsEmulator()) {
    throw new Error(
      `Blog ${blogId}: post content missing from admin. Pick a post again or save the post in Blog Posts first.`
    );
  }

  const { blog } = await getBlogByNumericId(blogId);
  return blog;
}
