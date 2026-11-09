/**
 * Crawler / link-preview meta for /work/<slug> project pages (served by the ogPreview router).
 * Mirrors the PageSeo props in frontend/src/app/modules/work/WorkPage.tsx, so a shared
 * link and the rendered page say the same thing.
 */

import { SITE_NAME } from './siteSeoDefaults.js';
import type { BlogSocialMetaInput } from './blogSocialMeta.js';

export type ProjectShareSource = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
};

/** The tagline, then the description up to ~155 characters on a word break (same as WorkPage). */
export function projectShareDescription(project: ProjectShareSource): string {
  const lead = /[.!?]$/.test(project.tagline) ? project.tagline : `${project.tagline}.`;
  const full = `${lead} ${project.description}`.replace(/\s+/g, ' ').trim();
  if (full.length <= 155) return full;
  const cut = full.slice(0, 154);
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:.\s]+$/, '')}…`;
}

export function resolveProjectShareMeta(
  project: ProjectShareSource,
  siteOrigin: string,
): BlogSocialMetaInput & { ogType: 'article' } {
  return {
    pageTitle: `${project.title} | Design Baker`,
    description: projectShareDescription(project),
    canonicalUrl: `${siteOrigin}/work/${project.slug}`,
    ogImage: `${siteOrigin}/og/projects/${project.slug}.jpg`,
    imageAlt: `${project.title}: ${project.tagline}`,
    siteName: SITE_NAME,
    ogType: 'article',
  };
}
