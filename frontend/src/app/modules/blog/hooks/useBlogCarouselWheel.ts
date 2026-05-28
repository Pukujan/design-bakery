import { useEffect, useRef, type RefObject } from 'react';
import type { CarouselApi } from '@/components/ui/carousel';

/** Horizontal wheel must dominate vertical by this ratio (trackpads often mix both). */
const HORIZONTAL_WHEEL_RATIO = 1.85;

/** Scale trackpad delta before accumulation (lower = slower). */
const WHEEL_DELTA_SCALE = 0.28;

/** Accumulated scaled delta needed to advance one slide. */
const WHEEL_SNAP_THRESHOLD = 120;

/** Minimum time between slide steps so one flick cannot skip many cards. */
const WHEEL_STEP_COOLDOWN_MS = 360;

/**
 * Map horizontal trackpad / shift+vertical wheel to Embla scrollPrev/scrollNext.
 * One slide per gesture burst; damped so sideways scroll does not jump ahead.
 */
export function useBlogCarouselWheel(
  api: CarouselApi | undefined,
  enabled: boolean,
  wheelRootRef?: RefObject<HTMLElement | null>,
) {
  const pendingDeltaRef = useRef(0);
  const lastStepAtRef = useRef(0);

  useEffect(() => {
    if (!api || !enabled) return;

    const root = wheelRootRef?.current ?? api.rootNode();
    if (!root) return;

    const onWheel = (event: WheelEvent) => {
      let delta = event.deltaX;
      const absX = Math.abs(event.deltaX);
      const absY = Math.abs(event.deltaY);

      if (absX <= absY * HORIZONTAL_WHEEL_RATIO) {
        if (event.shiftKey) delta = event.deltaY;
        else return;
      }

      const wantsNext = delta > 0;
      const wantsPrev = delta < 0;
      const canConsume =
        (wantsNext && api.canScrollNext()) || (wantsPrev && api.canScrollPrev());

      // Horizontal wheel: advance carousel when possible; at first/last slide only
      // preventDefault so macOS does not trigger browser back/forward.
      event.preventDefault();

      if (!canConsume) {
        pendingDeltaRef.current = 0;
        return;
      }
      pendingDeltaRef.current += delta * WHEEL_DELTA_SCALE;

      const now = performance.now();
      if (now - lastStepAtRef.current < WHEEL_STEP_COOLDOWN_MS) return;

      if (pendingDeltaRef.current >= WHEEL_SNAP_THRESHOLD) {
        if (!api.canScrollNext()) {
          pendingDeltaRef.current = 0;
          return;
        }
        api.scrollNext();
        pendingDeltaRef.current = 0;
        lastStepAtRef.current = now;
        return;
      }

      if (pendingDeltaRef.current <= -WHEEL_SNAP_THRESHOLD) {
        if (!api.canScrollPrev()) {
          pendingDeltaRef.current = 0;
          return;
        }
        api.scrollPrev();
        pendingDeltaRef.current = 0;
        lastStepAtRef.current = now;
      }
    };

    root.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      root.removeEventListener('wheel', onWheel);
      pendingDeltaRef.current = 0;
      lastStepAtRef.current = 0;
    };
  }, [api, enabled, wheelRootRef]);
}
