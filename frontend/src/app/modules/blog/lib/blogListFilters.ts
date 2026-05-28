import type { BlogSummary } from '@/modules/blog/data/blogData';

/** Posts visible per carousel slide (3×1 row on md+). */
export const BLOG_CAROUSEL_SLIDE_SIZE = 3;

/** Mobile infinite-scroll batch size. */
export const BLOG_MOBILE_BATCH_SIZE = 6;

export function filterBlogsBySearch(blogs: BlogSummary[], query: string): BlogSummary[] {
  const q = query.trim().toLowerCase();
  if (!q) return blogs;

  return blogs.filter((blog) => {
    const haystack = [
      blog.title,
      blog.excerpt,
      blog.author,
      blog.category,
      blog.date,
      blog.readTime,
      ...(blog.tags ?? []),
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function chunkCarouselSlides<T>(
  items: T[],
  slideSize = BLOG_CAROUSEL_SLIDE_SIZE,
): T[][] {
  if (items.length === 0) return [];
  const slides: T[][] = [];
  for (let i = 0; i < items.length; i += slideSize) {
    slides.push(items.slice(i, i + slideSize));
  }
  return slides;
}

export function carouselSlideRange(
  slideIndex: number,
  slideSize: number,
  totalItems: number,
): { start: number; end: number } {
  if (totalItems === 0) return { start: 0, end: 0 };
  const start = slideIndex * slideSize + 1;
  const end = Math.min((slideIndex + 1) * slideSize, totalItems);
  return { start, end };
}
