import { PROJECTS, JP_ACCENTS, SCENE_LINES, type Project } from "@/data/content";
import { ART } from "@/lib/art";
import { JpAccent } from "./JpAccent";
import { Reveal } from "./Reveal";
import { ProjectMoment } from "./ProjectMoment";

/**
 * One project in the descent. The photographic plates carry the scene now, so
 * the row is only the card's box: the driver finds every card with one
 * selector and the emphasis curve is written onto the card inside.
 */
function ProjectRow({ project }: { project: Project }) {
  return (
    <div className="-ml-7 pl-7 sm:ml-0 sm:pl-0">
      <ProjectMoment project={project} />
    </div>
  );
}

/** Scene 2 — the projects, revealed one at a time as the visitor descends. */
export function Work() {
  return (
    <section id="work" data-scene="work" className="relative px-5 pb-32 pt-24 sm:px-8 sm:pt-28">
      {/*
        The near-camera branch plane. It is the one scenery layer mounted above
        the page rather than inside the stage, so it can pass in front of the
        cards and cover and reveal them; it sits below the fixed nav and it is
        transparent through the centre, so the scene and the cards show through.
        Its opacity window rides the same eased clock as every other layer.
      */}
      <div
        className="db-work-fg"
        aria-hidden="true"
        style={{ backgroundImage: `url(${ART.workFg})` }}
      />

      <div className="relative mx-auto max-w-5xl">
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
