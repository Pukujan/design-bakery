import React from "react";
import { caseStudyPages, type CaseStudyPageId } from "./caseStudyData";

type CaseStudyTabNavProps = {
  activePage: CaseStudyPageId;
  onPageChange: (pageId: CaseStudyPageId) => void;
  /** Compact pills for footer row. */
  compact?: boolean;
};

function pageTabClassName(active: boolean, compact: boolean) {
  const size = compact ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";
  if (active) {
    return `${size} oni-nav-active border border-transparent shadow-sm`;
  }
  return `${size} oni-nav-idle oni-border border bg-[color:var(--oni-chip-bg)] hover:bg-[color:var(--oni-nav-idle-hover-bg)] hover:text-[color:var(--oni-nav-idle-hover-text)]`;
}

export function CaseStudyTabNav({ activePage, onPageChange, compact = false }: CaseStudyTabNavProps) {
  return (
    <nav
      className={`oni-page-tab-nav scrollbar-hide flex flex-wrap items-center gap-2 ${compact ? "" : "sm:flex-nowrap sm:overflow-x-auto"}`}
      aria-label="Case study pages"
    >
      {caseStudyPages.map((page) => {
        const active = activePage === page.id;
        return (
          <button
            key={page.id}
            type="button"
            onClick={() => onPageChange(page.id)}
            aria-current={active ? "page" : undefined}
            className={`shrink-0 whitespace-nowrap rounded-full font-black transition ${pageTabClassName(active, compact)}`}
          >
            {page.label}
          </button>
        );
      })}
    </nav>
  );
}

export function CaseStudyPageJump({
  activePage,
  onPageChange,
}: {
  activePage: CaseStudyPageId;
  onPageChange: (pageId: CaseStudyPageId) => void;
}) {
  const index = caseStudyPages.findIndex((page) => page.id === activePage);
  const prev = index > 0 ? caseStudyPages[index - 1] : null;
  const next = index < caseStudyPages.length - 1 ? caseStudyPages[index + 1] : null;

  if (!prev && !next) return null;

  return (
    <nav className="mt-16 flex flex-col gap-3 border-t border-[color:var(--oni-border)] pt-10 sm:flex-row sm:items-center sm:justify-between" aria-label="Continue reading">
      {prev ? (
        <button
          type="button"
          onClick={() => onPageChange(prev.id)}
          className="oni-nav-idle oni-border inline-flex max-w-md flex-col gap-1 rounded-2xl border bg-[color:var(--oni-chip-bg)] px-4 py-3 text-left transition hover:bg-[color:var(--oni-nav-idle-hover-bg)] hover:text-[color:var(--oni-nav-idle-hover-text)]"
        >
          <span className="text-xs font-black uppercase tracking-[0.2em] opacity-80">Previous</span>
          <span className="text-sm font-black">{prev.label}</span>
        </button>
      ) : (
        <span />
      )}
      {next ? (
        <button
          type="button"
          onClick={() => onPageChange(next.id)}
          className="oni-nav-idle oni-border inline-flex max-w-md flex-col gap-1 rounded-2xl border bg-[color:var(--oni-chip-bg)] px-4 py-3 text-left transition hover:bg-[color:var(--oni-nav-idle-hover-bg)] hover:text-[color:var(--oni-nav-idle-hover-text)] sm:ml-auto sm:text-right"
        >
          <span className="text-xs font-black uppercase tracking-[0.2em] opacity-80">Next</span>
          <span className="text-sm font-black">{next.label}</span>
        </button>
      ) : null}
    </nav>
  );
}
