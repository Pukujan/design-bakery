import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ogThumbnail from '@oni-agent-case-study-v4/app/assets/pukujan-astronaut-saturn.png';
import { PROJECT_NPM_NAME } from '@oni-agent-case-study-v4/app/components/oni/projectLinks';
import { AI_AGENTS_CASE_STUDY_V4_PATH } from '@/lib/caseStudyRoutes';

const SITE_NAME = 'Design Baker';
const META_TITLE = `ONI vs Agent-Ready Architecture (v4) | ${PROJECT_NPM_NAME}`;
const META_DESCRIPTION =
  'Reorganized interactive case study: ONI analogy, agent architecture, 500-agent pipeline, and risk — built around @pukujan/create-modular-monolith.';

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

function upsertLink(rel: string, href: string | undefined) {
  const selector = `link[rel="${rel}"]`;
  const existing = document.head.querySelector(selector);

  if (!href) {
    existing?.remove();
    return;
  }

  const el = (existing ?? document.createElement('link')) as HTMLLinkElement;
  el.setAttribute('rel', rel);
  el.setAttribute('href', href);
  if (!existing) document.head.appendChild(el);
}

function toAbsoluteUrl(pathOrUrl: string): string {
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://') || pathOrUrl.startsWith('data:')) {
    return pathOrUrl;
  }
  if (typeof window !== 'undefined') {
    const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
    return `${window.location.origin}${path}`;
  }
  return pathOrUrl;
}

export function OniCaseStudyV4Head() {
  const { pathname } = useLocation();
  const pageTitle = `${META_TITLE} | ${SITE_NAME}`;
  const canonicalUrl = toAbsoluteUrl(AI_AGENTS_CASE_STUDY_V4_PATH);
  const imageUrl = toAbsoluteUrl(ogThumbnail);

  useEffect(() => {
    document.title = pageTitle;
    upsertMeta('name', 'description', META_DESCRIPTION);
    upsertMeta('property', 'og:type', 'website');
    upsertMeta('property', 'og:site_name', SITE_NAME);
    upsertMeta('property', 'og:title', pageTitle);
    upsertMeta('property', 'og:description', META_DESCRIPTION);
    upsertMeta('property', 'og:url', canonicalUrl);
    upsertMeta('property', 'og:image', imageUrl);
    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', pageTitle);
    upsertMeta('name', 'twitter:description', META_DESCRIPTION);
    upsertMeta('name', 'twitter:image', imageUrl);
    upsertLink('canonical', canonicalUrl);

    return () => {
      document.title = SITE_NAME;
    };
  }, [pageTitle, canonicalUrl, imageUrl, pathname]);

  return null;
}
