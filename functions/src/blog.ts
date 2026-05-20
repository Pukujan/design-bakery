import { getFirestore } from 'firebase-admin/firestore';

export type FirestoreBlog = {
  numericId?: number;
  title: string;
  excerpt: string;
  content: string;
  tags?: string[];
  category: string;
  author: string;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
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
