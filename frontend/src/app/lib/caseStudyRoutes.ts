/** In-app Ekagajpatra fullstack case study (from extras/). */
export const EKAGAJPATRA_CASE_STUDY_PATH = '/case-studies/ekagajpatra';

/** In-app InvestAI case study (from extras/invest-ai-case-study/). */
export const INVEST_AI_CASE_STUDY_PATH = '/case-studies/invest-ai';

/** Interactive AI agents case study v3 (SVG + dark mode — extras/oni_agent_interactive_page_svg_darkmode_src/). */
export const AI_AGENTS_CASE_STUDY_PATH = '/case-studies/ai-agents/v3';

/** Legacy v1 path — resolves to v3 for CMS/Firestore links. */
export const AI_AGENTS_CASE_STUDY_V1_PATH = '/case-studies/ai-agents';

/** Legacy v2 path — resolves to v3. */
export const AI_AGENTS_CASE_STUDY_V2_PATH = '/case-studies/ai-agents/v2';

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
  if (
    title === 'ONI vs My Agent Ready Architecture' ||
    title === 'AI Workflow System' ||
    title === 'AI Workflow Agents' ||
    title === 'Legal Agent Projects'
  ) {
    if (isCaseStudyLabel(label)) {
      return AI_AGENTS_CASE_STUDY_PATH;
    }
  }
  if (url === AI_AGENTS_CASE_STUDY_V1_PATH || url.startsWith(`${AI_AGENTS_CASE_STUDY_V1_PATH}/`)) {
    return AI_AGENTS_CASE_STUDY_PATH;
  }
  if (url === AI_AGENTS_CASE_STUDY_V2_PATH || url.startsWith(`${AI_AGENTS_CASE_STUDY_V2_PATH}/`)) {
    return AI_AGENTS_CASE_STUDY_PATH;
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
