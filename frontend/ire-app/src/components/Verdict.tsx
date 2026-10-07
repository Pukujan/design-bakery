import { Ban, CircleCheck } from "lucide-react";
import type { PickRow } from "@/lib/feed";
import { cn } from "@/lib/utils";

interface VerdictProps {
  row: PickRow;
  className?: string;
}

/** "Recommended" or "Held back: <plain-english reasons>". */
export function Verdict({ row, className }: VerdictProps) {
  if (row.recommended) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-forest",
          className,
        )}
      >
        <CircleCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Recommended
      </span>
    );
  }

  const reasons =
    row.gateReasons.length > 0 ? row.gateReasons.join(" · ") : "a policy rule";

  return (
    <span className={cn("inline-flex items-start gap-1.5 text-xs", className)}>
      <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-oxide">
        <Ban className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Held back:
      </span>
      <span className="leading-relaxed text-ink-muted">{reasons}</span>
    </span>
  );
}
