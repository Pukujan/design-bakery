import { TEMP_ETE_HOME_ONLY } from '../lib/siteMode';

export type PortfolioId =
  | 'default'
  | 'legal-workflow-engineer'
  | 'endtoend-engineer'
  | 'ai-engineer'
  | 'forward-deployed-engineer';

export type PortfolioConfig = {
  id: PortfolioId;
  label: string;
  basePath: string;
  defaultBlogCategory: string;
  collectionPrefix: string;
};

export const DEFAULT_PORTFOLIO_ID: PortfolioId = 'default';

export const PORTFOLIOS: Record<PortfolioId, PortfolioConfig> = {
  default: {
    id: 'default',
    label: 'Design Bakery',
    basePath: '',
    defaultBlogCategory: 'all',
    collectionPrefix: '',
  },
  'legal-workflow-engineer': {
    id: 'legal-workflow-engineer',
    label: 'Legal Workflow Engineer',
    basePath: '/legal-workflow-engineer',
    defaultBlogCategory: 'all',
    collectionPrefix: 'lwe__',
  },
  'endtoend-engineer': {
    id: 'endtoend-engineer',
    label: 'AI/ML Engineer',
    basePath: '/endtoend-engineer',
    defaultBlogCategory: 'all',
    collectionPrefix: 'ete__',
  },
  'ai-engineer': {
    id: 'ai-engineer',
    label: 'AI Engineer',
    basePath: '/ai-engineer',
    defaultBlogCategory: 'all',
    collectionPrefix: 'aie__',
  },
  'forward-deployed-engineer': {
    id: 'forward-deployed-engineer',
    label: 'Forward-Deployed Engineer',
    basePath: '/forward-deployed-engineer',
    defaultBlogCategory: 'all',
    collectionPrefix: 'fde__',
  },
};

export const PORTFOLIO_LIST = Object.values(PORTFOLIOS);

export function getPortfolioConfig(id: PortfolioId): PortfolioConfig {
  return PORTFOLIOS[id];
}

export function getPortfolioFromPathname(pathname: string): PortfolioId {
  if (TEMP_ETE_HOME_ONLY && (pathname === '/' || pathname === '')) {
    return 'endtoend-engineer';
  }
  if (pathname === '/legal-workflow-engineer' || pathname.startsWith('/legal-workflow-engineer/')) {
    return 'legal-workflow-engineer';
  }
  if (pathname === '/endtoend-engineer' || pathname.startsWith('/endtoend-engineer/')) {
    return 'endtoend-engineer';
  }
  if (pathname === '/ai-engineer' || pathname.startsWith('/ai-engineer/')) {
    return 'ai-engineer';
  }
  if (
    pathname === '/forward-deployed-engineer' ||
    pathname.startsWith('/forward-deployed-engineer/')
  ) {
    return 'forward-deployed-engineer';
  }
  return 'default';
}

export function getAdminBasePath(portfolioId: PortfolioId): string {
  return portfolioId === 'default' ? '/admin' : `/admin/${portfolioId}`;
}

export function getPortfolioIdFromAdminPath(pathname: string): PortfolioId {
  if (pathname.startsWith('/admin/legal-workflow-engineer')) {
    return 'legal-workflow-engineer';
  }
  if (pathname.startsWith('/admin/endtoend-engineer')) {
    return 'endtoend-engineer';
  }
  if (pathname.startsWith('/admin/ai-engineer')) {
    return 'ai-engineer';
  }
  if (pathname.startsWith('/admin/forward-deployed-engineer')) {
    return 'forward-deployed-engineer';
  }
  return 'default';
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
