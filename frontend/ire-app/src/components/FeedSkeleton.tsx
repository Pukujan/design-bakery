import { Skeleton } from "@/components/ui/skeleton";

/** Shown while the single feed document is in flight. */
export function FeedSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-live="polite">
      <div className="panel border-t-[3px] border-t-forest p-5 sm:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:justify-between">
          <div className="max-w-xl space-y-3">
            <Skeleton className="h-9 w-24 bg-secondary" />
            <Skeleton className="h-5 w-72 bg-secondary" />
            <Skeleton className="h-3.5 w-full bg-secondary" />
            <Skeleton className="h-3.5 w-5/6 bg-secondary" />
            <Skeleton className="h-8 w-36 bg-secondary" />
          </div>
          <div className="grid w-full gap-4 sm:grid-cols-3 lg:max-w-md">
            {[0, 1, 2].map((item) => (
              <div key={item} className="space-y-2">
                <Skeleton className="h-3 w-20 bg-secondary" />
                <Skeleton className="h-4 w-28 bg-secondary" />
                <Skeleton className="h-3 w-16 bg-secondary" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel space-y-3 p-4 sm:p-5">
        <Skeleton className="h-4 w-52 bg-secondary" />
        <Skeleton className="h-10 w-full bg-secondary" />
        <Skeleton className="h-14 w-full bg-secondary" />
      </div>

      {[0, 1].map((panel) => (
        <div key={panel} className="panel p-4 sm:p-5">
          <Skeleton className="h-4 w-64 bg-secondary" />
          <Skeleton className="mt-4 h-64 w-full bg-secondary" />
        </div>
      ))}

      <div className="panel p-4 sm:p-5">
        <Skeleton className="h-4 w-40 bg-secondary" />
        <div className="mt-4 space-y-2">
          {[0, 1, 2, 3, 4, 5].map((row) => (
            <Skeleton key={row} className="h-9 w-full bg-secondary" />
          ))}
        </div>
      </div>

      <p className="px-1 font-mono text-[11px] text-ink-muted">
        Reading the daily feed document…
      </p>
    </div>
  );
}
