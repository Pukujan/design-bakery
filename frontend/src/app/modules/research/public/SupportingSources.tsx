import { Link } from 'react-router-dom';
import { RESEARCH_SOURCES } from '../data/researchPapers';

/**
 * Working landscape/survey notes that the papers cite, published so those
 * citations resolve to something a reader can open. Rendered in its own
 * section below the paper list, with its own heading and no approval badge,
 * so a working note is never presented as if it were a paper.
 */
export function SupportingSources() {
  if (RESEARCH_SOURCES.length === 0) return null;

  return (
    <section className="mt-16 min-w-0 border-t border-neutral-300 dark:border-neutral-700 pt-8">
      <h2 className="text-xl font-bold tracking-tight">Supporting sources</h2>
      <p className="mt-2 max-w-prose text-sm text-neutral-600 dark:text-neutral-400">
        Working landscape and survey notes compiled while drafting, published so the citations
        pointing at them resolve to something a reader can open. These are{' '}
        <strong>not papers</strong>: no abstract, no approval status, and not through the write-up
        process.
      </p>

      <ul className="mt-5 divide-y divide-neutral-200 dark:divide-neutral-800">
        {RESEARCH_SOURCES.map((s) => (
          <li key={s.id} className="py-5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-neutral-500 dark:text-neutral-400">
              <span className="rounded-full border border-neutral-300 dark:border-neutral-700 px-2 py-0.5 uppercase tracking-wide">
                {s.kind === 'survey' ? 'survey' : 'landscape note'}
              </span>
              <span>compiled {s.compiled}</span>
            </div>
            <h3 className="mt-2 text-base font-semibold leading-snug">
              <Link
                to={`/research/sources/${s.id}`}
                className="hover:text-blue-700 dark:hover:text-blue-400 hover:underline underline-offset-2"
              >
                {s.title}
              </Link>
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              {s.summary}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
