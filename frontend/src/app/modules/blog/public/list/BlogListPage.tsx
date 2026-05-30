/** Blog motion: guidelines/agent-devlog-blog-motion.md — decor via BlogPageMotion */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Search, X } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Squiggle } from '@/components/GraphicElements';
import {
  BlogPageDecor,
  PlayfulBlogTitle,
  blogButtonMotion,
} from '@/modules/blog/shared/BlogPageMotion';
import { useBlogCategories, useBlogData } from '@/modules/blog/data/blogData';
import { filterBlogsBySearch } from '@/modules/blog/lib/blogListFilters';
import {
  buildBlogsPathWithCategory,
  resolveCategoryFromSearchParam,
  resolveBlogCategoryId,
} from '@/modules/blog/lib/blogCategoryNav';
import { usePortfolio } from '@/portfolios/PortfolioContext';
import { BlogListCarousel } from './BlogListCarousel';
import { BlogScrollToTopFab } from '@/modules/blog/shared/BlogScrollToTopFab';
import { useBlogListGestureGuard } from '@/modules/blog/hooks/useBlogListGestureGuard';
import { BlogListHead } from '@/seo/BlogListHead';

type CategoryTrackScrollHints = {
  canScroll: boolean;
  left: boolean;
  right: boolean;
};

function readCategoryTrackScrollHints(el: HTMLDivElement): CategoryTrackScrollHints {
  const overflow = el.scrollWidth - el.clientWidth > 6;
  return {
    canScroll: overflow,
    left: overflow && el.scrollLeft > 6,
    right: overflow && el.scrollLeft + el.clientWidth < el.scrollWidth - 6,
  };
}

export function BlogListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { pathTo } = usePortfolio();
  const categories = useBlogCategories();
  const { blogs, isLoading } = useBlogData();
  const blogsPath = pathTo('/blogs');
  const selectedCategory = useMemo(
    () => resolveCategoryFromSearchParam(searchParams.get('category'), categories),
    [searchParams, categories],
  );
  const [searchQuery, setSearchQuery] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const gestureGuardRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const dragStartRef = useRef(false);
  const [categoryScrollHints, setCategoryScrollHints] = useState<CategoryTrackScrollHints>({
    canScroll: false,
    left: false,
    right: false,
  });

  const updateCategoryScrollHints = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCategoryScrollHints(readCategoryTrackScrollHints(el));
  }, []);

  const categoryFilteredBlogs = useMemo(
    () =>
      selectedCategory === 'all'
        ? blogs
        : blogs.filter(
            (blog) => resolveBlogCategoryId(blog.category, categories) === selectedCategory,
          ),
    [blogs, selectedCategory, categories],
  );

  const filteredBlogs = useMemo(
    () => filterBlogsBySearch(categoryFilteredBlogs, searchQuery),
    [categoryFilteredBlogs, searchQuery],
  );

  const carouselKey = `${selectedCategory}:${searchQuery.trim()}:${filteredBlogs.length}`;

  useBlogListGestureGuard(gestureGuardRef);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateCategoryScrollHints();
    el.addEventListener('scroll', updateCategoryScrollHints, { passive: true });
    const observer = new ResizeObserver(updateCategoryScrollHints);
    observer.observe(el);

    return () => {
      el.removeEventListener('scroll', updateCategoryScrollHints);
      observer.disconnect();
    };
  }, [categories.length, updateCategoryScrollHints]);

  const categoryShellClass = [
    'blog-list-category-shell',
    categoryScrollHints.canScroll ? 'blog-list-category-shell--scrollable' : '',
    categoryScrollHints.left ? 'blog-list-category-shell--fade-left' : '',
    categoryScrollHints.right ? 'blog-list-category-shell--fade-right' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    dragStartRef.current = false;
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    if (Math.abs(walk) > 5) {
      dragStartRef.current = true;
    }
    scrollRef.current.scrollLeft = scrollLeft - walk;
    updateCategoryScrollHints();
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    updateCategoryScrollHints();
    setTimeout(() => {
      dragStartRef.current = false;
    }, 50);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  return (
    <>
      <BlogListHead />
      <section className="relative min-h-screen overflow-x-clip bg-gradient-to-br from-purple-100 via-indigo-100 to-blue-100 py-24 px-6 dark:from-purple-950 dark:via-indigo-950 dark:to-blue-950 md:overflow-x-visible">
      <BlogPageDecor variant="list" seed={`blogs-${selectedCategory}`} />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-[clamp(3rem,7vw,6rem)] leading-none mb-4 font-black">
            <PlayfulBlogTitle
              text="BLOGS"
              className="text-purple-600 dark:text-purple-400"
            />
          </h2>
          <p className="text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto mb-6">
            Technical study logs on AI/ML systems, LLM workflows, legal-tech AI,
            eval engineering, and document intelligence
          </p>
          <Squiggle color="#4169E1" className="mx-auto" />
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="mb-8 max-w-xl mx-auto"
        >
          <label htmlFor="blog-search" className="sr-only">
            Search blog posts
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500 dark:text-gray-400"
              aria-hidden
            />
            <Input
              id="blog-search"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by title, topic, or tag…"
              className="h-12 rounded-full border-4 border-black bg-white pl-12 pr-12 text-base font-medium shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus-visible:ring-purple-400 dark:border-gray-600 dark:bg-gray-900 dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.15)]"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </motion.div>

        <div
          ref={gestureGuardRef}
          className="blog-list-swipe-guard"
          aria-label="Blog list — horizontal gestures scroll content, not browser history"
        >
        {/* Swipable Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className={categoryShellClass}>
            <div
              ref={scrollRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              onScroll={updateCategoryScrollHints}
              className="blog-list-category-track flex gap-4 overflow-x-auto p-2 scrollbar-hide snap-x snap-mandatory scroll-smooth cursor-grab active:cursor-grabbing select-none"
              aria-label="Blog categories"
            >
              {categories.map((category) => (
                <motion.div key={category.id} {...blogButtonMotion} className="snap-start">
                  <Button
                    onClick={(e) => {
                      if (dragStartRef.current) {
                        e.preventDefault();
                        return;
                      }
                      navigate(buildBlogsPathWithCategory(blogsPath, category.id));
                    }}
                    className={`
                      px-6 py-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                      hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]
                      transition-all font-black text-base rounded-full whitespace-nowrap
                      ${
                        selectedCategory === category.id
                          ? 'text-white'
                          : 'bg-white dark:bg-gray-900 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                      }
                    `}
                    style={{
                      backgroundColor:
                        selectedCategory === category.id
                          ? category.color
                          : undefined,
                    }}
                  >
                    {category.label}
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="scroll-mt-24">
          <BlogListCarousel
            blogs={filteredBlogs}
            isLoading={isLoading}
            searchQuery={searchQuery}
            carouselKey={carouselKey}
            onClearSearch={() => setSearchQuery('')}
          />
        </div>
        </div>
      </div>

      <BlogScrollToTopFab />
    </section>
    </>
  );
}
