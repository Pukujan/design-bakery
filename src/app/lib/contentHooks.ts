import { useEffect, useState } from 'react';
import {
  getProjects,
  type Project,
  getEngineeringSkills,
  type SkillCategory,
  getSocialLinks,
  type SocialLink,
  getEngineeringHeroContent,
  type EngineeringHeroContent,
  ENGINEERING_HERO_DEFAULT,
  getEngineeringCommunityContent,
  type EngineeringCommunityContent,
  ENGINEERING_COMMUNITY_DEFAULT,
  getEngineeringAboutContent,
  type EngineeringAboutContent,
  ENGINEERING_ABOUT_DEFAULT,
  getEngineeringSkillsMeta,
  type EngineeringSkillsMeta,
  ENGINEERING_SKILLS_META_DEFAULT,
  getContactSectionContent,
  type ContactSectionContent,
  CONTACT_SECTION_DEFAULT,
  getFooterContent,
  type FooterContent,
  FOOTER_CONTENT_DEFAULT,
  getRelevantExperienceContent,
  type RelevantExperienceContent,
  RELEVANT_EXPERIENCE_DEFAULT,
} from './adminContentService';

function useAsyncContent<T>(loader: () => Promise<T>, fallback: T): T {
  const [data, setData] = useState<T>(fallback);

  useEffect(() => {
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
    // Intentionally run once per mount; loaders are stable module functions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return data;
}

export function useProjectsContent() {
  return useAsyncContent<Project[]>(() => getProjects(), []);
}

export function useEngineeringSkillsContent() {
  return useAsyncContent<SkillCategory[]>(() => getEngineeringSkills(), []);
}

export function useSocialLinksContent() {
  return useAsyncContent<SocialLink[]>(() => getSocialLinks(), []);
}

export function useEngineeringHeroSection() {
  return useAsyncContent<EngineeringHeroContent>(
    () => getEngineeringHeroContent(),
    ENGINEERING_HERO_DEFAULT
  );
}

export function useEngineeringCommunitySection() {
  return useAsyncContent<EngineeringCommunityContent>(
    () => getEngineeringCommunityContent(),
    ENGINEERING_COMMUNITY_DEFAULT
  );
}

export function useEngineeringAboutSection() {
  return useAsyncContent<EngineeringAboutContent>(
    () => getEngineeringAboutContent(),
    ENGINEERING_ABOUT_DEFAULT
  );
}

export function useEngineeringSkillsMetaSection() {
  return useAsyncContent<EngineeringSkillsMeta>(
    () => getEngineeringSkillsMeta(),
    ENGINEERING_SKILLS_META_DEFAULT
  );
}

export function useContactSection() {
  return useAsyncContent<ContactSectionContent>(
    () => getContactSectionContent(),
    CONTACT_SECTION_DEFAULT
  );
}

export function useFooterSection() {
  return useAsyncContent<FooterContent>(() => getFooterContent(), FOOTER_CONTENT_DEFAULT);
}

export function useRelevantExperienceContent() {
  return useAsyncContent<RelevantExperienceContent>(
    () => getRelevantExperienceContent(),
    RELEVANT_EXPERIENCE_DEFAULT
  );
}
