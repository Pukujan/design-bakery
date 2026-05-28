import { Fragment, type ReactElement } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { EngineeringHome } from './modules/engineering/EngineeringHome/EngineeringHome';
import { PortfolioHub } from './portfolios/PortfolioHub';
import { EkagajpatraCaseStudyPage } from './modules/case-studies/ekagajpatra/EkagajpatraCaseStudyPage';
import { InvestAiCaseStudyPage } from './modules/case-studies/invest-ai/InvestAiCaseStudyPage';
import { Navigate } from 'react-router-dom';
import { AiAgentsCaseStudyV3Page } from './modules/case-studies/ai-agents/AiAgentsCaseStudyV3Page';
import { AiAgentsCaseStudyV4Page } from './modules/case-studies/ai-agents/AiAgentsCaseStudyV4Page';
import { AI_AGENTS_CASE_STUDY_PATH, AI_AGENTS_CASE_STUDY_V1_PATH } from './lib/caseStudyRoutes';
import { DesignPortfolio } from './modules/design/DesignPortfolio/DesignPortfolio';
import { BlogListPage } from './modules/blog/public/list/BlogListPage';
import { BlogDetailPage } from './modules/blog/public/detail/BlogDetailPage';
import { PhotoGalleryPage } from './modules/photo-gallery';
import { AdminAuthProvider } from './lib/adminAuth';
import { AdminLogin } from './modules/admin/AdminLogin';
import { PortfolioPublicLayout } from './portfolios/PortfolioPublicLayout';
import { AdminLayoutShell } from './modules/admin/AdminLayoutShell';
import { buildAdminChildRoutes } from './modules/admin/adminRoutes';
import { TEMP_ETE_HOME_ONLY } from './lib/siteMode';

function adminRoutes(): ReactElement[] {
  return [
    <Route key="admin-login" path="/admin/login" element={<AdminLogin />} />,

    <Route key="admin-default" path="/admin" element={<AdminLayoutShell />}>
      {buildAdminChildRoutes('default').map((route) => (
        <Route
          key={route.path ?? 'index'}
          index={route.index}
          path={route.path}
          element={route.element}
        />
      ))}
    </Route>,

    <Route key="admin-lwe" path="/admin/legal-workflow-engineer" element={<AdminLayoutShell />}>
      {buildAdminChildRoutes('legal-workflow-engineer').map((route) => (
        <Route
          key={route.path ?? 'index-lwe'}
          index={route.index}
          path={route.path}
          element={route.element}
        />
      ))}
    </Route>,

    <Route key="admin-ete" path="/admin/endtoend-engineer" element={<AdminLayoutShell />}>
      {buildAdminChildRoutes('endtoend-engineer').map((route) => (
        <Route
          key={route.path ?? 'index-ete'}
          index={route.index}
          path={route.path}
          element={route.element}
        />
      ))}
    </Route>,

    <Route key="admin-aie" path="/admin/ai-engineer" element={<AdminLayoutShell />}>
      {buildAdminChildRoutes('ai-engineer').map((route) => (
        <Route
          key={route.path ?? 'index-aie'}
          index={route.index}
          path={route.path}
          element={route.element}
        />
      ))}
    </Route>,

    <Route key="admin-fde" path="/admin/forward-deployed-engineer" element={<AdminLayoutShell />}>
      {buildAdminChildRoutes('forward-deployed-engineer').map((route) => (
        <Route
          key={route.path ?? 'index-fde'}
          index={route.index}
          path={route.path}
          element={route.element}
        />
      ))}
    </Route>,
  ];
}

