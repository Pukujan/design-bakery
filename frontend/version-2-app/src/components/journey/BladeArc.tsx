/**
 * The blade. Not a streak lying in the picture plane: a katana thrusting *out of*
 * the scene at the viewer. Perspective is drawn into the geometry rather than
 * faked with motion —
 *
 *   the TIP is the widest part of the steel. It is pinned at the local origin and
 *           flares immediately behind it into a broad chisel
 *   the blade is a quad: two near-tip corners far apart, two far-hilt corners
 *           almost touching, so the taper itself reads as depth
 *   the cutting edge is a near-white line running all the way to the point; the
 *           spine side is cool steel blue-grey, so the eye follows the light to
 *           where the steel enters the world
 *   blurred ghosts sit *behind* the blade along the thrust direction — sharp at
 *           the tip, smearing back into the scene
 *   the guard and the wrapped hilt are drawn small and far, at the narrow end
 *
 * Two groups share the layer's scroll transform:
 *
 *   the thrust  — `.db-sword-depth` scales about 0 0, which *is* the tip, so
 *                 growing the sword drives the point through the screen plane
 *                 while the hilt stays deep in the scene
 *   the slash   — `.db-blade-arc`, held back until the tip has landed
 *
 * The layer box is 300px tall against a 200-unit viewBox with
 * preserveAspectRatio="none": a unit of y is 1.5px and a unit of x is ~1.25px, so
 * round things are drawn as ellipses. Everything is kept inside x = 0..-202 so
 * that at full thrust (scale 1.8) the hilt and the blurred ghosts still fit the
 * viewport instead of being cut off by it.
 */

/* Local coordinates: the tip is (0,0), the steel recedes toward -x, and y runs
   across the blade — negative is the cutting edge, positive is the spine. */
const SIL = [
  "M0 0",
  "C-5 -11 -8 -16 -13 -21.5",
  "C-58 -18.5 -106 -11.5 -146 -5",
  "L-146 4.4",
  "C-104 1 -54 7 -13 16.5",
  "C-8 10.5 -4 5 0 0",
  "Z",
].join(" ");

/* The bright bevel of the cutting edge, hugging the edge line to the point. */
const HA = [
  "M0 0",
  "C-5 -11 -8 -16 -13 -21.5",
  "C-58 -18.5 -106 -11.5 -146 -5",
  "L-146 -2.4",
  "C-104 -5.5 -52 -11.5 -13 -14",
  "C-9 -9 -4 -4 0 0",
  "Z",
].join(" ");

/* The shaded flat on the spine side. */
const MUNE = [
  "M0 0",
  "C-4 5 -8 10.5 -13 16.5",
  "C-54 7 -104 1 -146 4.4",
  "L-146 1.8",
  "C-104 -1.6 -52 3.5 -13 8",
  "C-9 5 -4 2.5 0 0",
  "Z",
].join(" ");

/* The wrapped hilt, drawn narrow because it is the farthest thing from us. */
const TSUKA = [
  "M-158 -5.6",
  "L-196 -3.8",
  "Q-199 0 -196 3.8",
  "L-158 5.6",
  "Q-154 0 -158 -5.6",
  "Z",
].join(" ");

/** diagonal bands of the tsuka-ito wrap; each pair is [x, half-width there] */
const WRAP: ReadonlyArray<readonly [number, number]> = [
  [-165, 5.2],
  [-174, 4.9],
  [-183, 4.6],
  [-192, 4.2],
];

