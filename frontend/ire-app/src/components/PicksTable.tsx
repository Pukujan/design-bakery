import { ListX } from "lucide-react";
import { HealthBadge } from "@/components/HealthBadge";
import { LicenceCell } from "@/components/LicenceCell";
import { ModelCell } from "@/components/ModelCell";
import { PicksCards } from "@/components/PicksCards";
import { RouteChip } from "@/components/RouteChip";
import { SectionPanel } from "@/components/SectionPanel";
import { Verdict } from "@/components/Verdict";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PickRow } from "@/lib/feed";
import { formatLocalDateTime, formatUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

interface PicksTableProps {
  rows: PickRow[];
  tierLabel: string;
  listName: string;
  asOf: string | null;
}

const HEAD_CLASS =
  "border-line px-3 py-2 font-mono text-[10.5px] font-medium uppercase tracking-[0.12em] text-ink-muted";
const CELL_CLASS = "px-3 py-3 align-top text-xs text-ink";

/** Section 6 — the ledger itself: one row per entry in the visible tier. */
export function PicksTable({ rows, tierLabel, listName, asOf }: PicksTableProps) {
  const recommended = rows.filter((row) => row.recommended).length;

  return (
    <div data-testid="picks-table">
      <SectionPanel
        index="04"
        title="The picks"
        eyebrow={`${tierLabel} · source list ${listName} · every row, including the ones held back`}
        meta={
          <span className="font-mono text-[11px]">
            {recommended}/{rows.length} recommended · as of {formatLocalDateTime(asOf)}
          </span>
        }
        bodyClassName="px-0 py-0 sm:px-0 sm:py-0"
      >
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
            <ListX className="h-5 w-5 text-ink-muted" aria-hidden />
            <p className="font-display text-sm font-medium text-ink">
              No open-weight rows in this tier
            </p>
            <p className="max-w-md text-xs leading-relaxed text-ink-muted">
              The feed carried entries here, but none of them passed the open-weight filter,
              so there is nothing to recommend.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden lg:block">
              <div className="max-w-full overflow-x-auto">
                <Table className="min-w-[1040px] border-collapse">
                  <TableHeader>
                    <TableRow className="border-line bg-paper/70 hover:bg-paper/70">
                      <TableHead className={cn(HEAD_CLASS, "w-12")}>#</TableHead>
                      <TableHead className={cn(HEAD_CLASS, "min-w-[220px]")}>
                        Model
                      </TableHead>
                      <TableHead className={cn(HEAD_CLASS, "min-w-[110px]")}>
                        Vendor
                      </TableHead>
                      <TableHead className={cn(HEAD_CLASS, "min-w-[170px]")}>
                        Route to call
                      </TableHead>
                      <TableHead className={cn(HEAD_CLASS, "text-right")}>
                        Input / 1M
                      </TableHead>
                      <TableHead className={cn(HEAD_CLASS, "text-right")}>
                        Output / 1M
                      </TableHead>
                      <TableHead className={cn(HEAD_CLASS, "min-w-[130px]")}>
                        Health
                      </TableHead>
                      <TableHead className={cn(HEAD_CLASS, "min-w-[140px]")}>
                        Licence
                      </TableHead>
                      <TableHead className={cn(HEAD_CLASS, "min-w-[220px]")}>
                        Verdict
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow
                        key={row.id}
                        className={cn(
                          "border-line transition-colors hover:bg-secondary/50",
                          !row.recommended && "bg-paper/60",
                        )}
                      >
                        <TableCell className={cn(CELL_CLASS, "num text-ink-muted")}>
                          {row.rank}
                        </TableCell>
                        <TableCell className={CELL_CLASS}>
                          <ModelCell row={row} muted={!row.recommended} />
                        </TableCell>
                        <TableCell
                          className={cn(
                            CELL_CLASS,
                            "text-ink-muted",
                            !row.recommended && "text-ink-muted/80",
                          )}
                        >
                          {row.vendor ?? "—"}
                        </TableCell>
                        <TableCell className={CELL_CLASS}>
                          <RouteChip route={row.route} />
                          {row.routes.length > 1 ? (
                            <p className="mt-1 font-mono text-[10.5px] text-ink-muted">
                              +{row.routes.length - 1} other route
                              {row.routes.length - 1 === 1 ? "" : "s"}
                            </p>
                          ) : null}
                        </TableCell>
                        <TableCell
                          className={cn(
                            CELL_CLASS,
                            "num text-right tabular-nums",
                            !row.recommended && "text-ink-muted",
                          )}
                        >
                          {formatUsd(row.inputPrice)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            CELL_CLASS,
                            "num text-right tabular-nums",
                            !row.recommended && "text-ink-muted",
                          )}
                        >
                          {formatUsd(row.outputPrice)}
                        </TableCell>
                        <TableCell className={CELL_CLASS}>
                          <HealthBadge
                            status={row.healthStatus}
                            confidence={row.healthConfidence}
                            reasons={row.healthReasons}
                          />
                        </TableCell>
                        <TableCell className={CELL_CLASS}>
                          <LicenceCell row={row} />
                        </TableCell>
                        <TableCell className={cn(CELL_CLASS, "min-w-[220px]")}>
                          <Verdict row={row} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="px-4 py-4 sm:px-5 lg:hidden">
              <PicksCards rows={rows} />
            </div>

            <p className="border-t border-line px-4 py-3 text-[11px] leading-relaxed text-ink-muted sm:px-5">
              Prices are the lowest listed ask when the list was built; the provider may
              bill more. Held-back rows stay visible and quieter — they are routable
              strings, not recommendations.
            </p>
          </>
        )}
      </SectionPanel>
    </div>
  );
}
