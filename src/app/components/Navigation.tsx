import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { Code, Palette, Menu, X, BookOpen } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";

export function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isEngineering = location.pathname === "/";
  const isDesign = location.pathname.startsWith("/design");
  const isBlogs = location.pathname.startsWith("/blogs");

  const scrollToSection = (sectionId: string) => {
    if (location.pathname === "/") {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/");
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
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <motion.div
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.3 }}
              className="text-2xl font-black text-blue-600 dark:text-blue-400"
            >
              DB
            </motion.div>
            <span className="hidden sm:block text-lg font-bold text-gray-900 dark:text-gray-100">
              Design Baker
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/">
              <Button
                variant={isEngineering ? "default" : "ghost"}
                className={`gap-2 ${
                  isEngineering
                    ? "bg-blue-600 hover:bg-blue-700 text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <Code className="w-4 h-4" />
                Engineering
              </Button>
            </Link>
            <Link to="/design">
              <Button
                variant={isDesign ? "default" : "ghost"}
                className={`gap-2 ${
                  isDesign
                    ? "bg-pink-500 hover:bg-pink-600 text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <Palette className="w-4 h-4" />
                Design
              </Button>
            </Link>
            <Link to="/blogs">
              <Button
                variant={isBlogs ? "default" : "ghost"}
                className={`gap-2 ${
                  isBlogs
                    ? "bg-purple-600 hover:bg-purple-700 text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <BookOpen className="w-4 h-4" />
                Blogs
              </Button>
            </Link>
            <button onClick={() => scrollToSection("projects")}>
              <Button variant="ghost" className="hover:bg-gray-100 dark:hover:bg-gray-800">
                Projects
              </Button>
            </button>
            <button onClick={() => scrollToSection("about")}>
              <Button variant="ghost" className="hover:bg-gray-100 dark:hover:bg-gray-800">
                About
              </Button>
            </button>
            <button onClick={() => scrollToSection("contact")}>
              <Button variant="ghost" className="hover:bg-gray-100 dark:hover:bg-gray-800">
                Contact
              </Button>
            </button>
            <ThemeSwitcher />
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden mt-4 pb-4 flex flex-col gap-2"
          >
            <Link to="/" onClick={() => setMobileMenuOpen(false)}>
              <Button
                variant={isEngineering ? "default" : "ghost"}
                className={`w-full justify-start gap-2 ${
                  isEngineering
                    ? "bg-blue-600 hover:bg-blue-700 text-white border-2 border-black"
                    : ""
                }`}
              >
                <Code className="w-4 h-4" />
                Engineering
              </Button>
            </Link>
            <Link to="/design" onClick={() => setMobileMenuOpen(false)}>
              <Button
                variant={isDesign ? "default" : "ghost"}
                className={`w-full justify-start gap-2 ${
                  isDesign
                    ? "bg-pink-500 hover:bg-pink-600 text-white border-2 border-black"
                    : ""
                }`}
              >
                <Palette className="w-4 h-4" />
                Design
              </Button>
            </Link>
            <Link to="/blogs" onClick={() => setMobileMenuOpen(false)}>
              <Button
                variant={isBlogs ? "default" : "ghost"}
                className={`w-full justify-start gap-2 ${
                  isBlogs
                    ? "bg-purple-600 hover:bg-purple-700 text-white border-2 border-black"
                    : ""
                }`}
              >
                <BookOpen className="w-4 h-4" />
                Blogs
              </Button>
            </Link>
            <button onClick={() => { setMobileMenuOpen(false); scrollToSection("projects"); }}>
              <Button variant="ghost" className="w-full justify-start">Projects</Button>
            </button>
            <button onClick={() => { setMobileMenuOpen(false); scrollToSection("about"); }}>
              <Button variant="ghost" className="w-full justify-start">About</Button>
            </button>
            <button onClick={() => { setMobileMenuOpen(false); scrollToSection("contact"); }}>
              <Button variant="ghost" className="w-full justify-start">Contact</Button>
            </button>
            <ThemeSwitcher />
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
}
