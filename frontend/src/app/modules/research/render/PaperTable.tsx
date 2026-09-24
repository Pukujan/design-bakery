import { Children, isValidElement, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

/** Tables longer than this collapse to PREVIEW_ROWS with a "Show all" button,
 *  unless they already sit inside a collapsed <details> block. */
const COLLAPSE_ABOVE = 10;
const PREVIEW_ROWS = 8; // keep in sync with `tr:nth-child(n + 9)` in globals.css

type HastNode = { type: string; tagName?: string; children?: HastNode[] };

function countBodyRows(node: HastNode | undefined): number {
  const tbody = node?.children?.find((child) => child.tagName === 'tbody');
  return tbody?.children?.filter((child) => child.tagName === 'tr').length ?? 0;
}

/**
 * Research tables: booktabs rules, tabular numbers, a sticky header and first
 * column inside their own scroll box, and a right-edge fade while more columns
 * are hidden. The wrapper scrolls; never overflow-x:hidden (clips columns).
 */
export function PaperTable({ node, children, ...props }: { node?: HastNode; children?: ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const rows = countBodyRows(node);
  const [insideDetails, setInsideDetails] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [moreRight, setMoreRight] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useLayoutEffect(() => {
    setInsideDetails(Boolean(scrollRef.current?.closest('details')));
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;
    const update = () => {
      setMoreRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
      setScrolled(el.scrollLeft > 2);
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      observer.disconnect();
    };
  }, [expanded]);

  const collapsible = rows > COLLAPSE_ABOVE && rows > PREVIEW_ROWS && !insideDetails;
  const collapsed = collapsible && !expanded;

  return (
    <div className="rp-table my-5" data-more-right={moreRight || undefined} data-scrolled={scrolled || undefined}>
      <div
        ref={scrollRef}
        className="rp-table-scroll"
        data-collapsed={collapsed || undefined}
        tabIndex={0}
        role="region"
        aria-label="Table (scrolls horizontally)"
      >
        <table {...props}>{children}</table>
      </div>
      {collapsible ? (
        <button type="button" className="rp-table-toggle" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}>
          {expanded ? 'Show fewer rows' : `Show all ${rows} rows`}
        </button>
      ) : null}
    </div>
  );
}

const CI = /^(.*\S)\s+(\([^()]*\d[–-]\d[^()]*\))$/;

/** Split "99.21% (98.3–99.6)" into the value and a smaller muted interval. */
export function withMutedInterval(children: ReactNode): ReactNode {
  return Children.map(children, (child) => {
    if (typeof child !== 'string') return child;
    const match = CI.exec(child);
    if (!match) return child;
    return (
      <>
        {match[1]} <span className="rp-ci">{match[2]}</span>
      </>
    );
  });
}

export function PaperCell({ node: _node, children, ...props }: { node?: unknown; children?: ReactNode }) {
  return <td {...props}>{withMutedInterval(children)}</td>;
}

export function isElementOfType(child: ReactNode, type: unknown): boolean {
  return isValidElement(child) && child.type === type;
}
