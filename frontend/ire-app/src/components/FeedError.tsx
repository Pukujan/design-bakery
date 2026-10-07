import { ExternalLink, PlugZap, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FEED_URL } from "@/lib/feed";

interface FeedErrorProps {
  message: string;
  onRetry: () => void;
  retrying: boolean;
}

/** Load failure state — always offers the feed URL directly. */
export function FeedError({ message, onRetry, retrying }: FeedErrorProps) {
  return (
    <div className="panel border-t-[3px] border-t-oxide p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <PlugZap className="mt-0.5 h-5 w-5 shrink-0 text-oxide" aria-hidden />
        <div className="min-w-0 space-y-3">
          <div>
            <h1 className="font-display text-lg font-semibold text-ink">
              The daily feed did not load
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-muted">
              {message} This page reads one public JSON document and nothing else, so a
              network block, a CORS refusal or a malformed document all land here. You can
              open the document directly to check it.
            </p>
          </div>

          <div className="rounded-md border border-line bg-paper px-3 py-2">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-muted">
              Feed URL
            </p>
            <a
              href={FEED_URL}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-1 inline-flex items-start gap-1.5 break-all font-mono text-[11.5px] leading-relaxed text-forest underline decoration-forest/30 underline-offset-2 transition-colors hover:decoration-forest"
            >
              {FEED_URL}
              <ExternalLink className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
            </a>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              onClick={onRetry}
              disabled={retrying}
              className="bg-forest font-mono text-[11px] uppercase tracking-[0.1em] text-surface hover:bg-forest-deep"
            >
              <RotateCw className={retrying ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} aria-hidden />
              {retrying ? "Retrying" : "Try again"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              asChild
              className="border-line-strong bg-paper font-mono text-[11px] uppercase tracking-[0.1em] text-ink hover:bg-secondary hover:text-ink"
            >
              <a href={FEED_URL} target="_blank" rel="noreferrer noopener">
                Open raw feed
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
