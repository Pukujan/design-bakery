/** In-app Ekagajpatra fullstack case study (from extras/). */
export const EKAGAJPATRA_CASE_STUDY_PATH = '/case-studies/ekagajpatra';

/** In-app InvestAI case study (from extras/invest-ai-case-study/). */
export const INVEST_AI_CASE_STUDY_PATH = '/case-studies/invest-ai';

/** Legacy Figma exports — rewrite to in-app routes when loaded from Firestore. */
const LEGACY_EKAGAJPATRA_CASE_STUDY_URLS = [
  'follow-smog-96608767.figma.site',
  'mock-flee-81526355.figma.site',
];
const LEGACY_INVEST_AI_CASE_STUDY_URLS = ['portal-genre-93680338.figma.site'];

export function isInternalAppPath(url: string): boolean {
  return url.startsWith('/') && !url.startsWith('//');
}

function isCaseStudyLabel(label: string): boolean {
  return label.toLowerCase().includes('case study');
}

function legacyHosts(url: string, hosts: string[]): boolean {
  const lower = url.toLowerCase();
  return hosts.some((host) => lower.includes(host));
}

/** Map project title + link to the correct in-app case study (Firestore-safe). */
export function resolveCaseStudyUrl(title: string, label: string, url: string): string {
  if (title === 'Ekagajpatra') {
    if (
      isCaseStudyLabel(label) ||
      legacyHosts(url, LEGACY_EKAGAJPATRA_CASE_STUDY_URLS)
    ) {
      return EKAGAJPATRA_CASE_STUDY_PATH;
    }
  }
  if (title === 'InvestAI') {
    if (
      isCaseStudyLabel(label) ||
      legacyHosts(url, LEGACY_INVEST_AI_CASE_STUDY_URLS)
    ) {
      return INVEST_AI_CASE_STUDY_PATH;
    }
  }
  return url;
}

export function normalizeProjectLinks<
  T extends { title: string; links: { label: string; url: string }[] },
>(projects: T[]): T[] {
  return projects.map((project) => ({
    ...project,
    links: project.links.map((link) => ({
      ...link,
      url: resolveCaseStudyUrl(project.title, link.label, link.url),
    })),
  }));
}
