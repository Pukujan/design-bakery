import type { BlogTocEntry } from '@/modules/blog/lib/parseBlogTableOfContents';

type BlogTableOfContentsProps = {
  entries: BlogTocEntry[];
  onNavigate: (hash: string) => void;
};

export function BlogTableOfContents({ entries, onNavigate }: BlogTableOfContentsProps) {
  if (entries.length === 0) return null;

  return (
    <nav
      className="blog-toc-nav my-4 sm:my-5 md:my-6 rounded-lg border-2 border-black bg-indigo-50/60 p-4 sm:p-5 dark:border-gray-700 dark:bg-indigo-950/30"
      aria-label="Table of contents"
    >
      <h2 className="mb-3 text-base font-black text-gray-900 dark:text-gray-100 sm:text-lg">
        Table of Contents
      </h2>
      <ol className="list-decimal space-y-1.5 pl-5 sm:pl-6 md:pl-7 marker:font-bold">
        {entries.map((entry) => (
          <li
            key={entry.href}
            className="pl-1 text-sm leading-relaxed text-gray-900 dark:text-gray-100 sm:text-base"
          >
            <a
              href={entry.href}
              className="font-bold text-blue-600 underline-offset-2 hover:underline dark:text-blue-400"
              onClick={(event) => {
                event.preventDefault();
                onNavigate(entry.href);
              }}
            >
              {entry.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
