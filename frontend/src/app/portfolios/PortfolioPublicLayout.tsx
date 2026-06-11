import { Outlet } from 'react-router-dom';
import { Navigation } from '../components/Navigation';
import { PortfolioProvider } from './PortfolioContext';

export function PortfolioPublicLayout() {
  const portfolioId = 'endtoend-engineer' as const;

  return (
    <PortfolioProvider portfolioId={portfolioId}>
      <div className="relative min-h-screen">
        <Navigation />
        <Outlet />
      </div>
    </PortfolioProvider>
  );
}
