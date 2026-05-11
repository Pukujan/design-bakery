import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { useAdminAuth } from '../../lib/adminAuth';
import { Button } from '../../components/ui/button';
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
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/admin/blog', label: 'Blog Posts', icon: BookOpen },
  { to: '/admin/blog-categories', label: 'Blog Categories', icon: Tag },
  { to: '/admin/projects', label: 'Projects', icon: Briefcase },
  { to: '/admin/hero', label: 'Hero Banner', icon: LayoutTemplate },
  { to: '/admin/community', label: 'Community & Advisory', icon: Users },
  { to: '/admin/about-content', label: 'About Me Content', icon: FileUser },
  { to: '/admin/engineering-skills-meta', label: 'Skills Header', icon: Wrench },
  { to: '/admin/contact-section', label: "Let's Connect", icon: MessageCircleHeart },
  { to: '/admin/relevant-experience', label: 'Relevant Experience', icon: Briefcase },
  { to: '/admin/footer', label: 'Footer', icon: PanelsTopLeft },
  { to: '/admin/about', label: 'About Timeline', icon: User },
  { to: '/admin/skills', label: 'Design Skills', icon: Stars },
  { to: '/admin/engineering-skills', label: 'Eng. Skills Data', icon: Wrench },
  { to: '/admin/advocacy', label: 'Advocacy', icon: Image },
  { to: '/admin/art-gallery', label: 'Art Gallery', icon: GalleryHorizontal },
  { to: '/admin/web-showcase', label: 'Web Showcase', icon: Globe },
  { to: '/admin/ai-showcase', label: 'AI Showcase', icon: Cpu },
  { to: '/admin/gallery', label: 'Gallery Page', icon: Image },
  { to: '/admin/contact', label: 'Social Links', icon: Share2 },
];

export function AdminLayout() {
  const { user, loading, signOut } = useAdminAuth();

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

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar */}
      <aside className="flex w-56 flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="px-4 py-5 text-lg font-bold tracking-tight">
          Admin Panel
        </div>
        <nav className="flex-1 overflow-y-auto px-2 pb-4">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-medium dark:bg-indigo-900/30 dark:text-indigo-300'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800',
                ].join(' ')
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-gray-200 dark:border-gray-800 p-3">
          <p className="mb-2 truncate text-xs text-gray-400">{user.email}</p>
          <Button variant="outline" size="sm" className="w-full" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
