/**
 * Crawler / link-preview meta for SPA case study routes (Vercel Edge middleware).
 * Edge-safe: no @/ path aliases or app/seo imports.
 */

import { DEFAULT_OG_IMAGE_PATH, SITE_NAME } from '../app/seo/siteSeoDefaults.js';
import type { BlogSocialMetaInput } from './blogSocialMeta.js';

type CaseStudyShareEntry = {
  title: string;
  description: string;
  canonicalPath: string;
  ogImage?: string;
  imageAlt?: string;
  ogTitle?: string;
  ogDescription?: string;
};

const CASE_STUDY_SHARE_ENTRIES: CaseStudyShareEntry[] = [
  {
    title: `Ekagajpatra Case Study | ${SITE_NAME}`,
    description:
      'Fullstack product engineering case study: civic-tech SaaS that reduced documentation costs up to 99% for 35,000+ users through UX research, guided forms, and document generation.',
    canonicalPath: '/case-studies/ekagajpatra',
    ogImage: '/images/ekagajpatra-logo.png',
    imageAlt: 'Ekagajpatra civic-tech case study',
  },
  {
    title: `InvestAI Case Study | ${SITE_NAME}`,
    description:
      'InvestAI case study: AI-assisted paper trading and financial reasoning research platform with prompt evaluation, RAG experiments, and market-grounded AI quality measurement.',
    canonicalPath: '/case-studies/invest-ai',
    ogImage: DEFAULT_OG_IMAGE_PATH,
    imageAlt: 'InvestAI research platform case study',
  },
  {
    title: `ONI vs Agent-Ready Architecture | ${SITE_NAME}`,
    description:
      'Interactive case study: how Oxygen Not Included maps to AI agent pipelines, modular monolith architecture, evals, and audit trails.',
    canonicalPath: '/case-studies/ai-agents/v3',
    ogImage: DEFAULT_OG_IMAGE_PATH,
    imageAlt: 'ONI vs agent-ready architecture case study',
  },
  {
    title: `ONI vs Agent-Ready Architecture (v4) | ${SITE_NAME}`,
    description:
      'Reorganized interactive case study: ONI analogy, agent architecture, 500-agent pipeline, and risk — built around modular monolith engineering.',
    canonicalPath: '/case-studies/ai-agents/v4',
    ogImage: DEFAULT_OG_IMAGE_PATH,
    imageAlt: 'ONI vs agent-ready architecture v4 case study',
  },
  {
    title: `Legal Workflow Research Case Study | ${SITE_NAME}`,
    description:
      'A technical case study on building safer AI systems for litigation operations using document intelligence, confidence routing, authority-aware reasoning, human review, procedural memory, and agent-safe architecture.',
    canonicalPath: '/case-studies/legal-workflow-research',
    ogImage: DEFAULT_OG_IMAGE_PATH,
    imageAlt: 'Legal Workflow Research: Building Safer AI Systems for Litigation Operations',
    ogTitle: 'Legal Workflow Research: Building Safer AI Systems for Litigation Operations',
    ogDescription:
      'A research ecosystem for legal document intelligence, workflow confidence, human review, procedural memory, and AI-agent architecture.',
  },
];

function normalizePath(pathname: string): string {
  if (!pathname || pathname === '/') return '/';
  return pathname.endsWith('/') && pathname.length > 1
    ? pathname.slice(0, -1)
    : pathname;
}

export function resolveCaseStudyShareMeta(
  pathname: string,
  siteOrigin: string,
): (BlogSocialMetaInput & { ogType: 'article' }) | null {
  const normalized = normalizePath(pathname);
  const seo = CASE_STUDY_SHARE_ENTRIES.find(
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
