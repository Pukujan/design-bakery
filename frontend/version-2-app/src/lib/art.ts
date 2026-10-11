/**
 * Painted key-art plates and the geometry of the world.
 * Every tunable about the scene lives here so the journey can be
 * re-composed without touching the components.
 */

/**
 * The scene plates live in public/ and are served under the app's base path
 * (/version-2/ on the site, / in dev). import.meta.env.BASE_URL carries that prefix,
 * so the same source works at either mount point.
 */
const plate = (name: string) => `${import.meta.env.BASE_URL}${name}`;

export const ART = {
  /** Scene 1 / 2 — pastel sunset arrival */
  sunset: plate("generated-1791737493819-ac12e96dface.png"),
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
} as const;

/**
 * The blade line. A 152deg gradient axis means the tear itself runs shallow
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
  separation: 0.055,
  /** how wide the paper band opens, in percent of the gradient length */
  spread: 30,
  feather: 1.4,
  /** the slash, in degrees, for anything that must sit inside it */
  slash: -28,
} as const;

/**
 * The sun already painted into the plate. The CSS bloom and the moon are
 * placed on top of it, so the cut transforms *that* sun rather than lighting a
 * second one. Position is given in image-space fractions, and `cover` cropping
 * is solved for in the scroll driver because the on-screen position depends on
 * the viewport's aspect ratio.
 */
export const SUN = {
  /** fraction across the source plate */
  fx: 0.43,
  /** fraction down the source plate */
  fy: 0.395,
  /** the plate's aspect ratio (16:9 key art) */
  aspect: 16 / 9,
  /** .db-plate-sunset geometry: inset -5% -3%, background-position center 60% */
  insetY: 0.05,
  insetX: 0.03,
  posY: 0.6,
} as const;

export const ORB = {
  moonRatio: 0.82,
  /** how far the sun drops and the moon climbs, as a fraction of viewport height */
  sunSink: 0.13,
  moonLift: 0.1,
  /** the disc sizes, in vmin */
  size: (vw: number) => (vw < 768 ? 21 : 16),
} as const;

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
