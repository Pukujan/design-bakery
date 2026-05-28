import { useCallback, useEffect, useMemo, useState } from 'react';
import { CoverStudioPackGallery } from './CoverStudioPackGallery.js';
import { CoverStudioPanel } from './CoverStudioPanel.js';
import { createCoverStudioClient } from './api.js';
import { createGalleryClient } from './galleryApi.js';
import type { CoverStudioHttpConfig } from './api.js';
import type { CoverStudioInput } from './CoverStudioPanel.js';
import type { GalleryPack } from '../types.js';

export type PublicCoverStudioAppProps = {
  /** e.g. import.meta.env.VITE_API_URL */
  apiBaseUrl: string;
  /** Optional — omit for a public API that does not require auth. */
  getAuthHeaders?: CoverStudioHttpConfig['getAuthHeaders'];
  title?: string;
  subtitle?: string;
  className?: string;
};

const defaultInput: CoverStudioInput = {
  title: '',
  description: '',
  selectedTags: [],
  color: '#6366f1',
};

/**
 * Standalone Cover Studio UI — same panel + gallery as admin, without AdminLayout.
 * Pack detail is in-app (CoverStudioPackGallery), not a modal.
 */
export function PublicCoverStudioApp({
  apiBaseUrl,
  getAuthHeaders,
  title = 'Social image studio',
  subtitle = 'One idea → nine platform sizes + a text-free hero for your media library.',
  className = '',
}: PublicCoverStudioAppProps) {
  const [input, setInput] = useState<CoverStudioInput>(defaultInput);
  const [packs, setPacks] = useState<GalleryPack[]>([]);
  const [libraryError, setLibraryError] = useState<string | null>(null);
  const [activePack, setActivePack] = useState<GalleryPack | null>(null);

  const httpConfig = useMemo<CoverStudioHttpConfig>(
    () => ({
      getBaseUrl: () => apiBaseUrl.replace(/\/$/, ''),
      getAuthHeaders: getAuthHeaders ?? (async () => ({})),
    }),
    [apiBaseUrl, getAuthHeaders],
  );

  const client = useMemo(() => createCoverStudioClient(httpConfig), [httpConfig]);
  const galleryClient = useMemo(() => createGalleryClient(httpConfig), [httpConfig]);

  const refreshLibrary = useCallback(async () => {
    try {
      setLibraryError(null);
      setPacks(await galleryClient.listPacks());
    } catch (e) {
      setLibraryError(e instanceof Error ? e.message : 'Could not load gallery');
    }
  }, [galleryClient]);

  useEffect(() => {
    void refreshLibrary();
  }, [refreshLibrary]);

  if (activePack) {
    return <CoverStudioPackGallery pack={activePack} onBack={() => setActivePack(null)} />;
  }

  return (
    <div className={`mx-auto max-w-7xl space-y-8 p-4 sm:p-6 ${className}`}>
      <header className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight">{title}</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>
      </header>

      <CoverStudioPanel
        client={client}
        galleryClient={galleryClient}
        value={input}
        onChange={(patch) => setInput((v) => ({ ...v, ...patch }))}
        onGallerySaved={() => void refreshLibrary()}
      />

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold">Your exports</h2>
          <button
            type="button"
            className="text-sm text-indigo-600 hover:underline dark:text-indigo-400"
            onClick={() => void refreshLibrary()}
          >
            Refresh
          </button>
        </div>
        {libraryError ? (
          <p className="text-sm text-amber-700 dark:text-amber-400">{libraryError}</p>
        ) : null}
        {packs.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Generate a pack to see saved exports here.
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {packs.map((pack) => (
              <li key={pack.packId}>
                <button
                  type="button"
                  className="group w-full overflow-hidden rounded-lg border border-gray-200 bg-white text-left transition hover:border-indigo-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:hover:border-indigo-700"
                  onClick={() => setActivePack(pack)}
                >
                  <div className="relative">
                    <img
                      src={pack.coverUrl}
                      alt={pack.title}
                      className="aspect-video w-full object-cover"
                    />
                    <span className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[0.65rem] font-semibold text-white">
                      {pack.exportCount} sizes
                    </span>
                  </div>
                  <div className="space-y-2 p-3">
                    <p className="truncate text-sm font-semibold">{pack.title}</p>
                    {pack.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {pack.tags.slice(0, 4).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[0.65rem] font-medium capitalize text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
