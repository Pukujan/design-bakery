import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { EngineeringHome } from './modules/engineering/EngineeringHome/EngineeringHome';
import { DesignPortfolio } from './modules/design/DesignPortfolio/DesignPortfolio';
import { BlogListPage } from './modules/engineering/BlogListPage/BlogListPage';
import { BlogDetailPage } from './modules/engineering/BlogDetailPage/BlogDetailPage';
import { syncContentToFirebase } from './lib/firebaseContentSync';

export default function App() {
  useEffect(() => {
    if (import.meta.env.VITE_FIREBASE_ENABLE_CONTENT_SYNC !== 'true') {
      return;
    }

    void syncContentToFirebase().catch((error) => {
      console.error('Firebase content sync failed:', error);
    });
  }, []);

  return (
    <Router>
      <div className="relative min-h-screen">

        <Navigation />

        <Routes>
          <Route path="/" element={<EngineeringHome />} />
          <Route path="/design" element={<DesignPortfolio />} />
          <Route path="/blogs" element={<BlogListPage />} />
          <Route path="/blogs/:blogId" element={<BlogDetailPage />} />
        </Routes>
      </div>
    </Router>
  );
}
