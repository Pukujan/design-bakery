import type { RouteObject } from 'react-router-dom';
import { lazyPage } from '@/lib/lazyPage';
import type { PortfolioId } from '../../portfolios/registry';

// Admin editors are split into their own chunks: they are never needed by a
// public visitor, so none of this code should be in the entry bundle.
const BlogEditor = lazyPage(
  async () => (await import('@/modules/blog/admin/sections/BlogEditor')).BlogEditor,
);
const BlogCategoriesEditor = lazyPage(
  async () => (await import('@/modules/blog/admin/sections/BlogCategoriesEditor')).BlogCategoriesEditor,
);
const EngineeringSkillsEditor = lazyPage(
  async () => (await import('./sections/EngineeringSkillsEditor')).EngineeringSkillsEditor,
);
const ProjectsEditor = lazyPage(
  async () => (await import('./sections/ProjectsEditor')).ProjectsEditor,
);
const ContactEditor = lazyPage(
  async () => (await import('./sections/ContactEditor')).ContactEditor,
);
const EngineeringHeroEditor = lazyPage(
  async () => (await import('./sections/EngineeringHeroEditor')).EngineeringHeroEditor,
);
const EngineeringCommunityEditor = lazyPage(
  async () => (await import('./sections/EngineeringCommunityEditor')).EngineeringCommunityEditor,
);
const EngineeringAboutEditor = lazyPage(
  async () => (await import('./sections/EngineeringAboutEditor')).EngineeringAboutEditor,
);
const EngineeringSkillsMetaEditor = lazyPage(
  async () => (await import('./sections/EngineeringSkillsMetaEditor')).EngineeringSkillsMetaEditor,
);
const ContactSectionEditor = lazyPage(
  async () => (await import('./sections/ContactSectionEditor')).ContactSectionEditor,
);
const FooterEditor = lazyPage(
  async () => (await import('./sections/FooterEditor')).FooterEditor,
);
const RelevantExperienceEditor = lazyPage(
  async () => (await import('./sections/RelevantExperienceEditor')).RelevantExperienceEditor,
);
const MediaLibraryEditor = lazyPage(
  async () => (await import('./sections/MediaLibraryEditor')).MediaLibraryEditor,
);
const CoverStudioEditor = lazyPage(
  async () => (await import('./sections/CoverStudioEditor')).CoverStudioEditor,
);
const CoverStudioPackEditor = lazyPage(
  async () => (await import('./sections/CoverStudioPackEditor')).CoverStudioPackEditor,
);

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

const PROFILE_EXTRA_ROUTES: RouteObject[] = [
  { path: 'contact', element: <ContactEditor /> },
];

export function buildAdminChildRoutes(_portfolioId: PortfolioId): RouteObject[] {
  return [...ENGINEERING_ROUTES, ...PROFILE_EXTRA_ROUTES];
}
