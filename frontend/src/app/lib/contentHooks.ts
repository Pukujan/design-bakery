import { useEffect, useMemo, useState } from 'react';
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
const CMS_CACHE_PREFIX = 'design-bakery:cms-content:v1:';

function readCachedContent<T>(cacheKey: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${CMS_CACHE_PREFIX}${cacheKey}`);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeCachedContent<T>(cacheKey: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${CMS_CACHE_PREFIX}${cacheKey}`, JSON.stringify(value));
  } catch {
    // Ignore quota/private-mode failures; CMS data can still render from memory.
  }
}

function useAsyncContent<T>(
  loader: () => Promise<T>,
  fallbackFactory: () => T,
  portfolioId: PortfolioId,
  cacheKey: string
): T {
  const fallback = useMemo(fallbackFactory, [portfolioId, fallbackFactory]);
  const [data, setData] = useState<T>(() => readCachedContent<T>(cacheKey) ?? fallback);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const onPushed = () => setReloadToken((value) => value + 1);
    window.addEventListener(PORTFOLIO_CONTENT_PUSH_EVENT, onPushed);
    return () => window.removeEventListener(PORTFOLIO_CONTENT_PUSH_EVENT, onPushed);
  }, []);

  useEffect(() => {
    const cached = readCachedContent<T>(cacheKey);
    if (cached) setData(cached);
    let active = true;
    void loader()
      .then((next) => {
        if (!active) return;
        setData(next);
        writeCachedContent(cacheKey, next);
      })
      .catch(() => {
        if (active && !cached) setData(fallback);
      });

    return () => {
      active = false;
    };
  }, [portfolioId, reloadToken, fallback, cacheKey]);

  return data;
}

export function useProjectsContent() {
  const { portfolioId } = usePortfolio();
  return useAsyncContent<Project[]>(
    () => getProjects(portfolioId),
    () => PROJECT_FALLBACKS[portfolioId],
    portfolioId,
    `${portfolioId}:projects`,
  );
}

export function useEngineeringSkillsContent() {
  const { portfolioId } = usePortfolio();
  return useAsyncContent<SkillCategory[]>(
    () => getEngineeringSkills(portfolioId),
    () => ENG_SKILLS_FALLBACKS[portfolioId],
    portfolioId,
    `${portfolioId}:engineering-skills`,
  );
}

export function useSocialLinksContent() {
  const { portfolioId } = usePortfolio();
  return useAsyncContent<SocialLink[]>(
    () => getSocialLinks(portfolioId),
    () => SOCIAL_LINKS_FALLBACK,
    portfolioId,
    `${portfolioId}:social-links`,
  );
}

export function useEngineeringHeroSection() {
  const { portfolioId } = usePortfolio();
  return useAsyncContent<EngineeringHeroContent>(
    () => getEngineeringHeroContent(portfolioId),
    () => getHeroFallback(portfolioId),
    portfolioId,
    `${portfolioId}:hero`,
  );
}

export function useEngineeringCommunitySection() {
  const { portfolioId } = usePortfolio();
  return useAsyncContent<EngineeringCommunityContent>(
    () => getEngineeringCommunityContent(portfolioId),
    () => ENGINEERING_COMMUNITY_DEFAULT,
    portfolioId,
    `${portfolioId}:community`,
  );
}

export function useEngineeringAboutSection() {
  const { portfolioId } = usePortfolio();
  return useAsyncContent<EngineeringAboutContent>(
    () => getEngineeringAboutContent(portfolioId),
    () => getAboutFallback(portfolioId),
    portfolioId,
    `${portfolioId}:about`,
  );
}

export function useEngineeringSkillsMetaSection() {
  const { portfolioId } = usePortfolio();
  return useAsyncContent<EngineeringSkillsMeta>(
    () => getEngineeringSkillsMeta(portfolioId),
    () => getSkillsMetaFallback(portfolioId),
    portfolioId,
    `${portfolioId}:skills-meta`,
  );
}

export function useContactSection() {
  const { portfolioId } = usePortfolio();
  return useAsyncContent<ContactSectionContent>(
    () => getContactSectionContent(portfolioId),
    () => CONTACT_SECTION_DEFAULT,
    portfolioId,
    `${portfolioId}:contact-section`,
  );
}

export function useFooterSection() {
  const { portfolioId } = usePortfolio();
  return useAsyncContent<FooterContent>(
    () => getFooterContent(portfolioId),
    () => FOOTER_CONTENT_DEFAULT,
    portfolioId,
    `${portfolioId}:footer`,
  );
}

export function useRelevantExperienceContent() {
  const { portfolioId } = usePortfolio();
  return useAsyncContent<RelevantExperienceContent>(
    () => getRelevantExperienceContent(portfolioId),
    () => getExperienceFallback(portfolioId),
    portfolioId,
    `${portfolioId}:relevant-experience`,
  );
}
