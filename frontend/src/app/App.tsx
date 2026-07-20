import { type ReactElement } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DefaultSiteHead } from './seo/PageSeo';
import { EngineeringHome } from './modules/engineering/EngineeringHome/EngineeringHome';
import { BlogListPage } from './modules/blog/public/list/BlogListPage';
import { BlogDetailPage } from './modules/blog/public/detail/BlogDetailPage';
import { AdminAuthProvider } from './lib/adminAuth';
import { AdminLogin } from './modules/admin/AdminLogin';
import { PortfolioPublicLayout } from './portfolios/PortfolioPublicLayout';
import { AdminLayoutShell } from './modules/admin/AdminLayoutShell';
import { buildAdminChildRoutes } from './modules/admin/adminRoutes';
import { NotFoundPage } from './components/NotFoundPage';
import { EkagajpatraCaseStudyPage } from './modules/case-studies/ekagajpatra/EkagajpatraCaseStudyPage';
import { InvestAiCaseStudyPage } from './modules/case-studies/invest-ai/InvestAiCaseStudyPage';
import { AiAgentsCaseStudyV3Page } from './modules/case-studies/ai-agents/AiAgentsCaseStudyV3Page';
import { AiAgentsCaseStudyV4Page } from './modules/case-studies/ai-agents/AiAgentsCaseStudyV4Page';
import { LegalWorkflowResearchCaseStudyPage } from './modules/case-studies/legal-workflow-research/LegalWorkflowResearchCaseStudyPage';
import { StaticCaseStudyAssetGuard } from './modules/case-studies/legal-workflow-research/StaticCaseStudyAssetGuard';
import { CortexCaseStudyRedirect } from './modules/case-studies/cortex/CortexCaseStudyRedirect';
import { ResearchRedirect } from './modules/research/ResearchRedirect';

const ADMIN_PORTFOLIOS = [
  'default',
  'legal-workflow-engineer',
  'endtoend-engineer',
  'ai-engineer',
  'forward-deployed-engineer',
] as const;

function buildAdminRoutes(portfolioId: (typeof ADMIN_PORTFOLIOS)[number]): ReactElement {
  return (
    <Route key={`admin-${portfolioId}`} path={`/admin/${portfolioId}`} element={<AdminLayoutShell />}>
      {buildAdminChildRoutes(portfolioId).map((route) => (
        <Route
          key={route.path ?? `${portfolioId}-index`}
          index={route.index}
          path={route.path}
          element={route.element}
        />
      ))}
    </Route>
  );
}

function adminRoutes(): ReactElement[] {
  return [
    <Route key="admin-login" path="/admin/login" element={<AdminLogin />} />,
    <Route key="admin-default" path="/admin" element={<AdminLayoutShell />}>
      {buildAdminChildRoutes('endtoend-engineer').map((route) => (
        <Route
          key={route.path ?? 'endtoend-index'}
          index={route.index}
          path={route.path}
          element={route.element}
        />
      ))}
    </Route>,
    ...ADMIN_PORTFOLIOS.filter((portfolioId) => portfolioId !== 'default').map(buildAdminRoutes),
  ];
}

function publicRoutes(): ReactElement[] {
  return [
    <Route key="public-shell" path="/" element={<PortfolioPublicLayout />}>
      <Route index element={<EngineeringHome />} />
    </Route>,
    <Route key="blog-shell" path="/blogs" element={<PortfolioPublicLayout />}>
      <Route index element={<BlogListPage />} />
      <Route path=":blogId" element={<BlogDetailPage />} />
    </Route>,
    <Route
      path="/case-studies/ekagajpatra"
      element={<EkagajpatraCaseStudyPage />}
    />,
    <Route
      path="/case-studies/invest-ai"
      element={<InvestAiCaseStudyPage />}
    />,
    <Route
      path="/case-studies/ai-agents/v3"
      element={<AiAgentsCaseStudyV3Page />}
    />,
    <Route
      path="/case-studies/ai-agents/v4"
      element={<AiAgentsCaseStudyV4Page />}
    />,
    <Route
      path="/case-studies/legal-workflow-research"
      element={<LegalWorkflowResearchCaseStudyPage />}
    />,
    <Route
      path="/case-studies/legal-workflow-research/:asset"
      element={<StaticCaseStudyAssetGuard />}
    />,
    <Route
      path="/case-studies/cortex"
      element={<CortexCaseStudyRedirect />}
    />,
    <Route
      path="/case-studies/cortex/specs"
      element={<CortexCaseStudyRedirect />}
    />,
    <Route
      path="/case-studies/cortex/:ver"
      element={<CortexCaseStudyRedirect />}
    />,
    <Route
      path="/case-studies/cortex/:ver/specs"
      element={<CortexCaseStudyRedirect />}
    />,
    <Route path="/research" element={<ResearchRedirect />} />,
    <Route path="/research/*" element={<ResearchRedirect />} />,
    <Route key="catch-all" path="*" element={<NotFoundPage />} />,
  ];
}

export default function App() {
  return (
    <AdminAuthProvider>
      <Router>
        <DefaultSiteHead />
        <Routes>
          {adminRoutes()}
          {publicRoutes()}
        </Routes>
      </Router>
    </AdminAuthProvider>
  );
}
