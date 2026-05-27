import { motion } from 'motion/react';
import { Copy, ExternalLink, Link2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { GalleryPhoto } from '../types';

type GalleryCardProps = {
  photo: GalleryPhoto;
  index: number;
  onOpen: () => void;
  onCopyUrl: () => void;
};

function formatBytes(n: number | null): string {
  if (!n) return '';
  if (n < 1024) return `${n} B`;
  return `${(n / 1024).toFixed(0)} KB`;
}

export function GalleryCard({ photo, index, onOpen, onCopyUrl }: GalleryCardProps) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.4) }}
      className="group mb-4 break-inside-avoid"
    >
      <div className="overflow-hidden rounded-2xl border-3 border-black bg-white shadow-[4px_4px_0_0_#000] transition-all duration-200 hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#000] dark:border-gray-700 dark:bg-gray-900">
        <button
          type="button"
          onClick={onOpen}
          className="relative block w-full overflow-hidden bg-gray-100 dark:bg-gray-800"
        >
          <img
            src={photo.url}
            alt={photo.altText}
            loading="lazy"
            className="w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-10 opacity-0 transition-opacity group-hover:opacity-100">
            <p className="text-left text-sm font-bold text-white line-clamp-2">{photo.title}</p>
          </div>
        </button>

        <div className="space-y-3 p-4">
          <div>
            <h2 className="text-base font-black text-gray-900 dark:text-gray-100 line-clamp-1">
              {photo.title}
            </h2>
            <p className="mt-1 font-mono text-xs text-purple-700 dark:text-purple-300 truncate">
              /{photo.slug}
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {photo.metaTags.slice(0, 4).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="border border-black/10 text-[10px] font-semibold capitalize dark:border-gray-600"
              >
                {tag}
              </Badge>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-2 border-black font-bold shadow-[2px_2px_0_0_#000]"
              onClick={onCopyUrl}
            >
              <Copy className="mr-1 h-3.5 w-3.5" />
              Copy URL
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-2 border-black font-bold"
              asChild
            >
              <a href={photo.url} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-1 h-3.5 w-3.5" />
                Open
              </a>
            </Button>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-medium text-gray-500 dark:text-gray-400">
            <Link2 className="h-3 w-3 shrink-0" />
            <span className="truncate">{photo.filename}</span>
            {photo.byteSize ? <span>· {formatBytes(photo.byteSize)}</span> : null}
          </div>
        </div>
      </div>
    </motion.article>
  );
}
