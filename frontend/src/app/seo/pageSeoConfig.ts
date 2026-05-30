import {
  AI_AGENTS_CASE_STUDY_PATH,
  AI_AGENTS_CASE_STUDY_V4_PATH,
  EKAGAJPATRA_CASE_STUDY_PATH,
  INVEST_AI_CASE_STUDY_PATH,
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
};

export const HOME_PAGE_SEO: PageSeoConfig = {
  title: DEFAULT_SITE_TITLE,
  description:
    'I build AI-assisted workflow systems for complex operational environments — combining document classification, RAG, OCR production work, and litigation workflow research with fullstack product ownership.',
  canonicalPath: '/',
  ogImage: DEFAULT_OG_IMAGE_PATH,
  imageAlt: `${SITE_NAME} — fullstack design engineer portfolio`,
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
    'Engineering projects and case studies across civic tech, legal AI, document intelligence, financial reasoning research, and agent-ready architecture.',
  canonicalPath: '/#projects',
  ogImage: DEFAULT_OG_IMAGE_PATH,
  imageAlt: `${SITE_NAME} engineering projects`,
};

export const CONTACT_PAGE_SEO: PageSeoConfig = {
  title: `Contact | ${SITE_NAME}`,
  description:
    'Contact Design Baker for engineering collaboration, product design, AI workflow systems, and fullstack development.',
  canonicalPath: '/#contact',
  ogImage: DEFAULT_OG_IMAGE_PATH,
  imageAlt: `Contact ${SITE_NAME}`,
};

export const BLOG_INDEX_SEO: PageSeoConfig = {
  title: `Engineering Blog | ${SITE_NAME}`,
  description:
    'Engineering blog on systems design, AI workflows, document intelligence, legal-tech product engineering, and agent architecture.',
  canonicalPath: '/blogs',
  ogImage: DEFAULT_OG_IMAGE_PATH,
  imageAlt: `${SITE_NAME} engineering blog`,
};

export const DESIGN_PORTFOLIO_SEO: PageSeoConfig = {
  title: `Design Portfolio | ${SITE_NAME}`,
  description:
    'Product design portfolio — web design, visual systems, community work, and design-led engineering.',
  canonicalPath: '/design',
  ogImage: DEFAULT_OG_IMAGE_PATH,
  imageAlt: `${SITE_NAME} design portfolio`,
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
  oniV4: {
    title: `ONI vs Agent-Ready Architecture (v4) | ${SITE_NAME}`,
    description:
      'Reorganized interactive case study: ONI analogy, agent architecture, 500-agent pipeline, and risk — built around modular monolith engineering.',
    canonicalPath: AI_AGENTS_CASE_STUDY_V4_PATH,
    ogImage: DEFAULT_OG_IMAGE_PATH,
    imageAlt: 'ONI vs agent-ready architecture v4 case study',
  },
} satisfies Record<string, PageSeoConfig>;

/** Sitemap static paths (relative). Blog posts are appended at build time. */
export const SITEMAP_STATIC_PATHS = [
  '/',
  '/#about',
  '/#projects',
  '/#contact',
  '/blogs',
  '/endtoend-engineer/blogs',
  '/endtoend-engineer',
  '/design',
  EKAGAJPATRA_CASE_STUDY_PATH,
  INVEST_AI_CASE_STUDY_PATH,
  AI_AGENTS_CASE_STUDY_PATH,
  AI_AGENTS_CASE_STUDY_V4_PATH,
] as const;

export { DEFAULT_SITE_DESCRIPTION, DEFAULT_SITE_TITLE };
