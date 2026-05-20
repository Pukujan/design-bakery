import { useEffect } from 'react';
import type { Blog } from '@/modules/engineering/blogData';
import {
  resolveBlogMetaDescription,
  resolveBlogMetaTitle,
} from '@/modules/engineering/blogSeo';

const DEFAULT_TITLE = 'Design Baker';

function upsertMeta(
  selector: string,
  attrs: Record<string, string>,
  createTag: 'meta' | 'link' = 'meta'
) {
  let el = document.querySelector(selector);
  if (!el) {
    el = document.createElement(createTag);
    for (const [key, value] of Object.entries(attrs)) {
      el.setAttribute(key, value);
    }
    document.head.appendChild(el);
    return;
  }
  for (const [key, value] of Object.entries(attrs)) {
    el.setAttribute(key, value);
  }
}

type BlogPostHeadProps = {
  blog: Blog;
  siteLabel?: string;
};

/**
 * Sets document title and meta/OG tags from blog.seo (Slice 2).
 * Lives in engineering module — not imported from agent module.
 */
export function BlogPostHead({ blog, siteLabel = 'Design Bakery' }: BlogPostHeadProps) {
  useEffect(() => {
    const metaTitle = resolveBlogMetaTitle(blog.title, blog.seo);
    const metaDescription = resolveBlogMetaDescription(blog.excerpt, blog.seo);
    const pageTitle = `${metaTitle} | ${siteLabel}`;
    const canonical = typeof window !== 'undefined' ? window.location.href : '';

    const previousTitle = document.title;
    document.title = pageTitle;

    upsertMeta('meta[name="description"]', { name: 'description', content: metaDescription });
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: metaTitle });
    upsertMeta('meta[property="og:description"]', {
      property: 'og:description',
      content: metaDescription,
    });
    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: 'article' });

    if (blog.seo?.ogImage?.trim()) {
      upsertMeta('meta[property="og:image"]', {
        property: 'og:image',
        content: blog.seo.ogImage.trim(),
      });
    }

    if (canonical) {
      upsertMeta('link[rel="canonical"]', { rel: 'canonical', href: canonical }, 'link');
    }

    return () => {
      document.title = previousTitle || DEFAULT_TITLE;
    };
  }, [blog, siteLabel]);

  return null;
}
