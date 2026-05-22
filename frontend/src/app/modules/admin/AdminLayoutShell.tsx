import { useLocation } from 'react-router-dom';
import { getPortfolioIdFromAdminPath } from '../../portfolios/registry';
import { AdminPortfolioProvider } from './AdminPortfolioContext';
import { AdminLayout } from './AdminLayout';

export function AdminLayoutShell() {
  const { pathname } = useLocation();
  const portfolioId = getPortfolioIdFromAdminPath(pathname);

  return (
    <AdminPortfolioProvider portfolioId={portfolioId}>
      <AdminLayout />
    </AdminPortfolioProvider>
  );
}
