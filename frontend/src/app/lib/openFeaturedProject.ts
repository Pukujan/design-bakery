export const OPEN_FEATURED_PROJECT_EVENT = 'design-bakery:open-featured-project';

export type OpenFeaturedProjectDetail = {
  projectId: number;
};

export function openFeaturedProject(projectId: number): void {
  window.dispatchEvent(
    new CustomEvent<OpenFeaturedProjectDetail>(OPEN_FEATURED_PROJECT_EVENT, {
      detail: { projectId },
    }),
  );
  window.history.replaceState(null, '', `#project-${projectId}`);
  document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function parseProjectHash(hash: string): number | null {
  const match = hash.replace(/^#/, '').match(/^project-(\d+)$/);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isFinite(id) && id > 0 ? id : null;
}

/** Carousel shows 4 projects per page; map global index to start + featured slot. */
export function projectCarouselPosition(
  projectIndex: number,
  pageSize = 4,
): { startIndex: number; featuredIndex: number } {
  const startIndex = Math.floor(projectIndex / pageSize) * pageSize;
  return { startIndex, featuredIndex: projectIndex - startIndex };
}
