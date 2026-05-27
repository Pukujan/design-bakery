import { motion } from 'motion/react';
import { Camera, Sparkles } from 'lucide-react';
import { Squiggle } from '@/components/GraphicElements';

type GalleryHeroProps = {
  total: number;
  source: 'demo' | 'api';
};

export function GalleryHero({ total, source }: GalleryHeroProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative mb-8 sm:mb-10 md:mb-12"
    >
      <div className="flex items-start gap-4">
        <div className="hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-3 border-black bg-yellow-300 shadow-[4px_4px_0_0_#000]">
          <Camera className="h-7 w-7 text-black" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border-2 border-black bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide shadow-[2px_2px_0_0_#000] dark:bg-gray-900">
              <Sparkles className="h-3 w-3 text-purple-600" />
              Issue #24
            </span>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {source === 'api' ? 'Live from media library' : 'Demo collection'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-gray-900 dark:text-gray-50">
            Photo Gallery
          </h1>
          <p className="mt-2 max-w-2xl text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
            Browse uploaded assets with copy-ready links, OCR-friendly slugs, and meta tags for search.
            Upload &amp; VL naming live in{' '}
            <span className="font-semibold">Admin → Media Library</span>.
          </p>
          <div className="mt-4 flex items-center gap-3">
            <Squiggle className="h-4 w-24 text-purple-500" />
            <span className="text-sm font-bold text-gray-600 dark:text-gray-400">
              {total} {total === 1 ? 'photo' : 'photos'}
            </span>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
