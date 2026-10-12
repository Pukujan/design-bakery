/**
 * The live state of the journey. Written once per frame by the scroll driver
 * and read directly by the canvas particle field — no React re-renders.
 */
export type Tier = "fine" | "coarse";

/**
 * Which tier this device gets. It lives here rather than in the driver because
 * the particle field needs the same answer before the driver has run: child
 * effects fire before the parent's, so anything that reads a value the driver
 * writes would see the default on first paint.
 */
export function detectTier(): Tier {
  return window.innerWidth < 768 || (navigator.hardwareConcurrency ?? 8) <= 4 ? "coarse" : "fine";
}

export const journey = {
  /** whole-document progress, 0 (afternoon) -> 1 (night) */
  p: 0,
  /** how far the tear has opened */
  tear: 0,
  /** how far the blade has swept */
  blade: 0,
  /** the pierce itself — spikes once when the tip lands, read by the sparks */
  impact: 0,
  /** 0 = day particles (petals), 1 = night particles (embers, stars) */
  night: 0,
  /** how much the world has gone to night */
  nightT: 0,
  /** viewport metrics */
  vw: 0,
  vh: 0,
  scrollY: 0,
  /** visible position of the two torn edges, measured along the seam normal */
  offA: 0,
  offB: 0,
  /** how far the seam line itself sits from the frame centre, along the normal */
  seamD: 0,
  reduced: false,
  tier: "fine" as Tier,
};
