import { useEffect, useState } from 'react';
import { NavLink, Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../lib/adminAuth';
import { ADMIN_IDLE_TIMEOUT_MS } from '../../lib/adminSession';
import { Button } from '../../components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../components/ui/sheet';
import {
  BookOpen,
  Tag,
  Image,
  Briefcase,
  Wrench,
  Share2,
  LogOut,
  LayoutTemplate,
  Users,
  FileUser,
  MessageCircleHeart,
  PanelsTopLeft,
  Menu,
  Images,
} from 'lucide-react';
import { useAdminPortfolio } from './AdminPortfolioContext';
import { AdminPushDefaults } from './components/AdminPushDefaults';
import {
  getAdminBasePath,
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
  { path: 'media-library', label: 'Media Library', icon: Images },
  { path: 'cover-studio', label: 'Cover Studio', icon: Image },
];

export function AdminLayout() {
  const { user, loading, signOut } = useAdminAuth();
  const portfolioId = useAdminPortfolio();
  const location = useLocation();
  const adminBase = getAdminBasePath(portfolioId);
  const portfolioLabel = getPortfolioConfig(portfolioId).label;
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const navItems: NavItem[] = [
    ...ENGINEERING_NAV,
    { path: 'contact', label: 'Social Links', icon: Share2 },
  ];

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
