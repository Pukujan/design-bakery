/**
 * Single active home profile. Other profiles (default, ai-engineer,
 * legal-workflow-engineer, forward-deployed-engineer) were archived in
 * TASK-DB-0049 — recover them from git history if needed.
 */
export type PortfolioId = 'endtoend-engineer';

export type PortfolioConfig = {
  id: PortfolioId;
  label: string;
  basePath: string;
  defaultBlogCategory: string;
  collectionPrefix: string;
};

export const DEFAULT_PORTFOLIO_ID: PortfolioId = 'endtoend-engineer';

export const PORTFOLIOS: Record<PortfolioId, PortfolioConfig> = {
  'endtoend-engineer': {
    id: 'endtoend-engineer',
    label: 'End-to-End Engineer',
    basePath: '',
    defaultBlogCategory: 'all',
    collectionPrefix: 'ete__',
  },
};

export const PORTFOLIO_LIST = Object.values(PORTFOLIOS);

export function getPortfolioConfig(id: PortfolioId): PortfolioConfig {
  return PORTFOLIOS[id];
}

export function getPortfolioFromPathname(_pathname: string): PortfolioId {
  return DEFAULT_PORTFOLIO_ID;
}

export function getAdminBasePath(portfolioId: PortfolioId): string {
  return `/admin/${portfolioId}`;
}

export function getPortfolioIdFromAdminPath(_pathname: string): PortfolioId {
  return DEFAULT_PORTFOLIO_ID;
}

export function portfolioPath(basePath: string, segment: string): string {
  const normalized = segment.startsWith('/') ? segment : `/${segment}`;
  if (!basePath) {
    return normalized === '/' ? '/' : normalized;
  }
  if (normalized === '/') {
    return basePath;
  }
  return `${basePath}${normalized}`;
}
