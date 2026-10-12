import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, RefObject } from "react";
import { PROJECTS, type Project } from "@/data/content";
import { useInView } from "@/hooks/useInView";
import { journey } from "@/lib/journey-state";
import { ProjectMoment } from "./ProjectMoment";

/* ------------------------------------------------------------------ geometry */

/** the canopy is authored in a fixed design space, then scaled uniformly */
const CANOPY_W = 1000;
const CANOPY_H = 520;
/** Tailwind's `sm` — at or above it the lane is the column centre */
const LANE_BREAK = 640;
const LANE_MOBILE = 14;
/** a tendril never reaches further than this from the spine, so it cannot
    cross project text on any viewport */
const REACH = 28;

const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v);

/** deterministic pseudo-noise, so the roots never re-shuffle on resize */
const noise = (i: number) => {
  const v = Math.sin(i * 12.9898) * 43758.5453;
  return v - Math.floor(v) - 0.5;
};
const span = (seed: number, lo: number, hi: number) => lo + (noise(seed) + 0.5) * (hi - lo);

type RootKind = "spine" | "main" | "hair";

type Root = {
  /** index into the --rN custom properties */
  i: number;
  d: string;
  kind: RootKind;
  /** reveal window inside the section's own progress */
  from: number;
  to: number;
};

/**
 * The whole root system, in the column's own pixel space. The spine starts at
 * the trunk base — which the uniform canopy scale puts at exactly (W / 2,
 * canopyH) — and descends to the bottom of the column, easing sideways into the
 * reserved lane as it goes.
 */
function buildRoots(W: number, H: number): Root[] {
  if (W <= 0 || H <= 0) return [];

  const s = W / CANOPY_W;
  const canopyH = CANOPY_H * s;
  const lane = W >= LANE_BREAK ? W / 2 : LANE_MOBILE;
  const top = canopyH;
  const bottom = Math.max(H, top + 1);
  const L = bottom - top;
  const n = PROJECTS.length;

  const spine =
    `M ${(W / 2).toFixed(1)} ${top.toFixed(1)} ` +
    `C ${(W / 2).toFixed(1)} ${(top + L * 0.05).toFixed(1)} ${lane.toFixed(1)} ${(top + L * 0.07).toFixed(1)} ` +
    `${lane.toFixed(1)} ${(top + L * 0.12).toFixed(1)} ` +
    `L ${lane.toFixed(1)} ${bottom.toFixed(1)}`;

  /* branch points are spread evenly down the descent: the nodes sit on the
     card centres by construction and the cards are evenly spaced, so the two
     meet without any measurement of the cards themselves */
  const fAt = (i: number) => 0.06 + (0.91 * i) / Math.max(1, n - 1);

  const drafts: { f: number; d: string; kind: RootKind }[] = [];
  for (let i = 0; i < n; i++) {
    const f = fAt(i);
    const y = top + L * f;
    const dir = W >= LANE_BREAK ? (i % 2 === 0 ? -1 : 1) : 1;

    const reach = dir * span(i * 3.7, REACH * 0.6, REACH);
    const drop = span(i * 5.1 + 2, 6, 30);
    drafts.push({
      f,
      kind: "main",
      d:
        `M ${lane.toFixed(1)} ${y.toFixed(1)} ` +
        `C ${(lane + reach * 0.4).toFixed(1)} ${(y + drop * 0.1).toFixed(1)} ` +
        `${(lane + reach * 0.72).toFixed(1)} ${(y + drop * 0.45).toFixed(1)} ` +
        `${(lane + reach).toFixed(1)} ${(y + drop).toFixed(1)}`,
    });

    /* a fine hair layer, so it reads as a root system rather than a wire */
    for (let k = 0; k < 2; k++) {
      const seed = i * 9.3 + k * 4.9 + 7;
      const hy = y + span(seed, -26, 26);
      const hdir = W >= LANE_BREAK ? (k === 0 ? -dir : dir) : 1;
      const hreach = hdir * span(seed + 1.3, REACH * 0.25, REACH * 0.6);
      const hdrop = span(seed + 2.7, 4, 18);
      drafts.push({
        f: clamp(f + (hy - y) / (L || 1)),
        kind: "hair",
        d:
          `M ${lane.toFixed(1)} ${hy.toFixed(1)} ` +
          `Q ${(lane + hreach * 0.55).toFixed(1)} ${(hy + hdrop * 0.2).toFixed(1)} ` +
          `${(lane + hreach).toFixed(1)} ${(hy + hdrop).toFixed(1)}`,
      });
    }
  }

  drafts.sort((a, b) => a.f - b.f);

  /* each root reveals over [0.6 * fPrev, 0.6 * f], so the last of them finishes
     well before the section ends while the spine runs all the way to p = 1 */
  const roots: Root[] = [{ i: 0, d: spine, kind: "spine", from: 0, to: 1 }];
  let fPrev = 0;
  drafts.forEach((draft, idx) => {
    roots.push({ i: idx + 1, d: draft.d, kind: draft.kind, from: 0.6 * fPrev, to: 0.6 * draft.f });
    fPrev = draft.f;
  });
  return roots;
}

