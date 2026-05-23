import type { PortfolioId } from './registry';
import type {
  EngineeringHeroContent,
  EngineeringAboutContent,
  EngineeringSkillsMeta,
  RelevantExperienceContent,
  Project,
  SkillCategory,
} from '../lib/adminContentService';
import {
  ENGINEERING_HERO_DEFAULT,
  ENGINEERING_ABOUT_DEFAULT,
  ENGINEERING_SKILLS_META_DEFAULT,
  RELEVANT_EXPERIENCE_DEFAULT,
} from '../lib/engineeringStaticDefaults';

import _projectsJson from '../modules/engineering/EngineeringProjects/projects.json';
import _engSkillsJson from '../modules/engineering/EngineeringSkills/skill-categories.json';
import aiHero from './ai-engineer/engineering/hero.json';
import aiAbout from './ai-engineer/engineering/about.json';
import aiExperience from './ai-engineer/engineering/relevant-experience.json';
import _aiProjectsJson from './ai-engineer/engineering/projects.json';
import _aiEngSkillsJson from './ai-engineer/engineering/skill-categories.json';
import lweHero from './legal-workflow-engineer/engineering/hero.json';
import lweAbout from './legal-workflow-engineer/engineering/about.json';
import lweExperience from './legal-workflow-engineer/engineering/relevant-experience.json';
import lweSkillsMeta from './legal-workflow-engineer/engineering/skills-meta.json';
import _lweProjectsJson from './legal-workflow-engineer/engineering/projects.json';
import _lweEngSkillsJson from './legal-workflow-engineer/engineering/skill-categories.json';
import eteHero from './endtoend-engineer/engineering/hero.json';
import eteExperience from './endtoend-engineer/engineering/relevant-experience.json';
import _eteProjectsJson from './endtoend-engineer/engineering/projects.json';
import fdeHero from './forward-deployed-engineer/engineering/hero.json';
import fdeAbout from './forward-deployed-engineer/engineering/about.json';
import fdeExperience from './forward-deployed-engineer/engineering/relevant-experience.json';
import fdeSkillsMeta from './forward-deployed-engineer/engineering/skills-meta.json';
import _fdeProjectsJson from './forward-deployed-engineer/engineering/projects.json';
import _fdeEngSkillsJson from './forward-deployed-engineer/engineering/skill-categories.json';

/** Homepage (default) content sources. */
const defaultProjects = _projectsJson as unknown as Project[];
const defaultSkills = _engSkillsJson as SkillCategory[];

export const PROJECT_FALLBACKS: Record<PortfolioId, Project[]> = {
  default: defaultProjects,
  'legal-workflow-engineer': _lweProjectsJson as unknown as Project[],
  'endtoend-engineer': _eteProjectsJson as unknown as Project[],
  'ai-engineer': _aiProjectsJson as unknown as Project[],
  'forward-deployed-engineer': _fdeProjectsJson as unknown as Project[],
};

export const ENG_SKILLS_FALLBACKS: Record<PortfolioId, SkillCategory[]> = {
  default: defaultSkills,
  'legal-workflow-engineer': _lweEngSkillsJson as SkillCategory[],
  'endtoend-engineer': defaultSkills,
  'ai-engineer': _aiEngSkillsJson as SkillCategory[],
  'forward-deployed-engineer': _fdeEngSkillsJson as SkillCategory[],
};

export function getHeroFallback(portfolioId: PortfolioId): EngineeringHeroContent {
  if (portfolioId === 'ai-engineer') return aiHero as EngineeringHeroContent;
  if (portfolioId === 'legal-workflow-engineer') return lweHero as EngineeringHeroContent;
  if (portfolioId === 'forward-deployed-engineer') return fdeHero as EngineeringHeroContent;
  if (portfolioId === 'endtoend-engineer') return eteHero as EngineeringHeroContent;
  return ENGINEERING_HERO_DEFAULT;
}

export function getAboutFallback(portfolioId: PortfolioId): EngineeringAboutContent {
  if (portfolioId === 'ai-engineer') return aiAbout as EngineeringAboutContent;
  if (portfolioId === 'legal-workflow-engineer') return lweAbout as EngineeringAboutContent;
  if (portfolioId === 'forward-deployed-engineer') return fdeAbout as EngineeringAboutContent;
  return ENGINEERING_ABOUT_DEFAULT;
}

export function getSkillsMetaFallback(portfolioId: PortfolioId): EngineeringSkillsMeta {
  if (portfolioId === 'legal-workflow-engineer') return lweSkillsMeta as EngineeringSkillsMeta;
  if (portfolioId === 'forward-deployed-engineer') return fdeSkillsMeta as EngineeringSkillsMeta;
  return ENGINEERING_SKILLS_META_DEFAULT;
}

export function getExperienceFallback(portfolioId: PortfolioId): RelevantExperienceContent {
  if (portfolioId === 'ai-engineer') return aiExperience as RelevantExperienceContent;
  if (portfolioId === 'legal-workflow-engineer') return lweExperience as RelevantExperienceContent;
  if (portfolioId === 'endtoend-engineer') {
    const legal = lweExperience as RelevantExperienceContent;
    const ete = eteExperience as RelevantExperienceContent;
    return { ...legal, subtitle: ete.subtitle };
  }
  if (portfolioId === 'forward-deployed-engineer') return fdeExperience as RelevantExperienceContent;
  return RELEVANT_EXPERIENCE_DEFAULT;
}
