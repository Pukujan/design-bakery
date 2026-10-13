import { useEffect, useRef } from "react";
import { SEAM } from "@/lib/art";
import { journey, detectTier } from "@/lib/journey-state";

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
 * A live spark. `hot` ones are thrown off the point where the rip opens,
 * fast and white; the others are motes lifting off the two torn edges while the
 * cut stays open.
 */
type Spark = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  life: number;
  max: number;
  hot: 0 | 1;
};

/**
 * Canvas 2D particle field — no WebGL anywhere. Petals drift through the day,
 * embers rise through the night, and sparks fly from the cut. Counts are halved
 * on the coarse tier and the canvas is skipped entirely when the visitor asks
 * for reduced motion.
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
    let sparks: Spark[] = [];
    let free: number[] = [];
    let moteDebt = 0;
    let raf = 0;
    let last = performance.now();

    const count = () => {
      const area = (window.innerWidth * window.innerHeight) / 1_000_000;
      const base = detectTier() === "coarse" ? 24 : 52;
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
      /*
       * The backing store is resolution-capped, not just DPR-capped. The canvas
       * is a full-viewport transparent surface re-uploaded every frame, so its
       * pixel count is the whole cost of the effect — and on the coarse tier it
       * was a 1.5x backing store over the tear, which is exactly where the
       * particle field peaks and where the frame budget is thinnest. Capping the
       * coarse tier at 1.0 keeps the sparks the same size in CSS pixels while
       * cutting the fill by more than half; the fine tier keeps its 1.5.
       */
      const dpr = Math.min(detectTier() === "coarse" ? 1 : 1.5, window.devicePixelRatio || 1);
      // measured here, not from journey.vw: child effects run before the
      // scroll driver's effect has written anything, so reading the shared
      // state on mount sized the canvas 0x0 and the petals never appeared
      w = window.innerWidth;
      h = window.innerHeight;
      journey.vw = w;
      journey.vh = h;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = Array.from({ length: count() }, () => seed({} as P, true));
      // one pooled spark per slot, so a burst never allocates mid-frame. the
      // pool is sized to what the emitters can actually ask for on this tier,
      // because every live slot is integrated and drawn with two or three arcs
      const cap = detectTier() === "coarse" ? 96 : 420;
      sparks = Array.from({ length: cap }, () => ({
        x: 0, y: 0, vx: 0, vy: 0, r: 1, life: 0, max: 1, hot: 0,
      })) as Spark[];
      free = sparks.map((_, i) => i).reverse();
      moteDebt = 0;
    };

    resize();
    window.addEventListener("resize", resize);

    /** take a dead slot, or drop the particle if the pool is saturated */
    const emit = (
      x: number, y: number, vx: number, vy: number, r: number, life: number, hot: 0 | 1,
    ) => {
      const i = free.pop();
      if (i === undefined) return;
      const s = sparks[i];
      s.x = x; s.y = y; s.vx = vx; s.vy = vy; s.r = r;
      s.life = life; s.max = life; s.hot = hot;
    };

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      const dt = Math.min(50, now - last) / 1000;
      last = now;

      ctx.clearRect(0, 0, w, h);
      if (journey.reduced) return;

      const night = journey.nightT;
      const tear = journey.tear;
      const lead = journey.lead;
      const coarse = journey.tier === "coarse";

      /*
       * The seam's own axis — the way the slash runs: lower-left toward
       * upper-right. The day motes are steered onto it as the cut approaches,
       * so the run-up leads into the tear instead of raining straight down.
       */
      const ax = SEAM.ny;
      const ay = -SEAM.nx;

      for (const p of particles) {
        const weight = p.kind === 0 ? 1 - night : night;

        // petals only: embers rise straight up, and by then the cut is behind us
        const spd = Math.hypot(p.vx, p.vy);
        const vx = p.kind === 0 ? p.vx + (ax * spd - p.vx) * lead : p.vx;
        const vy = p.kind === 0 ? p.vy + (ay * spd - p.vy) * lead : p.vy;

        p.x += vx * dt + Math.sin(now / 1400 + p.rot) * 14 * dt;
        p.y += vy * dt;
        p.rot += p.spin * dt;

        if (p.y > h + 30 || p.y < -30 || p.x < -40 || p.x > w + 40) {
          seed(p, false);
          /*
           * A petal steered up the seam re-enters at the bottom of that path —
           * `seed` puts falling petals on the top edge, which is the side they
           * are now leaving through.
           */
          if (p.kind === 0 && lead > 0.4) {
            p.x = -30 + Math.random() * (w * 0.7);
            p.y = h + 20;
          }
        }

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

      const px = -SEAM.ny;
      const py = SEAM.nx;
      const along = Math.hypot(w, h) * 0.46;

      /*
       * The rip. Sparks pour out of the point where the tear opens — the seam
       * centre — densest and hottest at the instant it gives way, then thinning
       * as `impact` falls away. They fly outward from where the rip opens,
       * biased along the seam, because that is the way the tear travels.
       */
      const imp = journey.impact;
      if (imp > 0.02) {
        const ix = w / 2 + SEAM.nx * journey.seamD;
        const iy = h / 2 + SEAM.ny * journey.seamD;
        const per = Math.min(coarse ? 3 : 11, Math.round((coarse ? 4 : 20) * imp));
        for (let n = 0; n < per; n++) {
          const a = Math.random() * 2 - 1;
          const o = Math.random() * 2 - 1;
          const sp = (70 + Math.random() * 560) * (0.45 + imp);
          const big = Math.random() < 0.18;
          emit(
            ix + px * a * 26 + SEAM.nx * o * 8,
            iy + py * a * 26 + SEAM.ny * o * 8,
            px * a * sp + SEAM.nx * o * sp * 0.75,
            py * a * sp + SEAM.ny * o * sp * 0.75,
            (big ? 2.6 : 1) * (0.9 + Math.random() * 2.3),
            0.3 + Math.random() * 0.5 + imp * 0.4,
            1,
          );
        }
      }

      /*
       * Glowing motes lifting off both torn edges for as long as the cut is
       * open. They leave the ragged edge slowly and drift outward, so the split
       * keeps shedding heat instead of going dark as it widens.
       */
      if (tear > 0.02 && tear < 0.995) {
        moteDebt += (coarse ? 11 : 46) * dt * (0.4 + 0.6 * tear);
        while (moteDebt >= 1) {
          moteDebt -= 1;
          const side = Math.random() < 0.5 ? -1 : 1;
          const d = journey.seamD + side * (side < 0 ? journey.offA : journey.offB);
          const u = Math.random() * 2 - 1;
          const sp = 18 + Math.random() * 74;
          emit(
            w / 2 + SEAM.nx * d + px * u * along + SEAM.nx * side * Math.random() * 9,
            h / 2 + SEAM.ny * d + py * u * along + SEAM.ny * side * Math.random() * 9,
            SEAM.nx * side * sp * 0.8 + px * (Math.random() * 2 - 1) * 30,
            SEAM.ny * side * sp * 0.8 + py * (Math.random() * 2 - 1) * 30 - 18,
            0.8 + Math.random() * 1.9,
            0.9 + Math.random() * 1.5,
            0,
          );
        }
      }

      // integrate and draw the spark pool under additive blending
      const drag = Math.exp(-dt * 2);
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < sparks.length; i++) {
        const s = sparks[i];
        if (s.life <= 0) continue;

        s.vx *= drag;
        s.vy = s.vy * drag + (s.hot ? 210 : -26) * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.life -= dt;
        if (s.life <= 0 || s.x < -60 || s.x > w + 60 || s.y < -60 || s.y > h + 60) {
          s.life = 0;
          free.push(i);
          continue;
        }

        const k = s.life / s.max;
        const a = Math.min(1, s.hot ? 0.5 + 0.8 * k : 0.24 + 0.5 * k);
        const heat = s.hot ? k : k * 0.78;
        const r = s.r * (0.55 + 0.45 * k);

        // the halo first, then the cooling core: two flat arcs, no gradients
        ctx.globalAlpha = a * 0.3;
        ctx.fillStyle = s.hot ? "#ff8a3a" : "#ff7a34";
        ctx.beginPath();
        ctx.arc(s.x, s.y, r * 3.6, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = a;
        ctx.fillStyle = heat > 0.7 ? "#fffdf4" : heat > 0.4 ? "#ffd68f" : "#ff8a3c";
        ctx.beginPath();
        ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
        ctx.fill();

        // hot sparks streak, so the burst reads as thrown-off metal, not dust
        if (s.hot && k > 0.22) {
          ctx.globalAlpha = a * 0.55;
          ctx.strokeStyle = "#ffeecb";
          ctx.lineWidth = r * 0.85;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(s.x - s.vx * 0.02, s.y - s.vy * 0.02);
          ctx.stroke();
        }
      }

      // the white-hot instant the tip lands
      if (imp > 0.05) {
        const ix = w / 2 + SEAM.nx * journey.seamD;
        const iy = h / 2 + SEAM.ny * journey.seamD;
        const rad = 60 + 330 * imp;
        const g = ctx.createRadialGradient(ix, iy, 0, ix, iy, rad);
        g.addColorStop(0, `rgba(255, 255, 250, ${0.6 * imp})`);
        g.addColorStop(0.24, `rgba(255, 216, 142, ${0.42 * imp})`);
        g.addColorStop(0.58, `rgba(255, 122, 52, ${0.2 * imp})`);
        g.addColorStop(1, "rgba(255, 90, 40, 0)");
        ctx.globalAlpha = 1;
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(ix, iy, rad, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = "source-over";

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
