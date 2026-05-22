/**
 * Blog Mermaid render + scroll viewport + zoom controls.
 * guidelines/agent-devlog-mermaid.md
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
const ZOOM_MIN = 0.75;
const ZOOM_MAX = 3;
const ZOOM_STEP_BUTTON = 0.25;
const ZOOM_STEP_SLIDER = 0.05;
const TRACKPAD_ZOOM_STEP = 0.08;
const WHEEL_SNAP_MS = 150;
const SCROLL_EDGE_TOLERANCE_PX = 2;

type ChartSize = { width: number; height: number };
type PointerPoint = { x: number; y: number };

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getSvg(container: HTMLElement | null): SVGSVGElement | null {
  return container?.querySelector('svg') ?? null;
}

function measureSvgSize(svg: SVGSVGElement): ChartSize {
  return {
    width: svg.scrollWidth || 1,
    height: svg.scrollHeight || 1,
  };
}

function pointerDistance(a: PointerPoint, b: PointerPoint): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function isAtScrollEdge(viewport: HTMLElement) {
  const t = SCROLL_EDGE_TOLERANCE_PX;
  return {
    atTop: viewport.scrollTop <= t,
    atBottom: viewport.scrollTop + viewport.clientHeight >= viewport.scrollHeight - t,
    atLeft: viewport.scrollLeft <= t,
    atRight: viewport.scrollLeft + viewport.clientWidth >= viewport.scrollWidth - t,
  };
}

function chartNeedsScroll(
  viewport: HTMLElement,
  baseSize: ChartSize,
  zoom: number,
): boolean {
  if (zoom > 1) return true;
  const tall = baseSize.height > TALL_THRESHOLD_PX;
  const wide = baseSize.width > viewport.clientWidth + WIDTH_SLOP_PX;
  return tall || wide;
}

export function MermaidDiagram({ chart }: { chart: string }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [error, setError] = useState<string | null>(null);
  const [chartSize, setChartSize] = useState<ChartSize>({ width: 0, height: 0 });
  const [isScrollable, setIsScrollable] = useState(false);
  const [zoom, setZoom] = useState(1);

  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const errorRef = useRef(error);
  errorRef.current = error;

  const pointersRef = useRef<Map<number, PointerPoint>>(new Map());
  const pinchStartRef = useRef<{ distance: number; zoom: number } | null>(null);
  const wheelSnapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const useScrollFrameRef = useRef(false);

  const applyZoom = useCallback((next: number, snapToSliderStep: boolean) => {
    const clamped = clamp(next, ZOOM_MIN, ZOOM_MAX);
    const value = snapToSliderStep
      ? clamp(Math.round(clamped / ZOOM_STEP_SLIDER) * ZOOM_STEP_SLIDER, ZOOM_MIN, ZOOM_MAX)
      : clamped;
    setZoom(value);
  }, []);

  const applyZoomRef = useRef(applyZoom);
  applyZoomRef.current = applyZoom;

  /** Layout measurement only — must not be a dependency of the mermaid render effect. */
  const measureChart = useCallback(() => {
    const viewport = viewportRef.current;
    const svg = getSvg(containerRef.current);
    if (!viewport || !svg || viewport.clientWidth === 0) {
      return;
    }
    const size = measureSvgSize(svg);
    setChartSize(size);
    setIsScrollable(chartNeedsScroll(viewport, size, zoomRef.current));
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
        setZoom(1);
        requestAnimationFrame(() => {
          if (!cancelled) measureChart();
        });
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to render diagram');
        }
      }
    };

    setChartSize({ width: 0, height: 0 });
    setIsScrollable(false);
    void renderChart();

    return () => {
      cancelled = true;
      el.innerHTML = '';
    };
  }, [chart, measureChart]);

  useEffect(() => {
    measureChart();
  }, [zoom, measureChart]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const observer = new ResizeObserver(() => measureChart());
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [measureChart]);

  /** Ctrl/Cmd+scroll = zoom; at scroll edge, extra wheel moves the page. */
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const onWheel = (event: WheelEvent) => {
      if (errorRef.current) return;

      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        const delta = event.deltaY > 0 ? -TRACKPAD_ZOOM_STEP : TRACKPAD_ZOOM_STEP;
        applyZoomRef.current(zoomRef.current + delta, false);

        if (wheelSnapTimerRef.current) clearTimeout(wheelSnapTimerRef.current);
        wheelSnapTimerRef.current = setTimeout(() => {
          applyZoomRef.current(zoomRef.current, true);
          wheelSnapTimerRef.current = null;
        }, WHEEL_SNAP_MS);
        return;
      }

      if (!useScrollFrameRef.current) return;

      const { atTop, atBottom, atLeft, atRight } = isAtScrollEdge(viewport);
      const { deltaY, deltaX } = event;

      const chainToPage =
        (deltaY > 0 && atBottom) ||
        (deltaY < 0 && atTop) ||
        (deltaX > 0 && atRight) ||
        (deltaX < 0 && atLeft);

      if (chainToPage) {
        event.preventDefault();
        window.scrollBy({ top: deltaY, left: deltaX, behavior: 'auto' });
      }
    };

    viewport.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      viewport.removeEventListener('wheel', onWheel);
      if (wheelSnapTimerRef.current) clearTimeout(wheelSnapTimerRef.current);
    };
  }, []);

  const setZoomClamped = (next: number) => applyZoom(next, true);

  const getLocalPoint = (event: React.PointerEvent): PointerPoint => ({
    x: event.clientX,
    y: event.clientY,
  });

  const handleViewportPointerDown = (event: React.PointerEvent) => {
    if (error) return;
    pointersRef.current.set(event.pointerId, getLocalPoint(event));

    if (pointersRef.current.size === 2) {
      const pts = [...pointersRef.current.values()];
      pinchStartRef.current = {
        distance: Math.max(pointerDistance(pts[0], pts[1]), 1),
        zoom: zoomRef.current,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  };

  const handleViewportPointerMove = (event: React.PointerEvent) => {
    if (error || !pointersRef.current.has(event.pointerId)) return;

    pointersRef.current.set(event.pointerId, getLocalPoint(event));

    if (pointersRef.current.size >= 2 && pinchStartRef.current) {
      event.preventDefault();
      const pts = [...pointersRef.current.values()].slice(0, 2);
      const dist = Math.max(pointerDistance(pts[0], pts[1]), 1);
      const ratio = dist / pinchStartRef.current.distance;
      applyZoom(pinchStartRef.current.zoom * ratio, false);
    }
  };

  const handleViewportPointerUp = (event: React.PointerEvent) => {
    pointersRef.current.delete(event.pointerId);

    if (pointersRef.current.size < 2) {
      if (pinchStartRef.current) {
        applyZoom(zoomRef.current, true);
      }
      pinchStartRef.current = null;
    } else if (pointersRef.current.size === 2) {
      const pts = [...pointersRef.current.values()];
      pinchStartRef.current = {
        distance: Math.max(pointerDistance(pts[0], pts[1]), 1),
        zoom: zoomRef.current,
      };
    }
  };

  const zoomOut = () => setZoomClamped(zoom - ZOOM_STEP_BUTTON);
  const zoomIn = () => setZoomClamped(zoom + ZOOM_STEP_BUTTON);

  const zoomPercent = Math.round(zoom * 100);
  const useScrollFrame = isScrollable || zoom > 1;
  useScrollFrameRef.current = useScrollFrame;
  const scaledWidth = chartSize.width * zoom;
  const scaledHeight = chartSize.height * zoom;

  const hintText = useScrollFrame
    ? 'Pinch or Ctrl/⌘+scroll to zoom · scroll inside the frame · at the edge, keep scrolling to move the page'
    : 'Pinch or Ctrl/⌘+scroll to zoom · or use +/− and the slider';

  return (
    <div
      className={CHART_SHELL_CLASS}
      role="group"
      aria-label="Diagram with zoom and scroll controls"
    >
      <div className="blog-mermaid-toolbar">
        <div className="blog-mermaid-toolbar__buttons">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="blog-mermaid-toolbar__btn"
            onClick={zoomOut}
            disabled={zoom <= ZOOM_MIN || Boolean(error)}
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4" aria-hidden />
          </Button>
          <span className="blog-mermaid-toolbar__label" aria-live="polite">
            {zoomPercent}%
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="blog-mermaid-toolbar__btn"
            onClick={zoomIn}
            disabled={zoom >= ZOOM_MAX || Boolean(error)}
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" aria-hidden />
          </Button>
        </div>
        <label className="blog-mermaid-toolbar__slider-wrap">
          <span className="sr-only">Diagram zoom level</span>
          <input
            type="range"
            className="blog-mermaid-toolbar__slider"
            min={ZOOM_MIN * 100}
            max={ZOOM_MAX * 100}
            step={ZOOM_STEP_SLIDER * 100}
            value={zoomPercent}
            disabled={Boolean(error)}
            onChange={(e) => setZoomClamped(Number(e.target.value) / 100)}
            aria-valuemin={ZOOM_MIN * 100}
            aria-valuemax={ZOOM_MAX * 100}
            aria-valuenow={zoomPercent}
            aria-valuetext={`${zoomPercent} percent`}
          />
        </label>
      </div>

      <div
        ref={viewportRef}
        className={`blog-mermaid-viewport blog-mermaid-viewport--gesture${useScrollFrame ? ' blog-mermaid-viewport--scroll' : ''}`}
        onPointerDown={handleViewportPointerDown}
        onPointerMove={handleViewportPointerMove}
        onPointerUp={handleViewportPointerUp}
        onPointerCancel={handleViewportPointerUp}
      >
        <div
          className="blog-mermaid-zoom-spacer"
          style={{
            width: scaledWidth > 0 ? scaledWidth : undefined,
            height: scaledHeight > 0 ? scaledHeight : undefined,
          }}
        >
          <div
            className="blog-mermaid-zoom-layer"
            style={{
              width: chartSize.width > 0 ? chartSize.width : undefined,
              height: chartSize.height > 0 ? chartSize.height : undefined,
              transform: `scale(${zoom})`,
            }}
          >
            <div ref={containerRef} className="blog-mermaid-svg-host" role="img" aria-label="Diagram" />
          </div>
        </div>
      </div>

      {!error ? <p className="blog-mermaid-hint">{hintText}</p> : null}

      {error ? <p className="text-red-600 dark:text-red-400 text-sm font-medium mt-2">{error}</p> : null}
    </div>
  );
}
