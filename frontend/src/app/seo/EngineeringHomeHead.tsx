import { useLocation } from 'react-router-dom';
import {
  ABOUT_PAGE_SEO,
  CONTACT_PAGE_SEO,
  HOME_PAGE_SEO,
  PROJECTS_PAGE_SEO,
  type PageSeoConfig,
} from './pageSeoConfig';
import { PageSeo } from './PageSeo';

const SECTION_SEO: Record<string, PageSeoConfig> = {
  '': HOME_PAGE_SEO,
  about: ABOUT_PAGE_SEO,
  projects: PROJECTS_PAGE_SEO,
  contact: CONTACT_PAGE_SEO,
};

/** Homepage sections (#about, #projects, #contact) get section-specific metadata. */
export function EngineeringHomeHead() {
  const { pathname, hash } = useLocation();
  const sectionId = hash.replace(/^#/, '').toLowerCase();
  const config = SECTION_SEO[sectionId] ?? HOME_PAGE_SEO;
  const canonicalPath = hash ? `${pathname}${hash}` : pathname;

  return (
    <PageSeo
      title={config.title}
      description={config.description}
      canonicalPath={canonicalPath}
      ogImage={config.ogImage}
      imageAlt={config.imageAlt}
    />
  );
}
