import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, RotateCcw, X, ZoomIn, ZoomOut } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { MermaidDiagram } from '@/modules/blog/render/MermaidDiagram';
import { getResearchPaper } from '../data/researchPapers';
import { remarkGithubAlerts } from '../render/remarkGithubAlerts';
import { PaperCell, PaperTable, isElementOfType } from '../render/PaperTable';
import { FigureCaption, PaperFigure, figureBase } from '../render/PaperFigure';
import type { OpenFigure } from '../render/PaperFigure';
import { ReadModeToggle, useReadMode } from '../render/ReadMode';
import { PaperTocRail, PaperTocSheet, ReadingProgress, slugify, useActiveHeading, useTocEntries } from '../render/PaperToc';

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
  /** Every table gets its own scroll box (never overflow-x:hidden, which clips a
   *  column), booktabs rules, sticky header/first column and, when long, a
   *  "Show all N rows" toggle. Confidence intervals render smaller and muted. */
  table: PaperTable,
  td: PaperCell,
};

type HastNode = { type: string; tagName?: string; value?: string; properties?: Record<string, unknown>; children?: HastNode[] };

function hastText(node: HastNode | undefined): string {
  if (!node) return '';
  if (node.type === 'text') return node.value ?? '';
  return (node.children ?? []).map(hastText).join('');
}

function findTag(node: HastNode | undefined, tagName: string): HastNode | undefined {
  if (!node) return undefined;
  if (node.tagName === tagName) return node;
  for (const child of node.children ?? []) {
    const found = findTag(child, tagName);
    if (found) return found;
  }
  return undefined;
}

const SECTION_NUMBER = /^((?:Appendix\s+)?[A-Z0-9]{1,2}\.)\s+([\s\S]*)$/;

/** h2/h3 with a stable id (for the contents rail) and the section number as a muted prefix. */
function makeHeading(Tag: 'h2' | 'h3') {
  return function PaperHeading({ node, children, ...props }: { node?: HastNode; children?: ReactNode }) {
    const text = hastText(node).trim();
    const parts = Array.isArray(children) ? children : [children];
    const match = typeof parts[0] === 'string' ? SECTION_NUMBER.exec(parts[0]) : null;
    return (
      <Tag {...props} id={slugify(text)} data-toc-label={text}>
        {match ? (
          <>
            <span className="rp-secnum">{match[1]}</span> {match[2]}
            {parts.slice(1)}
          </>
        ) : (
          children
        )}
      </Tag>
    );
  };
}

const PaperH2 = makeHeading('h2');
const PaperH3 = makeHeading('h3');

const FONT_LINK_ID = 'research-paper-fonts';
const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400&display=swap';

