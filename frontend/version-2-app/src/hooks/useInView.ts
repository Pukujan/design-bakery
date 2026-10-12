import { useEffect, useRef, useState } from "react";
import { journey } from "@/lib/journey-state";

type Entry = {
  el: HTMLElement;
  threshold: number;
  set: (v: boolean) => void;
  top: number;
  height: number;
  inView: boolean;
};

const entries = new Map<HTMLElement, Entry>();
let raf = 0;
let lastY = Number.NaN;

/** the document-space box, cached so the hot path never reads layout */
function measure(e: Entry) {
  const r = e.el.getBoundingClientRect();
  e.top = r.top + window.scrollY;
  e.height = Math.max(1, r.height);
}

function evaluate(e: Entry, y: number, prevY: number, vh: number) {
  const w = vh * 0.92;
  const overlap = Math.min(e.top + e.height, y + w) - Math.max(e.top, y);
  const inside = overlap / e.height >= e.threshold;

  /*
   * A single frame can move the eased position thousands of pixels — a hard
   * flick at a low frame rate — so the point sample above can leap clean over
   * an element's in-view band without ever landing inside it. The band is the
   * y-range over which the overlap reaches the threshold; if this frame's
   * segment crossed it, the element was on screen during the move.
   */
  const swept =
    !Number.isNaN(prevY) &&
    Math.max(prevY, y) >= e.top + e.threshold * e.height - w &&
    Math.min(prevY, y) <= e.top + e.height * (1 - e.threshold);

  /*
   * A sweep may only turn an element on, never off: off is decided by the
   * current position alone, so a big jump never leaves a landed-on element dark.
   * (A reveal swept past flips true for the frame it was crossed and back the
   * next — harmless, it is off-screen by then.)
   */
  const next = inside || swept;
  if (next !== e.inView) {
    e.inView = next;
    e.set(next);
  }
}

function tick() {
  raf = 0;
  const y = journey.scrollY;
  const prevY = lastY;
  if (y !== lastY) {
    lastY = y;
    const vh = window.innerHeight;
    for (const e of entries.values()) evaluate(e, y, prevY, vh);
  }
  // keep stepping while the eased position is still chasing the scrollbar
  if (Math.abs(journey.scrollY - window.scrollY) > 0.5) raf = requestAnimationFrame(tick);
}

function schedule() {
  if (!raf) raf = requestAnimationFrame(tick);
}

function remeasure() {
  for (const e of entries.values()) measure(e);
  lastY = Number.NaN;
  schedule();
}

let wired = false;
function wire() {
  if (wired) return;
  wired = true;
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", remeasure);
  window.addEventListener("orientationchange", remeasure);
  window.addEventListener("load", remeasure);
  document.fonts?.ready.then(remeasure).catch(() => {});
  new ResizeObserver(remeasure).observe(document.body);
}

/**
 * Content appears inside the world as the descent passes it. One shared
 * registry drives every block from the driver's eased scroll position, and each
 * frame it sweeps the whole segment the position moved through — so a fast
 * flick replays instead of skipping, and it plays in reverse on the way back up.
 */
export function useInView<T extends HTMLElement>(threshold = 0.28) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const entry: Entry = { el, threshold, set: setInView, top: 0, height: 1, inView: false };
    measure(entry);
    entries.set(el, entry);
    wire();
    lastY = Number.NaN;
    schedule();
    return () => {
      entries.delete(el);
    };
  }, [threshold]);

  return { ref, inView };
}
