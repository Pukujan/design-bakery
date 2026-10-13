/**
 * Painted key-art plates and the geometry of the world.
 * Every tunable about the scene lives here so the journey can be
 * re-composed without touching the components.
 */

/**
 * The scene plates live in public/ and are served under the app's base path
 * (the site root). import.meta.env.BASE_URL carries that prefix, so the same
 * source works at either mount point.
 */
const plate = (name: string) => `${import.meta.env.BASE_URL}${name}`;

export const ART = {
  /** Scene 1 / 2 — pastel sunset arrival */
  sunset: plate("plate-arrival.png"),
  /** Scene 3 — warm dusk, the house balcony */
  dusk: plate("generated-1791737575036-a882ca3f26ae.png"),
  /** Scene 5 — moonlit night, the lantern street */
  night: plate("generated-1791737635520-1c77ddc3a49f.png"),
  /** Scene 4 — torn washi seam with an ember edge */
  tear: plate("generated-1791737714568-1b15f1f9e102.png"),
  /** The two eyes that look out from inside the cut */
  eyes: plate("generated-1791738466279-e37e4bf0b2d5.png"),
  /** Near-black foreground silhouette band */
  band: plate("generated-1791738524759-8c7e0a4eca57.png"),
  /** Luminous cloud and mist bands (composited with screen) */
  clouds: plate("generated-1791737951319-4f89fd991e69.png"),
  /** Scene 2 — the work scene, far plane: sky, cloud, low sun, mountains, water */
  workBg: plate("plate-work-bg.png"),
  /** Scene 2 — the work scene, mid plane: torii, lantern village, pagodas, boat */
  workMid: plate("plate-work-mid.png"),
  /**
   * Scene 2 — the work scene, near plane: sharp sakura sprays framing the frame
   * edges, centre open. Alpha feathered to nothing well inside the plate, so no
   * rectangular edge can show.
   */
  workFg: plate("plate-work-fg.png"),
  /**
   * The portrait compositions. A landscape plate under `cover` on a phone shows
   * only its centre quarter, which magnifies every blossom about four times and
   * can bring the plate's own edge into view; these are painted for the tall
   * frame instead, so the sprays sit on the margins at their intended scale.
   */
  workFgPortrait: plate("plate-work-fg-portrait.png"),
  /**
   * Scene 1 — the intro bloom, two transparent foreground-only plates of the
   * same edge-framing composition: buds at t=0 and full blossom at full bloom.
   * They are cross-faded over the frozen arrival plate, which never changes.
   */
  bloomBuds: plate("plate-bloom-buds.png"),
  bloomFull: plate("plate-bloom-full.png"),
  bloomBudsPortrait: plate("plate-bloom-buds-portrait.png"),
  bloomFullPortrait: plate("plate-bloom-full-portrait.png"),
} as const;

/**
 * The seam line. A 152deg gradient axis means the tear itself runs shallow
 * from the lower-left of the frame up to the upper-right — the classic slash —
 * and the two halves pull apart along `normal`.
 */
const ANGLE = 152;
export const SEAM = {
  angle: ANGLE,
  /** unit normal along the gradient axis (screen coords, +y is down) */
  nx: Math.sin((ANGLE * Math.PI) / 180),
  ny: -Math.cos((ANGLE * Math.PI) / 180),
  /** how far the two halves drift apart, as a fraction of the diagonal */
  separation: 0.07,
  /** how wide the paper band opens, in percent of the gradient length */
  spread: 34,
  feather: 1.4,
  /** the slash, in degrees, for anything that must sit inside it */
  slash: -28,
} as const;

/**
 * The sun already painted into the plate. The CSS bloom is placed on top of it,
 * so the cut transforms *that* sun rather than lighting a second one. Position
 * is given in image-space fractions, and `cover` cropping is solved for in the
 * scroll driver because the on-screen position depends on the viewport's aspect
 * ratio.
 */
export const SUN = {
  /** fraction across the source plate */
  fx: 0.3753,
  /** fraction down the source plate */
  fy: 0.5307,
  /** the plate's aspect ratio (1792x1024) */
  aspect: 1792 / 1024,
  /** .db-plate-sunset geometry: inset -5% -3%, background-position center 60% */
  insetY: 0.05,
  insetX: 0.03,
  posY: 0.6,
} as const;

export const ORB = {
  /** how far the sun drops, as a fraction of viewport height */
  sunSink: 0.13,
  /** the disc size, in vmin */
  size: (vw: number) => (vw < 768 ? 21 : 16),
  /** the moon's own disc size, in vmin — a touch smaller than the sun's bloom */
  moonSize: (vw: number) => (vw < 768 ? 19 : 12),
} as const;

/**
 * The moon, as a % of the viewport.
 *
 * The sun bloom has to be solved from the arrival plate's crop, because it sits
 * on a sun painted into that plate. The moon has no such anchor: the night plate
 * is a different scene, and on a portrait phone the landscape plates under
 * `cover` show only their centre quarter, which is what pushed the orb out to
 * the very edge of the frame. Placing it from viewport percentages instead puts
 * it where a moon belongs — the upper third — on either aspect. Portrait sits a
 * little higher and nearer the right margin, because its frame is tall and
 * narrow.
 */
export function moonPosition(vw: number, vh: number) {
  return vw < vh ? { x: 67, y: 17 } : { x: 69, y: 20 };
}

/** Where the painted sun actually lands on screen, as a % of the viewport. */
export function sunPosition(vw: number, vh: number) {
  const boxW = vw * (1 + SUN.insetX * 2);
  const boxH = vh * (1 + SUN.insetY * 2);

  let rw: number;
  let rh: number;
  if (boxW / boxH > SUN.aspect) {
    rw = boxW;
    rh = boxW / SUN.aspect;
  } else {
    rh = boxH;
    rw = boxH * SUN.aspect;
  }

  const left = -vw * SUN.insetX + (boxW - rw) / 2;
  const top = -vh * SUN.insetY + (boxH - rh) * SUN.posY;

  return {
    x: ((left + SUN.fx * rw) / vw) * 100,
    y: ((top + SUN.fy * rh) / vh) * 100,
  };
}
