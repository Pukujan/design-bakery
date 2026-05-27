import type { GalleryPhoto } from '../types';
import { GalleryCard } from './GalleryCard';
import { galleryDetailPath } from '../lib/photoGalleryApi';

type GalleryMasonryProps = {
  photos: GalleryPhoto[];
  onOpen: (photo: GalleryPhoto) => void;
  onCopyUrl: (url: string) => void;
  pathPrefix?: string;
};

export function GalleryMasonry({ photos, onOpen, onCopyUrl, pathPrefix = '' }: GalleryMasonryProps) {
  if (photos.length === 0) {
    return (
      <div className="rounded-2xl border-3 border-dashed border-black/30 bg-white/60 p-12 text-center dark:border-gray-700 dark:bg-gray-900/60">
        <p className="text-lg font-black text-gray-800 dark:text-gray-200">No photos match</p>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Try another slug, tag, or clear the filters.
        </p>
      </div>
    );
  }

  return (
    <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
      {photos.map((photo, index) => (
        <GalleryCard
          key={photo.id}
          photo={photo}
          index={index}
          onOpen={() => onOpen(photo)}
          onCopyUrl={() => {
            const origin = typeof window !== 'undefined' ? window.location.origin : '';
              onCopyUrl(`${origin}${galleryDetailPath(photo, pathPrefix)}`);
          }}
        />
      ))}
    </div>
  );
}