/* ------------------------------------------------------------------- canopy */

/** one silhouette mass, its lower edge broken into lobes, in design space */
const CANOPY_MASS =
  "M 500 34 C 618 26 724 52 796 104 C 866 154 898 214 872 262 " +
  "C 846 310 764 336 668 342 C 606 346 552 344 500 344 " +
  "C 448 344 394 346 332 342 C 236 336 154 310 128 262 " +
  "C 102 214 134 154 204 104 C 276 52 382 26 500 34 Z";

const CANOPY_LOBES = [
  "M 150 236 C 96 244 66 282 94 306 C 122 330 188 320 214 290 C 236 264 208 230 150 236 Z",
  "M 850 236 C 904 244 934 282 906 306 C 878 330 812 320 786 290 C 764 264 792 230 850 236 Z",
  "M 300 44 C 250 40 212 66 226 92 C 240 118 302 122 338 100 C 368 82 350 48 300 44 Z",
  "M 700 44 C 750 40 788 66 774 92 C 760 118 698 122 662 100 C 632 82 650 48 700 44 Z",
];

/** the ragged underside of the foliage, drawn as thick round strokes */
const CANOPY_SKIRT = [
  "M 132 268 C 150 318 208 338 258 322",
  "M 250 322 C 300 346 356 340 396 322",
  "M 392 326 C 432 350 486 344 520 326",
  "M 516 326 C 556 350 612 344 652 322",
  "M 646 322 C 692 344 750 336 786 314",
  "M 780 306 C 830 322 878 300 890 262",
];

/** base wide, crown narrow: the trunk meets the spine at (500, 520) */
const TRUNK =
  "M 452 520 C 468 468 478 420 480 378 C 481 350 480 326 478 306 " +
  "L 522 306 C 520 326 519 350 520 378 C 522 420 532 468 548 520 Z";

const BOUGHS = ["M 500 392 C 480 366 458 348 432 336", "M 500 392 C 522 366 546 350 572 340"];

/* --------------------------------------------------------------------- tree */

/**
 * The hinge at the opening of the Work section: a full silhouette tree behind
 * the project column. Its canopy stands up as the section begins and its roots
 * grow downward as the visitor descends, one node per project.
 *
 * Everything is one SVG in one coordinate space — the column's own pixels — so
 * canopy, trunk and roots cannot drift apart across viewports. Canopy and trunk
 * are authored in a 1000 x 520 design space and scaled uniformly by W / 1000,
 * which lands the trunk base exactly where the spine starts.
 */
