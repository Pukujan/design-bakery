import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CoverStudioPanel,
  createCoverStudioClient,
  createGalleryClient,
  type CoverStudioInput,
  type GalleryPack,
} from '@design-bakery/cover-studio-kit/client';
import { useAdminPortfolio } from '@/modules/admin/AdminPortfolioContext';
import { getAdminBasePath } from '@/portfolios/registry';
import { useCoverStudioHttpConfig } from './useCoverStudioHttp';

const defaultInput: CoverStudioInput = {
  title: '',
  description: '',
  selectedTags: [],
  color: '#6366f1',
};

export function CoverStudioToolPage() {
  const portfolioId = useAdminPortfolio();
  const adminBase = getAdminBasePath(portfolioId);
  const [input, setInput] = useState<CoverStudioInput>(defaultInput);
  const [packs, setPacks] = useState<GalleryPack[]>([]);
  const [libraryError, setLibraryError] = useState<string | null>(null);

  const httpConfig = useCoverStudioHttpConfig();
  const client = useMemo(() => createCoverStudioClient(httpConfig), [httpConfig]);
  const galleryClient = useMemo(() => createGalleryClient(httpConfig), [httpConfig]);

  const refreshLibrary = useCallback(async () => {
    try {
      setLibraryError(null);
      const nextPacks = await galleryClient.listPacks();
      setPacks(nextPacks);
    } catch (e) {
      setLibraryError(e instanceof Error ? e.message : 'Could not load Cover Studio library');
    }
  }, [galleryClient]);

  useEffect(() => {
    void refreshLibrary();
  }, [refreshLibrary]);

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight">Cover Studio</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Nine social exports per run — one gallery card per generation.
        </p>
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
          <h2 className="text-lg font-bold">Cover Studio gallery</h2>
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
            No exports yet. Generate a pack — all nine sizes save automatically under one card.
            Run migration <code className="text-xs">008</code> in Supabase if the gallery fails.
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {packs.map((pack) => (
              <li key={pack.packId}>
                <Link
                  to={`${adminBase}/cover-studio/pack/${encodeURIComponent(pack.packId)}`}
                  className="group block w-full overflow-hidden rounded-lg border border-gray-200 bg-white text-left transition hover:border-indigo-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:hover:border-indigo-700"
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
                    <p className="text-[0.65rem] text-gray-500 dark:text-gray-400">
                      {new Date(pack.createdAt).toLocaleDateString()} · View all sizes
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
