import { BLOG_INDEX_SEO } from './pageSeoConfig';
import { PageSeo } from './PageSeo';

export function BlogListHead() {
  return (
    <PageSeo
      title={BLOG_INDEX_SEO.title}
      description={BLOG_INDEX_SEO.description}
      canonicalPath={BLOG_INDEX_SEO.canonicalPath}
      ogImage={BLOG_INDEX_SEO.ogImage}
      imageAlt={BLOG_INDEX_SEO.imageAlt}
    />
  );
}
