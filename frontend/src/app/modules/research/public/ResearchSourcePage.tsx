import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { getResearchSource } from '../data/researchPapers';
import { markdownComponents } from './ResearchPaperPage';

const KIND_LABEL: Record<string, string> = {
  'landscape-note': 'supporting source · landscape note',
  survey: 'supporting source · survey',
};

/**
 * Renders a supporting source (a working landscape/survey note that papers
 * cite). Deliberately styled and labelled as NOT a paper: no authors line, no
 * status badge, and an explicit banner saying it is working material.
 */
export function ResearchSourcePage() {
  const { sourceId } = useParams<{ sourceId: string }>();
  const source = sourceId ? getResearchSource(sourceId) : undefined;

  useEffect(() => {
    if (source) document.title = `${source.title} · Design Bakery Research`;
    window.scrollTo({ top: 0 });
  }, [source]);

  if (!source) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f6f2] dark:bg-[#12141a] px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-neutral-900 dark:text-neutral-100">Source not found</h1>
          <Link to="/research" className="text-blue-700 dark:text-blue-400 underline underline-offset-2">
            ← Back to research index
          </Link>
        </div>
      </div>
    );
  }

  return (
    <article className="min-h-screen bg-[#f7f6f2] dark:bg-[#12141a] text-neutral-900 dark:text-neutral-100">
      <div className="mx-auto min-w-0 max-w-3xl px-5 sm:px-6 pt-10 pb-24">
        <Link
          to="/research"
          className="inline-flex items-center gap-1.5 text-sm text-blue-700 dark:text-blue-400 hover:underline underline-offset-2 mb-7"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden />
          Research index
        </Link>

        <span className="inline-block rounded-full bg-neutral-200 dark:bg-neutral-800 px-3 py-0.5 font-mono text-[11px] uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
          {KIND_LABEL[source.kind] ?? source.kind}
        </span>

        <h1 className="mt-3 text-2xl sm:text-3xl font-bold leading-tight tracking-tight text-balance">
          {source.title}
        </h1>
        <p className="mt-1 font-mono text-[12px] text-neutral-500 dark:text-neutral-400 break-words">
          compiled {source.compiled}
        </p>

        <div className="mt-5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#1a1d26] p-4 text-sm text-neutral-600 dark:text-neutral-400">
          <strong className="text-neutral-800 dark:text-neutral-200">Supporting material, not a paper.</strong>{' '}
          This is a working research note compiled while drafting, published so that the citations
          pointing at it resolve to something readable. It has not been through the paper write-up or
          owner-approval process and should not be read as a finding.
        </div>

        <div className="research-paper mt-8 min-w-0">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={markdownComponents}
          >
            {source.content}
          </ReactMarkdown>
        </div>
      </div>
    </article>
  );
}
