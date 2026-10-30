/**
 * Date ordering helper: newest `startedAt` first.
 *
 * The homepage showcase does not use this. It uses `orderProjectsForShowcase`.
 * `startedAt` is `YYYY-MM-DD` or `YYYY-MM` (month precision when only the month is known).
 * ISO strings compare correctly as plain strings; a month-only value sorts after dated
 * values in the same month. Projects without a valid `startedAt` go last. The sort is
 * stable (Array.prototype.sort is stable since ES2019), so ties keep their data order.
 *
 * Plain TypeScript with no imports so `scripts/test-homepage-content-stability.mjs` can
 * import it directly under Node 24's type stripping.
 */
export const STARTED_AT_PATTERN = /^\d{4}-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?$/;

export function sortProjectsByStartedAtDesc<T extends { startedAt?: string }>(projects: readonly T[]): T[] {
  const key = (project: T) =>
    project.startedAt && STARTED_AT_PATTERN.test(project.startedAt) ? project.startedAt : '';
  return [...projects].sort((a, b) => {
    const ka = key(a);
    const kb = key(b);
    if (ka === kb) return 0;
    return ka < kb ? 1 : -1;
  });
}

/** Homepage filter buckets. `client` is past professional work, not a live product. */
export const PROJECT_CATEGORIES = ['shipped', 'systems', 'research', 'experiments', 'client'] as const;
export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];
export type ShowcaseFilter = 'all' | ProjectCategory;

export const PROJECT_CATEGORY_LABEL: Record<ProjectCategory, string> = {
  shipped: 'Shipped',
  systems: 'Systems',
  research: 'Research',
  experiments: 'Experiments',
  client: 'Client Work',
};

const CATEGORY_RANK: Record<ProjectCategory, number> = {
  shipped: 0,
  systems: 1,
  research: 2,
  experiments: 3,
  client: 4,
};

/**
 * Default All view leads with these titles, then the remaining shipped products
 * and system features, then research, experiments, and client work.
 */
const ALL_LEAD_TITLES = ['Website Copilot', 'Precedent', 'Ekagajpatra', 'Eval Lab', 'Agent Custom Setup'];

const WITHIN_CATEGORY: Record<ProjectCategory, readonly string[]> = {
  shipped: ['Website Copilot', 'Precedent', 'Ekagajpatra', 'Study OS'],
  systems: [
    'Agent Custom Setup',
    'Cortex',
    'Project Continuity Modules',
    'ONI vs My Agent Ready Architecture',
  ],
  research: [
    'Eval Lab',
    'Legal Workflow Research',
    'Inference Recommendation Engine',
    'FOSSIL',
  ],
  experiments: ['Orbitgraph', 'Fluffy V4', 'Voidfeed'],
  client: ['SaaS Dashboard Systems'],
};

export function isProjectCategory(value: string): value is ProjectCategory {
  return (PROJECT_CATEGORIES as readonly string[]).includes(value);
}

function withinRank(category: ProjectCategory | undefined, title: string): number {
  if (!category) return 1000;
  const list = WITHIN_CATEGORY[category];
  const index = list.indexOf(title);
  return index === -1 ? list.length : index;
}

/**
 * Order the homepage showcase. `all` is the default: the named lead first, then
 * shipped and systems ahead of research, experiments, and client work.
 * A category filter keeps that category's own order. Sort is stable for ties.
 */
export function orderProjectsForShowcase<T extends { title: string; category?: string }>(
  projects: readonly T[],
  filter: ShowcaseFilter = 'all',
): T[] {
  const filtered = projects.filter((project) => filter === 'all' || project.category === filter);
  return [...filtered].sort((a, b) => {
    if (filter === 'all') {
      const aLead = ALL_LEAD_TITLES.indexOf(a.title);
      const bLead = ALL_LEAD_TITLES.indexOf(b.title);
      const aIsLead = aLead !== -1;
      const bIsLead = bLead !== -1;
      if (aIsLead || bIsLead) {
        if (aIsLead && bIsLead) return aLead - bLead;
        return aIsLead ? -1 : 1;
      }
    }
    const aCat = a.category && isProjectCategory(a.category) ? a.category : undefined;
    const bCat = b.category && isProjectCategory(b.category) ? b.category : undefined;
    const aRank = aCat ? CATEGORY_RANK[aCat] : 99;
    const bRank = bCat ? CATEGORY_RANK[bCat] : 99;
    if (aRank !== bRank) return aRank - bRank;
    return withinRank(aCat, a.title) - withinRank(bCat, b.title);
  });
}
