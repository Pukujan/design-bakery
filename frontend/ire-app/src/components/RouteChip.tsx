import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";

interface RouteChipProps {
  route: string;
  copyable?: boolean;
  className?: string;
}

/** The route string is what a user pastes into a tool — keep it monospace and copyable. */
export function RouteChip({ route, copyable = true, className }: RouteChipProps) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(route);
      setCopied(true);
      showSuccess(`Copied route ${route}`);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      showError("The browser blocked the clipboard. Select the route text instead.");
    }
  };

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-sm border border-line bg-paper px-1.5 py-0.5",
        className,
      )}
    >
      <code className="truncate font-mono text-[11.5px] text-ink">{route}</code>
      {copyable ? (
        <button
          type="button"
          onClick={onCopy}
          aria-label={`Copy route ${route}`}
          title="Copy route"
          className="shrink-0 text-ink-muted transition-colors hover:text-forest focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {copied ? (
            <Check className="h-3 w-3 text-forest" aria-hidden />
          ) : (
            <Copy className="h-3 w-3" aria-hidden />
          )}
        </button>
      ) : null}
    </span>
  );
}
