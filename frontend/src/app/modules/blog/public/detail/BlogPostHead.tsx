import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import type { Blog } from '@/modules/blog/data/blogData';
import { resolveBlogMeta } from '@/modules/blog/seo/blogMeta';
import {
  applyBlogSocialMetaToDocument,
  collectBlogSocialMetaTags,
  readClientSocialEnv,
  upsertCanonicalLink,
} from '@og/blogSocialMeta';

/**
 * Sets document title and social meta tags for a blog detail view.
 * guidelines/agent-devlog-engineering-blog-posts.md
 */
export function BlogPostHead({ blog }: { blog: Blog }) {
  const { pathname } = useLocation();
  const meta = resolveBlogMeta(blog);
  const canonicalUrl =
    typeof window !== 'undefined' ? `${window.location.origin}${pathname}` : pathname;
  const env = readClientSocialEnv();

  useEffect(() => {
    document.title = meta.title;
    const tags = collectBlogSocialMetaTags({
      pageTitle: meta.title,
      description: meta.description,
      canonicalUrl,
      ogImage: meta.imageUrl,
      imageAlt: blog.title,
      author: blog.author,
      publishedTime: blog.date,
      fbAppId: env.fbAppId,
      twitterSite: env.twitterSite,
    });
    const cleanupMeta = applyBlogSocialMetaToDocument(tags);
    const cleanupCanonical = upsertCanonicalLink(canonicalUrl);

    return () => {
      cleanupMeta();
      cleanupCanonical();
      document.title = 'Design Baker';
    };
  }, [
    blog.id,
    blog.title,
    blog.author,
    blog.date,
    meta.title,
    meta.description,
    meta.imageUrl,
    canonicalUrl,
    env.fbAppId,
    env.twitterSite,
  ]);

  return null;
}
