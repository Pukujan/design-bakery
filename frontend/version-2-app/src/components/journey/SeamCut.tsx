import { useEffect, useMemo, useState } from "react";
import { ART, SEAM } from "@/lib/art";

/** deterministic pseudo-noise, so the ragged edge doesn't shimmer on resize */
const noise = (i: number) => {
  const v = Math.sin(i * 12.9898) * 43758.5453;
  return v - Math.floor(v) - 0.5;
};

/** 1 where the tip lands (the seam centre), falling off toward the frame edges */
const bump = (g: number) => Math.exp(-Math.pow(g * 3.05, 2));

type Node = { x: number; y: number; hw: number; fa: number; fb: number };

/**
 * The torn seam: a white-hot core that keeps its heat for as long as the cut is
 * open, wrapped in a warm ember glow, with ragged lifted paper fibres on both
 * edges and a flare where the sword tip strikes. Drawn in viewport pixel space
 * so it lines up exactly with the masked daylight halves; each edge is pushed
 * apart by the scroll driver via --seam-a-tf / --seam-b-tf.
 */
export function SeamCut() {
  const [size, setSize] = useState({ w: 1440, h: 900 });

  useEffect(() => {
    const update = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const geo = useMemo(() => {
    const { w, h } = size;
    const cx = w / 2;
    const cy = h / 2;
    // the seam runs perpendicular to the tear's normal
    const px = -SEAM.ny;
    const py = SEAM.nx;

    // clip the line to the viewport, with margin so it runs off-frame
    const m = 0.2;
    let t = Infinity;
    for (const [lim, comp] of [
      [w * (1 + m), px],
      [-w * m, -px],
      [h * (1 + m), py],
      [-h * m, -py],
    ] as [number, number][]) {
      if (Math.abs(comp) > 1e-6) t = Math.min(t, lim / Math.abs(comp));
    }
    if (!Number.isFinite(t) || t <= 0) t = Math.hypot(w, h);

    // keep the rip readable on a phone without losing mass on a desktop
    const k = Math.hypot(w, h) / 1500;
    const scale = Math.min(1.4, Math.max(0.6, k));

    const steps = 46;
    const nodes: Node[] = [];
    for (let i = 0; i <= steps; i++) {
      const s = -t + (2 * t * i) / steps;
      const c = bump(s / t);

      // three octaves of noise, deeper near the strike: ripped, not sliced
      const rip =
        (noise(i * 3.1) * 12 + noise(i * 7.7) * 8 + noise(i * 19.3) * 5.5) *
        (0.6 + 1.2 * c) *
        scale;
      const x = cx + px * s + SEAM.nx * rip;
      const y = cy + py * s + SEAM.ny * rip;

      // the molten core: fat where the tip landed, never uniform
      const hw = (2.4 + 11 * c + Math.abs(noise(i * 5.7 + 2)) * 3) * scale;
      // torn fibres lifted off each edge, ragged and uneven
      const fa = hw * 1.4 + (4 + Math.abs(noise(i * 11.3 + 4)) * 24) * scale;
      const fb = hw * 1.4 + (4 + Math.abs(noise(i * 13.1 + 9)) * 24) * scale;
      nodes.push({ x, y, hw, fa, fb });
    }

    const at = (n: Node, d: number) =>
      `${(n.x + SEAM.nx * d).toFixed(1)} ${(n.y + SEAM.ny * d).toFixed(1)}`;

    /** a closed lens: the heat profile, widened by k on both sides of the core */
    const lens = (k2: number) =>
      `M${nodes.map((n) => at(n, n.hw * k2)).join(" L")} L` +
      nodes
        .slice()
        .reverse()
        .map((n) => at(n, -n.hw * k2))
        .join(" L") +
      " Z";

    const edge = (key: "fa" | "fb", sign: 1 | -1) =>
      `M${nodes.map((n) => at(n, sign * n[key])).join(" L")}`;

    /** short bright fibres standing off each edge — the ripped paper teeth */
    const teeth = (key: "fa" | "fb", sign: 1 | -1) => {
      const d: string[] = [];
      for (let i = 1; i < steps; i += 2) {
        const n = nodes[i];
        const out = n[key] + (5 + Math.abs(noise(i * 8.9 + (sign > 0 ? 3 : 17))) * 26) * scale;
        d.push(`M${at(n, sign * n[key])} L${at(n, sign * out)}`);
      }
      return d.join(" ");
    };

    return {
      cx,
      cy,
      halo: lens(3.1),
      ember: lens(1.55),
      core: lens(1),
      line: `M${nodes.map((n) => at(n, 0)).join(" L")}`,
      fibreA: edge("fa", -1),
      fibreB: edge("fb", 1),
      toothA: teeth("fa", -1),
      toothB: teeth("fb", 1),
    };
  }, [size]);

  return (
    <div className="db-seam" aria-hidden="true">
      {/*
        The torn washi rides inside the seam group rather than as its own
        full-screen layer: when the seam is closed the whole subtree is skipped,
        which keeps the steady-state compositing cost low.
      */}
      <div className="db-seam-texture">
        <div className="db-img db-seam-washi" style={{ backgroundImage: `url(${ART.tear})` }} />
      </div>

      <svg className="db-seam-svg" viewBox={`0 0 ${size.w} ${size.h}`} preserveAspectRatio="none">
        <defs>
          {/* the white-hot landing point, carried by each edge as it separates */}
          <radialGradient id="db-flare">
            <stop offset="0%" stopColor="#fffdf6" stopOpacity="0.95" />
            <stop offset="30%" stopColor="#ffd68f" stopOpacity="0.6" />
            <stop offset="62%" stopColor="#ff8a3c" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#ff6a2c" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/*
          Each half carries its own torn edge. The heat is layered fills rather
          than an SVG blur, so nothing re-rasterizes the viewport per frame, and
          every layer is near-white or ember — never pale.
        */}
        {[
          { tf: "var(--seam-a-tf, none)", fibre: geo.fibreA, tooth: geo.toothA },
          { tf: "var(--seam-b-tf, none)", fibre: geo.fibreB, tooth: geo.toothB },
        ].map((half, i) => (
          <g key={i} style={{ transform: half.tf }}>
            <ellipse
              className="db-seam-flare"
              cx={geo.cx}
              cy={geo.cy}
              rx={150}
              ry={92}
              fill="url(#db-flare)"
            />
            <path className="db-seam-halo" d={geo.halo} />
            <path className="db-seam-ember" d={geo.ember} />
            <path className="db-seam-core" d={geo.core} />
            <path className="db-seam-line" d={geo.line} />
            <path className="db-seam-fibre" d={half.fibre} />
            <path className="db-seam-tooth" d={half.tooth} />
          </g>
        ))}
      </svg>
    </div>
  );
}
