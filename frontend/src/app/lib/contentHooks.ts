import { usePortfolio } from '../portfolios/PortfolioContext';
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
} from '../portfolios/portfolioDefaults';
import _socialLinksJson from '../components/social-links.json';

const SOCIAL_LINKS_FALLBACK = _socialLinksJson as SocialLink[];
function useStaticContent<T>(value: T): T {
  return value;
}

export function useProjectsContent() {
  const { portfolioId } = usePortfolio();
  return useStaticContent<Project[]>(PROJECT_FALLBACKS[portfolioId]);
}

export function useEngineeringSkillsContent() {
  const { portfolioId } = usePortfolio();
  return useStaticContent<SkillCategory[]>(ENG_SKILLS_FALLBACKS[portfolioId]);
}

export function useSocialLinksContent() {
  usePortfolio();
  return useStaticContent<SocialLink[]>(SOCIAL_LINKS_FALLBACK);
}

export function useEngineeringHeroSection() {
  const { portfolioId } = usePortfolio();
  return useStaticContent(getHeroFallback(portfolioId));
}

export function useEngineeringCommunitySection() {
  usePortfolio();
  return useStaticContent(ENGINEERING_COMMUNITY_DEFAULT);
}

export function useEngineeringAboutSection() {
  const { portfolioId } = usePortfolio();
  return useStaticContent<EngineeringAboutContent>(getAboutFallback(portfolioId));
}

export function useEngineeringSkillsMetaSection() {
  const { portfolioId } = usePortfolio();
  return useStaticContent<EngineeringSkillsMeta>(getSkillsMetaFallback(portfolioId));
}

export function useContactSection() {
  usePortfolio();
  return useStaticContent<ContactSectionContent>(CONTACT_SECTION_DEFAULT);
}

export function useFooterSection() {
  usePortfolio();
  return useStaticContent<FooterContent>(FOOTER_CONTENT_DEFAULT);
}

export function useRelevantExperienceContent() {
  const { portfolioId } = usePortfolio();
  return useStaticContent<RelevantExperienceContent>(getExperienceFallback(portfolioId));
}