export function BladeArc() {
  return (
    <div className="db-blade" aria-hidden="true">
      <svg viewBox="0 0 1200 200" width="100%" height="100%" preserveAspectRatio="none">
        <defs>
          <linearGradient id="db-trail" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ff7a3c" stopOpacity="0" />
            <stop offset="35%" stopColor="#ff9a4e" stopOpacity="0.22" />
            <stop offset="78%" stopColor="#ffd08a" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#fff6e2" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="db-trail2" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ffe9c4" stopOpacity="0" />
            <stop offset="60%" stopColor="#ffe9c4" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.85" />
          </linearGradient>

          {/*
            Steel, read along its length rather than across it: x1=1 is the right
            edge of the bounding box, which is the tip. The far end loses alpha,
            and because the layer screen-blends, less alpha really is less light —
            that is what makes the hilt sit *inside* the scene instead of floating
            in front of it.
          */}
          <linearGradient id="db-steel" x1="1" y1="0.5" x2="0" y2="0.5">
            <stop offset="0%" stopColor="#f4f9ff" stopOpacity="0.92" />
            <stop offset="42%" stopColor="#c3d6ee" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#7e97ba" stopOpacity="0.2" />
          </linearGradient>
          {/* the cutting edge: near-white at the point, dimming as it runs away */}
          <linearGradient id="db-ha" x1="1" y1="0.5" x2="0" y2="0.5">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="34%" stopColor="#fdfeff" stopOpacity="0.95" />
            <stop offset="72%" stopColor="#e8f1fb" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#cfe0f2" stopOpacity="0.22" />
          </linearGradient>
          {/* the spine: steel blue-grey, deliberately the dull side */}
          <linearGradient id="db-mune" x1="1" y1="0.5" x2="0" y2="0.5">
            <stop offset="0%" stopColor="#8ea6c9" stopOpacity="0.7" />
            <stop offset="55%" stopColor="#647fa6" stopOpacity="0.42" />
            <stop offset="100%" stopColor="#41597c" stopOpacity="0.12" />
          </linearGradient>
          {/* the smear left behind along the thrust */}
          <linearGradient id="db-ghost" x1="1" y1="0.5" x2="0" y2="0.5">
            <stop offset="0%" stopColor="#fff3d6" stopOpacity="0.85" />
            <stop offset="55%" stopColor="#ffdca4" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ff9a5e" stopOpacity="0" />
          </linearGradient>
          {/* heat where the steel enters the world */}
          <radialGradient id="db-tip">
            <stop offset="0%" stopColor="#fffaf0" stopOpacity="0.95" />
            <stop offset="40%" stopColor="#ffcf8c" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ff7a3c" stopOpacity="0" />
          </radialGradient>

          <filter id="db-blur" x="-30%" y="-60%" width="160%" height="220%">
            <feGaussianBlur stdDeviation="10" />
          </filter>
          <filter id="db-blur-soft" x="-30%" y="-60%" width="160%" height="220%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
          <filter id="db-blur-ghost" x="-30%" y="-70%" width="170%" height="240%">
            <feGaussianBlur stdDeviation="4.5" />
          </filter>
          <filter id="db-blur-ghost2" x="-30%" y="-70%" width="170%" height="240%">
            <feGaussianBlur stdDeviation="9" />
          </filter>
        </defs>

        {/* the cut itself, along the arc — held back until the tip has landed */}
        <g className="db-blade-arc">
          <path
            d="M40 178 C 320 150, 660 112, 1150 52"
            fill="none"
            stroke="url(#db-trail)"
            strokeWidth="54"
            strokeLinecap="round"
            filter="url(#db-blur)"
          />
          <path
            d="M70 172 C 340 146, 670 108, 1152 50"
            fill="none"
            stroke="url(#db-trail)"
            strokeWidth="16"
            strokeLinecap="round"
            filter="url(#db-blur-soft)"
          />
          <path
            d="M110 166 C 360 142, 680 104, 1156 48"
            fill="none"
            stroke="url(#db-trail2)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>

        {/*
          The sword. Placed at the viewBox centre — which is the layer centre,
          which is the seam — so the point arrives exactly where the world splits.
          The layer already carries the -28deg slash; this -14deg tips the blade
          off the tear line so it reads as coming *at* you rather than lying in it.
        */}
        <g className="db-blade-sword" transform="translate(600 104) rotate(-14)">
          <g className="db-sword-depth">
            {/*
              Motion blur first, so it is behind the steel: the same silhouette
              scaled down about the tip and offset back along the thrust, smeared
              into the scene. The real blade on top stays crisp, so the sharpness
              is at the point and the blur trails away from it.
            */}
            <path
              d={SIL}
              transform="translate(-34 0) scale(0.78)"
              fill="url(#db-ghost)"
              opacity="0.3"
              filter="url(#db-blur-ghost2)"
            />
            <path
              d={SIL}
              transform="translate(-16 0) scale(0.9)"
              fill="url(#db-ghost)"
              opacity="0.55"
              filter="url(#db-blur-ghost)"
            />

            {/* the body of the steel: broad at the near tip, a sliver at the far end */}
            <path d={SIL} fill="url(#db-steel)" />
            {/* the shaded spine side */}
            <path d={MUNE} fill="url(#db-mune)" />
            {/* the bright cutting edge, running all the way to the point */}
            <path d={HA} fill="url(#db-ha)" />
            {/* and the hairline the eye actually follows */}
            <path
              d="M0 0 C-5 -11 -8 -16 -13 -21.5 C-58 -18.5 -106 -11.5 -146 -5"
              fill="none"
              stroke="#ffffff"
              strokeWidth="1.6"
              strokeOpacity="0.85"
              strokeLinecap="round"
            />

            {/* the guard, small and far, seen almost edge-on as it comes at you */}
            <ellipse
              cx="-152"
              cy="0"
              rx="6"
              ry="11.5"
              fill="#3a1c30"
              fillOpacity="0.5"
              stroke="#ffd9a2"
              strokeOpacity="0.8"
              strokeWidth="1.5"
            />

            {/* the wrapped hilt, tapering further still */}
            <path d={TSUKA} fill="#5a2a44" fillOpacity="0.5" />
            <path
              d={TSUKA}
              fill="none"
              stroke="#f7cfa6"
              strokeOpacity="0.55"
              strokeWidth="1.3"
            />
            {WRAP.map(([x, hw]) => (
              <path
                key={x}
                d={`M${x} ${-hw} L${x - 6.5} ${hw}`}
                stroke="#ffe4c2"
                strokeOpacity="0.72"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            ))}
            {/* the pommel, the last bright thing before the steel is gone */}
            <ellipse
              cx="-199"
              cy="0"
              rx="3.4"
              ry="4.4"
              fill="#6b3350"
              stroke="#f7dca8"
              strokeOpacity="0.7"
              strokeWidth="1.2"
            />

            {/* heat at the point, and a core exactly on the seam */}
            <ellipse cx="-4" cy="-1" rx="28" ry="23" fill="url(#db-tip)" />
            <ellipse cx="-1" cy="0" rx="8" ry="6" fill="#fffdf6" fillOpacity="0.9" />
          </g>
        </g>
      </svg>
    </div>
  );
}
