import { useLocation } from 'react-router-dom';
import { BLOG_INDEX_SEO } from './pageSeoConfig';
import { PageSeo } from './PageSeo';

export function BlogListHead() {
  const { pathname } = useLocation();

  return (
    <PageSeo
      title={BLOG_INDEX_SEO.title}
      description={BLOG_INDEX_SEO.description}
      canonicalPath={pathname}
      ogImage={BLOG_INDEX_SEO.ogImage}
      imageAlt={BLOG_INDEX_SEO.imageAlt}
    />
  );
}
