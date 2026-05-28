import type { BlogPost } from '@design-bakery/blog-core/admin';
import type { BlogSeo } from '@design-bakery/blog-core/seo/blogMeta';
import { MAX_BLOG_TAGS } from '@design-bakery/blog-core/lib/parseBlogTags';

export type PublishKitMetaResult = {
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  rationale?: string;
};

export type PublishKitTagsResult = {
  tags: string[];
  rationale?: string;
};

function emptySeo(): BlogSeo {
  return {};
}

/** Apply publish-kit meta + tags in one pass (avoids stale setState when both return). */
export function applyPublishKitSeoToPost(
  post: BlogPost,
  input: {
    meta?: PublishKitMetaResult;
    tags?: PublishKitTagsResult;
  },
): BlogPost {
  let next = post;

  if (input.meta) {
    const seo: BlogSeo = {
      ...emptySeo(),
      ...next.seo,
      metaTitle: input.meta.metaTitle,
      metaDescription: input.meta.metaDescription,
    };
    next = {
      ...next,
      seo,
      excerpt: input.meta.excerpt?.trim() || input.meta.metaDescription,
    };
  }

  if (input.tags?.tags?.length) {
    next = {
      ...next,
      tags: input.tags.tags.slice(0, MAX_BLOG_TAGS),
    };
  }

  return next;
}

export function formatPublishKitMetaNote(meta: PublishKitMetaResult): string {
  const blurb = meta.excerpt.length > 72 ? `${meta.excerpt.slice(0, 72)}…` : meta.excerpt;
  const title = meta.metaTitle;
  return meta.rationale
    ? `${title} · ${blurb} — ${meta.rationale}`
    : `${title} · ${blurb}`;
}

export function formatPublishKitTagsNote(tags: PublishKitTagsResult): string {
  const list = tags.tags.join(', ');
  return tags.rationale ? `Tags: ${list} — ${tags.rationale}` : `Tags: ${list}`;
}
