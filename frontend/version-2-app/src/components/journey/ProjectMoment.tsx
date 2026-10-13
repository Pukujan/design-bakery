import type { ReactNode } from "react";
import type { Project } from "@/data/content";
import { Reveal } from "./Reveal";

const isExternal = (href: string) => /^https?:\/\//.test(href);

/** The frame each project hangs in — a pane of glass in the landscape. */
function Device({ project, children }: { project: Project; children: ReactNode }) {
  const { device, side } = project;

  const tilt =
    device === "signboard" ? (side === "left" ? "db-tilt-a" : "db-tilt-b") : device === "lantern" ? "db-tilt-c" : "";

  const frameClass =
    device === "billboard"
      ? "db-billboard rounded-[1.6rem]"
      : device === "lantern"
        ? "db-hang rounded-[2.25rem]"
        : device === "passing"
          ? "rounded-[1.25rem]"
          : "db-plaque-posts rounded-[1.75rem]";

  return (
    <div className={`db-device w-full max-w-[30rem] sm:max-w-[32rem] ${tilt}`}>
      {device === "passing" ? (
        /* the one frame that keeps its own signature: a tight top and a deep
           bottom, so the glass reads as sliding past rather than resting */
        <div className={`db-card ${frameClass} overflow-hidden px-7 pb-16 pt-7 sm:px-9 sm:pt-8`}>
          {children}
        </div>
      ) : (
        <div className={`db-card ${frameClass} p-7 sm:p-9`}>{children}</div>
      )}
    </div>
  );
}

export function ProjectMoment({ project }: { project: Project }) {
  const { index, title, tagline, monoTagline, description, tech, links, stats, side } = project;

  return (
    <Reveal threshold={0.22} className={`flex w-full ${side === "left" ? "justify-start" : "justify-end"}`}>
      <Device project={project}>
        <p className="db-label text-[0.55rem] text-dusk-gold/70">
          {index} <span className="mx-1.5 inline-block h-px w-6 translate-y-[-3px] bg-dusk-gold/40 align-middle" />
          Work
        </p>

        <h3 className="db-display mt-3 text-[1.7rem] leading-[1.1] text-cream sm:text-[2rem]">{title}</h3>

        {monoTagline ? (
          <p className="mt-2 break-words font-mono text-[0.82rem] tracking-tight text-dusk-gold">{tagline}</p>
        ) : (
          <p className="db-display mt-2 text-[1.12rem] italic leading-snug text-dusk-blush sm:text-[1.25rem]">
            {tagline}
          </p>
        )}

        <p className="db-body mt-4 text-[0.86rem] text-cream/80 sm:text-[0.92rem]">{description}</p>

        {stats && (
          <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-3 border-t border-cream/12 pt-4">
            {stats.map((s) => (
              <div key={s.label}>
                <dt className="db-display text-[1.4rem] leading-none text-dusk-gold">{s.value}</dt>
                <dd className="db-label mt-1.5 text-[0.56rem] text-cream/60">{s.label}</dd>
              </div>
            ))}
          </dl>
        )}

        <ul className="mt-5 flex flex-wrap gap-1.5">
          {tech.map((t) => (
            <li key={t} className="db-tag rounded-full px-2.5 py-1 text-[0.62rem] font-medium tracking-wide text-cream/75">
              {t}
            </li>
          ))}
        </ul>

        {links.length > 0 && (
          <ul className="db-links mt-5 flex flex-wrap gap-2 border-t border-cream/20 pt-4">
            {links.map((l) => (
              <li key={l.label}>
                <a
                  href={l.href}
                  target={isExternal(l.href) ? "_blank" : undefined}
                  rel={isExternal(l.href) ? "noreferrer noopener" : undefined}
                  className="db-link inline-flex items-center gap-1.5 rounded-full border border-cream/25 px-3.5 py-1.5 text-[0.68rem] font-semibold tracking-wide text-cream/90"
                >
                  {l.label}
                  {isExternal(l.href) && (
                    <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden="true">
                      <path d="M2 8 8 2M8 2H4M8 2v4" fill="none" stroke="currentColor" strokeWidth="1.3" />
                    </svg>
                  )}
                </a>
              </li>
            ))}
          </ul>
        )}
      </Device>
    </Reveal>
  );
}
