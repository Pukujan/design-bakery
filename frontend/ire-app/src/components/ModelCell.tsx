import type { PickRow } from "@/lib/feed";
import { cn } from "@/lib/utils";

interface ModelCellProps {
  row: PickRow;
  muted?: boolean;
  className?: string;
}

/** Model name plus the rough capability band, price regime and confidence. */
export function ModelCell({ row, muted, className }: ModelCellProps) {
  const chips = [
    row.capabilityTier,
    row.priceRegime ? row.priceRegime.replace(/_/g, " ") : null,
  ].filter((chip): chip is string => Boolean(chip));

  return (
    <div className={cn("min-w-0", className)}>
      <p
        className={cn(
          "font-display text-[13.5px] font-semibold leading-snug",
          muted ? "text-ink-muted" : "text-ink",
        )}
      >
        {row.model}
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10.5px] text-ink-muted">
        {row.capability !== null ? (
          <span className="tabular-nums">≈{Math.round(row.capability)}/100</span>
        ) : null}
        {chips.map((chip) => (
          <span
            key={chip}
            className="rounded-sm border border-line bg-paper px-1 py-px capitalize"
          >
            {chip}
          </span>
        ))}
        {row.confidence ? <span>confidence {row.confidence}</span> : null}
      </div>
    </div>
  );
}
