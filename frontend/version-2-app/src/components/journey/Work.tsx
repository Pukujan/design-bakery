import { useRef } from "react";
import { PROJECTS, JP_ACCENTS, SCENE_LINES } from "@/data/content";
import { JpAccent } from "./JpAccent";
import { Reveal } from "./Reveal";
import { ProjectRow, SakuraTree } from "./SakuraTree";

/** Scene 2 — the projects, revealed one at a time as the visitor descends. */
export function Work() {
  const columnRef = useRef<HTMLDivElement | null>(null);

  return (
    <section id="work" data-scene="work" className="relative px-5 pb-32 pt-24 sm:px-8 sm:pt-28">
      <div ref={columnRef} className="relative mx-auto max-w-5xl">
        {/* the silhouette tree paints behind everything in the column */}
        <SakuraTree hostRef={columnRef} />

        <div className="relative z-10">
          <Reveal threshold={0.3}>
            <p className="db-display mx-auto max-w-[34ch] text-center text-[1.25rem] leading-snug text-cream sm:text-[1.6rem]">
              {SCENE_LINES.descent}
            </p>
          </Reveal>

          <div className="mt-24 space-y-32 pl-7 sm:mt-32 sm:space-y-44 sm:pl-0">
            {PROJECTS.map((p, i) => (
              <div key={p.title}>
                <ProjectRow project={p} />
                {/* let it breathe */}
                {i === 3 && <JpAccent className="mt-28 sm:mt-36" jp={JP_ACCENTS.lightShadow.jp} en={JP_ACCENTS.lightShadow.en} />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
