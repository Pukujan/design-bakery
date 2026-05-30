import { Helmet } from 'react-helmet-async';
import { toAbsoluteSiteUrl } from '@/lib/siteUrl';
import {
  collectPageSocialMetaTags,
  readClientSocialEnv,
  SITE_NAME as OG_SITE_NAME,
} from '@og/blogSocialMeta';
import {
  DEFAULT_OG_IMAGE_PATH,
  DEFAULT_ROBOTS,
  SITE_NAME,
} from './siteSeoDefaults';
import type { PageSeoConfig } from './pageSeoConfig';

export type PageSeoProps = PageSeoConfig & {
  ogType?: 'website' | 'article';
  robots?: string;
  author?: string;
  publishedTime?: string;
};

export function PageSeo({
  title,
  description,
  canonicalPath,
  ogImage,
  imageAlt,
  ogType = 'website',
  robots = DEFAULT_ROBOTS,
  author,
  publishedTime,
}: PageSeoProps) {
  const canonicalUrl = toAbsoluteSiteUrl(canonicalPath);
  const resolvedOgImage = toAbsoluteSiteUrl(ogImage ?? DEFAULT_OG_IMAGE_PATH);
  const env = readClientSocialEnv();
  const tags = collectPageSocialMetaTags({
    pageTitle: title,
    description,
    canonicalUrl,
    ogImage: resolvedOgImage,
    imageAlt: imageAlt ?? title,
    ogType,
    robots,
    author,
    publishedTime,
    siteName: SITE_NAME,
    fbAppId: env.fbAppId,
    twitterSite: env.twitterSite,
  });

  return (
    <Helmet prioritizeSeoTags>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonicalUrl} />
      <link rel="image_src" href={resolvedOgImage} />
      <meta property="og:site_name" content={OG_SITE_NAME} />
      {tags
        .filter(
          (tag) =>
            !(
              tag.key === 'description' ||
              tag.key === 'robots' ||
              tag.key === 'og:site_name'
            ),
        )
        .map((tag) =>
          tag.attribute === 'name' ? (
            <meta key={`name:${tag.key}`} name={tag.key} content={tag.content} />
          ) : (
            <meta key={`property:${tag.key}`} property={tag.key} content={tag.content} />
          ),
        )}
    </Helmet>
  );
}

export function DefaultSiteHead() {
  return (
    <PageSeo
      title={`${SITE_NAME} | Fullstack Design Engineer`}
      description="Fullstack design engineer portfolio — AI workflow systems, document intelligence, legal-tech products, and interactive case studies."
      canonicalPath="/"
    />
  );
}

export function AdminSeoHead() {
  return (
    <PageSeo
      title={`Admin | ${SITE_NAME}`}
      description="Private admin area."
      canonicalPath="/admin"
      robots="noindex, nofollow"
    />
  );
}
