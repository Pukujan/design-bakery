import type { BlogPost } from '@design-bakery/blog-core/admin';
import {
  DEFAULT_PUBLISH_KIT_EDITOR_DRAFT,
  type PublishKitEditorDraft,
} from '@design-bakery/blog-creator/studio/types';

/** Stable key for in-memory draft while editing (Firestore id or new-post slot). */
export function blogEditSessionKey(post: BlogPost, newPostSlot: string): string {
  if (post.id) return post.id;
  if (post.numericId && post.numericId > 0) return `numeric:${post.numericId}`;
  return `new:${newPostSlot}`;
}

/** Compare post fields (ignores Firestore doc id). */
export function fingerprintBlogPost(post: BlogPost): string {
  const { id: _id, ...data } = post;
  return JSON.stringify(data);
}

export function hasPublishKitDraftActivity(draft: PublishKitEditorDraft): boolean {
  return (
    draft.stagedVisual != null ||
    draft.lastTemplate != null ||
    draft.lastMetaNote != null ||
    draft.lastTagsNote != null ||
    draft.variationOffset > 0
  );
}

export function hasUnappliedKitPreview(draft: PublishKitEditorDraft): boolean {
  return draft.stagedVisual != null && !draft.appliedToForm;
}

export function isBlogEditorDirty(
  post: BlogPost,
  baseline: string,
  kitDraft: PublishKitEditorDraft,
): boolean {
  return fingerprintBlogPost(post) !== baseline || hasUnappliedKitPreview(kitDraft);
}

export { DEFAULT_PUBLISH_KIT_EDITOR_DRAFT };
