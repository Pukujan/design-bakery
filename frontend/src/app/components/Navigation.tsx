import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { Menu, X, BookOpen, ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";
import { usePortfolio } from "../portfolios/PortfolioContext";
import { TEMP_ETE_HOME_ONLY } from "@/lib/siteMode";
import { useBlogCategories, useBlogData, useBlogPost } from "@/modules/blog/data/blogData";
import { resolveBlogCategoryId } from "@/modules/blog/lib/blogCategoryNav";
import { BlogCategoryNav } from "@/modules/blog/shared/BlogCategoryNav";

export function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { pathTo, config } = usePortfolio();

  const homePath = pathTo("/");
  const blogsPath = pathTo("/blogs");
  const isHome =
    location.pathname === homePath ||
    (homePath !== "/" && location.pathname === homePath);
  const isBlogs = location.pathname.startsWith(blogsPath);
  const isBlogDetail = /\/blogs\/\d+$/.test(location.pathname);
  const { blogs } = useBlogData();
  const categories = useBlogCategories();
  const { blogId } = useParams<{ blogId?: string }>();
  const detailRouteId = isBlogDetail ? Number(blogId) : NaN;
  const { blog: detailBlog } = useBlogPost(
    Number.isFinite(detailRouteId) && detailRouteId > 0 ? detailRouteId : undefined,
  );
  const detailActiveCategoryId = detailBlog
    ? resolveBlogCategoryId(detailBlog.category, categories)
    : undefined;

  const desktopNavClass = isBlogDetail
    ? "hidden min-[1020px]:flex items-center gap-6"
    : "hidden md:flex items-center gap-6";
  const mobileMenuToggleClass = isBlogDetail ? "min-[1020px]:hidden" : "md:hidden";
  const mobileMenuPanelClass = isBlogDetail ? "min-[1020px]:hidden" : "md:hidden";

  const scrollToSection = (sectionId: string) => {
    if (isHome) {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate(homePath);
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
      }, 150);
    }
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b-4 border-black shadow-[0_4px_0px_0px_rgba(0,0,0,1)]"
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <motion.div
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.3 }}
              className="text-2xl font-black text-blue-600 dark:text-blue-400"
            >
              DB
            </motion.div>
            <span className="hidden sm:block text-lg font-bold text-gray-900 dark:text-gray-100">
              {config.label}
            </span>
          </Link>

          <div className={desktopNavClass}>
            {!TEMP_ETE_HOME_ONLY && (
              <Button
                asChild
                variant={isBlogs ? "default" : "ghost"}
                className={`gap-2 ${
                  isBlogs
                    ? "bg-purple-600 hover:bg-purple-700 text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <Link to={blogsPath}>
                  <BookOpen className="w-4 h-4" />
                  Blogs
                </Link>
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              className="hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => scrollToSection("projects")}
            >
              Projects
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => scrollToSection("experience")}
            >
              Experience
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => scrollToSection("about")}
            >
              About
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => scrollToSection("contact")}
            >
              Contact
            </Button>
            <ThemeSwitcher />
          </div>

          <Button
            variant="ghost"
            size="icon"
            className={mobileMenuToggleClass}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>

        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${mobileMenuPanelClass} mt-4 pb-4 flex flex-col gap-2`}
          >
            {!TEMP_ETE_HOME_ONLY && (
              <Button
                asChild
                variant={isBlogs ? "default" : "ghost"}
                className={`w-full justify-start gap-2 ${
                  isBlogs
                    ? "bg-purple-600 hover:bg-purple-700 text-white border-2 border-black"
                    : ""
                }`}
              >
                <Link to={blogsPath} onClick={() => setMobileMenuOpen(false)}>
                  <BookOpen className="w-4 h-4" />
                  Blogs
                </Link>
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {
                setMobileMenuOpen(false);
                scrollToSection("projects");
              }}
            >
              Projects
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {
                setMobileMenuOpen(false);
                scrollToSection("experience");
              }}
            >
              Experience
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {
                setMobileMenuOpen(false);
                scrollToSection("about");
              }}
            >
              About
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {
                setMobileMenuOpen(false);
                scrollToSection("contact");
              }}
            >
              Contact
            </Button>

            {isBlogDetail && (
              <>
                <div className="border-t-2 border-black my-3 pt-3 space-y-2">
                  <p className="px-2 text-xs font-black text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    Quick Actions
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full justify-start gap-2 font-bold"
                    onClick={() => {
                      navigate(blogsPath);
                      setMobileMenuOpen(false);
                    }}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    All Blogs
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full justify-start font-bold"
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: "smooth" });
                      setMobileMenuOpen(false);
                    }}
                  >
                    ↑ Back to Top
                  </Button>
                </div>
                <BlogCategoryNav
                  layout="menu"
                  categories={categories}
                  blogs={blogs}
                  blogsPath={blogsPath}
                  activeCategoryId={detailActiveCategoryId}
                  onNavigate={() => setMobileMenuOpen(false)}
                />
              </>
            )}

            <ThemeSwitcher />
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
}
