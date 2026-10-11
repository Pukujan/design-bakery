import { ARRIVAL_LINE, JP_ACCENTS } from "@/data/content";
import { JpAccent } from "./JpAccent";
import { Reveal } from "./Reveal";

/** Scene 1 — one line, then straight into the work. */
export function Arrival() {
  return (
    <section
      data-scene="arrival"
      className="db-beat-arrival relative flex flex-col items-center justify-center px-5 pb-28 pt-32 text-center"
    >
      <Reveal delay={120} className="w-full">
        <h1 className="db-title mx-auto max-w-[22ch] text-[1.65rem] leading-[1.35] text-cream sm:text-[2.6rem] md:text-[3.35rem]">
          {ARRIVAL_LINE}
        </h1>
      </Reveal>

      <JpAccent delay={520} className="mt-14" jp={JP_ACCENTS.evening.jp} en={JP_ACCENTS.evening.en} />

      <div className="pointer-events-none absolute inset-x-0 bottom-7 flex flex-col items-center gap-2">
        <span className="db-label text-[0.48rem] text-cream/60">Scroll</span>
        <svg className="db-cue" width="14" height="26" viewBox="0 0 14 26" aria-hidden="true">
          <path d="M7 1v20M1.5 16.5 7 22l5.5-5.5" fill="none" stroke="#f8efe7" strokeOpacity="0.65" strokeWidth="1.2" />
        </svg>
      </div>
    </section>
  );
}
