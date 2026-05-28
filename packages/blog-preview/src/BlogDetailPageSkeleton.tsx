import { Skeleton } from '@/components/ui/skeleton';

function Sk({ className }: { className?: string }) {
  return (
    <Skeleton
      className={`bg-gray-200/90 dark:bg-gray-700/80 border-2 border-black/10 ${className ?? ''}`}
    />
  );
}

export function BlogDetailPageSkeleton() {
  return (
    <section
      className="min-h-screen pt-28 sm:pt-32 md:pt-36 pb-12 sm:pb-14 md:pb-16 px-4 sm:px-5 md:px-6 bg-gradient-to-br from-purple-100 via-indigo-100 to-blue-100 dark:from-purple-950 dark:via-indigo-950 dark:to-blue-950 relative"
      aria-busy="true"
      aria-label="Loading blog post"
    >
      <div className="fixed top-[4.5rem] sm:top-24 left-3 sm:left-4 md:left-6 z-50">
        <Sk className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10 pt-6 sm:pt-8 md:pt-10">
        <div className="flex flex-col gap-4 sm:gap-5 min-[1020px]:grid min-[1020px]:grid-cols-[minmax(0,1fr)_260px] min-[1020px]:gap-6">
          <div className="min-w-0 ml-11 sm:ml-12 md:ml-0">
            <Sk className="h-2.5 sm:h-3 w-full rounded-full mb-4 md:mb-6" />
            <Sk className="h-8 sm:h-9 md:h-10 w-full max-w-2xl mb-4" />
            <Sk className="h-8 sm:h-9 md:h-10 w-4/5 max-w-xl mb-4" />
            <div className="flex flex-wrap gap-2 mb-4">
              <Sk className="h-4 w-24 rounded-full" />
              <Sk className="h-4 w-20 rounded-full" />
              <Sk className="h-4 w-16 rounded-full" />
            </div>
            <div className="flex flex-wrap gap-2 mb-6">
              <Sk className="h-6 w-16 rounded-md" />
              <Sk className="h-6 w-20 rounded-md" />
              <Sk className="h-6 w-14 rounded-md" />
            </div>

            <div className="rounded-xl border-3 md:border-4 border-black/20 bg-white/80 dark:bg-gray-900/80 p-4 sm:p-6 md:p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)] space-y-3">
              <Sk className="h-4 w-full" />
              <Sk className="h-4 w-full" />
              <Sk className="h-4 w-11/12" />
              <Sk className="h-4 w-full" />
              <Sk className="h-4 w-10/12" />
              <Sk className="h-32 w-full rounded-lg my-4" />
              <Sk className="h-4 w-full" />
              <Sk className="h-4 w-9/12" />
              <Sk className="h-4 w-full" />
              <Sk className="h-4 w-4/5" />
            </div>

            <div className="mt-8 space-y-4">
              <Sk className="h-7 w-48" />
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <Sk className="h-36 w-full rounded-xl" />
                <Sk className="h-36 w-full rounded-xl hidden sm:block" />
                <Sk className="h-36 w-full rounded-xl hidden md:block" />
              </div>
            </div>
          </div>

          <aside className="hidden min-[1020px]:block w-[260px] space-y-4">
            <div className="rounded-xl border-3 border-black/20 bg-white/80 dark:bg-gray-900/80 p-4 space-y-3">
              <Sk className="h-6 w-28" />
              <Sk className="h-12 w-full rounded-lg" />
              <Sk className="h-12 w-full rounded-lg" />
              <Sk className="h-12 w-full rounded-lg" />
            </div>
            <div className="rounded-xl border-3 border-black/20 bg-white/80 dark:bg-gray-900/80 p-4 space-y-3">
              <Sk className="h-6 w-32" />
              <Sk className="h-10 w-full rounded-lg" />
              <Sk className="h-10 w-full rounded-lg" />
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
