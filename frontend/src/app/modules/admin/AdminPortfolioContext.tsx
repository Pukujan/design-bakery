import { createContext, useContext, type ReactNode } from 'react';
import { DEFAULT_PORTFOLIO_ID, type PortfolioId } from '../../portfolios/registry';

const AdminPortfolioContext = createContext<PortfolioId>(DEFAULT_PORTFOLIO_ID);

export function AdminPortfolioProvider({
  portfolioId,
  children,
}: {
  portfolioId: PortfolioId;
  children: ReactNode;
}) {
  return (
    <AdminPortfolioContext.Provider value={portfolioId}>
      {children}
    </AdminPortfolioContext.Provider>
  );
}

export function useAdminPortfolio(): PortfolioId {
  return useContext(AdminPortfolioContext);
}
