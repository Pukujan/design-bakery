/** Minimal fallback shown while a lazily-loaded route chunk downloads. */
export function RouteFallback() {
  return (
    <div
      className="flex min-h-[60vh] w-full items-center justify-center"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">Loading…</span>
      <span
        className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-black dark:border-gray-700 dark:border-t-white"
        aria-hidden
      />
    </div>
  );
}
