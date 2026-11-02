import { Outlet } from 'react-router-dom';
import { PortfolioProvider } from '../../portfolios/PortfolioContext';
import { LabBar } from './LabHeader';
import './lab.css';

/**
 * The shell for the writing and research pages: the lab header in place of the old site
 * navigation. The pages themselves are unchanged; the portfolio context they read stays.
 */
export function LabPageLayout() {
  return (
    <PortfolioProvider portfolioId="endtoend-engineer">
      <div className="lab-chrome">
        <LabBar />
      </div>
      <Outlet />
    </PortfolioProvider>
  );
}
