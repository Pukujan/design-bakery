import { ExternalLink, ShieldAlert } from "lucide-react";
import type { PickRow } from "@/lib/feed";
import { cn } from "@/lib/utils";

interface LicenceCellProps {
  row: PickRow;
  className?: string;
}

/**
 * Unverified licences (open_weight === null) are never linked and always say so.
 */
export function LicenceCell({ row, className }: LicenceCellProps) {
  if (row.openWeight === null) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 text-xs text-oxide",
          className,
        )}
      >
        <ShieldAlert className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Licence not verified
      </span>
    );
  }

  if (row.licence?.url) {
    return (
      <span className={cn("inline-flex flex-wrap items-center gap-x-2 gap-y-1", className)}>
        <a
          href={row.licence.url}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1 text-xs text-forest underline decoration-forest/30 underline-offset-2 transition-colors hover:decoration-forest"
        >
          {row.licence.name}
          <ExternalLink className="h-3 w-3" aria-hidden />
        </a>
        {row.licence.weightsUrl ? (
          <a
            href={row.licence.weightsUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-ink-muted underline decoration-line-strong underline-offset-2 transition-colors hover:text-forest"
          >
            weights
          </a>
        ) : null}
      </span>
    );
  }

  if (row.licence?.name) {
    return (
      <span className={cn("text-xs text-ink", className)}>{row.licence.name}</span>
    );
  }

  return (
    <span className={cn("text-xs text-ink-muted", className)}>
      Open weight, licence not stated
    </span>
  );
}
