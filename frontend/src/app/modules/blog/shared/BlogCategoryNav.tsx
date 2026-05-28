import { useEffect, useMemo, useRef, type Ref } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'motion/react';
/** Subtle lift inside scroll panel — avoids clipping vs blogCardMotion on list cards. */
const categoryNavButtonMotion = {
  whileHover: { y: -4, scale: 1.02 },
  whileTap: { scale: 0.98 },
} as const;
import type { BlogCategory, BlogSummary } from '@/modules/blog/data/blogData';
import {
  buildBlogsPathWithCategory,
  resolveBlogCategoryId,
} from '@/modules/blog/lib/blogCategoryNav';

type BlogCategoryNavProps = {
  categories: BlogCategory[];
  blogs: BlogSummary[];
  blogsPath: string;
  /** Highlight id (resolved category id). */
  activeCategoryId?: string;
  /** `sidebar` = scrollable list on desktop; `menu` = scrollable list in mobile nav. */
  layout: 'sidebar' | 'menu';
  onNavigate?: () => void;
};

function categoryCount(
  blogs: BlogSummary[],
  categoryId: string,
  categories: BlogCategory[],
): number {
  return blogs.filter(
    (b) => resolveBlogCategoryId(b.category, categories) === categoryId,
  ).length;
}

type CategoryRowProps = {
  category: BlogCategory;
  count: number;
  isActive: boolean;
  onSelect: () => void;
  compact?: boolean;
  rowRef?: Ref<HTMLDivElement>;
};

function CategoryRow({ category, count, isActive, onSelect, compact, rowRef }: CategoryRowProps) {
  if (compact) {
    return (
      <div ref={rowRef} className="blog-category-nav-row">
        <Button
          type="button"
          variant="ghost"
          onClick={onSelect}
          className={`w-full justify-between px-3 py-2 text-sm ${
            isActive ? 'bg-black text-white hover:bg-black/90 hover:text-white' : ''
          }`}
        >
          <span className="flex items-center gap-2">
            <Tag className="w-3 h-3 shrink-0" style={{ color: isActive ? '#fff' : category.color }} />
            {category.label}
          </span>
          <Badge
            variant="outline"
            className={`border-2 text-xs ${isActive ? 'border-white text-white' : 'border-black'}`}
          >
            {count}
          </Badge>
        </Button>
      </div>
    );
  }

  return (
    <div ref={rowRef} className="blog-category-nav-row">
      <motion.div {...categoryNavButtonMotion}>
        <Button
          type="button"
          onClick={onSelect}
          className={`
            w-full justify-between px-4 py-3 border-4 border-black
            shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
            hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]
            transition-all font-black text-sm
            ${
              isActive
                ? 'bg-black text-white'
                : 'bg-white dark:bg-gray-900 text-black dark:text-white'
            }
          `}
          style={{
            borderLeftColor: isActive ? category.color : undefined,
            borderLeftWidth: isActive ? '8px' : undefined,
          }}
        >
          <span>{category.label}</span>
          <Badge
            variant="outline"
            className={`border-2 ${isActive ? 'border-white text-white' : 'border-black'}`}
          >
            {count}
          </Badge>
        </Button>
      </motion.div>
    </div>
  );
}

export function BlogCategoryNav({
  categories,
  blogs,
  blogsPath,
  activeCategoryId = '',
  layout,
  onNavigate,
}: BlogCategoryNavProps) {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRowRef = useRef<HTMLDivElement>(null);

  const navCategories = useMemo(
    () => categories.filter((c) => c.id !== 'all'),
    [categories],
  );

  const goToCategory = (categoryId: string) => {
    navigate(buildBlogsPathWithCategory(blogsPath, categoryId));
    onNavigate?.();
  };

  useEffect(() => {
    const node = activeRowRef.current;
    const scroller = scrollRef.current;
    if (!node || !scroller) return;

    const rowTop = node.offsetTop;
    const rowBottom = rowTop + node.offsetHeight;
    const viewTop = scroller.scrollTop;
    const viewBottom = viewTop + scroller.clientHeight;

    if (rowTop < viewTop || rowBottom > viewBottom) {
      node.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [activeCategoryId, navCategories.length]);

  if (navCategories.length === 0) return null;

  const scrollClass =
    layout === 'menu'
      ? 'max-h-[min(45vh,320px)]'
      : 'max-h-[min(52vh,22rem)]';

  const list = (
    <div className="blog-category-nav-shell overflow-visible">
      <div
        ref={scrollRef}
        className={`blog-category-nav-scroll scrollbar-mini scrollbar-mini--always overflow-y-scroll overscroll-contain ${scrollClass} ${
          layout === 'sidebar' ? 'space-y-2' : 'space-y-0.5'
        }`}
        role="list"
        aria-label="Blog categories"
      >
      {navCategories.map((category) => {
        const isActive = category.id === activeCategoryId;
        return (
          <CategoryRow
            key={category.id}
            rowRef={isActive ? activeRowRef : undefined}
            category={category}
            count={categoryCount(blogs, category.id, categories)}
            isActive={isActive}
            onSelect={() => goToCategory(category.id)}
            compact={layout === 'menu'}
          />
        );
      })}
      </div>
    </div>
  );

  if (layout === 'menu') {
    return (
      <div className="border-t-2 border-black pt-3">
        <p className="mb-2 px-2 text-xs font-black uppercase tracking-wide text-gray-600 dark:text-gray-400">
          Categories
        </p>
        {list}
      </div>
    );
  }

  return list;
}
