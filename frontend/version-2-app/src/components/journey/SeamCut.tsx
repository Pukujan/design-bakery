import { useEffect, useMemo, useState } from "react";
import { ART, SEAM } from "@/lib/art";

/** deterministic pseudo-noise, so the ragged edge doesn't shimmer on resize */
const noise = (i: number) => {
  const v = Math.sin(i * 12.9898) * 43758.5453;
  return v - Math.floor(v) - 0.5;
};

/**
 * The torn seam: two ragged ember edges with lifted paper fibres, drawn in
 * viewport pixel space so they line up exactly with the masked daylight halves.
 * Each edge is pushed apart by the scroll driver via --seam-a-tf / --seam-b-tf.
 */
export function SeamCut() {
  const [size, setSize] = useState({ w: 1440, h: 900 });

  useEffect(() => {
    const update = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const { dCore, dFibreA, dFibreB } = useMemo(() => {
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

    const steps = 30;
    const core: string[] = [];
    const fa: string[] = [];
    const fb: string[] = [];
    for (let i = 0; i <= steps; i++) {
      const s = -t + (2 * t * i) / steps;
      const wob = noise(i * 3.1) * 14 + noise(i * 7.7) * 7;
      const x = cx + px * s + SEAM.nx * wob;
      const y = cy + py * s + SEAM.ny * wob;
      const cmd = i === 0 ? "M" : "L";
      core.push(`${cmd}${x.toFixed(1)} ${y.toFixed(1)}`);

      const f = 6 + Math.abs(noise(i * 5.3 + 1)) * 20;
      fa.push(`${cmd}${(x - SEAM.nx * f).toFixed(1)} ${(y - SEAM.ny * f).toFixed(1)}`);
      fb.push(`${cmd}${(x + SEAM.nx * f).toFixed(1)} ${(y + SEAM.ny * f).toFixed(1)}`);
    }
    return { dCore: core.join(" "), dFibreA: fa.join(" "), dFibreB: fb.join(" ") };
  }, [size]);

  return (
    <div className="db-seam" aria-hidden="true">
      {/*
        The torn washi rides inside the seam group rather than as its own
        full-screen layer: when the seam is closed the whole subtree is skipped,
        which keeps the steady-state compositing cost low.
      */}
      <div className="db-img db-seam-texture" style={{ backgroundImage: `url(${ART.tear})` }} />

      <svg className="db-seam-svg" viewBox={`0 0 ${size.w} ${size.h}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="db-ember" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ff7a3c" stopOpacity="0.1" />
            <stop offset="26%" stopColor="#ffb765" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#fff3d4" stopOpacity="1" />
            <stop offset="74%" stopColor="#ffb765" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#ff6a3c" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* the hot seam — the wide glow is handled by the CSS bleed layer,
            so no SVG blur filter is paid for across the whole viewport */}
        <g style={{ transform: "var(--seam-a-tf, none)" }}>
          <path d={dCore} fill="none" stroke="rgba(255,116,56,0.5)" strokeWidth={11} strokeLinecap="round" />
          <path d={dCore} fill="none" stroke="url(#db-ember)" strokeWidth={4} strokeLinecap="round" />
          <path d={dCore} fill="none" stroke="#fff8e6" strokeWidth={1.4} strokeLinecap="round" />
          <path d={dFibreA} fill="none" stroke="rgba(255,236,214,0.34)" strokeWidth={1} strokeDasharray="3 10" />
        </g>

        {/* the lower-right half of the split */}
        <g style={{ transform: "var(--seam-b-tf, none)" }}>
          <path d={dCore} fill="none" stroke="rgba(255,116,56,0.5)" strokeWidth={11} strokeLinecap="round" />
          <path d={dCore} fill="none" stroke="url(#db-ember)" strokeWidth={4} strokeLinecap="round" />
          <path d={dCore} fill="none" stroke="#fff8e6" strokeWidth={1.4} strokeLinecap="round" />
          <path d={dFibreB} fill="none" stroke="rgba(255,236,214,0.34)" strokeWidth={1} strokeDasharray="3 10" />
        </g>
      </svg>
    </div>
  );
}
