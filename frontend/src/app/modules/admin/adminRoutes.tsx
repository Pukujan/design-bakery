import type { RouteObject } from 'react-router-dom';
import { BlogEditor } from '@/modules/blog/admin/sections/BlogEditor';
import { BlogCategoriesEditor } from '@/modules/blog/admin/sections/BlogCategoriesEditor';
import { AboutEditor } from './sections/AboutEditor';
import { SkillsEditor } from './sections/SkillsEditor';
import { EngineeringSkillsEditor } from './sections/EngineeringSkillsEditor';
import { AdvocacyEditor } from './sections/AdvocacyEditor';
import { ArtGalleryEditor } from './sections/ArtGalleryEditor';
import { ProjectsEditor } from './sections/ProjectsEditor';
import { ContactEditor } from './sections/ContactEditor';
import { WebShowcaseEditor } from './sections/WebShowcaseEditor';
import { GalleryPageEditor } from './sections/GalleryPageEditor';
import { EngineeringHeroEditor } from './sections/EngineeringHeroEditor';
import { EngineeringCommunityEditor } from './sections/EngineeringCommunityEditor';
import { EngineeringAboutEditor } from './sections/EngineeringAboutEditor';
import { EngineeringSkillsMetaEditor } from './sections/EngineeringSkillsMetaEditor';
import { ContactSectionEditor } from './sections/ContactSectionEditor';
import { FooterEditor } from './sections/FooterEditor';
import { RelevantExperienceEditor } from './sections/RelevantExperienceEditor';
import { MediaLibraryEditor } from './sections/MediaLibraryEditor';
import { CoverStudioEditor } from './sections/CoverStudioEditor';
import { CoverStudioPackEditor } from './sections/CoverStudioPackEditor';
import type { PortfolioId } from '../../portfolios/registry';

const ENGINEERING_ROUTES: RouteObject[] = [
  { index: true, element: <BlogEditor /> },
  { path: 'blog', element: <BlogEditor /> },
  { path: 'blog-categories', element: <BlogCategoriesEditor /> },
  { path: 'projects', element: <ProjectsEditor /> },
  { path: 'hero', element: <EngineeringHeroEditor /> },
  { path: 'community', element: <EngineeringCommunityEditor /> },
  { path: 'about-content', element: <EngineeringAboutEditor /> },
  { path: 'engineering-skills-meta', element: <EngineeringSkillsMetaEditor /> },
  { path: 'contact-section', element: <ContactSectionEditor /> },
  { path: 'footer', element: <FooterEditor /> },
  { path: 'relevant-experience', element: <RelevantExperienceEditor /> },
  { path: 'engineering-skills', element: <EngineeringSkillsEditor /> },
  { path: 'media-library', element: <MediaLibraryEditor /> },
  { path: 'cover-studio', element: <CoverStudioEditor /> },
  { path: 'cover-studio/pack/:packId', element: <CoverStudioPackEditor /> },
];

const DESIGN_ROUTES: RouteObject[] = [
  { path: 'about', element: <AboutEditor /> },
  { path: 'skills', element: <SkillsEditor /> },
  { path: 'advocacy', element: <AdvocacyEditor /> },
  { path: 'art-gallery', element: <ArtGalleryEditor /> },
  { path: 'web-showcase', element: <WebShowcaseEditor /> },
  { path: 'ai-showcase', element: <WebShowcaseEditor /> },
  { path: 'gallery', element: <GalleryPageEditor /> },
  { path: 'contact', element: <ContactEditor /> },
];

const LWE_EXTRA_ROUTES: RouteObject[] = [
  { path: 'contact', element: <ContactEditor /> },
];

export function buildAdminChildRoutes(portfolioId: PortfolioId): RouteObject[] {
  if (portfolioId === 'default') {
    return [...ENGINEERING_ROUTES, ...DESIGN_ROUTES];
  }
  return [...ENGINEERING_ROUTES, ...LWE_EXTRA_ROUTES];
}
