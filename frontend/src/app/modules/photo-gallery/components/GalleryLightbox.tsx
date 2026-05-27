import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Copy, X, Hash, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { GalleryPhoto } from '../types';
import { galleryDetailPath } from '../lib/photoGalleryApi';

type GalleryLightboxProps = {
  photo: GalleryPhoto | null;
  photos: GalleryPhoto[];
  onClose: () => void;
  onNavigate: (photo: GalleryPhoto) => void;
  onCopyUrl: (url: string) => void;
  toast: string;
};

export function GalleryLightbox({
  photo,
  photos,
  onClose,
  onNavigate,
  onCopyUrl,
  toast,
}: GalleryLightboxProps) {
  useEffect(() => {
    if (!photo) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      const idx = photos.findIndex((p) => p.id === photo.id);
      if (e.key === 'ArrowLeft' && idx > 0) onNavigate(photos[idx - 1]);
      if (e.key === 'ArrowRight' && idx < photos.length - 1) onNavigate(photos[idx + 1]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [photo, photos, onClose, onNavigate]);

  const index = photo ? photos.findIndex((p) => p.id === photo.id) : -1;

  return (
    <AnimatePresence>
      {photo && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-0 sm:p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            className="relative flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-none sm:rounded-2xl border-0 sm:border-3 border-black bg-white shadow-[8px_8px_0_0_#000] dark:bg-gray-950 sm:max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-black/10 px-4 py-3 dark:border-gray-800">
              <div className="min-w-0">
                <p className="truncate font-black text-gray-900 dark:text-gray-100">{photo.title}</p>
                <p className="truncate font-mono text-xs text-purple-600 dark:text-purple-400">
                  {photo.slug}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex flex-1 flex-col lg:flex-row min-h-0">
              <div className="relative flex flex-1 items-center justify-center bg-gray-100 dark:bg-gray-900 min-h-[40vh] lg:min-h-0">
                <img
                  src={photo.url}
                  alt={photo.altText}
                  className="max-h-[50vh] lg:max-h-full w-full object-contain p-4"
                />
                {index > 0 && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 border-2 border-black bg-white/90"
                    onClick={() => onNavigate(photos[index - 1])}
                    aria-label="Previous"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                )}
                {index < photos.length - 1 && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 border-2 border-black bg-white/90"
                    onClick={() => onNavigate(photos[index + 1])}
                    aria-label="Next"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                )}
              </div>

              <aside className="w-full shrink-0 border-t lg:border-t-0 lg:border-l border-black/10 p-4 lg:w-80 dark:border-gray-800 overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <p className="mb-1 flex items-center gap-1 text-xs font-bold uppercase text-gray-500">
                      <Hash className="h-3 w-3" /> Slug
                    </p>
                    <code className="block break-all rounded-lg bg-gray-100 px-2 py-1.5 text-xs dark:bg-gray-800">
                      {photo.slug}
                    </code>
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-bold uppercase text-gray-500">Alt text</p>
                    <p className="text-sm text-gray-800 dark:text-gray-200">{photo.altText}</p>
                  </div>

                  <div>
                    <p className="mb-2 flex items-center gap-1 text-xs font-bold uppercase text-gray-500">
                      <Tag className="h-3 w-3" /> Meta tags
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {photo.metaTags.map((tag) => (
                        <Badge key={tag} variant="outline" className="capitalize text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {photo.notes && (
                    <div>
                      <p className="mb-1 text-xs font-bold uppercase text-gray-500">Notes</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{photo.notes}</p>
                    </div>
                  )}

                  <div>
                    <p className="mb-1 text-xs font-bold uppercase text-gray-500">Image source URL</p>
                    <p className="break-all text-xs text-gray-600 dark:text-gray-400">{photo.url}</p>
                  </div>

                  <Button
                    className="w-full border-2 border-black font-bold shadow-[2px_2px_0_0_#000]"
                    onClick={() => {
                      const origin = typeof window !== 'undefined' ? window.location.origin : '';
                      onCopyUrl(`${origin}${galleryDetailPath(photo)}`);
                    }}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy link
                  </Button>

                  {toast && (
                    <p className="text-center text-xs font-semibold text-green-700 dark:text-green-400">
                      {toast}
                    </p>
                  )}
                </div>
              </aside>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
