import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import type { Blog } from '@/modules/blog/data/blogData';
import { resolveBlogMeta } from '@/modules/blog/seo/blogMeta';
import { toAbsoluteSiteUrl } from '@/lib/siteUrl';
import {
  collectBlogSocialMetaTags,
  readClientSocialEnv,
} from '@og/blogSocialMeta';

/**
 * Dynamic SEO for blog detail — title, description, canonical, robots, OG, Twitter.
 * Crawler HTML is still served by Vercel middleware; Helmet updates the SPA document head.
 */
export function BlogPostHead({ blog }: { blog: Blog }) {
  const { pathname } = useLocation();
  const meta = resolveBlogMeta(blog);
  const canonicalUrl = toAbsoluteSiteUrl(pathname);
  const env = readClientSocialEnv();
  const tags = collectBlogSocialMetaTags({
    pageTitle: meta.pageTitle,
    description: meta.description,
    canonicalUrl,
    ogImage: meta.imageUrl,
    imageAlt: blog.title,
    author: blog.author,
    publishedTime: blog.publishedAt ?? blog.date,
    fbAppId: env.fbAppId,
    twitterSite: env.twitterSite,
  });

  return (
    <Helmet prioritizeSeoTags>
      <title>{meta.documentTitle}</title>
      <link rel="canonical" href={canonicalUrl} />
      {meta.imageUrl ? <link rel="image_src" href={meta.imageUrl} /> : null}
      {tags.map((tag) =>
        tag.attribute === 'name' ? (
          <meta key={`name:${tag.key}`} name={tag.key} content={tag.content} />
        ) : (
          <meta key={`property:${tag.key}`} property={tag.key} content={tag.content} />
        ),
      )}
    </Helmet>
  );
}
