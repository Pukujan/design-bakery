import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { GalleryFilter } from '../types';

type GalleryToolbarProps = {
  filter: GalleryFilter;
  onFilterChange: (next: GalleryFilter) => void;
  allTags: string[];
  resultCount: number;
};

export function GalleryToolbar({ filter, onFilterChange, allTags, resultCount }: GalleryToolbarProps) {
  return (
    <div className="sticky top-20 z-30 mb-8 rounded-2xl border-3 border-black bg-white/90 p-4 shadow-[4px_4px_0_0_#000] backdrop-blur-md dark:border-gray-700 dark:bg-gray-900/90 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={filter.query}
            onChange={(e) => onFilterChange({ ...filter, query: e.target.value })}
            placeholder="Search slug, title, alt text, or tags…"
            className="border-2 border-black pl-10 font-medium shadow-[2px_2px_0_0_#000] dark:border-gray-600"
          />
          {filter.query && (
            <button
              type="button"
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => onFilterChange({ ...filter, query: '' })}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="shrink-0 text-sm font-bold text-gray-600 dark:text-gray-400">
          {resultCount} match{resultCount === 1 ? '' : 'es'}
        </p>
      </div>

      {allTags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onFilterChange({ ...filter, tag: null })}
            className={[
              'rounded-full border-2 px-3 py-1 text-xs font-bold transition-colors',
              filter.tag === null
                ? 'border-black bg-purple-500 text-white shadow-[2px_2px_0_0_#000]'
                : 'border-black/30 bg-gray-50 text-gray-700 hover:border-black dark:bg-gray-800 dark:text-gray-300',
            ].join(' ')}
          >
            All tags
          </button>
          {allTags.slice(0, 14).map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() =>
                onFilterChange({ ...filter, tag: filter.tag === tag ? null : tag })
              }
            >
              <Badge
                variant="outline"
                className={[
                  'cursor-pointer border-2 font-bold capitalize',
                  filter.tag === tag
                    ? 'border-black bg-indigo-500 text-white'
                    : 'border-black/20 hover:border-black',
                ].join(' ')}
              >
                #{tag}
              </Badge>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
