import { ExternalLink } from "lucide-react";
import { FEED_URL, type Feed } from "@/lib/feed";
import {
  commitUrl,
  formatDay,
  formatLocalDateTime,
  isStaleNow,
  repoSlug,
  shortSha,
  trimTrailingSlash,
} from "@/lib/format";

interface ProvenanceFooterProps {
  feed: Feed;
}

interface Receipt {
  label: string;
  value: string;
  hint: string;
  href?: string | null;
}

/** Section 8 — every number has a receipt. */
export function ProvenanceFooter({ feed }: ProvenanceFooterProps) {
  const commitHref = commitUrl(feed.sourceRepo, feed.codeCommit);
  const stale = isStaleNow(feed.staleAfter);

  const receipts: Receipt[] = [
    {
      label: "List day",
      value: formatDay(feed.dayEt),
      hint: `day_et ${feed.dayEt || "not stated"} · US Eastern`,
    },
    {
      label: "Built",
      value: formatLocalDateTime(feed.generatedAt),
      hint: "generated_at · shown in your local time",
    },
    {
      label: "Refresh due after",
      value: formatLocalDateTime(feed.staleAfter),
      hint: stale ? "stale_after passed · overdue" : "stale_after · still current",
    },
    {
      label: "Code commit",
      value: feed.codeCommit ? shortSha(feed.codeCommit) : "not recorded",
      hint: feed.codeCommit ? "code_commit" : "code_commit absent from the feed",
      href: commitHref,
    },
    {
      label: "Data snapshot",
      value: feed.snapshotSha256 ? shortSha(feed.snapshotSha256, 12) : "not recorded",
      hint: "snapshot_sha256",
    },
    {
      label: "Schema",
      value: feed.schemaVersion,
      hint: `open_weight_only: ${feed.openWeightOnly ? "true" : "false"}`,
    },
    {
      label: "Source repository",
      value: repoSlug(feed.sourceRepo),
      hint: "source_repo",
      href: feed.sourceRepo ? trimTrailingSlash(feed.sourceRepo) : null,
    },
    {
      label: "Raw feed",
      value: "today.json",
      hint: "the document this page read",
      href: FEED_URL,
    },
  ];

  return (
    <footer data-testid="provenance" className="space-y-3">
      <div className="panel overflow-hidden">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-line px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <span className="num text-[11px] tracking-[0.16em] text-forest">06</span>
              <h2 className="font-display text-[15px] font-semibold leading-tight text-ink sm:text-base">
                Provenance
              </h2>
            </div>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-ink-muted">
              Every number on this page has a receipt. Nothing is computed in the browser
              beyond formatting and the open-weight filter.
            </p>
          </div>
          <a
            href={FEED_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex shrink-0 items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-forest underline decoration-forest/30 underline-offset-2 transition-colors hover:decoration-forest"
          >
            Open the raw feed
            <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
        </div>

        <dl className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
          {receipts.map((receipt) => (
            <div key={receipt.label} className="bg-surface px-4 py-3 sm:px-5">
              <dt className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-muted">
                {receipt.label}
              </dt>
              <dd className="mt-1 break-words font-display text-[13px] font-medium leading-snug text-ink">
                {receipt.href ? (
                  <a
                    href={receipt.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-start gap-1 text-forest underline decoration-forest/30 underline-offset-2 transition-colors hover:decoration-forest"
                  >
                    <span className="break-all font-mono text-[12px]">
                      {receipt.value}
                    </span>
                    <ExternalLink className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
                  </a>
                ) : (
                  <span className="break-all font-mono text-[12px]">{receipt.value}</span>
                )}
              </dd>
              <dd className="mt-1 font-mono text-[10.5px] leading-snug text-ink-muted">
                {receipt.hint}
              </dd>
            </div>
          ))}
        </dl>

        {feed.notice ? (
          <div className="border-t border-line bg-paper px-4 py-3 sm:px-5">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-muted">
              Notice carried by the feed
            </p>
            <p className="mt-1 max-w-4xl text-xs leading-relaxed text-ink-muted">
              {feed.notice}
            </p>
          </div>
        ) : null}
      </div>

      <p className="px-1 text-[11px] leading-relaxed text-ink-muted">
        IRE is a read-only reader of one public document. It never asks for, stores or
        forwards an API key, and it names no closed-model vendor — model names come from the
        feed alone.
      </p>
    </footer>
  );
}
