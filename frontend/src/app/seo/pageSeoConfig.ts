import {
  AI_AGENTS_CASE_STUDY_PATH,
  EKAGAJPATRA_CASE_STUDY_PATH,
  INVEST_AI_CASE_STUDY_PATH,
  LEGAL_WORKFLOW_RESEARCH_CASE_STUDY_PATH,
} from '@/lib/caseStudyRoutes';
import {
  DEFAULT_OG_IMAGE_PATH,
  DEFAULT_SITE_DESCRIPTION,
  DEFAULT_SITE_TITLE,
  SITE_NAME,
} from './siteSeoDefaults';

export type PageSeoConfig = {
  title: string;
  description: string;
  canonicalPath: string;
  ogImage?: string;
  imageAlt?: string;
  ogTitle?: string;
  ogDescription?: string;
};

export const HOME_PAGE_SEO: PageSeoConfig = {
  title: DEFAULT_SITE_TITLE,
  description: DEFAULT_SITE_DESCRIPTION,
  canonicalPath: '/',
  ogImage: DEFAULT_OG_IMAGE_PATH,
  imageAlt: `${SITE_NAME} — AI/ML, product and design engineer`,
};

export const ABOUT_PAGE_SEO: PageSeoConfig = {
  title: `About | ${SITE_NAME}`,
  description:
    'Designer-engineer and fullstack developer with end-to-end product ownership — from 0→1 concept and UX through production APIs, reliability, and AI-enabled workflows.',
  canonicalPath: '/#about',
  ogImage: DEFAULT_OG_IMAGE_PATH,
  imageAlt: `About ${SITE_NAME}`,
};

export const PROJECTS_PAGE_SEO: PageSeoConfig = {
  title: `Projects & Case Studies | ${SITE_NAME}`,
  description:
    'Live AI products, the platform they run on, and case studies: voice agents, answer engines, maps, civic tech, evals and agent tooling.',
  canonicalPath: '/#projects',
  ogImage: DEFAULT_OG_IMAGE_PATH,
  imageAlt: `${SITE_NAME} engineering projects`,
};

export const CONTACT_PAGE_SEO: PageSeoConfig = {
  title: `Contact | ${SITE_NAME}`,
  description:
    'Contact Design Baker for engineering collaboration, product design, AI workflow systems, and fullstack development.',
  canonicalPath: '/contact',
  ogImage: DEFAULT_OG_IMAGE_PATH,
  imageAlt: `Contact ${SITE_NAME}`,
};

export const RESEARCH_INDEX_SEO: PageSeoConfig = {
  title: `Research | ${SITE_NAME}`,
  description:
    'Working papers on agent reliability, authorization, evals and retrieval, with their evidence and limits.',
  canonicalPath: '/research',
  ogImage: DEFAULT_OG_IMAGE_PATH,
  imageAlt: `${SITE_NAME} research papers`,
};

export const BLOG_INDEX_SEO: PageSeoConfig = {
  title: `Engineering Blog | ${SITE_NAME}`,
  description:
    'Engineering blog on building AI products end to end: systems design, AI workflows, retrieval, evals and agent architecture.',
  canonicalPath: '/blogs',
  ogImage: DEFAULT_OG_IMAGE_PATH,
  imageAlt: `${SITE_NAME} engineering blog`,
};

export const CASE_STUDY_SEO = {
  ekagajpatra: {
    title: `Ekagajpatra Case Study | ${SITE_NAME}`,
    description:
      'Fullstack product engineering case study: civic-tech SaaS that reduced documentation costs up to 99% for 35,000+ users through UX research, guided forms, and document generation.',
    canonicalPath: EKAGAJPATRA_CASE_STUDY_PATH,
    ogImage: '/images/ekagajpatra-logo.png',
    imageAlt: 'Ekagajpatra civic-tech case study',
  },
  investAi: {
    title: `InvestAI Case Study | ${SITE_NAME}`,
    description:
      'InvestAI case study: AI-assisted paper trading and financial reasoning research platform with prompt evaluation, RAG experiments, and market-grounded AI quality measurement.',
    canonicalPath: INVEST_AI_CASE_STUDY_PATH,
    ogImage: DEFAULT_OG_IMAGE_PATH,
    imageAlt: 'InvestAI research platform case study',
  },
  oniV3: {
    title: `ONI vs Agent-Ready Architecture | ${SITE_NAME}`,
    description:
      'Interactive case study: how Oxygen Not Included maps to AI agent pipelines, modular monolith architecture, evals, and audit trails.',
    canonicalPath: AI_AGENTS_CASE_STUDY_PATH,
    ogImage: DEFAULT_OG_IMAGE_PATH,
    imageAlt: 'ONI vs agent-ready architecture case study',
  },
  legalWorkflowResearch: {
    title: `Legal Workflow Research Case Study | ${SITE_NAME}`,
    description:
      'A technical case study on building safer AI systems for litigation operations using document intelligence, confidence routing, authority-aware reasoning, human review, procedural memory, and agent-safe architecture.',
    canonicalPath: LEGAL_WORKFLOW_RESEARCH_CASE_STUDY_PATH,
    ogImage: DEFAULT_OG_IMAGE_PATH,
    imageAlt:
      'Legal Workflow Research: Building Safer AI Systems for Litigation Operations',
    ogTitle: 'Legal Workflow Research: Building Safer AI Systems for Litigation Operations',
    ogDescription:
      'A research ecosystem for legal document intelligence, workflow confidence, human review, procedural memory, and AI-agent architecture.',
  },
} satisfies Record<string, PageSeoConfig>;

/** Sitemap static paths (relative). Blog posts are appended at build time. */
export const SITEMAP_STATIC_PATHS = [
  '/',
  '/blogs',
  EKAGAJPATRA_CASE_STUDY_PATH,
  INVEST_AI_CASE_STUDY_PATH,
  AI_AGENTS_CASE_STUDY_PATH,
  LEGAL_WORKFLOW_RESEARCH_CASE_STUDY_PATH,
] as const;

export { DEFAULT_SITE_DESCRIPTION, DEFAULT_SITE_TITLE };
