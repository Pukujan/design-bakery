import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { EngineeringHome } from './modules/engineering/EngineeringHome/EngineeringHome';
import { DesignPortfolio } from './modules/design/DesignPortfolio/DesignPortfolio';
import { BlogListPage } from './modules/engineering/BlogListPage/BlogListPage';
import { BlogDetailPage } from './modules/engineering/BlogDetailPage/BlogDetailPage';
import { syncContentToFirebase } from './lib/firebaseContentSync';
import { AdminAuthProvider } from './lib/adminAuth';
import { AdminLayout } from './modules/admin/AdminLayout';
import { AdminLogin } from './modules/admin/AdminLogin';
import { BlogEditor } from './modules/admin/sections/BlogEditor';
import { BlogCategoriesEditor } from './modules/admin/sections/BlogCategoriesEditor';
import { AboutEditor } from './modules/admin/sections/AboutEditor';
import { SkillsEditor } from './modules/admin/sections/SkillsEditor';
import { EngineeringSkillsEditor } from './modules/admin/sections/EngineeringSkillsEditor';
import { AdvocacyEditor } from './modules/admin/sections/AdvocacyEditor';
import { ArtGalleryEditor } from './modules/admin/sections/ArtGalleryEditor';
import { ProjectsEditor } from './modules/admin/sections/ProjectsEditor';
import { ContactEditor } from './modules/admin/sections/ContactEditor';
import { WebShowcaseEditor } from './modules/admin/sections/WebShowcaseEditor';
import { GalleryPageEditor } from './modules/admin/sections/GalleryPageEditor';
import { EngineeringHeroEditor } from './modules/admin/sections/EngineeringHeroEditor';
import { EngineeringCommunityEditor } from './modules/admin/sections/EngineeringCommunityEditor';
import { EngineeringAboutEditor } from './modules/admin/sections/EngineeringAboutEditor';
import { EngineeringSkillsMetaEditor } from './modules/admin/sections/EngineeringSkillsMetaEditor';
import { ContactSectionEditor } from './modules/admin/sections/ContactSectionEditor';
import { FooterEditor } from './modules/admin/sections/FooterEditor';
import { RelevantExperienceEditor } from './modules/admin/sections/RelevantExperienceEditor';

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
    <AdminAuthProvider>
      <Router>
        <Routes>
          {/* Admin routes — no public Navigation */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<BlogEditor />} />
            <Route path="blog" element={<BlogEditor />} />
            <Route path="blog-categories" element={<BlogCategoriesEditor />} />
            <Route path="projects" element={<ProjectsEditor />} />
            <Route path="hero" element={<EngineeringHeroEditor />} />
            <Route path="community" element={<EngineeringCommunityEditor />} />
            <Route path="about-content" element={<EngineeringAboutEditor />} />
            <Route path="engineering-skills-meta" element={<EngineeringSkillsMetaEditor />} />
            <Route path="contact-section" element={<ContactSectionEditor />} />
            <Route path="footer" element={<FooterEditor />} />
            <Route path="relevant-experience" element={<RelevantExperienceEditor />} />
            <Route path="about" element={<AboutEditor />} />
            <Route path="skills" element={<SkillsEditor />} />
            <Route path="engineering-skills" element={<EngineeringSkillsEditor />} />
            <Route path="advocacy" element={<AdvocacyEditor />} />
            <Route path="art-gallery" element={<ArtGalleryEditor />} />
            <Route path="web-showcase" element={<WebShowcaseEditor />} />
            <Route path="ai-showcase" element={<WebShowcaseEditor />} />
            <Route path="gallery" element={<GalleryPageEditor />} />
            <Route path="contact" element={<ContactEditor />} />
          </Route>

          {/* Public routes */}
          <Route
            path="/*"
            element={
              <div className="relative min-h-screen">
                <Navigation />
                <Routes>
                  <Route path="/" element={<EngineeringHome />} />
                  <Route path="/design" element={<DesignPortfolio />} />
                  <Route path="/blogs" element={<BlogListPage />} />
                  <Route path="/blogs/:blogId" element={<BlogDetailPage />} />
                </Routes>
              </div>
            }
          />
        </Routes>
      </Router>
    </AdminAuthProvider>
  );
}
