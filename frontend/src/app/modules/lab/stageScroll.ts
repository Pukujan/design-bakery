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

/** Smoothly scroll to the top of the page. */
export function scrollStageToTop() {
  if (lenis) lenis.scrollTo(0, { duration: 0.9 });
  else window.scrollTo({ top: 0, behavior: 'auto' });
}

/** Smoothly scroll an element to the top of the viewport. */
export function scrollStageToElement(element: HTMLElement | null) {
  if (!element) return;
  if (lenis) lenis.scrollTo(element, { duration: 1.1 });
  else element.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
