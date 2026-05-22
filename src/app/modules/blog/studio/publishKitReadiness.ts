import { resolveBlogNumericId } from '@/modules/blog/data/blogData';
import type { BlogPost } from '@/lib/adminContentService';
import type { PublishKitAction } from './types';

export type PublishKitReadiness = {
  ready: boolean;
  blogId: number | null;
  /** Short label for the status chip */
  status: 'ready' | 'needs_save' | 'needs_fields';
  message: string;
  hint?: string;
};

function needsMarkdown(action: PublishKitAction): boolean {
  return action !== 'visual';
}

function needsBlurb(action: PublishKitAction): boolean {
  return action !== 'meta' && action !== 'tags' && action !== 'meta_and_tags';
}

export function getPublishKitReadiness(
  post: BlogPost,
  action: PublishKitAction,
): PublishKitReadiness {
  const blogId = resolveBlogNumericId(post);
  const title = post.title?.trim() ?? '';
  const content = post.content?.trim() ?? '';
  const excerpt = post.excerpt?.trim() ?? '';
  const blurb = excerpt || content;

  if (blogId <= 0) {
    return {
      ready: false,
      blogId: null,
      status: 'needs_save',
      message: 'Save this post once before using AI tools.',
      hint: 'Saving assigns a numeric post ID and stores your draft in Firestore.',
    };
  }

  if (!title) {
    return {
      ready: false,
      blogId,
      status: 'needs_fields',
      message: 'Add a title first.',
    };
  }

  if (needsMarkdown(action) && !content) {
    return {
      ready: false,
      blogId,
      status: 'needs_fields',
      message: 'Add markdown content before generating SEO text.',
      hint: 'Meta and tags are generated from the post body, not just the title.',
    };
  }

  if (needsBlurb(action) && !blurb) {
    return {
      ready: false,
      blogId,
      status: 'needs_fields',
      message: 'Add an excerpt or content for the image card blurb.',
    };
  }

  return {
    ready: true,
    blogId,
    status: 'ready',
    message: 'Ready',
  };
}

export function formatPublishKitError(raw: string, readiness: PublishKitReadiness): string {
  if (/not found/i.test(raw)) {
    if (readiness.status === 'needs_save') {
      return 'Post not in Firestore yet. Save once, then run AI tools.';
    }
    return (
      'Could not load this post on the server. Collapse and reopen the editor, or save the post again. ' +
      'If you clicked Generate immediately after opening, wait until the form shows your full content.'
    );
  }
  if (/post content missing from admin/i.test(raw)) {
    return 'Editor snapshot was empty. Add title and content, then try again.';
  }
  if (/unauthenticated/i.test(raw)) {
    return 'Sign in to admin before using the publish kit.';
  }
  return raw;
}
