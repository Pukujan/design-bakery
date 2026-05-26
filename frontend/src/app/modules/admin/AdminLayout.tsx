import { useEffect, useState } from 'react';
import { NavLink, Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../lib/adminAuth';
import { ADMIN_IDLE_TIMEOUT_MS } from '../../lib/adminSession';
import { Button } from '../../components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../components/ui/sheet';
import {
  BookOpen,
  Tag,
  User,
  Stars,
  Image,
  Briefcase,
  Wrench,
  Share2,
  Globe,
  Cpu,
  GalleryHorizontal,
  LogOut,
  LayoutTemplate,
  Users,
  FileUser,
  MessageCircleHeart,
  PanelsTopLeft,
  ArrowLeftRight,
  Menu,
} from 'lucide-react';
import { useAdminPortfolio } from './AdminPortfolioContext';
import { AdminPushDefaults } from './components/AdminPushDefaults';
import {
  getAdminBasePath,
  PORTFOLIO_LIST,
  getPortfolioConfig,
} from '../../portfolios/registry';

type NavItem = { path: string; label: string; icon: typeof BookOpen; title?: string };

const ENGINEERING_NAV: NavItem[] = [
  { path: 'blog', label: 'Blog Posts', icon: BookOpen },
  { path: 'blog-categories', label: 'Blog Categories', icon: Tag },
  { path: 'projects', label: 'Projects', icon: Briefcase },
  { path: 'hero', label: 'Hero Banner', icon: LayoutTemplate },
  { path: 'community', label: 'Community & Advisory', icon: Users },
  { path: 'about-content', label: 'About Me Content', icon: FileUser },
  { path: 'engineering-skills-meta', label: 'Skills Header', icon: Wrench },
  { path: 'contact-section', label: "Let's Connect", icon: MessageCircleHeart },
  { path: 'relevant-experience', label: 'Relevant Experience', icon: Briefcase },
  { path: 'footer', label: 'Footer', icon: PanelsTopLeft },
  { path: 'engineering-skills', label: 'Eng. Skills Data', icon: Wrench },
];

const DESIGN_NAV: NavItem[] = [
  { path: 'about', label: 'About Timeline', icon: User },
  { path: 'skills', label: 'Design Skills', icon: Stars },
  { path: 'advocacy', label: 'Advocacy', icon: Image },
  { path: 'art-gallery', label: 'Art Gallery', icon: GalleryHorizontal },
  { path: 'web-showcase', label: 'Web Showcase', icon: Globe },
  { path: 'ai-showcase', label: 'AI Showcase', icon: Cpu },
  { path: 'gallery', label: 'Gallery Page', icon: Image },
  { path: 'contact', label: 'Social Links', icon: Share2 },
];

export function AdminLayout() {
  const { user, loading, signOut } = useAdminAuth();
  const portfolioId = useAdminPortfolio();
  const location = useLocation();
  const adminBase = getAdminBasePath(portfolioId);
  const portfolioLabel = getPortfolioConfig(portfolioId).label;
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const navItems: NavItem[] =
    portfolioId === 'default'
      ? [...ENGINEERING_NAV, ...DESIGN_NAV]
      : [...ENGINEERING_NAV, { path: 'contact', label: 'Social Links', icon: Share2 }];

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-500">
        Loading…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  const closeMobileNav = () => setMobileNavOpen(false);
  const sidebarContent = (
    <>
      <div className="px-4 py-5">
        <p className="text-lg font-bold tracking-tight">Admin Panel</p>
        <p className="mt-1 text-xs text-gray-500">{portfolioLabel}</p>
      </div>

      <div className="px-3 pb-3">
        <p className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
          <ArrowLeftRight className="h-3 w-3" />
          Switch portfolio
        </p>
        <div className="flex flex-col gap-1">
          {PORTFOLIO_LIST.map((p) => {
            const target = getAdminBasePath(p.id);
            const active = adminBase === target;
            return (
              <Link
                key={p.id}
                to={target}
                onClick={closeMobileNav}
                className={[
                  'rounded-md px-3 py-2 text-sm transition-colors',
                  active
                    ? 'bg-indigo-50 font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800',
                ].join(' ')}
              >
                {p.label}
              </Link>
            );
          })}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-4">
        {navItems.map(({ path, label, icon: Icon, title: navTitle }) => {
          const to = path === 'blog' ? adminBase : `${adminBase}/${path}`;
          return (
            <NavLink
              key={`${path}-${label}`}
              to={to}
              end={path === 'blog'}
              title={navTitle}
              onClick={closeMobileNav}
              className={({ isActive }) =>
                [
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-indigo-50 font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800',
                ].join(' ')
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          );
        })}
      </nav>

      <AdminPushDefaults />

      <div className="border-t border-gray-200 p-3 dark:border-gray-800">
        <p className="mb-1 truncate text-xs text-gray-400">{user.email}</p>
        <p className="mb-2 text-[10px] leading-snug text-gray-400">
          Auto sign-out after {Math.round(ADMIN_IDLE_TIMEOUT_MS / 60000)} min idle
        </p>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => {
            closeMobileNav();
            signOut();
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 md:flex">
        {sidebarContent}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95 md:hidden">
          <div>
            <p className="text-sm font-semibold tracking-tight">Admin Panel</p>
            <p className="mt-1 text-xs text-gray-500">{portfolioLabel}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Open admin navigation"
            onClick={() => setMobileNavOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>

        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetContent
            side="left"
            className="w-72 max-w-[85vw] border-r border-gray-200 bg-white p-0 dark:border-gray-800 dark:bg-gray-900 sm:max-w-[85vw]"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Admin navigation</SheetTitle>
            </SheetHeader>
            <aside className="flex h-full flex-col">{sidebarContent}</aside>
          </SheetContent>
        </Sheet>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