/** Load the paper faces (Source Serif 4, IBM Plex Sans) only on research pages. */
function usePaperFonts() {
  useEffect(() => {
    if (document.getElementById(FONT_LINK_ID)) return;
    const link = document.createElement('link');
    link.id = FONT_LINK_ID;
    link.rel = 'stylesheet';
    link.href = FONT_HREF;
    document.head.appendChild(link);
  }, []);
}

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
  const [activeFigure, setActiveFigure] = useState<OpenFigure | null>(null);
  const [figureZoom, setFigureZoom] = useState(1);
  const closeFigureButtonRef = useRef<HTMLButtonElement>(null);
  const figureDialogPanelRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  usePaperFonts();
  const [readMode, setReadMode] = useReadMode();

  const paperMarkdownComponents = useMemo(() => {
    const openFigure = (figure: OpenFigure) => {
      setActiveFigure(figure);
      setFigureZoom(1);
    };
    return {
      ...markdownComponents,
      h2: PaperH2,
      h3: PaperH3,
      figcaption: FigureCaption,
      /** `<figure data-figure="NAME"><picture>…<img src="….light.wide.svg">` from the
       *  paper becomes a theme- and width-aware PaperFigure. */
      figure({ node, children, ...props }: { node?: HastNode; children?: ReactNode }) {
        const name = node?.properties?.dataFigure;
        const img = findTag(node, 'img');
        const base = figureBase(img?.properties?.src as string | undefined);
        if (typeof name !== 'string' || !base) {
          return <figure {...props}>{children}</figure>;
        }
        const caption = (Array.isArray(children) ? children : [children]).filter((child) =>
          isElementOfType(child, FigureCaption),
        );
        return (
          <PaperFigure
            name={name}
            base={base}
            alt={String(img?.properties?.alt || 'Research figure')}
            caption={caption}
            onOpen={openFigure}
          />
        );
      },
      /** ```chart {"figure": "NAME", "base": "/research/figures/…/NAME", "alt": "…", "caption": "…"}
       *  renders the same PaperFigure (and, later, an interactive renderer). */
      code(props: any) {
        const language = /language-(\w+)/.exec(props.className || '')?.[1];
        if (language === 'chart') {
          try {
            const spec = JSON.parse(String(props.children));
            return (
              <PaperFigure
                name={spec.figure}
                base={spec.base}
                alt={spec.alt || 'Research figure'}
                renderer={spec.renderer}
                caption={spec.caption ? <FigureCaption>{spec.caption}</FigureCaption> : null}
                onOpen={openFigure}
              />
            );
          } catch {
            return markdownComponents.code(props);
          }
        }
        return markdownComponents.code(props);
      },
      img({ src, alt, ...props }: any) {
        if (!src) return null;
        const label = alt || 'Research figure';
        return (
          <button
            type="button"
            className="research-figure-trigger"
            aria-label={`Open figure: ${label}`}
            onClick={() => openFigure({ src, alt: label, theme: 'light' })}
          >
            <img {...props} src={src} alt={label} />
          </button>
        );
      },
    };
  }, []);

  const content = paper ? stripLeadingTitle(paper.content, paper.title) : '';
  const hasDeepDives = content.includes('class="deep-dive"');
  const tocEntries = useTocEntries(bodyRef, `${content}|${readMode}`);
  const activeHeading = useActiveHeading(tocEntries);

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
    <article data-read-mode={readMode} className="rp-page min-h-screen bg-[#f7f6f2] dark:bg-[#12141a] text-neutral-900 dark:text-neutral-100">
      <ReadingProgress targetRef={mainRef} />
      <div className="rp-layout">
        <aside className="rp-layout-toc">
          <PaperTocRail entries={tocEntries} active={activeHeading} />
        </aside>

        <div ref={mainRef} className="rp-layout-main min-w-0">
          <header className="rp-header">
            <Link
              to="/research"
              className="inline-flex items-center gap-1.5 text-sm text-blue-700 dark:text-blue-400 hover:underline underline-offset-2 mb-6"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden />
              Research index
            </Link>

            <div>
              <span className="inline-block rounded-full bg-neutral-200 dark:bg-neutral-800 px-3 py-0.5 font-mono text-[11px] uppercase tracking-wide text-amber-700 dark:text-amber-500">
                {STATUS_LABEL[paper.status] ?? paper.status}
              </span>
            </div>

            <h1 className="rp-title">{paper.title}</h1>
            <p className="rp-byline">{paper.authors.join(' · ')}</p>
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
            {hasDeepDives ? (
              <div className="rp-readmode-row">
                <ReadModeToggle mode={readMode} onChange={setReadMode} />
                <span className="rp-readmode-hint">
                  {readMode === 'quick' ? 'Showing the short version and main findings.' : 'Deep-dive details are collapsed; open any to read more.'}
                </span>
              </div>
            ) : null}
          </header>

          <div ref={bodyRef} className="research-paper rp-body mt-8 min-w-0">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkGithubAlerts]}
              rehypePlugins={[rehypeRaw]}
              components={paperMarkdownComponents}
            >
              {content}
            </ReactMarkdown>
          </div>

          <div className="rp-after">
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
        </div>
      </div>

      <PaperTocSheet entries={tocEntries} active={activeHeading} />

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
            <div className="research-figure-dialog-stage" data-theme={activeFigure.theme}>
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
