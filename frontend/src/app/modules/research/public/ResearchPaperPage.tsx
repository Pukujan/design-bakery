import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { MermaidDiagram } from '@/modules/blog/render/MermaidDiagram';
import { getResearchPaper } from '../data/researchPapers';

/** Markdown renderer: prose styles the prose; we only intercept fenced code
 *  (mermaid → diagram, other → styled block) and keep inline code compact. */
const markdownComponents = {
  pre({ children }: any) {
    // Let the `code` component own block rendering so mermaid isn't wrapped in <pre>.
    return <>{children}</>;
  },
  code({ className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || '');
    const text = String(children).replace(/\n$/, '');
    if (match?.[1] === 'mermaid') {
      return <MermaidDiagram chart={text} />;
    }
    if (match) {
      return (
        <pre className="not-prose my-4 overflow-x-auto rounded-md border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 p-4 text-[12.5px] leading-relaxed font-mono">
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      );
    }
    return (
      <code
        className="rounded bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 text-[0.85em] font-mono break-words"
        {...props}
      >
        {children}
      </code>
    );
  },
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'pending · not owner-approved',
  approved: 'approved',
};

/** The page header already renders the title; strip a leading `# <title>` line from
 *  the markdown body so it isn't shown twice. Only strips an exact-title H1. */
function stripLeadingTitle(md: string, title: string): string {
  const nl = md.indexOf('\n');
  const firstLine = (nl === -1 ? md : md.slice(0, nl)).trim();
  if (firstLine === `# ${title}` || firstLine === `#${title}`) {
    return md.slice(nl === -1 ? md.length : nl + 1).replace(/^\s+/, '');
  }
  return md;
}

export function ResearchPaperPage() {
  const { paperId } = useParams<{ paperId: string }>();
  const paper = paperId ? getResearchPaper(paperId) : undefined;
  const [showBib, setShowBib] = useState(false);

  useEffect(() => {
    if (paper) document.title = `${paper.id} · ${paper.title}`;
    window.scrollTo({ top: 0 });
  }, [paper]);

  if (!paper) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f6f2] dark:bg-[#12141a] px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-neutral-900 dark:text-neutral-100">Paper not found</h1>
          <Link to="/research" className="text-blue-700 dark:text-blue-400 underline underline-offset-2">
            ← Back to research index
          </Link>
        </div>
      </div>
    );
  }

  return (
    <article className="min-h-screen bg-[#f7f6f2] dark:bg-[#12141a] text-neutral-900 dark:text-neutral-100">
      <div className="mx-auto max-w-3xl px-5 sm:px-6 pt-10 pb-24">
        <Link
          to="/research"
          className="inline-flex items-center gap-1.5 text-sm text-blue-700 dark:text-blue-400 hover:underline underline-offset-2 mb-7"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden />
          Research index
        </Link>

        <span className="inline-block rounded-full bg-neutral-200 dark:bg-neutral-800 px-3 py-0.5 font-mono text-[11px] uppercase tracking-wide text-amber-700 dark:text-amber-500">
          {STATUS_LABEL[paper.status] ?? paper.status}
        </span>

        <h1 className="mt-3 text-2xl sm:text-3xl font-bold leading-tight tracking-tight text-balance">
          {paper.title}
        </h1>
        <p className="mt-2 text-neutral-500 dark:text-neutral-400">{paper.authors.join(' · ')}</p>
        <p className="mt-1 font-mono text-[12px] text-neutral-500 dark:text-neutral-400 break-words">
          {paper.id} · submitted {paper.submitted} · status {paper.status}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {paper.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-neutral-300 dark:border-neutral-700 px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wide text-neutral-600 dark:text-neutral-400"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="research-paper mt-8">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={markdownComponents}
          >
            {stripLeadingTitle(paper.content, paper.title)}
          </ReactMarkdown>
        </div>

        {paper.bibtex ? (
          <div className="mt-10 border-t border-neutral-300 dark:border-neutral-700 pt-5">
            <button
              type="button"
              onClick={() => setShowBib((v) => !v)}
              className="font-mono text-[13px] text-blue-700 dark:text-blue-400 hover:underline underline-offset-2"
            >
              {showBib ? 'Hide' : 'Show'} BibTeX
            </button>
            {showBib ? (
              <pre className="mt-3 overflow-x-auto rounded-md border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 p-4 text-[12px] leading-relaxed font-mono">
                <code>{paper.bibtex}</code>
              </pre>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
