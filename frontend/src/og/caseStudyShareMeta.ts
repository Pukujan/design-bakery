/** Crawler / link-preview meta for SPA case study routes (Vercel Edge middleware). */

import { CASE_STUDY_SEO, type PageSeoConfig } from '../app/seo/pageSeoConfig.js';
import { DEFAULT_OG_IMAGE_PATH, SITE_NAME } from '../app/seo/siteSeoDefaults.js';
import type { BlogSocialMetaInput } from './blogSocialMeta.js';

const LEGAL_DEMO_PATH =
  '/case-studies/legal-workflow-research/legal_workflow_interactive_demo_v5.html';

const LEGAL_DEMO_SEO: PageSeoConfig = {
  title: 'Legal Workflow AI · Guided Recruiter Demo',
  description:
    'Interactive recruiter demo: Bill of Particulars workflow, OPA authorization email, source review, and simulated court filing — synthetic case data.',
  canonicalPath: LEGAL_DEMO_PATH,
  ogImage: DEFAULT_OG_IMAGE_PATH,
  imageAlt: 'Legal Workflow interactive recruiter demo',
  ogTitle: 'Legal Workflow AI · Guided Recruiter Demo',
  ogDescription:
    'Walk through a paralegal case dashboard: draft OPA authorization, review sources, and finalize the Bill of Particulars.',
};

const EXTRA_BY_PATH: Record<string, PageSeoConfig> = {
  [LEGAL_DEMO_PATH]: LEGAL_DEMO_SEO,
};

function normalizePath(pathname: string): string {
  if (!pathname || pathname === '/') return '/';
  return pathname.endsWith('/') && pathname.length > 1
    ? pathname.slice(0, -1)
    : pathname;
}

function allCaseStudyConfigs(): PageSeoConfig[] {
  return [...Object.values(CASE_STUDY_SEO), ...Object.values(EXTRA_BY_PATH)];
}

export function resolveCaseStudyShareMeta(
  pathname: string,
  siteOrigin: string,
): (BlogSocialMetaInput & { ogType: 'article' }) | null {
  const normalized = normalizePath(pathname);
  const seo = allCaseStudyConfigs().find(
    (entry) => normalizePath(entry.canonicalPath) === normalized,
  );
  if (!seo) return null;

  const ogPath = seo.ogImage ?? DEFAULT_OG_IMAGE_PATH;
  const ogImage = ogPath.startsWith('http') ? ogPath : `${siteOrigin}${ogPath}`;

  return {
    pageTitle: seo.ogTitle ?? seo.title,
    description: seo.ogDescription ?? seo.description,
    canonicalUrl: `${siteOrigin}${seo.canonicalPath}`,
    ogImage,
    imageAlt: seo.imageAlt ?? seo.title,
    siteName: SITE_NAME,
    ogType: 'article',
  };
}

export function isCaseStudySharePath(pathname: string): boolean {
  return resolveCaseStudyShareMeta(pathname, 'https://example.com') !== null;
}
