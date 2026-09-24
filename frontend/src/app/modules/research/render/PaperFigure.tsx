import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useDarkMode } from '@/hooks/useDarkMode';
import { FIGURE_RENDERERS } from './figureRenderers';
import type { FigureLayout, FigureTheme } from './figureRenderers';

/** Below this width the tall (phone) variant is used. Matches the paper's <source> media. */
export const TALL_FIGURE_QUERY = '(max-width: 700px)';
const VARIANT_SUFFIX = /\.(light|dark)\.(wide|tall)\.svg$/;

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const sync = () => setMatches(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, [query]);
  return matches;
}

/** `/research/figures/benchmark/x.light.wide.svg` → `/research/figures/benchmark/x`, or null for a plain image. */
export function figureBase(src: string | undefined): string | null {
  return src && VARIANT_SUFFIX.test(src) ? src.replace(VARIANT_SUFFIX, '') : null;
}

export function figureVariant(base: string, theme: FigureTheme, layout: FigureLayout): string {
  return `${base}.${theme}.${layout}.svg`;
}

export interface OpenFigure {
  src: string;
  alt: string;
  theme: FigureTheme;
}

interface PaperFigureProps {
  /** Figure name (the paper's `data-figure`), e.g. `judges_ranked`. */
  name: string;
  /** URL prefix without the variant suffix. */
  base: string;
  alt: string;
  caption?: ReactNode;
  /** Optional renderer override (e.g. from a ```chart fence). */
  renderer?: string;
  onOpen: (figure: OpenFigure) => void;
}

/**
 * One paper figure. Picks the static SVG variant that matches the site theme
 * (`html.dark`, which a <source media> query cannot see) and the viewport width,
 * and opens that same variant in the zoom dialog. Print always gets light/wide.
 * If an interactive renderer is registered for the figure it is mounted instead,
 * with the static SVG kept for print.
 */
export function PaperFigure({ name, base, alt, caption, renderer, onOpen }: PaperFigureProps) {
  const theme: FigureTheme = useDarkMode() ? 'dark' : 'light';
  const layout: FigureLayout = useMediaQuery(TALL_FIGURE_QUERY) ? 'tall' : 'wide';
  const src = figureVariant(base, theme, layout);
  const printSrc = figureVariant(base, 'light', 'wide');
  const Interactive = FIGURE_RENDERERS[renderer ?? name];

  return (
    <figure className="research-figure" data-figure={name} data-theme={theme} data-layout={layout}>
      {Interactive ? (
        <>
          <div className="research-figure-interactive">
            <Interactive name={name} dataUrl={`${base}.data.json`} theme={theme} layout={layout} fallbackSrc={src} alt={alt} />
          </div>
          <img className="research-figure-print" src={printSrc} alt={alt} />
        </>
      ) : (
        <button
          type="button"
          className="research-figure-trigger"
          aria-label={`Open figure: ${alt}`}
          onClick={() => onOpen({ src, alt, theme })}
        >
          <picture>
            <source media="print" srcSet={printSrc} />
            <img src={src} alt={alt} decoding="async" />
          </picture>
        </button>
      )}
      {caption}
    </figure>
  );
}

const CAPTION = /^(Figure\s+[A-Z]?\d+[a-z]?\.)\s+([\s\S]+?[.!?])(?=\s|$)([\s\S]*)$/;

/** "Figure 1. Takeaway sentence. Details…" → muted label, bold takeaway, muted details. */
export function FigureCaption({ node: _node, children, ...props }: { node?: unknown; children?: ReactNode }) {
  const parts = Array.isArray(children) ? children : [children];
  const first = parts[0];
  const match = typeof first === 'string' ? CAPTION.exec(first) : null;
  if (!match) return <figcaption {...props}>{children}</figcaption>;
  return (
    <figcaption {...props}>
      <span className="rp-fig-label">{match[1]}</span> <strong className="rp-fig-takeaway">{match[2]}</strong>
      <span className="rp-fig-detail">
        {match[3]}
        {parts.slice(1)}
      </span>
    </figcaption>
  );
}
