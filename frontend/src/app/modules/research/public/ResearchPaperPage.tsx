import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, RotateCcw, X, ZoomIn, ZoomOut } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { MermaidDiagram } from '@/modules/blog/render/MermaidDiagram';
import { getResearchPaper } from '../data/researchPapers';

/** Markdown renderer: prose styles the prose; we only intercept fenced code
 *  (mermaid → diagram, other → styled block) and keep inline code compact.
 *  Exported so the supporting-source page renders identically. */
export const markdownComponents = {
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
  /** Wrap every table so a wide one scrolls inside its own box rather than
   *  pushing the page sideways at 390px. Never overflow-x:hidden, that clips
   *  a column instead of letting the reader reach it. */
  table({ children, ...props }: any) {
    return (
      <div className="rp-table-scroll my-5">
        <table {...props}>{children}</table>
      </div>
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
  const [activeFigure, setActiveFigure] = useState<{ src: string; alt: string } | null>(null);
  const [figureZoom, setFigureZoom] = useState(1);
  const closeFigureButtonRef = useRef<HTMLButtonElement>(null);
  const figureDialogPanelRef = useRef<HTMLDivElement>(null);
  const paperMarkdownComponents = useMemo(
    () => ({
      ...markdownComponents,
      img({ src, alt, ...props }: any) {
        if (!src) return null;
        const label = alt || 'Research figure';
        return (
          <button
            type="button"
            className="research-figure-trigger"
            aria-label={`Open figure: ${label}`}
            onClick={() => {
              setActiveFigure({ src, alt: label });
              setFigureZoom(1);
            }}
          >
            <img {...props} src={src} alt={label} />
          </button>
        );
      },
    }),
    [setActiveFigure, setFigureZoom],
  );

  useEffect(() => {
    if (paper) document.title = `${paper.id} · ${paper.title}`;
    window.scrollTo({ top: 0 });
  }, [paper]);

  useEffect(() => {
    if (!activeFigure) return undefined;

    const previousOverflow = document.body.style.overflow;
    const previousActiveElement = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    closeFigureButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveFigure(null);
      if (event.key === 'Tab') {
        const focusableElements = figureDialogPanelRef.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
        );
        const firstElement = focusableElements?.[0];
        const lastElement = focusableElements?.[focusableElements.length - 1];
        if (!firstElement || !lastElement) {
          event.preventDefault();
        } else if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
      if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        setFigureZoom((value) => Math.min(3, Number((value + 0.25).toFixed(2))));
      }
      if (event.key === '-') {
        event.preventDefault();
        setFigureZoom((value) => Math.max(1, Number((value - 0.25).toFixed(2))));
      }
      if (event.key === '0') setFigureZoom(1);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousActiveElement?.focus();
    };
  }, [activeFigure]);

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
      <div className="mx-auto min-w-0 max-w-3xl px-5 sm:px-6 pt-10 pb-24">
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

        <div className="research-paper mt-8 min-w-0">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={paperMarkdownComponents}
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

      {activeFigure ? (
        <div
          className="research-figure-dialog"
          role="dialog"
          aria-modal="true"
          aria-label={`Enlarged figure: ${activeFigure.alt}`}
          onClick={() => setActiveFigure(null)}
        >
          <div
            ref={figureDialogPanelRef}
            className="research-figure-dialog-panel"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="research-figure-dialog-toolbar">
              <p className="research-figure-dialog-title">{activeFigure.alt}</p>
              <div className="research-figure-dialog-controls">
                <button
                  type="button"
                  className="research-figure-dialog-button"
                  onClick={() => setFigureZoom((value) => Math.max(1, Number((value - 0.25).toFixed(2))))}
                  disabled={figureZoom <= 1}
                  aria-label="Zoom out"
                  title="Zoom out"
                >
                  <ZoomOut aria-hidden />
                </button>
                <button
                  type="button"
                  className="research-figure-dialog-zoom"
                  onClick={() => setFigureZoom(1)}
                  aria-label="Reset zoom"
                  title="Reset zoom"
                >
                  {Math.round(figureZoom * 100)}%
                </button>
                <button
                  type="button"
                  className="research-figure-dialog-button"
                  onClick={() => setFigureZoom((value) => Math.min(3, Number((value + 0.25).toFixed(2))))}
                  disabled={figureZoom >= 3}
                  aria-label="Zoom in"
                  title="Zoom in"
                >
                  <ZoomIn aria-hidden />
                </button>
                <button
                  type="button"
                  className="research-figure-dialog-button"
                  onClick={() => setFigureZoom(1)}
                  aria-label="Reset zoom"
                  title="Reset zoom"
                >
                  <RotateCcw aria-hidden />
                </button>
                <button
                  ref={closeFigureButtonRef}
                  type="button"
                  className="research-figure-dialog-button"
                  onClick={() => setActiveFigure(null)}
                  aria-label="Close figure viewer"
                  title="Close"
                >
                  <X aria-hidden />
                </button>
              </div>
            </div>
            <div className="research-figure-dialog-stage">
              <img
                src={activeFigure.src}
                alt={activeFigure.alt}
                className="research-figure-dialog-image"
                style={{ width: `${figureZoom * 100}%` }}
              />
            </div>
            <p className="research-figure-dialog-hint">
              Use the controls or +/− keys to inspect the figure. Press Escape or click outside to close.
            </p>
          </div>
        </div>
      ) : null}
    </article>
  );
}
