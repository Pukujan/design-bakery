import { useEffect, useRef } from 'react';
import type { CarouselApi } from '@/components/ui/carousel';

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
export function useBlogCarouselWheel(api: CarouselApi | undefined, enabled: boolean) {
  const pendingDeltaRef = useRef(0);
  const lastStepAtRef = useRef(0);

  useEffect(() => {
    if (!api || !enabled) return;

    const viewport = api.rootNode();
    if (!viewport) return;

    const onWheel = (event: WheelEvent) => {
      let delta = event.deltaX;
      if (Math.abs(delta) <= Math.abs(event.deltaY)) {
        if (event.shiftKey) delta = event.deltaY;
        else return;
      }

      event.preventDefault();
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

    viewport.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      viewport.removeEventListener('wheel', onWheel);
      pendingDeltaRef.current = 0;
      lastStepAtRef.current = 0;
    };
  }, [api, enabled]);
}
