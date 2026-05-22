/**
 * Blog Mermaid render + scrollable viewport for large diagrams.
 * guidelines/agent-devlog-mermaid.md
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
});

const CHART_SHELL_CLASS =
  'blog-mermaid-chart my-4 sm:my-5 md:my-6 p-2.5 sm:p-3 md:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg md:rounded-xl border-2 sm:border-2 md:border-3 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] sm:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-xs sm:text-xs md:text-sm';

const TALL_THRESHOLD_PX = 280;
const WIDTH_SLOP_PX = 8;

function getSvg(container: HTMLElement | null): SVGSVGElement | null {
  return container?.querySelector('svg') ?? null;
}

function chartNeedsScroll(viewport: HTMLElement, svg: SVGSVGElement): boolean {
  const rect = svg.getBoundingClientRect();
  const tall = rect.height > TALL_THRESHOLD_PX;
  const wide = svg.scrollWidth > viewport.clientWidth + WIDTH_SLOP_PX;
  return tall || wide;
}

export function MermaidDiagram({ chart }: { chart: string }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [error, setError] = useState<string | null>(null);
  const [isScrollable, setIsScrollable] = useState(false);

  const measureChart = useCallback(() => {
    const viewport = viewportRef.current;
    const svg = getSvg(containerRef.current);
    if (!viewport || !svg || viewport.clientWidth === 0) {
      return;
    }
    setIsScrollable(chartNeedsScroll(viewport, svg));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let cancelled = false;

    const renderChart = async () => {
      try {
        const id = `blog-mmd-${Math.random().toString(36).slice(2, 11)}`;
        const { svg, bindFunctions } = await mermaid.render(id, chart);
        if (cancelled) return;
        el.innerHTML = svg;
        bindFunctions?.(el);
        setError(null);
        requestAnimationFrame(() => {
          if (!cancelled) measureChart();
        });
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to render diagram');
        }
      }
    };

    setIsScrollable(false);
    void renderChart();

    return () => {
      cancelled = true;
      el.innerHTML = '';
    };
  }, [chart, measureChart]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const observer = new ResizeObserver(() => measureChart());
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [measureChart]);

  return (
    <div
      className={CHART_SHELL_CLASS}
      role="group"
      aria-label="Diagram. Scroll inside the frame to explore large charts."
    >
      <div
        ref={viewportRef}
        className={`blog-mermaid-viewport${isScrollable ? ' blog-mermaid-viewport--scroll' : ''}`}
      >
        <div ref={containerRef} className="blog-mermaid-svg-host" role="img" aria-label="Diagram" />
      </div>

      {isScrollable ? (
        <p className="blog-mermaid-hint">Scroll inside the frame to explore</p>
      ) : null}

      {error ? <p className="text-red-600 dark:text-red-400 text-sm font-medium mt-2">{error}</p> : null}
    </div>
  );
}
