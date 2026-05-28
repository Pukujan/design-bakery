import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import { BlogPostCard } from '@/modules/blog/shared/BlogPostCard';
import { useLoadMoreOnScroll } from '@/modules/blog/hooks/useLoadMoreOnScroll';
import type { BlogSummary } from '@/modules/blog/data/blogData';
import { BLOG_MOBILE_BATCH_SIZE } from '@/modules/blog/lib/blogListFilters';
import {
  BLOG_CAROUSEL_BLEED_CLASS,
  BLOG_CAROUSEL_GAP_OFFSET_CLASS,
  BLOG_CAROUSEL_GAP_CLASS,
  BLOG_CAROUSEL_SLIDE_BASIS_CLASS,
} from '@/modules/blog/lib/blogCarouselLayout';
import { useBlogCarouselVisibleCount } from '@/modules/blog/hooks/useBlogCarouselVisibleCount';
import { usePortfolio } from '@/portfolios/PortfolioContext';
import { useBlogCarouselWheel } from '@/modules/blog/hooks/useBlogCarouselWheel';

type BlogListCarouselProps = {
  blogs: BlogSummary[];
  isLoading: boolean;
  searchQuery: string;
  carouselKey: string;
  onClearSearch?: () => void;
};

function BlogListEmpty({
  searchQuery,
  onClearSearch,
}: {
  searchQuery: string;
  onClearSearch?: () => void;
}) {
  return (
    <div className="rounded-xl border-4 border-black bg-white/90 p-10 text-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:border-gray-600 dark:bg-gray-900/90">
      <p className="text-lg font-black text-gray-900 dark:text-gray-100">No posts found</p>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        {searchQuery.trim()
          ? 'Try a different search term or category.'
          : 'No posts in this category yet.'}
      </p>
      {searchQuery.trim() && onClearSearch ? (
        <Button
          type="button"
          variant="outline"
          className="mt-6 border-2 border-black font-bold"
          onClick={onClearSearch}
        >
          Clear search
        </Button>
      ) : null}
    </div>
  );
}

function BlogListSkeleton() {
  return (
    <>
      <div className="flex flex-col gap-6 md:hidden">
        {Array.from({ length: 2 }, (_, idx) => (
          <div
            key={`blog-skeleton-m-${idx}`}
            className="min-h-[280px] rounded-xl border-6 border-black bg-white/80 dark:bg-gray-900/80 animate-pulse shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
            aria-hidden
          />
        ))}
      </div>
      <div
        className={`hidden md:flex ${BLOG_CAROUSEL_BLEED_CLASS} ${BLOG_CAROUSEL_GAP_OFFSET_CLASS}`}
      >
        {Array.from({ length: 2 }, (_, idx) => (
          <div
            key={`blog-skeleton-d-${idx}`}
            className={`${BLOG_CAROUSEL_GAP_CLASS} ${BLOG_CAROUSEL_SLIDE_BASIS_CLASS} min-h-[22rem] rounded-xl border-6 border-black bg-white/80 dark:bg-gray-900/80 animate-pulse shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`}
            aria-hidden
          />
        ))}
      </div>
    </>
  );
}

function BlogListMobileFeed({
  blogs,
  listKey,
  onOpenPost,
}: {
  blogs: BlogSummary[];
  listKey: string;
  onOpenPost: (id: number) => void;
}) {
  const [visibleCount, setVisibleCount] = useState(BLOG_MOBILE_BATCH_SIZE);

  useEffect(() => {
    setVisibleCount(BLOG_MOBILE_BATCH_SIZE);
  }, [listKey]);

  const visibleBlogs = blogs.slice(0, visibleCount);
  const hasMore = visibleCount < blogs.length;

  const loadMore = useCallback(() => {
    setVisibleCount((count) => Math.min(count + BLOG_MOBILE_BATCH_SIZE, blogs.length));
  }, [blogs.length]);

  const sentinelRef = useLoadMoreOnScroll(hasMore, loadMore, visibleCount);

  return (
    <div className="space-y-6">
      <p className="text-center text-sm font-bold text-gray-700 dark:text-gray-300">
        {visibleBlogs.length} of {blogs.length} posts
      </p>

      <div className="flex flex-col gap-6">
        {visibleBlogs.map((blog, idx) => (
          <motion.div
            key={blog.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: Math.min(idx * 0.04, 0.2) }}
          >
            <BlogPostCard blog={blog} onOpen={() => onOpenPost(blog.id)} />
          </motion.div>
        ))}
      </div>

      {hasMore ? (
        <div ref={sentinelRef} className="flex justify-center py-6" aria-hidden>
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-black border-t-purple-500 dark:border-gray-600 dark:border-t-purple-400" />
        </div>
      ) : blogs.length > BLOG_MOBILE_BATCH_SIZE ? (
        <p className="text-center text-sm font-bold text-gray-500 dark:text-gray-400">
          You&apos;ve reached the end
        </p>
      ) : null}
    </div>
  );
}