export function SakuraTree({ hostRef }: { hostRef: RefObject<HTMLDivElement | null> }) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  const roots = useMemo(() => buildRoots(size.w, size.h), [size.w, size.h]);

  /* One effect owns the lane, the measurement and the scroll-driven growth.
     Layout is read on resize only — never inside the scroll frame. */
  useEffect(() => {
    const host = hostRef.current;
    const wrap = wrapRef.current;
    if (!host || !wrap) return;

    let top = 0;
    let span = 1;
    let raf = 0;
    const written = new Map<string, string>();

    const put = (k: string, v: string) => {
      if (written.get(k) === v) return;
      written.set(k, v);
      wrap.style.setProperty(k, v);
    };

    const measure = () => {
      const rect = host.getBoundingClientRect();
      const w = host.clientWidth;
      const h = host.clientHeight;
      top = rect.top + window.scrollY;
      span = Math.max(1, h);
      /* the lane has exactly one source of truth: this number, used for the
         spine and tendrils above and handed to the node dots as a variable */
      host.style.setProperty("--tree-lane", `${w >= LANE_BREAK ? w / 2 : LANE_MOBILE}px`);
      setSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
    };

    const update = () => {
      raf = 0;
      // reduced motion: the CSS forces the whole tree drawn and every node lit
      if (journey.reduced) return;

      const vh = window.innerHeight;
      const p = clamp((window.scrollY + vh - top) / (span + vh));

      // the canopy stands up over the first twelfth of the section
      put("--tree-rise", `${(-28 * (1 - clamp(p / 0.12))).toFixed(2)}px`);

      for (const root of roots) {
        const q = clamp((p - root.from) / (root.to - root.from || 1));
        put(`--r${root.i}`, (1 - q).toFixed(3));
      }
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    measure();
    schedule();

    const ro = new ResizeObserver(() => {
      measure();
      schedule();
    });
    ro.observe(host);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("orientationchange", schedule);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("orientationchange", schedule);
    };
  }, [hostRef, roots]);

  const s = size.w / CANOPY_W;
  const canopyH = CANOPY_H * s;
  const fade = CANOPY_H * 0.95;

  return (
    <div className="db-tree" ref={wrapRef} aria-hidden="true">
      <svg className="db-tree-svg" viewBox={`0 0 ${size.w} ${size.h}`}>
        <defs>
          {/* A silhouette is a shadow, not a solid: the crown stays translucent
              so the sky reads through it, and it thins out entirely at its top
              edge so it has no hard outline against the sky. */}
          <linearGradient id="db-tree-ink" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={fade}>
            <stop offset="0%" stopColor="rgba(11,5,16,0)" />
            <stop offset="42%" stopColor="rgba(11,5,16,0.16)" />
            <stop offset="100%" stopColor="rgba(11,5,16,0.5)" />
          </linearGradient>
        </defs>

        {/* canopy + trunk: one dark silhouette, no interior detail */}
        <g className="db-tree-canopy">
          <g transform={`scale(${s})`}>
            <path d={CANOPY_MASS} fill="url(#db-tree-ink)" />
            {CANOPY_LOBES.map((d, i) => (
              <path key={`lobe-${i}`} d={d} fill="url(#db-tree-ink)" />
            ))}
            {CANOPY_SKIRT.map((d, i) => (
              <path key={`skirt-${i}`} className="db-tree-skirt" d={d} stroke="url(#db-tree-ink)" />
            ))}
            <path d={TRUNK} fill="url(#db-tree-ink)" />
            {BOUGHS.map((d, i) => (
              <path key={`bough-${i}`} className="db-tree-bough" d={d} stroke="url(#db-tree-ink)" />
            ))}
          </g>
        </g>

        {/* roots, revealed by stroke-dashoffset against the section's progress */}
        {roots.map((root) => (
          <g key={`root-${root.i}`}>
            <path
              className={root.kind === "hair" ? "db-root db-root-hair" : root.kind === "spine" ? "db-root db-root-spine" : "db-root"}
              d={root.d}
              pathLength={1}
              strokeDasharray="1 1"
              style={{ strokeDashoffset: `var(--r${root.i}, 1)` } as CSSProperties}
            />
            {root.kind !== "hair" && (
              /* the same root drawn again, faintly sakura, sharing its window */
              <path
                className="db-root-tint"
                d={root.d}
                pathLength={1}
                strokeDasharray="1 1"
                style={{ strokeDashoffset: `var(--r${root.i}, 1)` } as CSSProperties}
              />
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

/* ---------------------------------------------------------------------- row */

/**
 * A project and the root node it hangs from. The node sits at the row's vertical
 * centre and on the lane by construction, so nothing here measures the card.
 */
export function ProjectRow({ project }: { project: Project }) {
  const { ref, inView } = useInView<HTMLDivElement>(0.25);
  const [lit, setLit] = useState(false);

  useEffect(() => {
    // ignition latches on: an eleven-card section that un-ignited and
    // re-ignited on every pass would be distracting
    if (inView) setLit(true);
  }, [inView]);

  return (
    <div
      ref={ref}
      /* The row's box is pulled back to the column's left edge and re-padded,
         so `--tree-lane` is measured from the same origin as the SVG. The card
         itself still starts 28px in on mobile — nothing moves visually. */
      className="relative -ml-7 pl-7 sm:ml-0 sm:pl-0"
    >
      <ProjectMoment project={project} />
      <span className="db-root-node" data-lit={lit} aria-hidden="true" />
    </div>
  );
}
