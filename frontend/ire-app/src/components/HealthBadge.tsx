import type { Confidence, HealthStatus } from "@/lib/feed";
import { healthMeta } from "@/lib/health";
import { cn } from "@/lib/utils";

interface HealthBadgeProps {
  status: HealthStatus | null;
  confidence?: Confidence | null;
  reasons?: string[];
  className?: string;
}

/** One readable badge per health status, with the probe detail on hover. */
export function HealthBadge({
  status,
  confidence,
  reasons,
  className,
}: HealthBadgeProps) {
  const meta = healthMeta(status);
  const detail = [
    meta.note,
    reasons && reasons.length > 0 ? reasons.join("; ") : null,
    confidence ? `health confidence: ${confidence}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <span
      title={detail}
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm border px-1.5 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.08em]",
        meta.badgeClass,
        className,
      )}
    >
      <span
        aria-hidden
        className={cn("h-1.5 w-1.5 shrink-0 rounded-full", meta.dotClass)}
      />
      {meta.label}
    </span>
  );
}
