import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import type { Blog } from '@/modules/blog/data/blogData';
import { resolveBlogMeta } from '@/modules/blog/seo/blogMeta';
import { PageSeo } from '@/seo/PageSeo';

/** Dynamic SEO for blog detail — title, description, canonical, robots, OG, Twitter. */
export function BlogPostHead({ blog }: { blog: Blog }) {
  const { pathname } = useLocation();
  const meta = resolveBlogMeta(blog);

  return (
    <PageSeo
      title={meta.documentTitle}
      description={meta.description}
      canonicalPath={pathname}
      ogImage={meta.imageUrl}
      imageAlt={blog.title}
      ogType="article"
      author={blog.author}
      publishedTime={blog.publishedAt ?? blog.date}
    />
  );
}
