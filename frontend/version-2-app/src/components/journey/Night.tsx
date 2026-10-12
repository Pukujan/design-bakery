import { CONTACT, EXPERIENCE, JP_ACCENTS, SCENE_LINES, SKILLS } from "@/data/content";
import { JpAccent } from "./JpAccent";
import { Reveal } from "./Reveal";

const CONTACT_LINKS = [
  { label: "GitHub", href: CONTACT.github },
  { label: "LinkedIn", href: CONTACT.linkedin },
];

/** Scene 5 — moonlight: the roles and the craft. */
export function Night() {
  return (
    <section data-scene="night" className="relative px-5 py-32 sm:px-8 sm:py-40">
      <div className="mx-auto max-w-4xl">
        <JpAccent jp={JP_ACCENTS.night.jp} en={JP_ACCENTS.night.en} />

        <Reveal delay={120}>
          <h2 className="db-display mt-16 text-center text-[1.7rem] leading-tight text-cream sm:text-[2.2rem]">
            Relevant Experience
          </h2>
        </Reveal>

        <ol className="mt-11 space-y-3">
          {EXPERIENCE.map((job, i) => (
            <Reveal
              as="li"
              key={`${job.org}-${job.period}`}
              delay={i * 70}
              threshold={0.2}
              className="db-plaque relative rounded-xl px-5 py-5 sm:px-7 sm:py-6"
            >
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                <div className="min-w-0">
                  <h3 className="db-display text-[1.2rem] leading-snug text-cream sm:text-[1.4rem]">{job.org}</h3>
                  <p className="mt-1 text-[0.82rem] font-medium tracking-wide text-dusk-blush sm:text-[0.88rem]">
                    {job.role}
                  </p>
                </div>
                <p className="db-label shrink-0 text-[0.58rem] text-dusk-gold/75 sm:text-[0.62rem]">{job.period}</p>
              </div>
            </Reveal>
          ))}
        </ol>

        <div className="mt-28 sm:mt-36">
          {SKILLS.map((group) => (
            <div key={group.group}>
              <Reveal>
                <h2 className="db-display text-center text-[1.7rem] leading-tight text-cream sm:text-[2.2rem]">
                  {group.group}
                </h2>
              </Reveal>

              <Reveal delay={140}>
                <ul className="mt-9 flex flex-wrap justify-center gap-2.5 sm:gap-3">
                  {group.items.map((s) => (
                    <li
                      key={s}
                      className="db-tag rounded-full px-4 py-2 text-[0.74rem] font-medium tracking-wide text-cream/85 sm:text-[0.8rem]"
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** The closing beat — still, moonlit, one line that invites contact. */
export function Contact() {
  return (
    <section
      id="contact"
      data-scene="contact"
      className="db-beat-contact relative flex flex-col items-center justify-center px-5 py-32 text-center sm:px-8"
    >
      <div className="mx-auto max-w-2xl">
        <Reveal>
          <h2 className="db-title text-[1.5rem] leading-[1.45] text-cream sm:text-[2.15rem]">{SCENE_LINES.night}</h2>
        </Reveal>

        <Reveal delay={180}>
          <div className="mt-11 flex flex-wrap items-center justify-center">
            <a
              href={`mailto:${CONTACT.email}`}
              className="db-link inline-flex items-center break-all rounded-full border border-dusk-gold/55 bg-dusk-gold/12 px-6 py-3 text-[0.78rem] font-semibold tracking-wide text-dusk-gold"
            >
              {CONTACT.email}
            </a>
          </div>

          <ul className="db-links mt-7 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
            {CONTACT_LINKS.map((l) => (
              <li key={l.label}>
                <a
                  href={l.href}
                  target={l.href.startsWith("http") ? "_blank" : undefined}
                  rel={l.href.startsWith("http") ? "noreferrer noopener" : undefined}
                  className="db-link inline-flex items-center rounded-full border border-cream/30 bg-cream/[0.06] px-4 py-2 text-[0.72rem] font-semibold tracking-wide text-cream/95 sm:px-5 sm:text-[0.76rem]"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={340}>
          <div className="mt-20 flex flex-col items-center gap-4">
            <span className="db-rule w-24" />
            <p className="db-wordmark text-[0.6rem] text-cream/45">Design Bakery</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
