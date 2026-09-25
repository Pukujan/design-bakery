/**
 * Dataset loading.
 *
 * A chart spec names a dataset id (`eval-lab/judges-blind-760`). The file that
 * id maps to is resolved through `/research/data/index.json` — the manifest the
 * exporter writes, which also carries the sha256 of every file — with a flat
 * `<id>.json` fallback for a dataset that is published on its own. Nothing here
 * knows anything about eval-lab beyond that convention: swap the manifest and
 * any project's data works.
 *
 * Fetched lazily, on demand, and cached by id, so two charts in one paper share
 * one request.
 */
import type { Dataset } from './types.generated';

export const DATA_BASE = '/research/data';

export interface DatasetIndexEntry {
  path: string;
  kind: string;
  id: string;
  bytes: number;
  sha256: string;
}

export interface DatasetIndex {
  schemaVersion: string;
  repository?: string;
  commit?: string;
  generatedAt?: string;
  files: DatasetIndexEntry[];
}

const INDEX_PREFIX = 'paper/data/';

let indexPromise: Promise<DatasetIndex | null> | null = null;
const datasetPromises = new Map<string, Promise<Dataset>>();

function resolveUrl(path: string): string {
  return `${DATA_BASE}/${path.replace(/^\/+/, '')}`;
}

/** `paper/data/charts/x.json` → `charts/x.json`. */
export function publicPathFor(entry: DatasetIndexEntry): string {
  return entry.path.startsWith(INDEX_PREFIX) ? entry.path.slice(INDEX_PREFIX.length) : entry.path;
}

/** The manifest is optional: a dataset published as `<id>.json` still works. */
export function loadDatasetIndex(): Promise<DatasetIndex | null> {
  if (!indexPromise) {
    indexPromise = fetch(resolveUrl('index.json'))
      .then((response) => (response.ok ? (response.json() as Promise<DatasetIndex>) : null))
      .catch(() => null);
  }
  return indexPromise;
}

export async function datasetUrl(id: string): Promise<string> {
  const index = await loadDatasetIndex();
  const entry = index?.files.find((file) => file.id === id && file.kind !== 'schema');
  return resolveUrl(entry ? publicPathFor(entry) : `${id}.json`);
}

export function loadDataset(id: string): Promise<Dataset> {
  const cached = datasetPromises.get(id);
  if (cached) return cached;

  const pending = datasetUrl(id)
    .then((url) => fetch(url))
    .then((response) => {
      if (!response.ok) {
        throw new Error(`dataset "${id}" is not published (HTTP ${response.status})`);
      }
      return response.json() as Promise<Dataset>;
    })
    .catch((error: unknown) => {
      // Do not cache a failure: a retry after a flaky network should work.
      datasetPromises.delete(id);
      throw error;
    });

  datasetPromises.set(id, pending);
  return pending;
}

/** Test seam. */
export function resetDatasetCache(): void {
  indexPromise = null;
  datasetPromises.clear();
}
