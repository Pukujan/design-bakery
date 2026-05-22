import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import type { Blog } from '@/modules/engineering/blogData';
import { resolveBlogMeta } from '@/modules/engineering/blogMeta';

function upsertMeta(
  attribute: 'name' | 'property',
  key: string,
  content: string | undefined,
) {
  const selector = `meta[${attribute}="${key}"]`;
  const existing = document.head.querySelector(selector);

  if (!content) {
    existing?.remove();
    return;
  }

  const el = (existing ?? document.createElement('meta')) as HTMLMetaElement;
  el.setAttribute(attribute, key);
  el.setAttribute('content', content);
  if (!existing) document.head.appendChild(el);
}

/**
 * Sets document title and social meta tags for a blog detail view.
 * guidelines/agent-devlog-engineering-blog-posts.md
 */
export function BlogPostHead({ blog }: { blog: Blog }) {
  const { pathname } = useLocation();
  const meta = resolveBlogMeta(blog);
  const canonicalUrl =
    typeof window !== 'undefined' ? `${window.location.origin}${pathname}` : pathname;

  useEffect(() => {
    document.title = meta.title;
    upsertMeta('name', 'description', meta.description);
    upsertMeta('property', 'og:type', 'article');
    upsertMeta('property', 'og:title', meta.title);
    upsertMeta('property', 'og:description', meta.description);
    upsertMeta('property', 'og:url', canonicalUrl);
    upsertMeta('property', 'og:image', meta.imageUrl);
    upsertMeta('name', 'twitter:card', meta.imageUrl ? 'summary_large_image' : 'summary');
    upsertMeta('name', 'twitter:title', meta.title);
    upsertMeta('name', 'twitter:description', meta.description);
    upsertMeta('name', 'twitter:image', meta.imageUrl);

    return () => {
      document.title = 'Design Baker';
    };
  }, [blog.id, meta.title, meta.description, meta.imageUrl, canonicalUrl]);

  return null;
}
