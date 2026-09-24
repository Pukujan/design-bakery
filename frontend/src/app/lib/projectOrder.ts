/**
 * Showcase ordering: newest project first, by `startedAt`.
 *
 * `startedAt` is `YYYY-MM-DD` or `YYYY-MM` (month precision when only the month is known).
 * ISO strings compare correctly as plain strings; a month-only value sorts after dated
 * values in the same month. Projects without a valid `startedAt` go last. The sort is
 * stable (Array.prototype.sort is stable since ES2019), so ties keep their data order.
 *
 * Plain TypeScript with no imports so `scripts/test-homepage-content-stability.mjs` can
 * import it directly under Node 24's type stripping.
 */
export const STARTED_AT_PATTERN = /^\d{4}-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?$/;

export function sortProjectsByStartedAtDesc<T extends { startedAt?: string }>(projects: readonly T[]): T[] {
  const key = (project: T) =>
    project.startedAt && STARTED_AT_PATTERN.test(project.startedAt) ? project.startedAt : '';
  return [...projects].sort((a, b) => {
    const ka = key(a);
    const kb = key(b);
    if (ka === kb) return 0;
    return ka < kb ? 1 : -1;
  });
}
