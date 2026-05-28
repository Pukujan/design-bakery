import { useMemo } from 'react';
import type { GalleryPack } from '../types.js';
import { galleryAssetsToSocialVariants, downloadImageUrl } from '../packVariants.js';
import { socialPostLinkForFormat } from '../socialPostLinks.js';
import { SocialAppPreview } from './SocialAppPreview.js';

type Props = {
  pack: GalleryPack;
  /** e.g. "/admin/cover-studio" */
  backTo?: string;
  onBack?: () => void;
};

function slugify(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function CoverStudioPackGallery({ pack, backTo, onBack }: Props) {
  const variants = useMemo(() => galleryAssetsToSocialVariants(pack.assets), [pack.assets]);
  const baseSlug = slugify(pack.title) || 'export';

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <header className="space-y-3">
        {backTo || onBack ? (
          onBack ? (
            <button
              type="button"
              className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
              onClick={onBack}
            >
              ← Back to gallery
            </button>
          ) : (
            <a
              href={backTo}
              className="inline-block text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
            >
              ← Back to gallery
            </a>
          )
        ) : null}
        <div className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight">{pack.title}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {variants.length} platform export{variants.length === 1 ? '' : 's'} ·{' '}
            {new Date(pack.createdAt).toLocaleString()}
          </p>
        </div>
        {pack.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {pack.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-medium capitalize text-indigo-800 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-200"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </header>

      <section className="space-y-3">
        <p className="text-xs font-semibold text-indigo-900 dark:text-indigo-100">
          Platform previews ({variants.length} sizes)
        </p>
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {variants.map((variant) => {
            const postLink = socialPostLinkForFormat(variant.id);
            return (
              <div key={variant.id} className="flex min-w-0 flex-col gap-2">
                <SocialAppPreview
                  variant={variant}
                  onDownload={() =>
                    void downloadImageUrl(variant.previewDataUrl, `${baseSlug}-${variant.id}.png`)
                  }
                />
                {postLink ? (
                  <a
                    href={postLink.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-center text-[0.65rem] font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    {postLink.label} ↗
                  </a>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
