/**
 * The order the home page shows the projects in: the named lead first, then shipped and systems ahead of research, experiments and
 * client work. A copy of `orderProjectsForShowcase` in frontend/src/app/lib/projectOrder.ts (the backend does not ship the frontend
 * source); scripts/test-copilot-order.mjs fails when the two disagree. "Next" on a project page follows this order.
 */
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
 * Default All view leads with these titles (live products first, then the platform
 * and tools), then the remaining shipped products and system features, then
 * research, experiments, and client work.
 */
const ALL_LEAD_TITLES = [
  'Maybe',
  'Maybe Home',
  'Riley',
  'NYC Map Agent',
  'Octo',
  'Ekagajpatra',
  'Study OS',
  'Agent Custom Setup',
  'Eval Lab',
  'Precedent',
];

const WITHIN_CATEGORY: Record<ProjectCategory, readonly string[]> = {
  shipped: ['Maybe', 'Maybe Home', 'Riley', 'NYC Map Agent', 'Ekagajpatra', 'Study OS', 'Precedent'],
  systems: [
    'Octo',
    'Agent Custom Setup',
    'Cortex',
    'Project Continuity Modules',
    'ONI vs My Agent Ready Architecture',
  ],
  research: [
    'Eval Lab',
    'Inference Recommendation Engine',
    'FOSSIL',
  ],
  experiments: ['Orbitgraph', 'Fluffy V4', 'Voidfeed'],
  client: [],
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
