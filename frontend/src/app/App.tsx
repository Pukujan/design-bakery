import { Fragment, type ReactElement } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DefaultSiteHead } from './seo/PageSeo';
import { EngineeringHome } from './modules/engineering/EngineeringHome/EngineeringHome';
import { AdminAuthProvider } from './lib/adminAuth';
import { AdminLogin } from './modules/admin/AdminLogin';
import { PortfolioPublicLayout } from './portfolios/PortfolioPublicLayout';
import { AdminLayoutShell } from './modules/admin/AdminLayoutShell';
import { buildAdminChildRoutes } from './modules/admin/adminRoutes';

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
    <Route key="home" path="/" element={<PortfolioPublicLayout />}>
      <Route index element={<EngineeringHome />} />
    </Route>,
    <Route path="/blogs" element={<Navigate to="/" replace />} />,
    <Route path="/blogs/:blogId" element={<Navigate to="/" replace />} />,
    <Route path="/gallery" element={<Navigate to="/" replace />} />,
    <Route path="/gallery/image/:category/:imageId" element={<Navigate to="/" replace />} />,
    <Route path="/legal-workflow-engineer" element={<Navigate to="/" replace />} />,
    <Route path="/legal-workflow-engineer/blogs" element={<Navigate to="/" replace />} />,
    <Route path="/legal-workflow-engineer/blogs/:blogId" element={<Navigate to="/" replace />} />,
    <Route path="/endtoend-engineer" element={<Navigate to="/" replace />} />,
    <Route path="/endtoend-engineer/blogs" element={<Navigate to="/" replace />} />,
    <Route path="/endtoend-engineer/blogs/:blogId" element={<Navigate to="/" replace />} />,
    <Route path="/endtoend-engineer/gallery" element={<Navigate to="/" replace />} />,
    <Route path="/endtoend-engineer/gallery/image/:category/:imageId" element={<Navigate to="/" replace />} />,
    <Route path="/ai-engineer" element={<Navigate to="/" replace />} />,
    <Route path="/ai-engineer/blogs" element={<Navigate to="/" replace />} />,
    <Route path="/ai-engineer/blogs/:blogId" element={<Navigate to="/" replace />} />,
    <Route path="/forward-deployed-engineer" element={<Navigate to="/" replace />} />,
    <Route path="/forward-deployed-engineer/blogs" element={<Navigate to="/" replace />} />,
    <Route path="/forward-deployed-engineer/blogs/:blogId" element={<Navigate to="/" replace />} />,
    <Route path="/nav/design" element={<Navigate to="/" replace />} />,
    <Route path="/design" element={<Navigate to="/" replace />} />,
    <Route key="catch-all" path="*" element={<Navigate to="/" replace />} />,
  ];
}

export default function App() {
  return (
    <AdminAuthProvider>
      <Router>
        <DefaultSiteHead />
        <Routes>
          <Fragment>
            {adminRoutes()}
            {publicRoutes()}
          </Fragment>
        </Routes>
      </Router>
    </AdminAuthProvider>
  );
}
