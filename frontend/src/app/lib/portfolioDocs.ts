import { useEffect, useState } from 'react';
import eteProjects from '../portfolios/endtoend-engineer/engineering/projects.json';
import { getAuthApiBaseUrl } from './adminToken';

/**
 * The portfolio's content documents, read from Octo through the backend (cms_documents, key
 * endtoend-engineer). The bundled repo JSON is the fallback, so the page still renders when the
 * API is unreachable or the endpoint is not deployed yet. Each document is fetched once per page load.
 */
const cache = new Map<string, Promise<unknown | null>>();

export function loadPortfolioDoc(collection: string): Promise<unknown | null> {
  const cached = cache.get(collection);
  if (cached) return cached;
  const base = getAuthApiBaseUrl();
  const pending: Promise<unknown | null> = base
    ? fetch(`${base}/api/public/portfolio/${collection}`)
        .then((res) => (res.ok ? (res.json() as Promise<{ ok?: boolean; value?: unknown }>) : null))
        .then((body) => (body?.ok && body.value ? body.value : null))
        .catch(() => null)
    : Promise.resolve(null);
  cache.set(collection, pending);
  return pending;
}

/** The Octo copy of a portfolio document once it is read; until then, and if it cannot be read, the fallback. */
export function usePortfolioDoc<T>(collection: string | null, fallback: T): T {
  const [value, setValue] = useState<T>(fallback);
  useEffect(() => {
    if (!collection) return;
    let live = true;
    void loadPortfolioDoc(collection).then((doc) => {
      if (live && doc) setValue(doc as T);
    });
    return () => {
      live = false;
    };
  }, [collection]);
  return value;
}

/** A project record as the repo JSON describes it: the lab pages use the slug, category and status too. */
export type ProjectRecord = (typeof eteProjects)[number];

/** The project list for the lab pages, from Octo with the repo JSON as fallback. */
export function useProjectRecords(): ProjectRecord[] {
  return usePortfolioDoc<ProjectRecord[]>('engineering_projects', eteProjects as ProjectRecord[]);
}
