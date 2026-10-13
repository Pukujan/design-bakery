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

    /*
     * The project cards. Their document-space centres are read in measure() — on
     * resize, load and font-ready, never inside the frame — and the frame then
     * turns each one into a distance from the middle of the viewport.
     */
    type Card = { el: HTMLElement; mid: number; v: string };
    let cards: Card[] = [];

    /** one card's emphasis, written only when it actually changes */
    const writeEmph = (c: Card, v: string) => {
      if (c.v === v) return;
      c.v = v;
      c.el.style.setProperty("--card-emph", v);
    };

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

      // the cards, cached: the frame must never read layout back
      cards = Array.from(document.querySelectorAll<HTMLElement>(".db-card")).map((el) => {
        const r = el.getBoundingClientRect();
        return { el, mid: r.top + r.height / 2 + window.scrollY, v: "" };
      });
      // reduced motion composes to a still frame: every card at its centre
      if (reduced) for (const c of cards) writeEmph(c, "1");
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
      target = p;
      current += (target - current) * k;
      const sp = current;
      const ey = sp * max;

      journey.p = sp;
      journey.scrollY = ey;

      /* ---------------------------------------------------- light of the world */
      const dayBlend = smooth(phase(sp, anchors.work, anchors.about));

      /* --------------------------------------------------------------- the cut */
      const through = clamp((ey + vh - cut.top) / (cut.height + vh));
      const tear = reduced ? smooth(phase(through, 0.2, 0.8)) : smooth(phase(through, 0.16, 0.82));
      const nightT = smooth(phase(tear, 0.3, 1));

      journey.tear = tear;
      journey.nightT = nightT;
      journey.lead = phase(sp, anchors.about, anchors.cut);

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

      /*
       * The burst is the rip itself: it spikes once as the tear opens, and is
       * read by the particle field to throw sparks.
       */
      const impact = reduced
        ? 0
        : Math.pow(Math.sin(Math.PI * clamp(phase(tear, 0.04, 0.24))), 3);
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
      // the near-camera branch plane has to visibly outpace the cards, which
      // scroll with the page, so it gets a deeper amplitude than --par-near
      const parFg = (0.5 - sp) * 320;

      /* ------------------------------------------------------------------ out */
      set("--p", sp.toFixed(4));
      set("--plate-dusk", dayBlend.toFixed(4));
      /*
       * The intro bloom is gated to the arrival beat, which is exactly one
       * viewport tall — so its share of the page is vh / max and its handoff to
       * the work scene is the same fraction of the eased clock. The window is 1
       * at the top of the page, where the load-time animation runs, and closes
       * over the second half of that beat, so the blossom dissolves away as the
       * arrival hands over and is gone before the work scene is the active one
       * — which is what keeps it from ever being read on top of the cards or
       * stacked with the near branch plane. Derived rather than fixed, so it
       * holds on any viewport, and it rides the same eased clock as everything
       * else and adds no second listener.
       */
      const bloomOut = clamp((vh / max) * 0.85, 0.008, 0.5);
      set("--bloom-op", (1 - phase(sp, bloomOut * 0.35, bloomOut)).toFixed(4));
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
      set("--orb-t", smooth(phase(tear, 0.34, 0.72)).toFixed(4));
      // the sun goes down as the cut opens
      set("--sun-sink", `${(vh * ORB.sunSink * tear).toFixed(1)}px`);
      set("--par-far", `${parFar.toFixed(1)}px`);
      set("--par-mid", `${parMid.toFixed(1)}px`);
      set("--par-near", `${parNear.toFixed(1)}px`);
      set("--par-fg", `${parFg.toFixed(1)}px`);
      // the branch plane only exists over the work beat: it fades up as the
      // section arrives and is gone well before About, so it can never cross the
      // cut, the night or the page chrome
      set(
        "--work-fg",
        clamp(
          phase(sp, anchors.work - 0.02, anchors.work + 0.06) *
            (1 - phase(sp, anchors.about - 0.06, anchors.about - 0.01)),
        ).toFixed(4),
      );
      set("--fg-day", fgDay.toFixed(4));
      set("--fg-night", fgNight.toFixed(4));
      set("--night-scale", (1.05 - 0.05 * nightT).toFixed(4));
      set("--particle-op", reduced ? "0" : "1");
      set("--nav-dark", clamp(phase(sp, anchors.work - 0.05, anchors.work + 0.08)).toFixed(4));

      /* -------------------------------------------------------- card emphasis */
      /*
       * The centre reveal: a card swells to full strength as it crosses the
       * middle of the frame and gives way toward the edges, so the one being
       * read stands proud of the ones entering and leaving. It rides the same
       * eased clock as the rest of the world — the centres were measured on
       * resize, so nothing here reads layout — and it never removes a card: the
       * floor is the dim, small edge state.
       */
      if (!reduced) {
        const middle = ey + vh / 2;
        const reach = vh * 0.62;
        for (const c of cards) {
          const e = 1 - clamp(Math.abs(c.mid - middle) / reach);
          writeEmph(c, (0.42 + 0.58 * smooth(e)).toFixed(3));
        }
      }
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
      // a reduced-motion visitor gets the still frame, so re-measure the cards
      // and settle them at their centre emphasis instead of leaving them mid-curve
      if (reduced) measure();
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
