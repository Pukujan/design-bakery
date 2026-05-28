import { useMemo, useState } from 'react';
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { BlogHostProvider, getAdminAccessToken, useBlogPost } from '@design-bakery/blog-core';
import { BlogEditor } from '@design-bakery/blog-creator';
import { BlogPreviewPage } from '@design-bakery/blog-preview';
import { LoginPage } from './LoginPage';

function PreviewRoute() {
  const { blogId } = useParams();
  const numericId = Number(blogId);
  const { post, loading } = useBlogPost(Number.isFinite(numericId) ? numericId : 0);

  if (loading) {
    return <p className="p-8 font-bold">Loading preview…</p>;
  }
  if (!post) {
    return <p className="p-8 font-bold">Post not found.</p>;
  }
  return <BlogPreviewPage />;
}

export default function App() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(() => Boolean(getAdminAccessToken()));

  const hostConfig = useMemo(
    () => ({
      basePath: '/blogs',
      apiBaseUrl: import.meta.env.VITE_BLOG_API_URL?.replace(/\/$/, '') ?? '',
      navigate: (path: string) => navigate(path),
    }),
    [navigate],
  );

  if (!authed) {
    return <LoginPage onLoggedIn={() => setAuthed(true)} />;
  }

  return (
    <BlogHostProvider config={hostConfig}>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <header className="border-b-4 border-black bg-white px-6 py-4 flex gap-4 items-center">
          <span className="font-black text-lg">Blog Studio</span>
          <nav className="flex gap-2 text-sm font-bold">
            <a href="/editor" className="underline">
              Editor
            </a>
          </nav>
        </header>
        <Routes>
          <Route path="/" element={<Navigate to="/editor" replace />} />
          <Route path="/editor" element={<BlogEditor />} />
          <Route path="/preview/:blogId" element={<PreviewRoute />} />
        </Routes>
      </div>
    </BlogHostProvider>
  );
}
