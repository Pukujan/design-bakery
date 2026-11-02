import { useMemo } from 'react';
import { usePortfolio } from '../portfolios/PortfolioContext';
import { usePortfolioDoc } from './portfolioDocs';
import type { PortfolioId } from '../portfolios/registry';
import {
  type Project,
  type SkillCategory,
  type SocialLink,
  ENGINEERING_COMMUNITY_DEFAULT,
  type EngineeringAboutContent,
  type EngineeringSkillsMeta,
  type ContactSectionContent,
  CONTACT_SECTION_DEFAULT,
  type FooterContent,
  FOOTER_CONTENT_DEFAULT,
  type RelevantExperienceContent,
} from './adminContentService';
import {
  PROJECT_FALLBACKS,
  ENG_SKILLS_FALLBACKS,
  getHeroFallback,
  getAboutFallback,
  getSkillsMetaFallback,
  getExperienceFallback,
  ETE_EXPERIENCE_BASE,
  ETE_EXPERIENCE_RENDERED,
} from '../portfolios/portfolioDefaults';
import _socialLinksJson from '../components/social-links.json';

const SOCIAL_LINKS_FALLBACK = _socialLinksJson as SocialLink[];
function useStaticContent<T>(value: T): T {
  return value;
}

/** Octo serves the main portfolio's documents; other portfolios keep their bundled defaults. */
const octoDoc = (portfolioId: PortfolioId, collection: string) =>
  portfolioId === 'endtoend-engineer' ? collection : null;

export function useProjectsContent() {
  const { portfolioId } = usePortfolio();
  return usePortfolioDoc<Project[]>(octoDoc(portfolioId, 'engineering_projects'), PROJECT_FALLBACKS[portfolioId]);
}

export function useEngineeringSkillsContent() {
  const { portfolioId } = usePortfolio();
  return usePortfolioDoc<SkillCategory[]>(octoDoc(portfolioId, 'engineering_skills'), ENG_SKILLS_FALLBACKS[portfolioId]);
}

export function useSocialLinksContent() {
  usePortfolio();
  return useStaticContent<SocialLink[]>(SOCIAL_LINKS_FALLBACK);
}

export function useEngineeringHeroSection() {
  const { portfolioId } = usePortfolio();
  return usePortfolioDoc(octoDoc(portfolioId, 'engineering_hero_content'), getHeroFallback(portfolioId));
}

export function useEngineeringCommunitySection() {
  usePortfolio();
  return useStaticContent(ENGINEERING_COMMUNITY_DEFAULT);
}

export function useEngineeringAboutSection() {
  const { portfolioId } = usePortfolio();
  return usePortfolioDoc<EngineeringAboutContent>(octoDoc(portfolioId, 'engineering_about_content'), getAboutFallback(portfolioId));
}

export function useEngineeringSkillsMetaSection() {
  const { portfolioId } = usePortfolio();
  return usePortfolioDoc<EngineeringSkillsMeta>(octoDoc(portfolioId, 'engineering_skills_meta'), getSkillsMetaFallback(portfolioId));
}

export function useContactSection() {
  usePortfolio();
  return useStaticContent<ContactSectionContent>(CONTACT_SECTION_DEFAULT);
}

export function useFooterSection() {
  usePortfolio();
  return useStaticContent<FooterContent>(FOOTER_CONTENT_DEFAULT);
}

/** The experience list is the rendered list from Octo, with the subtitle from the base document, as the repo merges them. */
export function useRelevantExperienceContent() {
  const { portfolioId } = usePortfolio();
  const base = usePortfolioDoc<RelevantExperienceContent>(octoDoc(portfolioId, 'relevant_experience_content'), ETE_EXPERIENCE_BASE);
  const rendered = usePortfolioDoc<RelevantExperienceContent>(octoDoc(portfolioId, 'relevant_experience_rendered'), ETE_EXPERIENCE_RENDERED);
  return useMemo<RelevantExperienceContent>(
    () => (portfolioId === 'endtoend-engineer' ? { ...rendered, subtitle: base.subtitle } : getExperienceFallback(portfolioId)),
    [portfolioId, base, rendered],
  );
}
