/**
 * The live state of the journey. Written once per frame by the scroll driver
 * and read directly by the canvas particle field — no React re-renders.
 */
export type Tier = "fine" | "coarse";

export const journey = {
  /** whole-document progress, 0 (afternoon) -> 1 (night) */
  p: 0,
  /** how far the tear has opened */
  tear: 0,
  /** how far the blade has swept */
  blade: 0,
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
