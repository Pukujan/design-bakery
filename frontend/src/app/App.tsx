import { type ReactElement } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DefaultSiteHead } from './seo/PageSeo';
import { AdminAuthProvider } from './lib/adminAuth';
import { lazyPage } from './lib/lazyPage';
import { PortfolioPublicLayout } from './portfolios/PortfolioPublicLayout';
import { AdminLayoutShell } from './modules/admin/AdminLayoutShell';
import { buildAdminChildRoutes } from './modules/admin/adminRoutes';
import { NotFoundPage } from './components/NotFoundPage';
import { CortexCaseStudyRedirect } from './modules/case-studies/cortex/CortexCaseStudyRedirect';
import { FossilCaseStudyRedirect } from './modules/case-studies/fossil/FossilCaseStudyRedirect';
import { StudyOsCaseStudyRedirect } from './modules/case-studies/study-os/StudyOsCaseStudyRedirect';
import { FluffyV4CaseStudyRedirect } from './modules/case-studies/fluffy-v4/FluffyV4CaseStudyRedirect';
import { IrePageRedirect } from './modules/ire/IrePageRedirect';

// Page routes are split into their own chunks (modularization step 3). The
// layouts, the redirect stubs and the 404 page stay eager: lazy-loading a
// redirect only adds a chunk request before it navigates, and the 404 must
// render even when a chunk fails to load.
const EngineeringHomePage = lazyPage(
  async () => (await import('./modules/engineering/EngineeringHome/EngineeringHome')).EngineeringHome,
);
const BlogListPage = lazyPage(
  async () => (await import('./modules/blog/public/list/BlogListPage')).BlogListPage,
);
const BlogDetailPage = lazyPage(
  async () => (await import('./modules/blog/public/detail/BlogDetailPage')).BlogDetailPage,
);
const AdminLoginPage = lazyPage(
  async () => (await import('./modules/admin/AdminLogin')).AdminLogin,
);
const EkagajpatraCaseStudyPage = lazyPage(
  async () =>
    (await import('./modules/case-studies/ekagajpatra/EkagajpatraCaseStudyPage'))
      .EkagajpatraCaseStudyPage,
);
const InvestAiCaseStudyPage = lazyPage(
  async () =>
    (await import('./modules/case-studies/invest-ai/InvestAiCaseStudyPage')).InvestAiCaseStudyPage,
);
const AiAgentsCaseStudyV3Page = lazyPage(
  async () =>
    (await import('./modules/case-studies/ai-agents/AiAgentsCaseStudyV3Page')).AiAgentsCaseStudyV3Page,
);
const AiAgentsCaseStudyV4Page = lazyPage(
  async () =>
    (await import('./modules/case-studies/ai-agents/AiAgentsCaseStudyV4Page')).AiAgentsCaseStudyV4Page,
);
const LegalWorkflowResearchCaseStudyPage = lazyPage(
  async () =>
    (await import('./modules/case-studies/legal-workflow-research/LegalWorkflowResearchCaseStudyPage'))
      .LegalWorkflowResearchCaseStudyPage,
);
const StaticCaseStudyAssetGuard = lazyPage(
  async () =>
    (await import('./modules/case-studies/legal-workflow-research/StaticCaseStudyAssetGuard'))
      .StaticCaseStudyAssetGuard,
);
const ResearchListPage = lazyPage(
  async () => (await import('./modules/research/public/ResearchListPage')).ResearchListPage,
);
const ResearchPaperPage = lazyPage(
  async () => (await import('./modules/research/public/ResearchPaperPage')).ResearchPaperPage,
);
const ResearchSourcePage = lazyPage(
  async () => (await import('./modules/research/public/ResearchSourcePage')).ResearchSourcePage,
);

const ADMIN_PORTFOLIOS = ['endtoend-engineer'] as const;

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
    <Route key="admin-login" path="/admin/login" element={<AdminLoginPage />} />,
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
    ...ADMIN_PORTFOLIOS.map(buildAdminRoutes),
  ];
}

function publicRoutes(): ReactElement[] {
  return [
    <Route key="public-shell" path="/" element={<PortfolioPublicLayout />}>
      <Route index element={<EngineeringHomePage />} />
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
    <Route path="/case-studies/fluffy-v4" element={<FluffyV4CaseStudyRedirect />} />,
    <Route path="/case-studies/fluffy-v4/gallery" element={<FluffyV4CaseStudyRedirect />} />,
    // IRE market page (IRE #77): static page with a live daily feed, same hand-off pattern.
    <Route path="/ire" element={<IrePageRedirect />} />,
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
