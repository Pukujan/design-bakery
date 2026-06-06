import { useEffect, useState } from 'react';
import { usePortfolio } from '../portfolios/PortfolioContext';
import type { PortfolioId } from '../portfolios/registry';
import {
  getProjects,
  type Project,
  getEngineeringSkills,
  type SkillCategory,
  getSocialLinks,
  type SocialLink,
  getEngineeringHeroContent,
  type EngineeringHeroContent,
  getEngineeringCommunityContent,
  type EngineeringCommunityContent,
  ENGINEERING_COMMUNITY_DEFAULT,
  getEngineeringAboutContent,
  type EngineeringAboutContent,
  getEngineeringSkillsMeta,
  type EngineeringSkillsMeta,
  getContactSectionContent,
  type ContactSectionContent,
  CONTACT_SECTION_DEFAULT,
  getFooterContent,
  type FooterContent,
  FOOTER_CONTENT_DEFAULT,
  getRelevantExperienceContent,
  type RelevantExperienceContent,
  PORTFOLIO_CONTENT_PUSH_EVENT,
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

function useAsyncContent<T>(
  loader: () => Promise<T>,
  fallback: T,
  portfolioId: PortfolioId
): T {
  const [data, setData] = useState<T>(fallback);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const onPushed = () => setReloadToken((value) => value + 1);
    window.addEventListener(PORTFOLIO_CONTENT_PUSH_EVENT, onPushed);
    return () => window.removeEventListener(PORTFOLIO_CONTENT_PUSH_EVENT, onPushed);
  }, []);

  useEffect(() => {
    setData(fallback);
    let active = true;
    void loader()
      .then((next) => {
        if (active) setData(next);
      })
      .catch(() => {
        if (active) setData(fallback);
      });

    return () => {
      active = false;
    };
  }, [portfolioId, reloadToken, fallback]);

  return data;
}

export function useProjectsContent() {
  const { portfolioId } = usePortfolio();
  const fallback = PROJECT_FALLBACKS[portfolioId];
  return useAsyncContent<Project[]>(() => getProjects(portfolioId), fallback, portfolioId);
}

export function useEngineeringSkillsContent() {
  const { portfolioId } = usePortfolio();
  const fallback = ENG_SKILLS_FALLBACKS[portfolioId];
  return useAsyncContent<SkillCategory[]>(
    () => getEngineeringSkills(portfolioId),
    fallback,
    portfolioId
  );
}

export function useSocialLinksContent() {
  const { portfolioId } = usePortfolio();
  return useAsyncContent<SocialLink[]>(
    () => getSocialLinks(portfolioId),
    SOCIAL_LINKS_FALLBACK,
    portfolioId
  );
}

export function useEngineeringHeroSection() {
  const { portfolioId } = usePortfolio();
  return useAsyncContent<EngineeringHeroContent>(
    () => getEngineeringHeroContent(portfolioId),
    getHeroFallback(portfolioId),
    portfolioId
  );
}

export function useEngineeringCommunitySection() {
  const { portfolioId } = usePortfolio();
  return useAsyncContent<EngineeringCommunityContent>(
    () => getEngineeringCommunityContent(portfolioId),
    ENGINEERING_COMMUNITY_DEFAULT,
    portfolioId
  );
}

export function useEngineeringAboutSection() {
  const { portfolioId } = usePortfolio();
  return useAsyncContent<EngineeringAboutContent>(
    () => getEngineeringAboutContent(portfolioId),
    getAboutFallback(portfolioId),
    portfolioId
  );
}

export function useEngineeringSkillsMetaSection() {
  const { portfolioId } = usePortfolio();
  return useAsyncContent<EngineeringSkillsMeta>(
    () => getEngineeringSkillsMeta(portfolioId),
    getSkillsMetaFallback(portfolioId),
    portfolioId
  );
}

export function useContactSection() {
  const { portfolioId } = usePortfolio();
  return useAsyncContent<ContactSectionContent>(
    () => getContactSectionContent(portfolioId),
    CONTACT_SECTION_DEFAULT,
    portfolioId
  );
}

export function useFooterSection() {
  const { portfolioId } = usePortfolio();
  return useAsyncContent<FooterContent>(
    () => getFooterContent(portfolioId),
    FOOTER_CONTENT_DEFAULT,
    portfolioId
  );
}

export function useRelevantExperienceContent() {
  const { portfolioId } = usePortfolio();
  return useAsyncContent<RelevantExperienceContent>(
    () => getRelevantExperienceContent(portfolioId),
    getExperienceFallback(portfolioId),
    portfolioId
  );
}
