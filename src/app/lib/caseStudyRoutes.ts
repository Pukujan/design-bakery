/** In-app Ekagajpatra fullstack case study (from extras/). */
export const EKAGAJPATRA_CASE_STUDY_PATH = '/case-studies/ekagajpatra';

/** In-app InvestAI case study (from extras/invest-ai-case-study/). */
export const INVEST_AI_CASE_STUDY_PATH = '/case-studies/invest-ai';

export function isInternalAppPath(url: string): boolean {
  return url.startsWith('/') && !url.startsWith('//');
}
