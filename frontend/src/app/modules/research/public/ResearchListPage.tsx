import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { RESEARCH_PAPERS, type ResearchStatus } from '../data/researchPapers';

type StatusFilter = 'all' | ResearchStatus;

export function ResearchListPage() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');

  useEffect(() => {
    document.title = 'Research · Design Bakery';
  }, []);

  const papers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return RESEARCH_PAPERS.filter((p) => {
      if (status !== 'all' && p.status !== status) return false;
      if (!q) return true;
      return [p.title, p.abstract, p.id, ...p.tags, ...p.authors]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [query, status]);

  return (
    <main className="min-h-screen bg-[#f7f6f2] dark:bg-[#12141a] text-neutral-900 dark:text-neutral-100">
      <div className="mx-auto max-w-3xl px-5 sm:px-6 pt-12 pb-24">
        <h1 className="text-3xl font-bold tracking-tight">Research</h1>
        <p className="mt-3 max-w-prose text-neutral-600 dark:text-neutral-400">
          Working notes and technical reports in an arXiv-style layout: abstract, citations, methods, and
          benchmarks. Papers appear as <strong>approved</strong> only after owner approval; drafts stay
          marked <span className="font-mono text-[13px]">pending</span> and are not presented as
          established findings.
        </p>

        <div className="mt-6 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#1a1d26] p-4 text-sm text-neutral-600 dark:text-neutral-400">
          <strong className="text-neutral-800 dark:text-neutral-200">Publication gate.</strong> Status{' '}
          <span className="font-mono text-emerald-700 dark:text-emerald-500">approved</span> means the
          owner accepted the write-up and any claimed numbers.{' '}
          <span className="font-mono text-amber-700 dark:text-amber-500">pending</span> means draft or
          awaiting approval, read as provisional. No silent promotion from green tests to product claims.
        </div>

        {/* Controls */}
        <div className="mt-7 flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title, tag, id, author…"
              aria-label="Search papers"
              className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#1a1d26] py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="status" className="text-sm text-neutral-600 dark:text-neutral-400">
              Show
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusFilter)}
              className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#1a1d26] py-2 px-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="all">All</option>
              <option value="approved">Approved only</option>
              <option value="pending">Pending / draft</option>
            </select>
          </div>
        </div>

        <p className="mt-4 font-mono text-[12px] text-neutral-500 dark:text-neutral-400">
          Showing {papers.length} {papers.length === 1 ? 'paper' : 'papers'}
        </p>

        {/* List */}
        <ul className="mt-2 divide-y divide-neutral-200 dark:divide-neutral-800">
          {papers.map((p) => (
            <li key={p.id} className="py-6">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-neutral-500 dark:text-neutral-400">
                <span>{p.id}</span>
                <span>{p.submitted}</span>
                <span
                  className={
                    p.status === 'approved'
                      ? 'rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 uppercase tracking-wide text-emerald-700 dark:text-emerald-400'
                      : 'rounded-full bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 uppercase tracking-wide text-amber-700 dark:text-amber-400'
                  }
                >
                  {p.status}
                </span>
                {p.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-neutral-300 dark:border-neutral-700 px-2 py-0.5 uppercase tracking-wide"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <h2 className="mt-2 text-lg font-bold leading-snug">
                <Link
                  to={`/research/papers/${p.id}`}
                  className="hover:text-blue-700 dark:hover:text-blue-400 hover:underline underline-offset-2"
                >
                  {p.title}
                </Link>
              </h2>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{p.authors.join(', ')}</p>
              <p className="mt-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                {p.abstract}
              </p>
              <Link
                to={`/research/papers/${p.id}`}
                className="mt-2 inline-block text-sm text-blue-700 dark:text-blue-400 hover:underline underline-offset-2"
              >
                Read paper →
              </Link>
            </li>
          ))}
        </ul>

        {papers.length === 0 ? (
          <p className="mt-8 text-neutral-500 dark:text-neutral-400">No papers match this filter.</p>
        ) : null}
      </div>
    </main>
  );
}
