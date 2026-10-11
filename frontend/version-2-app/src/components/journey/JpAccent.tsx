import { Reveal } from "./Reveal";

/**
 * A sparse scene accent: a short Japanese phrase set into the artwork the way
 * a film title card sets one, with its English beneath. It never carries
 * content the visitor needs.
 */
export function JpAccent({
  jp,
  en,
  delay = 0,
  className = "",
}: {
  jp: string;
  en: string;
  delay?: number;
  className?: string;
}) {
  return (
    <Reveal delay={delay} className={`flex flex-col items-center gap-2 ${className}`}>
      <span
        aria-hidden="true"
        className="db-jp text-[0.78rem] leading-[1.5] text-dusk-gold/80 sm:text-[0.92rem]"
      >
        {jp}
      </span>
      <span className="db-label text-[0.46rem] text-cream/55 sm:text-[0.5rem]">{en}</span>
    </Reveal>
  );
}
