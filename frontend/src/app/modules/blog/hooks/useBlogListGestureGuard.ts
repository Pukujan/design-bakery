import { useEffect, type RefObject } from 'react';

const HORIZONTAL_RATIO = 1.5;

function isHorizontalWheel(event: WheelEvent): boolean {
  const absX = Math.abs(event.deltaX);
  const absY = Math.abs(event.deltaY);
  return absX > absY * HORIZONTAL_RATIO || (event.shiftKey && absY > 0);
}

/** Nearest ancestor with horizontal overflow scroll (category pills, etc.). */
function findHorizontalScroller(
  target: Element,
  root: HTMLElement,
): HTMLElement | null {
  let node = target instanceof HTMLElement ? target : null;
  while (node && root.contains(node)) {
    const { overflowX } = getComputedStyle(node);
    const scrollable =
      overflowX === 'auto' || overflowX === 'scroll' || overflowX === 'overlay';
    if (scrollable && node.scrollWidth > node.clientWidth + 1) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

/** True if native scrollLeft can still move in the direction of deltaX. */
function canNativeScrollX(el: HTMLElement, deltaX: number): boolean {
  const max = el.scrollWidth - el.clientWidth;
  if (max <= 1) return false;
  if (deltaX > 0) return el.scrollLeft < max - 1;
  if (deltaX < 0) return el.scrollLeft > 1;
  return false;
}

/**
 * Block macOS browser back/forward only when a horizontal gesture has nowhere
 * left to scroll. Does not stop propagation — carousel / category scroll still work.
 */
export function useBlogListGestureGuard(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const onWheel = (event: WheelEvent) => {
      if (!root.contains(event.target as Node)) return;
      if (!isHorizontalWheel(event)) return;

      const target = event.target as Element;

      // Carousel uses Embla + useBlogCarouselWheel — never intercept here.
      if (target.closest('.blog-list-carousel-viewport')) return;

      const scroller = findHorizontalScroller(target, root);
      if (scroller && canNativeScrollX(scroller, event.deltaX)) return;

      // At horizontal scroll edge (or non-scrollable area) — eat gesture so
      // the browser does not navigate history.
      event.preventDefault();
    };

    root.addEventListener('wheel', onWheel, { passive: false });
    return () => root.removeEventListener('wheel', onWheel);
  }, [rootRef]);
}
