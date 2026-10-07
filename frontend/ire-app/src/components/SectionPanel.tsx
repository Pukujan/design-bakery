import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionPanelProps {
  index?: string;
  title: string;
  eyebrow?: string;
  meta?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

/** Ledger panel: numbered eyebrow, rule title, hairline-separated body. */
export function SectionPanel({
  index,
  title,
  eyebrow,
  meta,
  children,
  className,
  bodyClassName,
}: SectionPanelProps) {
  return (
    <section className={cn("panel overflow-hidden", className)}>
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-line px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            {index ? (
              <span className="num text-[11px] tracking-[0.16em] text-forest">
                {index}
              </span>
            ) : null}
            <h2 className="font-display text-[15px] font-semibold leading-tight text-ink sm:text-base">
              {title}
            </h2>
          </div>
          {eyebrow ? (
            <p className="mt-1 text-xs leading-relaxed text-ink-muted">{eyebrow}</p>
          ) : null}
        </div>
        {meta ? <div className="shrink-0 text-xs text-ink-muted">{meta}</div> : null}
      </header>
      <div className={cn("px-4 py-4 sm:px-5 sm:py-5", bodyClassName)}>{children}</div>
    </section>
  );
}
