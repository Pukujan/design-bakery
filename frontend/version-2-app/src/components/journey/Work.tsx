import { PROJECTS, JP_ACCENTS, SCENE_LINES } from "@/data/content";
import { JpAccent } from "./JpAccent";
import { ProjectMoment } from "./ProjectMoment";
import { Reveal } from "./Reveal";

/** Scene 2 — the projects, revealed one at a time as the visitor descends. */
export function Work() {
  return (
    <section id="work" data-scene="work" className="relative px-5 pb-32 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Reveal threshold={0.3}>
          <p className="db-display mx-auto max-w-[34ch] text-center text-[1.25rem] leading-snug text-cream sm:text-[1.6rem]">
            {SCENE_LINES.descent}
          </p>
        </Reveal>

        <div className="mt-24 space-y-32 sm:mt-32 sm:space-y-44">
          {PROJECTS.map((p, i) => (
            <div key={p.title}>
              <ProjectMoment project={p} />
              {/* let it breathe */}
              {i === 3 && <JpAccent className="mt-28 sm:mt-36" jp={JP_ACCENTS.lightShadow.jp} en={JP_ACCENTS.lightShadow.en} />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
