import { SCENE_LINES } from "@/data/content";
import { Reveal } from "./Reveal";

/**
 * Scene 4 — the turn. This block is tall and mostly empty on purpose: the
 * blade sweeps as it passes the viewport, tears the daylight open, and the
 * sun becomes the moon. No figure, no face, no prop — only a blade and eyes.
 */
export function Cut() {
  return (
    <section
      id="cut"
      data-scene="cut"
      className="db-beat-cut relative flex flex-col items-center justify-start px-5 pt-[64vh] sm:px-8"
    >
      <Reveal threshold={0.4} className="w-full max-w-2xl text-center">
        <p className="db-label text-[0.5rem] text-cream/55 sm:text-[0.55rem]">The turn</p>
        <h2 className="db-title mx-auto mt-6 max-w-[24ch] text-[1.55rem] leading-[1.4] text-cream sm:text-[2.3rem]">
          {SCENE_LINES.cut}
        </h2>
      </Reveal>
    </section>
  );
}
