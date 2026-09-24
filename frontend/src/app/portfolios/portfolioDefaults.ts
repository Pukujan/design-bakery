import type { PortfolioId } from './registry';
import type {
  EngineeringHeroContent,
  EngineeringAboutContent,
  EngineeringSkillsMeta,
  RelevantExperienceContent,
  Project,
  SkillCategory,
} from '../lib/adminContentService';
import { ENGINEERING_SKILLS_META_DEFAULT } from '../lib/engineeringStaticDefaults';

import _engSkillsJson from '../modules/engineering/EngineeringSkills/skill-categories.json';
import eteHero from './endtoend-engineer/engineering/hero.json';
import eteAbout from './endtoend-engineer/engineering/about.json';
import eteExperience from './endtoend-engineer/engineering/relevant-experience.json';
// Experience list currently rendered on the homepage (formerly the legal-workflow-engineer
// profile's list, moved here in TASK-DB-0049 so rendered content is unchanged).
import eteRenderedExperienceList from './endtoend-engineer/engineering/relevant-experience-rendered-list.json';
import _eteProjectsJson from './endtoend-engineer/engineering/projects.json';

export const PROJECT_FALLBACKS: Record<PortfolioId, Project[]> = {
  'endtoend-engineer': _eteProjectsJson as unknown as Project[],
};

export const ENG_SKILLS_FALLBACKS: Record<PortfolioId, SkillCategory[]> = {
  'endtoend-engineer': _engSkillsJson as SkillCategory[],
};

export function getHeroFallback(_portfolioId: PortfolioId): EngineeringHeroContent {
  return eteHero as EngineeringHeroContent;
}

export function getAboutFallback(_portfolioId: PortfolioId): EngineeringAboutContent {
  return eteAbout as EngineeringAboutContent;
}

export function getSkillsMetaFallback(_portfolioId: PortfolioId): EngineeringSkillsMeta {
  return ENGINEERING_SKILLS_META_DEFAULT;
}

const eteExperienceMerged: RelevantExperienceContent = {
  ...(eteRenderedExperienceList as RelevantExperienceContent),
  subtitle: (eteExperience as RelevantExperienceContent).subtitle,
};

export function getExperienceFallback(_portfolioId: PortfolioId): RelevantExperienceContent {
  return eteExperienceMerged;
}
