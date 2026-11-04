/**
 * Programmatic scrolling for the stage. The stage uses Lenis for smooth wheel scrolling, and the browser's own
 * smooth scrollIntoView fights it and stops partway, so every script-driven scroll goes through Lenis here.
 * Falls back to the browser's scroll where Lenis is off (reduced motion, touch).
 */
import type Lenis from 'lenis';

let lenis: Lenis | null = null;

export function setStageLenis(instance: Lenis | null) {
  lenis = instance;
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Smoothly scroll to the top of the page. Returns how long the scroll takes, in seconds. */
export function scrollStageToTop(options: { slow?: boolean } = {}): number {
  if (!lenis) {
    window.scrollTo({ top: 0, behavior: 'auto' });
    return 0;
  }
  const duration = options.slow ? Math.min(2.4, Math.max(1.2, window.scrollY / 2500)) : 0.9;
  lenis.scrollTo(0, options.slow ? { duration, easing: easeInOut } : { duration });
  return duration;
}

/**
 * Smoothly scroll an element to the top of the viewport. `slow` is for a voice call: the page glides there in an even
 * scroll, longer the further it has to go (1.2 to 2.4 seconds), so the visitor can follow where it went.
 */
export function scrollStageToElement(element: HTMLElement | null, options: { slow?: boolean; offset?: number } = {}): number {
  if (!element) return 0;
  if (!lenis) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return 0;
  }
  if (!options.slow) {
    lenis.scrollTo(element, { duration: 1.1, offset: options.offset ?? 0 });
    return 1.1;
  }
  const distance = Math.abs(element.getBoundingClientRect().top);
  const duration = Math.min(2.4, Math.max(1.2, distance / 2500));
  lenis.scrollTo(element, { duration, easing: easeInOut, offset: options.offset ?? 0 });
  return duration;
}

/** Put the page at a scroll position at once. Called every frame by a scripted glide that sets its own easing. */
export function setStageScroll(y: number) {
  if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
  else window.scrollTo({ top: y, behavior: 'auto' });
}
