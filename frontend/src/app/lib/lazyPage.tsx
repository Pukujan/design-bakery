import { lazy, Suspense, type ComponentType, type ReactElement } from 'react';
import { RouteFallback } from '../components/RouteFallback';

/**
 * Lazily import a route page so its chunk downloads on first navigation.
 *
 * Call this at module scope: `lazy()` must not run during render, or the page
 * remounts on every render. Each page gets its own Suspense boundary, so a
 * page rendered inside a layout (via <Outlet />) suspends without unmounting
 * the layout's nav.
 */
export function lazyPage(load: () => Promise<ComponentType>): ComponentType {
  const Lazy = lazy(async () => ({ default: await load() }));

  function LazyPage(): ReactElement {
    return (
      <Suspense fallback={<RouteFallback />}>
        <Lazy />
      </Suspense>
    );
  }

  return LazyPage;
}