function tempEtePublicRoutes(): ReactElement[] {
  return [
    <Route key="cs-eka" path="/case-studies/ekagajpatra" element={<EkagajpatraCaseStudyPage />} />,
    <Route key="cs-invest" path="/case-studies/invest-ai" element={<InvestAiCaseStudyPage />} />,
    <Route key="cs-agents-v3" path="/case-studies/ai-agents/v3" element={<AiAgentsCaseStudyV3Page />} />,
    <Route key="cs-agents-v4" path="/case-studies/ai-agents/v4" element={<AiAgentsCaseStudyV4Page />} />,
    <Route
      key="cs-agents-v2"
      path="/case-studies/ai-agents/v2"
      element={<Navigate to={AI_AGENTS_CASE_STUDY_PATH} replace />}
    />,
    <Route
      key="cs-agents-v1"
      path={AI_AGENTS_CASE_STUDY_V1_PATH}
      element={<Navigate to={AI_AGENTS_CASE_STUDY_PATH} replace />}
    />,
    <Route key="home" path="/" element={<PortfolioPublicLayout />}>
      <Route index element={<EngineeringHome />} />
      <Route path="blogs" element={<BlogListPage />} />
      <Route path="blogs/:blogId" element={<BlogDetailPage />} />
    </Route>,
    <Route key="ete-redirect" path="/endtoend-engineer" element={<Navigate to="/" replace />} />,
    <Route key="ete-blogs-layout" element={<PortfolioPublicLayout />}>
      <Route path="/endtoend-engineer/blogs" element={<BlogListPage />} />
      <Route path="/endtoend-engineer/blogs/:blogId" element={<BlogDetailPage />} />
    </Route>,
    <Route key="catch-all" path="*" element={<Navigate to="/" replace />} />,
  ];
}

function fullPublicRoutes(): ReactElement[] {
  return [
    <Route key="hub" path="/" element={<PortfolioHub />} />,
    <Route key="cs-eka" path="/case-studies/ekagajpatra" element={<EkagajpatraCaseStudyPage />} />,
    <Route key="cs-invest" path="/case-studies/invest-ai" element={<InvestAiCaseStudyPage />} />,
    <Route key="cs-agents-v3" path="/case-studies/ai-agents/v3" element={<AiAgentsCaseStudyV3Page />} />,
    <Route key="cs-agents-v4" path="/case-studies/ai-agents/v4" element={<AiAgentsCaseStudyV4Page />} />,
    <Route
      key="cs-agents-v2"
      path="/case-studies/ai-agents/v2"
      element={<Navigate to={AI_AGENTS_CASE_STUDY_PATH} replace />}
    />,
    <Route
      key="cs-agents-v1"
      path={AI_AGENTS_CASE_STUDY_V1_PATH}
      element={<Navigate to={AI_AGENTS_CASE_STUDY_PATH} replace />}
    />,
    <Route key="nav-design" path="/nav/design" element={<DesignPortfolio />} />,
    <Route key="design" path="/design" element={<DesignPortfolio />} />,

    <Route key="public-layout" element={<PortfolioPublicLayout />}>
      <Route path="/blogs" element={<BlogListPage />} />
      <Route path="/blogs/:blogId" element={<BlogDetailPage />} />
      <Route path="/legal-workflow-engineer" element={<EngineeringHome />} />
      <Route path="/legal-workflow-engineer/blogs" element={<BlogListPage />} />
      <Route path="/legal-workflow-engineer/blogs/:blogId" element={<BlogDetailPage />} />
      <Route path="/endtoend-engineer" element={<EngineeringHome />} />
      <Route path="/endtoend-engineer/blogs" element={<BlogListPage />} />
      <Route path="/endtoend-engineer/blogs/:blogId" element={<BlogDetailPage />} />
      <Route path="/endtoend-engineer/gallery" element={<PhotoGalleryPage />} />
      <Route
        path="/endtoend-engineer/gallery/image/:category/:imageId"
        element={<PhotoGalleryPage />}
      />
      <Route path="/gallery" element={<PhotoGalleryPage />} />
      <Route path="/gallery/image/:category/:imageId" element={<PhotoGalleryPage />} />
      <Route path="/ai-engineer" element={<EngineeringHome />} />
      <Route path="/ai-engineer/blogs" element={<BlogListPage />} />
      <Route path="/ai-engineer/blogs/:blogId" element={<BlogDetailPage />} />
      <Route path="/forward-deployed-engineer" element={<EngineeringHome />} />
      <Route path="/forward-deployed-engineer/blogs" element={<BlogListPage />} />
      <Route path="/forward-deployed-engineer/blogs/:blogId" element={<BlogDetailPage />} />
    </Route>,
  ];
}

export default function App() {
  return (
    <AdminAuthProvider>
      <Router>
        <Routes>
          <Fragment>
            {adminRoutes()}
            {TEMP_ETE_HOME_ONLY ? tempEtePublicRoutes() : fullPublicRoutes()}
          </Fragment>
        </Routes>
      </Router>
    </AdminAuthProvider>
  );
}
