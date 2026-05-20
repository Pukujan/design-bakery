import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { EngineeringHome } from './components/EngineeringHome';
import { DesignPortfolio } from './components/DesignPortfolio';
import { BlogListPage } from './components/BlogListPage';
import { BlogDetailPage } from './components/BlogDetailPage';

export default function App() {
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
