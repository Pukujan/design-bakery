import { useEffect } from "react";
import { ART, ORB, SEAM, sunPosition } from "@/lib/art";
import { journey, detectTier, type Tier } from "@/lib/journey-state";

const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const phase = (v: number, a: number, b: number) => clamp((v - a) / (b - a || 1));
const smooth = (t: number) => t * t * (3 - 2 * t);

const SCENES = ["arrival", "work", "about", "cut", "night", "contact"] as const;
type Scene = (typeof SCENES)[number];

/**
 * Drives the world from the scrollbar. Everything is written as CSS custom
 * properties on <html> and consumed by transform/opacity only, so the scroll
 * story stays smooth and never reads layout back mid-frame.
 */
export function useJourneyScroll() {
  useEffect(() => {
    const root = document.documentElement;
    const stage = document.querySelector<HTMLElement>(".db-stage");

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = mq.matches;
    const tier: Tier = detectTier();

    journey.tier = tier;
    journey.reduced = reduced;
    if (stage) stage.dataset.tier = tier;
    root.dataset.reduced = reduced ? "true" : "false";

    root.style.setProperty("--seam-angle", `${SEAM.angle}deg`);
    root.style.setProperty("--feather", `${SEAM.feather}%`);
    root.style.setProperty("--slash", `${SEAM.slash}deg`);

    let anchors: Record<Scene, number> = {
      arrival: 0,
      work: 0.14,
      about: 0.4,
      cut: 0.6,
      night: 0.72,
      contact: 0.9,
    };
    let cut = { top: 0, height: 1 };
    let max = 1;
    let sunPct = { x: 43, y: 38 };

    const measure = () => {
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      journey.vh = vh;
      journey.vw = vw;
      max = Math.max(1, document.body.scrollHeight - vh);

      // the bloom sits on the sun already painted into the plate
      sunPct = sunPosition(vw, vh);
      root.style.setProperty("--sun-x", `${sunPct.x.toFixed(2)}%`);
      root.style.setProperty("--sun-y", `${sunPct.y.toFixed(2)}%`);
      const size = ORB.size(vw);
      root.style.setProperty("--sun-size", `${size}vmin`);

      const next: Record<Scene, number> = { ...anchors };
      for (const s of SCENES) {
        const el = document.querySelector<HTMLElement>(`[data-scene="${s}"]`);
        if (el) next[s] = clamp((el.getBoundingClientRect().top + window.scrollY - vh * 0.55) / max);
      }
      anchors = next;

      const cutEl = document.querySelector<HTMLElement>('[data-scene="cut"]');
      if (cutEl) {
        const r = cutEl.getBoundingClientRect();
        cut = { top: r.top + window.scrollY, height: Math.max(1, r.height) };
      }
    };

    const vars = new Map<string, string>();
    const set = (k: string, v: string) => {
      if (vars.get(k) !== v) {
        vars.set(k, v);
        root.style.setProperty(k, v);
      }
    };

    let target = 0;
    let current = 0;
    let dirty = true;
    let last = performance.now();
    let raf = 0;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(64, now - last);
      last = now;
      if (!dirty && Math.abs(target - current) < 0.0004) return;
      dirty = false;

      const y = window.scrollY;
      const { vh, vw } = journey;
      const p = clamp(y / max);

      // critically damped follow, so fast flicks stay smooth
      const k = reduced ? 1 : 1 - Math.exp(-dt / 70);
      current += (target - current) * k;
      target = p;
      const sp = current;

      journey.p = sp;
      journey.scrollY = y;

      /* ---------------------------------------------------- light of the world */
      const dayBlend = smooth(phase(sp, anchors.work, anchors.about));

      /* --------------------------------------------------------- the blade cut */
      const through = clamp((y + vh - cut.top) / (cut.height + vh));
      const bladeSweep = phase(through, 0.02, 0.24);
      const tear = reduced ? smooth(phase(through, 0.2, 0.8)) : smooth(phase(through, 0.16, 0.82));
      const nightT = smooth(phase(tear, 0.3, 1));

      journey.blade = bladeSweep;
      journey.tear = tear;
      journey.nightT = nightT;

      const gradLen = Math.abs(vw * SEAM.nx) + Math.abs(vh * SEAM.ny);

      /*
       * The tear is aimed at the sun, not at the middle of the frame: the
       * centre of the cut sits where the painted sun is, so the split passes
       * through it.
       */
      const sunX = (sunPct.x / 100) * vw;
      const sunY = (sunPct.y / 100) * vh;
      const d = (sunX - vw / 2) * SEAM.nx + (sunY - vh / 2) * SEAM.ny;
      const c = 50 + (d / gradLen) * 100;

      const sep = SEAM.separation * Math.hypot(vw, vh) * tear;

      // half the visible gap, in px, measured along the seam normal
      const band = (SEAM.spread * tear * gradLen) / 100;
      const off = band + sep;
      journey.offA = off;
      journey.offB = off;
      journey.seamD = d;

      const fine = tier === "fine" && !reduced;
      const halfA = fine
        ? `translate3d(${-SEAM.nx * off}px, ${-SEAM.ny * off}px, 0) rotate(${-1.6 * tear}deg) scale(${1 + 0.045 * tear})`
        : "none";
      const halfB = fine
        ? `translate3d(${SEAM.nx * off}px, ${SEAM.ny * off}px, 0) rotate(${1.6 * tear}deg) scale(${1 + 0.045 * tear})`
        : "none";

      /* -------------------------------------------------------- eyes in the cut */
      // they look out while the seam is fresh, then sink back into the night
      const eyes = phase(tear, 0.06, 0.22) * (1 - phase(tear, 0.5, 0.82));

      /* ----------------------------------------------------------------- blade */
      /*
       * The sword arrives before the cut does. `thrust` grows the blade out of
       * the background toward the viewer and `slash` is the carve that follows
       * once the tip has landed; `impact` spikes at the moment of contact and is
       * read by the particle field to throw sparks.
       */
      const thrust = phase(bladeSweep, 0, 0.42);
      const slash = phase(bladeSweep, 0.4, 1);
      const impact = reduced
        ? 0
        : Math.pow(Math.sin(Math.PI * clamp(phase(bladeSweep, 0.34, 0.66))), 3);
      const bladeTravel = (slash * 2.2 - 1.1) * Math.hypot(vw, vh);
      const bladeOp =
        reduced || tier === "coarse"
          ? 0
          : clamp(thrust * 1.8) * (1 - phase(bladeSweep, 0.82, 1));
      // the tip starts far off and grows until it is through the screen plane
      const thrustScale = 0.1 + 1.7 * thrust;
      // the torn paper stays lit while the cut is open: it used to fall away by
      // the time the tear reached its widest
      const flash = reduced
        ? 0
        : clamp(phase(tear, 0.01, 0.2)) * (1 - 0.45 * phase(tear, 0.7, 1));

      journey.impact = impact;

      /* ------------------------------------------------------------ foreground */
      const fgDay = 1 - smooth(phase(sp, anchors.cut - 0.08, anchors.cut + 0.06));
      const fgNight = smooth(phase(sp, anchors.cut + 0.04, anchors.night));

      const parFar = (0.5 - sp) * 64;
      const parMid = (0.5 - sp) * 120;
      const parNear = (0.5 - sp) * 190;

      /* ------------------------------------------------------------------ out */
      set("--p", sp.toFixed(4));
      set("--plate-dusk", dayBlend.toFixed(4));
      set("--night-t", nightT.toFixed(4));
      set("--tear", tear.toFixed(4));
      set("--veil", clamp(0.18 + 0.34 * phase(sp, anchors.about, anchors.cut) - 0.26 * nightT).toFixed(4));
      set("--seam-c", `${c.toFixed(3)}%`);
      set("--shift-x", `${(d * SEAM.nx).toFixed(1)}px`);
      set("--shift-y", `${(d * SEAM.ny).toFixed(1)}px`);
      set("--eyes-x", `${(vw / 2 + d * SEAM.nx).toFixed(1)}px`);
      set("--eyes-y", `${(vh / 2 + d * SEAM.ny).toFixed(1)}px`);
      set("--half-a", halfA);
      set("--half-b", halfB);
      set(
        "--seam-a-tf",
        `translate3d(${-SEAM.nx * off}px, ${-SEAM.ny * off}px, 0)`,
      );
      set(
        "--seam-b-tf",
        `translate3d(${SEAM.nx * off}px, ${SEAM.ny * off}px, 0)`,
      );
      set("--band", `${off.toFixed(1)}px`);
      // the seam holds its heat for as long as the cut is open. it used to fade
      // across the widest part of the tear, dimming the core exactly when the
      // two halves were furthest apart
      set("--seam-op", (phase(tear, 0.01, 0.05) * (1 - 0.4 * phase(tear, 0.9, 1))).toFixed(4));
      set("--seam-flash", flash.toFixed(4));
      set("--eyes-op", eyes.toFixed(4));
      set("--eyes-scale", (0.9 + 0.14 * tear).toFixed(4));
      set("--blade-op", clamp(bladeOp).toFixed(4));
      set("--blade-thrust", `scale(${thrustScale.toFixed(4)})`);
      set("--blade-arc", slash.toFixed(4));
      // the blade rides the same line the world tears along, through the sun
      set(
        "--blade-tf",
        `translate3d(${(d * SEAM.nx).toFixed(1)}px, ${(d * SEAM.ny).toFixed(1)}px, 0) ` +
          `translate(-50%, -50%) rotate(${SEAM.slash}deg) translate3d(${bladeTravel.toFixed(1)}px, 0, 0)`,
      );
      set("--orb-t", smooth(phase(tear, 0.34, 0.72)).toFixed(4));
      // the sun goes down as the cut opens
      set("--sun-sink", `${(vh * ORB.sunSink * tear).toFixed(1)}px`);
      set("--par-far", `${parFar.toFixed(1)}px`);
      set("--par-mid", `${parMid.toFixed(1)}px`);
      set("--par-near", `${parNear.toFixed(1)}px`);
      set("--fg-day", fgDay.toFixed(4));
      set("--fg-night", fgNight.toFixed(4));
      set("--night-scale", (1.05 - 0.05 * nightT).toFixed(4));
      set("--particle-op", reduced ? "0" : "1");
      set("--nav-dark", clamp(phase(sp, anchors.work - 0.05, anchors.work + 0.08)).toFixed(4));
    };

    const onScroll = () => {
      dirty = true;
    };
    const onResize = () => {
      measure();
      dirty = true;
    };

    measure();
    target = clamp(window.scrollY / max);
    current = target;
    frame(performance.now());

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);

    const onMotion = (e: MediaQueryListEvent) => {
      reduced = e.matches;
      journey.reduced = reduced;
      root.dataset.reduced = reduced ? "true" : "false";
      dirty = true;
    };
    mq.addEventListener("change", onMotion);

    // the plates are CSS backgrounds, so warm them explicitly and re-measure
    // once the real heights exist
    let lastHeight = -1;
    const onReady = () => {
      if (document.body.scrollHeight === lastHeight) return;
      lastHeight = document.body.scrollHeight;
      measure();
      dirty = true;
    };

    window.addEventListener("load", onReady);
    Object.values(ART)
      .filter((src) => src !== ART.clouds)
      .forEach((src) => {
        const img = new Image();
        img.addEventListener("load", onReady, { once: true });
        img.addEventListener("error", onReady, { once: true });
        img.src = src;
      });
    document.fonts?.ready.then(onReady).catch(() => {});

    const ro = new ResizeObserver(onReady);
    ro.observe(document.body);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      window.removeEventListener("load", onReady);
      mq.removeEventListener("change", onMotion);
      ro.disconnect();
    };
  }, []);
}
