import { useEffect, useState } from 'react';
import type { RefObject } from 'react';
import { List, X } from 'lucide-react';

export interface TocEntry {
  id: string;
  text: string;
  level: 2 | 3;
}

/** Stable, readable heading ids ("4. What we found" → "what-we-found"). */
export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/^(\d+|[a-z])\.\s+/, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-') || 'section'
  );
}

/** Collect h2/h3 from the rendered paper body (outside collapsed <details>). */
export function useTocEntries(bodyRef: RefObject<HTMLElement>, key: unknown): TocEntry[] {
  const [entries, setEntries] = useState<TocEntry[]>([]);
  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    const headings = Array.from(body.querySelectorAll<HTMLHeadingElement>('h2[id], h3[id]')).filter(
      (heading) => !heading.closest('details') && heading.offsetParent !== null,
    );
    setEntries(
      headings.map((heading) => ({
        id: heading.id,
        text: heading.dataset.tocLabel || heading.textContent || '',
        level: heading.tagName === 'H2' ? 2 : 3,
      })),
    );
  }, [bodyRef, key]);
  return entries;
}

/** The heading currently being read: the last one above ~a third of the viewport. */
export function useActiveHeading(entries: TocEntry[]): string | null {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    if (!entries.length) return undefined;
    const elements = entries
      .map((entry) => document.getElementById(entry.id))
      .filter((element): element is HTMLElement => Boolean(element));
    const compute = () => {
      const line = window.innerHeight * 0.35 + 4;
      let current: string | null = null;
      for (const element of elements) {
        if (element.getBoundingClientRect().top <= line) current = element.id;
      }
      setActive(current ?? elements[0]?.id ?? null);
    };
    // Headings crossing the band near the top of the viewport trigger a recompute.
    const observer = new IntersectionObserver(compute, { rootMargin: '0px 0px -65% 0px', threshold: [0, 1] });
    elements.forEach((element) => observer.observe(element));
    compute();
    return () => observer.disconnect();
  }, [entries]);
  return active;
}

function TocList({ entries, active, onNavigate }: { entries: TocEntry[]; active: string | null; onNavigate?: () => void }) {
  return (
    <ol className="rp-toc-list">
      {entries.map((entry) => (
        <li key={entry.id} className={`rp-toc-item rp-toc-level-${entry.level}`}>
          <a
            href={`#${entry.id}`}
            aria-current={active === entry.id ? 'location' : undefined}
            onClick={(event) => {
              event.preventDefault();
              document.getElementById(entry.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              history.replaceState(null, '', `#${entry.id}`);
              onNavigate?.();
            }}
          >
            {entry.text}
          </a>
        </li>
      ))}
    </ol>
  );
}

/** Sticky left rail on wide screens. */
export function PaperTocRail({ entries, active }: { entries: TocEntry[]; active: string | null }) {
  if (!entries.length) return null;
  return (
    <nav className="rp-toc-rail" aria-label="Contents">
      <p className="rp-toc-title">Contents</p>
      <TocList entries={entries} active={active} />
    </nav>
  );
}

/** Floating "Contents" button with a sheet on narrower screens. */
export function PaperTocSheet({ entries, active }: { entries: TocEntry[]; active: string | null }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  if (!entries.length) return null;
  return (
    <div className="rp-toc-mobile">
      <button type="button" className="rp-toc-button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        {open ? <X aria-hidden /> : <List aria-hidden />}
        Contents
      </button>
      {open ? (
        <>
          <div className="rp-toc-backdrop" onClick={() => setOpen(false)} aria-hidden />
          <nav className="rp-toc-sheet" aria-label="Contents">
            <TocList entries={entries} active={active} onNavigate={() => setOpen(false)} />
          </nav>
        </>
      ) : null}
    </div>
  );
}

/** Thin reading-progress bar pinned to the top of the viewport. */
export function ReadingProgress({ targetRef }: { targetRef: RefObject<HTMLElement> }) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const update = () => {
      const target = targetRef.current;
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      setProgress(total <= 0 ? 1 : Math.min(1, Math.max(0, -rect.top / total)));
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [targetRef]);
  return (
    <div className="rp-progress" aria-hidden>
      <div className="rp-progress-bar" style={{ transform: `scaleX(${progress})` }} />
    </div>
  );
}
