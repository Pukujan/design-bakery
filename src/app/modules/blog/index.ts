/**
 * Engineering blog module — public reader, admin, publish kit, agents.
 *
 * Submodules:
 * - `data/` — types, Firestore hooks, JSON seeds
 * - `seo/` — meta tags, cover/OG URL resolvers
 * - `public/` — list + detail pages
 * - `render/` — Mermaid
 * - `studio/` — publish kit (callable client + admin UI)
 * - `agents/` — SEO rules + LinkedIn promo
 * - `admin/` — editor + categories
 * - `shared/` — cover, motion, contact FAB
 * - `lib/` — tags parsing, client image upload
 */

export {
  useBlogData,
  useBlogPost,
  useBlogCategories,
  type Blog,
  type BlogSeo,
} from './data/blogData';

export {
  normalizeBlogSeo,
  resolveBlogMeta,
  resolveBlogCoverUrl,
  resolveBlogOgPreviewUrl,
  resolveBlogThumbnailUrl,
} from './seo/blogMeta';

export {
  resolveBlogMetaTitle,
  resolveBlogMetaDescription,
} from './seo/blogSeo';

export { BlogListPage } from './public/list/BlogListPage';
export { BlogDetailPage } from './public/detail/BlogDetailPage';

export { BlogCoverImage } from './shared/BlogCoverImage';
export {
  BlogPageDecor,
  MotionSection,
  PlayfulBlogTitle,
  blogCardMotion,
  blogButtonMotion,
  blogReveal,
} from './shared/BlogPageMotion';
export { BlogContactFab } from './shared/BlogContactFab';

export { BlogEditor } from './admin/sections/BlogEditor';
export { BlogCategoriesEditor } from './admin/sections/BlogCategoriesEditor';
export { BlogAgentsPage } from './agents/BlogAgentsPage';
