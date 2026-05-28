import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  CoverStudioPackGallery,
  createGalleryClient,
  type GalleryPack,
} from '@design-bakery/cover-studio-kit/client';
import { useAdminPortfolio } from '@/modules/admin/AdminPortfolioContext';
import { getAdminBasePath } from '@/portfolios/registry';
import { useCoverStudioHttpConfig } from './useCoverStudioHttp';

export function CoverStudioPackPage() {
  const { packId } = useParams<{ packId: string }>();
  const navigate = useNavigate();
  const portfolioId = useAdminPortfolio();
  const adminBase = getAdminBasePath(portfolioId);
  const httpConfig = useCoverStudioHttpConfig();
  const galleryClient = useMemo(() => createGalleryClient(httpConfig), [httpConfig]);

  const [pack, setPack] = useState<GalleryPack | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPack = useCallback(async () => {
    if (!packId) {
      setError('Pack not found.');
      setLoading(false);
      return;
    }
    try {
      setError(null);
      setLoading(true);
      const packs = await galleryClient.listPacks();
      const match = packs.find((p) => p.packId === packId);
      if (!match) {
        setError('This pack is no longer in the gallery.');
        setPack(null);
        return;
      }
      setPack(match);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load pack');
    } finally {
      setLoading(false);
    }
  }, [galleryClient, packId]);

  useEffect(() => {
    void loadPack();
  }, [loadPack]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl p-6 text-sm text-gray-500 dark:text-gray-400">
        Loading pack…
      </div>
    );
  }

  if (error || !pack) {
    return (
      <div className="mx-auto max-w-7xl space-y-3 p-6">
        <p className="text-sm text-amber-700 dark:text-amber-400">{error ?? 'Pack not found.'}</p>
        <Link
          to={`${adminBase}/cover-studio`}
          className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
        >
          ← Back to Cover Studio
        </Link>
      </div>
    );
  }

  return (
    <CoverStudioPackGallery
      pack={pack}
      onBack={() => navigate(`${adminBase}/cover-studio`)}
    />
  );
}
