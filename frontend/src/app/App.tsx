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
import { FossilCaseStudyRedirect } from './modules/case-studies/fossil/FossilCaseStudyRedirect';
import { StudyOsCaseStudyRedirect } from './modules/case-studies/study-os/StudyOsCaseStudyRedirect';
import { ResearchListPage } from './modules/research/public/ResearchListPage';
import { ResearchPaperPage } from './modules/research/public/ResearchPaperPage';
import { ResearchSourcePage } from './modules/research/public/ResearchSourcePage';

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
    // Cortex case study is served as static HTML (public/case-studies/cortex/a/*.html).
    // vercel.json rewrites every non-.html path to the SPA, so these routes must exist and
    // redirect out to the static pages. React versions archived in extras/ 2026-07-25.
    <Route path="/case-studies/cortex" element={<CortexCaseStudyRedirect />} />,
    <Route path="/case-studies/cortex/specs" element={<CortexCaseStudyRedirect />} />,
    <Route path="/case-studies/cortex/:ver" element={<CortexCaseStudyRedirect />} />,
    <Route path="/case-studies/cortex/:ver/specs" element={<CortexCaseStudyRedirect />} />,
    // FOSSIL follows the same static-case-study pattern as Cortex, but keeps a separate
    // presentation and evidence ledger so marketing claims remain inspectable.
    <Route path="/case-studies/fossil" element={<FossilCaseStudyRedirect />} />,
    <Route path="/case-studies/fossil/presentation" element={<FossilCaseStudyRedirect />} />,
    <Route path="/case-studies/fossil/evidence" element={<FossilCaseStudyRedirect />} />,
    // Study OS uses the same static case-study pattern, with the marketing story and
    // research ledger kept separate so product claims stay bounded.
    <Route path="/case-studies/study-os" element={<StudyOsCaseStudyRedirect />} />,
    <Route path="/case-studies/study-os/presentation" element={<StudyOsCaseStudyRedirect />} />,
    <Route path="/case-studies/study-os/evidence" element={<StudyOsCaseStudyRedirect />} />,
    <Route key="research-shell" path="/research" element={<PortfolioPublicLayout />}>
      <Route index element={<ResearchListPage />} />
      <Route path="papers/:paperId" element={<ResearchPaperPage />} />
      <Route path="sources/:sourceId" element={<ResearchSourcePage />} />
    </Route>,
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
