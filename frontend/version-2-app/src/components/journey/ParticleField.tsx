import { useEffect, useRef } from "react";
import { SEAM } from "@/lib/art";
import { journey } from "@/lib/journey-state";

type P = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  a: number;
  spin: number;
  rot: number;
  kind: 0 | 1; // 0 = petal, 1 = ember
};

/**
 * Canvas 2D particle field — no WebGL anywhere. Petals drift through the day,
 * embers rise through the night, and sparks fly along the two ragged edges of
 * the cut. Counts are halved on the coarse tier and the canvas is skipped
 * entirely when the visitor asks for reduced motion.
 */
export function ParticleField() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let particles: P[] = [];
    let raf = 0;
    let last = performance.now();

    const count = () => {
      const area = (journey.vw * journey.vh) / 1_000_000;
      const base = journey.tier === "coarse" ? 24 : 52;
      return Math.round(Math.min(base, Math.max(12, base * (0.5 + area))));
    };

    const seed = (p: P, spread: boolean) => {
      p.kind = Math.random() < 0.5 ? 0 : 1;
      p.x = Math.random() * w;
      p.y = spread ? Math.random() * h : p.kind === 0 ? -20 : h + 20;
      p.r = p.kind === 0 ? 2 + Math.random() * 4 : 1 + Math.random() * 2.2;
      p.a = 0.25 + Math.random() * 0.5;
      p.vx = (Math.random() - 0.5) * 24;
      p.vy = p.kind === 0 ? 14 + Math.random() * 26 : -(7 + Math.random() * 18);
      p.spin = (Math.random() - 0.5) * 2.2;
      p.rot = Math.random() * Math.PI;
      return p;
    };

    const resize = () => {
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      w = journey.vw;
      h = journey.vh;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = Array.from({ length: count() }, () => seed({} as P, true));
    };

    resize();
    window.addEventListener("resize", resize);

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      const dt = Math.min(50, now - last) / 1000;
      last = now;

      ctx.clearRect(0, 0, w, h);
      if (journey.reduced) return;

      const night = journey.nightT;
      const tear = journey.tear;

      for (const p of particles) {
        const weight = p.kind === 0 ? 1 - night : night;

        p.x += p.vx * dt + Math.sin(now / 1400 + p.rot) * 14 * dt;
        p.y += p.vy * dt;
        p.rot += p.spin * dt;

        if (p.y > h + 30 || p.y < -30 || p.x < -40 || p.x > w + 40) seed(p, false);

        const alpha = p.a * weight;
        if (alpha <= 0.01) continue;

        if (p.kind === 0) {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.globalAlpha = alpha * 0.85;
          ctx.fillStyle = "#fbd9d3";
          ctx.beginPath();
          ctx.ellipse(0, 0, p.r * 1.5, p.r * 0.85, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else {
          ctx.globalAlpha = alpha;
          ctx.fillStyle = "#ffb765";
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // sparks thrown off along the two ragged edges of the cut
      if (tear > 0.02 && tear < 0.995) {
        const per = journey.tier === "coarse" ? 6 : 14;
        const along = Math.hypot(w, h) * 0.92;
        const cx = w / 2;
        const cy = h / 2;
        const px = -SEAM.ny;
        const py = SEAM.nx;

        ctx.globalCompositeOperation = "lighter";
        for (const [off, dir] of [
          [-journey.offA, -1],
          [journey.offB, 1],
        ] as [number, number][]) {
          const ex = cx + SEAM.nx * (journey.seamD + off);
          const ey = cy + SEAM.ny * (journey.seamD + off);
          for (let i = 0; i < per; i++) {
            const t = (i / per - 0.5) * 2;
            const jitter = Math.sin(now / 300 + i * 2.3 + dir) * (10 + 26 * tear);
            const x = ex - px * t * along + SEAM.nx * jitter * dir;
            const y = ey - py * t * along + SEAM.ny * jitter * dir;
            const r = 0.7 + Math.abs(Math.sin(now / 250 + i)) * 2.1;
            const a =
              (0.16 + 0.5 * Math.abs(Math.sin(now / 380 + i * 1.7))) *
              (1 - Math.abs(t)) *
              Math.min(1, tear * 3);
            if (a <= 0.01) continue;
            ctx.globalAlpha = a;
            ctx.fillStyle = i % 3 === 0 ? "#ffe0a8" : "#ff9a4e";
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.globalCompositeOperation = "source-over";
      }

      // a scatter of fixed stars, only once the world is dark
      if (night > 0.05) {
        for (let i = 0; i < 26; i++) {
          const sx = (((i * 97.3) % 100) / 100) * w;
          const sy = (((i * 53.7) % 44) / 100) * h;
          const tw = 0.35 + 0.65 * Math.abs(Math.sin(now / (900 + i * 37) + i));
          ctx.globalAlpha = night * tw * 0.7;
          ctx.fillStyle = "#e8f0ff";
          ctx.fillRect(sx, sy, 1.4, 1.4);
        }
      }

      ctx.globalAlpha = 1;
    };

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} className="db-canvas" aria-hidden="true" />;
}
