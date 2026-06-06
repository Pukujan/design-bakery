import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { TEMP_ETE_HOME_ONLY } from '../lib/siteMode';
import {
  DEFAULT_PORTFOLIO_ID,
  getPortfolioConfig,
  portfolioPath,
  type PortfolioConfig,
  type PortfolioId,
} from './registry';

type PortfolioContextValue = {
  portfolioId: PortfolioId;
  config: PortfolioConfig;
  basePath: string;
  pathTo: (segment?: string) => string;
  isDefaultPortfolio: boolean;
};

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

export function PortfolioProvider({
  portfolioId,
  children,
}: {
  portfolioId: PortfolioId;
  children: ReactNode;
}) {
  const value = useMemo(() => {
    const config = getPortfolioConfig(portfolioId);
    const basePath =
      TEMP_ETE_HOME_ONLY && portfolioId === 'endtoend-engineer' ? '' : config.basePath;
    return {
      portfolioId,
      config,
      basePath,
      pathTo: (segment = '/') => portfolioPath(basePath, segment),
      isDefaultPortfolio: portfolioId === DEFAULT_PORTFOLIO_ID,
    };
  }, [portfolioId]);

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
}

export function usePortfolio(): PortfolioContextValue {
  const ctx = useContext(PortfolioContext);
  if (!ctx) {
    throw new Error('usePortfolio must be used within PortfolioProvider');
  }
  return ctx;
}

export function useOptionalPortfolio(): PortfolioContextValue | null {
  return useContext(PortfolioContext);
}
