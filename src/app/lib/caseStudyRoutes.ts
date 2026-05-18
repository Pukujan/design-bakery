/** In-app Ekagajpatra fullstack case study (from extras/). */
export const EKAGAJPATRA_CASE_STUDY_PATH = '/case-studies/ekagajpatra';

export function isInternalAppPath(url: string): boolean {
  return url.startsWith('/') && !url.startsWith('//');
}
