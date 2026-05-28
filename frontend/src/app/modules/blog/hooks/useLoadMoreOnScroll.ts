import { useEffect, useRef } from 'react';

/**
 * Calls `onLoadMore` when the sentinel enters the viewport.
 * Pass `unlockKey` (e.g. visible item count) so the next batch can load after the previous one.
 */
export function useLoadMoreOnScroll(
  hasMore: boolean,
  onLoadMore: () => void,
  unlockKey?: string | number,
) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const onLoadMoreRef = useRef(onLoadMore);
  const lockedRef = useRef(false);
  onLoadMoreRef.current = onLoadMore;

  useEffect(() => {
    lockedRef.current = false;
  }, [unlockKey]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || lockedRef.current) return;
        lockedRef.current = true;
        onLoadMoreRef.current();
      },
      { rootMargin: '320px 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, unlockKey]);

  return sentinelRef;
}
