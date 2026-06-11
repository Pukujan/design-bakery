import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ThemeSwitcher } from './ThemeSwitcher';
import { Menu, X } from 'lucide-react';
import { Button } from './ui/button';
import { useState } from 'react';
import { usePortfolio } from '../portfolios/PortfolioContext';

export function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { pathTo, config } = usePortfolio();

  const homePath = pathTo('/');
  const isHome = location.pathname === homePath || (homePath !== '/' && location.pathname === homePath);

  const scrollToSection = (sectionId: string) => {
    if (isHome) {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    navigate(homePath);
    setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    }, 150);
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

          <div className="hidden md:flex items-center gap-6">
            <Button
              type="button"
              variant="ghost"
              className="hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => scrollToSection('projects')}
            >
              Projects
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => scrollToSection('experience')}
            >
              Experience
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => scrollToSection('about')}
            >
              About
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => scrollToSection('contact')}
            >
              Contact
            </Button>
            <ThemeSwitcher />
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>

        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden mt-4 pb-4 flex flex-col gap-2"
          >
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {
                setMobileMenuOpen(false);
                scrollToSection('projects');
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
                scrollToSection('experience');
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
                scrollToSection('about');
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
                scrollToSection('contact');
              }}
            >
              Contact
            </Button>
            <ThemeSwitcher />
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
}
