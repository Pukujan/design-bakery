import { Outlet, useLocation } from 'react-router-dom';
import { Navigation } from '../components/Navigation';
import { PortfolioProvider } from './PortfolioContext';
import { getPortfolioFromPathname } from './registry';

export function PortfolioPublicLayout() {
  const { pathname } = useLocation();
  const portfolioId = getPortfolioFromPathname(pathname);

  return (
    <PortfolioProvider portfolioId={portfolioId}>
      <div className="relative min-h-screen">
        <Navigation />
        <Outlet />
      </div>
    </PortfolioProvider>
  );
}
