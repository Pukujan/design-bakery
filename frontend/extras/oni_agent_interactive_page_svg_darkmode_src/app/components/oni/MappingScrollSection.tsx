import React, { useEffect, useRef, useState } from "react";
import { ArrowDown } from "lucide-react";
import decorOrbit from "../../assets/pukujan-decor-orbit.svg";
import astronautTool from "../../assets/pukujan-astronaut-tool.svg";
import { BrandMark } from "./BrandMark";
import { MAPPING_STEP_VH, mappingRows, type MappingRow } from "./mappingData";

const STICKY_TOP_PX = 112;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

function MappingPanel({
  row,
  index,
  total,
  pinned,
}: {
  row: MappingRow;
  index: number;
  total: number;
  pinned: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-8 text-white shadow-xl">
      <img src={decorOrbit} alt="" className="pointer-events-none absolute -right-24 -top-32 h-96 w-72 opacity-20" />
      <BrandMark
        src={astronautTool}
        alt="Astronaut tool accent"
        preset="accent"
        frameClassName="absolute right-5 top-5 bg-white/10 p-2"
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">
          Mapping {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </p>
        {pinned ? (
          <p className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-cyan-100">
            Scroll to advance · releases when complete
          </p>
        ) : null}
      </div>
      <div className="relative mt-8 grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
        <div className="rounded-3xl bg-white/10 p-6">
          <p className="text-sm font-bold text-slate-400">ONI</p>
          <p className="mt-2 text-2xl font-black">{row.oni}</p>
        </div>
        <ArrowDown className="mx-auto h-6 w-6 text-cyan-300 lg:rotate-[-90deg]" />
        <div className="oni-accent-highlight rounded-3xl p-6">
          <p className="oni-accent-highlight-label text-sm font-bold">AI agents</p>
          <p className="mt-2 text-2xl font-black">{row.ai}</p>
        </div>
      </div>
      <p className="relative mt-8 text-xl font-bold leading-8 text-slate-200">{row.detail}</p>
      <div className="mt-8 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-cyan-300 transition-[width] duration-300 ease-out"
          style={{ width: `${((index + 1) / total) * 100}%` }}
        />
      </div>
    </div>
  );
}

export function MappingScrollSection() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [pinned, setPinned] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const total = mappingRows.length;
  const trackHeightVh = total * MAPPING_STEP_VH;

  useEffect(() => {
    if (reducedMotion) return;

    const update = () => {
      const track = trackRef.current;
      if (!track) return;

      const vh = window.innerHeight;
      const rect = track.getBoundingClientRect();
      const scrollRange = track.offsetHeight - vh;

      if (scrollRange <= 0) {
        setPinned(false);
        setActiveIndex(0);
        return;
      }

      const isPinned = rect.top <= STICKY_TOP_PX && rect.bottom > vh;
      setPinned(isPinned);

      if (rect.top > STICKY_TOP_PX) {
        setActiveIndex(0);
        return;
      }
      if (rect.bottom <= vh) {
        setActiveIndex(total - 1);
        return;
      }

      const scrolled = clamp(STICKY_TOP_PX - rect.top, 0, scrollRange);
      const progress = scrolled / scrollRange;
      const index = clamp(Math.floor(progress * total), 0, total - 1);
      setActiveIndex(index);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [reducedMotion, total]);

  const row = mappingRows[activeIndex];

  if (reducedMotion) {
    return (
      <div className="hidden lg:grid lg:gap-6">
        {mappingRows.map((item, index) => (
          <MappingPanel key={item.oni} row={item} index={index} total={total} pinned={false} />
        ))}
      </div>
    );
  }

  return (
    <div ref={trackRef} className="relative hidden lg:block" style={{ height: `${trackHeightVh}vh` }}>
      <div className="sticky top-28 z-10 flex min-h-[calc(100vh-7rem)] items-center py-8">
        <div className="grid w-full gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="oni-surface oni-border oni-shadow rounded-[2rem] border p-6 shadow-sm">
            <p className="oni-text-subtle mb-4 text-sm font-bold uppercase tracking-[0.2em]">Scroll-driven mapping</p>
            <ol className="grid gap-2">
              {mappingRows.map((item, index) => {
                const active = index === activeIndex;
                return (
                  <li
                    key={item.oni}
                    className={`rounded-2xl border p-4 transition duration-300 ${
                      active
                        ? "oni-map-selected oni-shadow border"
                        : index < activeIndex
                          ? "oni-map-idle border opacity-70"
                          : "oni-map-idle border opacity-45"
                    }`}
                    aria-current={active ? "step" : undefined}
                  >
                    <p className="oni-text font-black">{item.oni}</p>
                    <p className="oni-text-muted mt-1 text-sm">{item.ai}</p>
                  </li>
                );
              })}
            </ol>
          </div>
          <MappingPanel row={row} index={activeIndex} total={total} pinned={pinned} />
        </div>
      </div>
    </div>
  );
}
