import type { ReactNode } from "react";
import type { Project } from "@/data/content";
import { Reveal } from "./Reveal";

const isExternal = (href: string) => /^https?:\/\//.test(href);

/** The frame each project hangs in — a beat in the landscape, not a card. */
function Device({ project, children }: { project: Project; children: ReactNode }) {
  const { device, side } = project;

  const tilt =
    device === "signboard" ? (side === "left" ? "db-tilt-a" : "db-tilt-b") : device === "lantern" ? "db-tilt-c" : "";

  const frameClass =
    device === "billboard"
      ? "db-plaque db-billboard rounded-md"
      : device === "lantern"
        ? "db-plaque db-hang rounded-[2rem]"
        : device === "passing"
          ? "db-plaque rounded-sm"
          : "db-plaque db-plaque-posts rounded-lg";

  return (
    <div className={`db-device w-full max-w-[30rem] sm:max-w-[32rem] ${tilt}`}>
      {device === "passing" ? (
        <div className={`${frameClass} overflow-hidden pb-14 pt-6 sm:pt-7`}>
          {children}
          {/* the lit windows of a night train sliding past below the panel */}
          <div className="db-rail" />
        </div>
      ) : (
        <div className={`${frameClass} p-6 sm:p-7`}>{children}</div>
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
                <dd className="db-label mt-1.5 text-[0.5rem] text-cream/60">{s.label}</dd>
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
          <ul className="mt-5 flex flex-wrap gap-2 border-t border-cream/12 pt-4">
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
