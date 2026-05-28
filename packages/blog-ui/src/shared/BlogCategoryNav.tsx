import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type Ref,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'motion/react';
import type { BlogCategory, BlogSummary } from '@design-bakery/blog-core';
import {
  buildBlogsPathWithCategory,
  resolveBlogCategoryId,
} from '@design-bakery/blog-core/lib/blogCategoryNav';

/** Subtle lift inside scroll panel — avoids clipping vs blogCardMotion on list cards. */
const categoryNavButtonMotion = {
  whileHover: { y: -4, scale: 1.02 },
  whileTap: { scale: 0.98 },
} as const;

type ScrollHints = {
  canScroll: boolean;
  top: boolean;
  bottom: boolean;
};

function readScrollHints(el: HTMLDivElement): ScrollHints {
  const overflow = el.scrollHeight - el.clientHeight > 6;
  return {
    canScroll: overflow,
    top: overflow && el.scrollTop > 6,
    bottom: overflow && el.scrollTop + el.clientHeight < el.scrollHeight - 6,
  };
}

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
            relative w-full justify-between overflow-hidden px-4 py-3 border-4 border-black
            shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
            hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]
            transition-all font-black text-sm
            ${
              isActive
                ? 'blog-category-nav-btn--active bg-black text-white'
                : 'bg-white dark:bg-gray-900 text-black dark:text-white'
            }
          `}
          style={
            isActive
              ? ({ '--category-accent': category.color } as CSSProperties)
              : undefined
          }
        >
          <span className="relative z-[1]">{category.label}</span>
          <Badge
            variant="outline"
            className={`relative z-[1] border-2 ${isActive ? 'border-white text-white' : 'border-black'}`}
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
  const [scrollHints, setScrollHints] = useState<ScrollHints>({
    canScroll: false,
    top: false,
    bottom: false,
  });

  const updateScrollHints = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setScrollHints(readScrollHints(el));
  }, []);

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

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateScrollHints();
    el.addEventListener('scroll', updateScrollHints, { passive: true });
    const observer = new ResizeObserver(updateScrollHints);
    observer.observe(el);
  return () => {
      el.removeEventListener('scroll', updateScrollHints);
      observer.disconnect();
    };
  }, [navCategories.length, updateScrollHints]);

  if (navCategories.length === 0) return null;

  const scrollClass =
    layout === 'menu'
      ? 'max-h-[min(45vh,320px)]'
      : 'max-h-[min(42vh,17.5rem)]';

  const shellClass = [
    'blog-category-nav-shell',
    scrollHints.canScroll ? 'blog-category-nav-shell--scrollable' : '',
    scrollHints.top ? 'blog-category-nav-shell--fade-top' : '',
    scrollHints.bottom ? 'blog-category-nav-shell--fade-bottom' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const list = (
    <div className={shellClass}>
      <div
        ref={scrollRef}
        className={`blog-category-nav-scroll scrollbar-mini scrollbar-mini--always overflow-y-scroll overscroll-contain ${scrollClass} ${
          layout === 'sidebar' ? 'space-y-2' : 'space-y-0.5'
        }`}
        role="list"
        aria-label="Blog categories"
        aria-describedby={scrollHints.canScroll ? 'blog-category-nav-scroll-hint' : undefined}
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

      {scrollHints.bottom ? (
        <p
          id="blog-category-nav-scroll-hint"
          className="blog-category-nav-more-hint"
          aria-live="polite"
        >
          <ChevronDown className="h-3.5 w-3.5 shrink-0 animate-bounce" aria-hidden />
          Scroll for more categories
        </p>
      ) : null}
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
