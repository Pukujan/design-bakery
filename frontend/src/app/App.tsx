import { type ReactElement } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
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

function LegacyBlogRedirect() {
  const { blogId } = useParams<{ blogId?: string }>();
  return <Navigate to={blogId ? `/blogs/${blogId}` : '/blogs'} replace />;
}

function LegacyHomeRedirect() {
  return <Navigate to="/" replace />;
}

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

function publicRoutes(): ReactElement[] {
  return [
    <Route key="public-shell" path="/" element={<PortfolioPublicLayout />}>
      <Route index element={<EngineeringHome />} />
    </Route>,
    <Route key="blog-shell" path="/blogs" element={<PortfolioPublicLayout />}>
      <Route index element={<BlogListPage />} />
      <Route path=":blogId" element={<BlogDetailPage />} />
    </Route>,
    <Route path="/legal-workflow-engineer" element={<LegacyHomeRedirect />} />,
    <Route path="/legal-workflow-engineer/*" element={<LegacyHomeRedirect />} />,
    <Route path="/endtoend-engineer" element={<LegacyHomeRedirect />} />,
    <Route path="/endtoend-engineer/*" element={<LegacyHomeRedirect />} />,
    <Route path="/ai-engineer" element={<LegacyHomeRedirect />} />,
    <Route path="/ai-engineer/*" element={<LegacyHomeRedirect />} />,
    <Route path="/forward-deployed-engineer" element={<LegacyHomeRedirect />} />,
    <Route path="/forward-deployed-engineer/*" element={<LegacyHomeRedirect />} />,
    <Route path="/nav/design" element={<LegacyHomeRedirect />} />,
    <Route path="/design" element={<LegacyHomeRedirect />} />,
    <Route path="/gallery" element={<LegacyHomeRedirect />} />,
    <Route path="/gallery/*" element={<LegacyHomeRedirect />} />,
    <Route path="/legal-workflow-engineer/blogs" element={<Navigate to="/blogs" replace />} />,
    <Route
      path="/legal-workflow-engineer/blogs/:blogId"
      element={<LegacyBlogRedirect />}
    />,
    <Route path="/endtoend-engineer/blogs" element={<Navigate to="/blogs" replace />} />,
    <Route path="/endtoend-engineer/blogs/:blogId" element={<LegacyBlogRedirect />} />,
    <Route path="/ai-engineer/blogs" element={<Navigate to="/blogs" replace />} />,
    <Route path="/ai-engineer/blogs/:blogId" element={<LegacyBlogRedirect />} />,
    <Route
      path="/forward-deployed-engineer/blogs"
      element={<Navigate to="/blogs" replace />}
    />,
    <Route
      path="/forward-deployed-engineer/blogs/:blogId"
      element={<LegacyBlogRedirect />}
    />,
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
