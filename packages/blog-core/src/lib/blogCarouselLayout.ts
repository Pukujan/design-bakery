/** Gap between carousel cards (Embla padding-left pattern). */
export const BLOG_CAROUSEL_GAP_PX = 40;

/** Tailwind: pl-10 = 2.5rem = 40px — ! overrides CarouselItem default pl-4 */
export const BLOG_CAROUSEL_GAP_CLASS = '!pl-10';
export const BLOG_CAROUSEL_GAP_OFFSET_CLASS = '!-ml-10';

/** md–lg: 2 cards; lg+: 3 cards (one gutter vs two gutters in width calc). */
export const BLOG_CAROUSEL_SLIDE_BASIS_CLASS =
  'basis-[calc((100%-2.5rem)/2)] shrink-0 grow-0 lg:basis-[calc((100%-5rem)/3)]';

/** Break out of max-width page column to viewport edges. */
export const BLOG_CAROUSEL_BLEED_CLASS =
  'relative left-[50%] -ml-[50vw] w-screen max-w-[100vw]';
