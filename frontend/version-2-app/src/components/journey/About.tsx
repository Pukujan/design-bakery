import { ABOUT, JP_ACCENTS } from "@/data/content";
import { JpAccent } from "./JpAccent";
import { Reveal } from "./Reveal";

/** Scene 3 — mid-descent, the sky warming, a more personal space. */
export function About() {
  return (
    <section id="about" data-scene="about" className="relative px-5 py-32 sm:px-8 sm:py-40">
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <p className="db-label text-center text-[0.52rem] text-dusk-gold/75 sm:text-[0.58rem]">About</p>
        </Reveal>

        <Reveal delay={100}>
          <h2 className="db-display mt-5 text-center text-[1.9rem] leading-tight text-cream sm:text-[2.6rem]">
            {ABOUT.name}
          </h2>
        </Reveal>

        <Reveal delay={220}>
          <div className="db-plaque mt-10 rounded-2xl p-6 sm:mt-12 sm:p-9">
            <div className="space-y-5">
              {ABOUT.paragraphs.map((para) => (
                <p key={para.slice(0, 24)} className="db-body text-[0.9rem] text-cream/85 sm:text-[1rem]">
                  {para}
                </p>
              ))}
            </div>

            <ul className="mt-8 grid gap-px overflow-hidden rounded-xl border border-cream/12 sm:grid-cols-2">
              {ABOUT.highlights.map((h, i) => (
                <li key={h} className="flex items-center gap-3 bg-cream/[0.04] px-4 py-3.5">
                  <span className="db-display text-[0.95rem] leading-none text-dusk-gold/80">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[0.78rem] font-medium tracking-wide text-cream/85">{h}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <JpAccent className="mt-16" jp={JP_ACCENTS.lantern.jp} en={JP_ACCENTS.lantern.en} delay={260} />
      </div>
    </section>
  );
}
