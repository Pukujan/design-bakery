import { useEffect, useState } from 'react';
import { useInView } from '@/hooks/useInView';
import {
  resolveBlogCoverUrl,
  resolveBlogThumbnailUrl,
} from '@/modules/blog/seo/blogMeta';
import type { Blog } from '@/modules/blog/data/blogData';

type Props = {
  blog: Pick<Blog, 'title' | 'coverImageUrl' | 'thumbnailImageUrl' | 'seo'>;
  variant: 'hero' | 'card';
  /** `full` = entire artwork visible; `cover` = fill frame and clip to outline; `square` / `compact` = fixed frame. */
  coverFit?: 'square' | 'compact' | 'full' | 'cover';
  className?: string;
};

export function BlogCoverImage({
  blog,
  variant,
  coverFit = 'square',
  className = '',
}: Props) {
  const { ref: shellRef, inView } = useInView(variant === 'hero' ? '400px' : '240px');
  const url =
    variant === 'card'
      ? coverFit === 'full' || coverFit === 'cover'
        ? resolveBlogCoverUrl(blog) ?? resolveBlogThumbnailUrl(blog)
        : resolveBlogThumbnailUrl(blog)
      : resolveBlogCoverUrl(blog);
  const urlKey = url ?? '';

  const shouldLoad = variant === 'hero' || inView;
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [urlKey]);

  const isLoading = Boolean(url) && shouldLoad && !loaded && !failed;

  if (!url) {
    if (variant === 'card') {
      return (
        <div
          className={`mb-4 w-full rounded-lg border-2 border-dashed border-gray-300 bg-gray-100/80 dark:border-gray-600 dark:bg-gray-800/50 ${
            coverFit === 'full'
              ? 'blog-cover-shell--card-full'
              : coverFit === 'cover'
                ? 'blog-cover-shell--card-cover'
                : coverFit === 'compact'
                  ? 'blog-cover-shell--card-compact'
                  : 'aspect-square'
          } ${className}`}
          aria-hidden
        />
      );
    }
    return null;
  }

  if (failed) {
    return (
      <div
        className={
          variant === 'hero'
            ? `mb-4 sm:mb-5 md:mb-6 ml-11 sm:ml-12 md:ml-0 rounded-lg border-2 border-amber-300 bg-amber-50 px-4 py-6 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100 ${className}`
            : `mb-4 aspect-square w-full rounded-lg border-2 border-amber-300 bg-amber-50 px-3 py-8 text-center text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100 ${className}`
        }
        role="status"
      >
        Cover image failed to load. Check the URL in admin and save again.
      </div>
    );
  }

  const cardShellMod =
    coverFit === 'full'
      ? 'blog-cover-shell--card-full'
      : coverFit === 'cover'
        ? 'blog-cover-shell--card-cover'
        : coverFit === 'compact'
          ? 'blog-cover-shell--card-compact'
          : 'blog-cover-shell--card';

  const shellClass =
    variant === 'card'
      ? `blog-cover-shell ${cardShellMod} mb-4 overflow-hidden rounded-lg border-2 border-black ${
          coverFit === 'full' ? '!overflow-visible' : ''
        } ${className}`
      : `blog-cover-shell blog-cover-shell--hero mb-4 sm:mb-5 md:mb-6 ml-11 sm:ml-12 md:ml-0 overflow-hidden rounded-lg md:rounded-xl border-2 sm:border-2 md:border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] md:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${className}`;

  const imgClass =
    variant === 'card'
      ? coverFit === 'full'
        ? 'blog-cover-img--card-full'
        : coverFit === 'cover'
          ? 'blog-cover-img--card-cover'
          : 'blog-cover-img--card block h-full w-full object-contain'
      : 'blog-cover-img--hero block w-full h-auto max-h-[min(720px,85vh)] object-contain';

  return (
    <div
      ref={shellRef}
      className={`${shellClass}${isLoading ? ' blog-cover-shell--loading' : ''}`}
      aria-busy={isLoading}
    >
      {isLoading ? (
        <div className="blog-cover-skeleton" aria-hidden>
          <p className="blog-cover-skeleton__label">Loading cover…</p>
        </div>
      ) : null}
      {shouldLoad ? (
        <img
          key={urlKey}
          src={url}
          alt={variant === 'card' ? '' : blog.title ? `Cover for ${blog.title}` : 'Blog cover'}
          className={imgClass}
          loading={variant === 'card' ? 'lazy' : 'eager'}
          decoding="async"
          onLoad={() => {
            setLoaded(true);
            setFailed(false);
          }}
          onError={() => setFailed(true)}
        />
      ) : null}
    </div>
  );
}