function BlogListDesktopCarousel({
  blogs,
  carouselKey,
  searchQuery,
  onOpenPost,
}: {
  blogs: BlogSummary[];
  carouselKey: string;
  searchQuery: string;
  onOpenPost: (id: number) => void;
}) {
  const [api, setApi] = useState<CarouselApi>();
  const [slideIndex, setSlideIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const carouselViewportRef = useRef<HTMLDivElement>(null);
  const visiblePerView = useBlogCarouselVisibleCount();

  const totalCards = blogs.length;
  const visibleEnd = Math.min(slideIndex + visiblePerView, totalCards);
  const visibleStart = totalCards === 0 ? 0 : slideIndex + 1;

  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      setSlideIndex(api.selectedScrollSnap());
      setCanScrollPrev(api.canScrollPrev());
      setCanScrollNext(api.canScrollNext());
    };
    onSelect();
    api.on('reInit', onSelect);
    api.on('select', onSelect);
    return () => {
      api.off('select', onSelect);
      api.off('reInit', onSelect);
    };
  }, [api]);

  useEffect(() => {
    api?.scrollTo(0, true);
    setSlideIndex(0);
  }, [carouselKey, api]);

  useEffect(() => {
    if (!api) return;
    api.reInit();
  }, [api, blogs.length, carouselKey, visiblePerView]);

  useBlogCarouselWheel(api, totalCards > 1, carouselViewportRef);

  return (
    <div className="space-y-6">
      <p className="text-center text-sm font-bold text-gray-700 dark:text-gray-300">
        Showing {visibleStart}–{visibleEnd} of {blogs.length}
        {searchQuery.trim() ? ` matching “${searchQuery.trim()}”` : ''}
      </p>

      <div
        className={`blog-list-carousel blog-list-carousel--bleed pt-4 pb-16 md:pb-20 ${BLOG_CAROUSEL_BLEED_CLASS}`}
      >
        <div
          ref={carouselViewportRef}
          className="blog-list-carousel-viewport relative pt-2 pb-6"
          aria-label="Blog posts carousel. Use arrows, drag, or swipe sideways to browse posts."
        >
          {totalCards > 1 ? (
            <>
              <button
                type="button"
                className="blog-list-carousel-nav blog-list-carousel-nav--prev"
                disabled={!canScrollPrev}
                onClick={() => api?.scrollPrev()}
                aria-label="Previous posts"
              >
                <span className="blog-list-carousel-nav__hit">
                  <ChevronLeft className="h-10 w-10 stroke-[2.5]" aria-hidden />
                </span>
              </button>
              <button
                type="button"
                className="blog-list-carousel-nav blog-list-carousel-nav--next"
                disabled={!canScrollNext}
                onClick={() => api?.scrollNext()}
                aria-label="Next posts"
              >
                <span className="blog-list-carousel-nav__hit">
                  <ChevronRight className="h-10 w-10 stroke-[2.5]" aria-hidden />
                </span>
              </button>
            </>
          ) : null}

          <Carousel
            key={`${carouselKey}:${visiblePerView}`}
            setApi={setApi}
            opts={{
              align: 'start',
              loop: false,
              dragFree: false,
              containScroll: 'keepSnaps',
              slidesToScroll: 1,
              watchDrag: (_api, event) => {
                const target = event.target;
                if (!(target instanceof Element)) return true;
                return !target.closest('button, a, [role="button"]');
              },
            }}
            className="w-full"
          >
            <CarouselContent
              className={`${BLOG_CAROUSEL_GAP_OFFSET_CLASS} ml-0 items-stretch`}
            >
              {blogs.map((blog, idx) => (
                <CarouselItem
                  key={blog.id}
                  className={`${BLOG_CAROUSEL_GAP_CLASS} ${BLOG_CAROUSEL_SLIDE_BASIS_CLASS} min-w-0`}
                >
                  <motion.div
                    className="h-full"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: Math.min(idx * 0.04, 0.16) }}
                  >
                    <BlogPostCard blog={blog} onOpen={() => onOpenPost(blog.id)} />
                  </motion.div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          {totalCards > 1 ? (
            <p className="blog-list-carousel-hint px-4 sm:px-6">
              Drag or swipe sideways to scroll · trackpad scroll pans horizontally · up/down
              moves the page
            </p>
          ) : null}
        </div>
      </div>

      {totalCards > visiblePerView ? (
        <div className="flex flex-col items-center gap-3 px-6 pb-4">
          <p className="text-sm font-bold text-gray-600 dark:text-gray-400">
            Card {slideIndex + 1} of {totalCards}
          </p>
          <div
            className="h-2.5 w-full max-w-md overflow-hidden rounded-full border-2 border-black bg-white dark:bg-gray-800"
            role="progressbar"
            aria-valuenow={slideIndex + 1}
            aria-valuemin={1}
            aria-valuemax={totalCards}
          >
            <div
              className="h-full bg-purple-600 transition-[width] duration-200 dark:bg-purple-400"
              style={{ width: `${((slideIndex + 1) / totalCards) * 100}%` }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function BlogListCarousel({
  blogs,
  isLoading,
  searchQuery,
  carouselKey,
  onClearSearch,
}: BlogListCarouselProps) {
  const navigate = useNavigate();
  const { pathTo } = usePortfolio();

  const openPost = useCallback(
    (id: number) => navigate(pathTo(`/blogs/${id}`)),
    [navigate, pathTo],
  );

  if (isLoading && blogs.length === 0) {
    return <BlogListSkeleton />;
  }

  if (blogs.length === 0) {
    return <BlogListEmpty searchQuery={searchQuery} onClearSearch={onClearSearch} />;
  }

  return (
    <>
      <div className="md:hidden">
        <BlogListMobileFeed blogs={blogs} listKey={carouselKey} onOpenPost={openPost} />
      </div>

      <div className="hidden md:block">
        <BlogListDesktopCarousel
          blogs={blogs}
          carouselKey={carouselKey}
          searchQuery={searchQuery}
          onOpenPost={openPost}
        />
      </div>
    </>
  );
}
