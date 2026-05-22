/**
 * Blog Mermaid render + desktop loupe + touch pan/zoom.
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

const LENS_SIZE = 168;
const LENS_ZOOM = 2.25;
const LENS_OFFSET = 16;
const TALL_THRESHOLD_PX = 280;
const WIDTH_SLOP_PX = 8;
const MIN_SCALE = 1;
const MAX_SCALE = 4;

type TouchView = { x: number; y: number; scale: number };
type PointerPoint = { x: number; y: number };

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function pointerDistance(a: PointerPoint, b: PointerPoint): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function pointerCenter(a: PointerPoint, b: PointerPoint): PointerPoint {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function getSvg(container: HTMLElement | null): SVGSVGElement | null {
  return container?.querySelector('svg') ?? null;
}

function chartNeedsZoom(viewport: HTMLElement, svg: SVGSVGElement): boolean {
  const rect = svg.getBoundingClientRect();
  const tall = rect.height > TALL_THRESHOLD_PX;
  const wide = svg.scrollWidth > viewport.clientWidth + WIDTH_SLOP_PX;
  return tall || wide;
}

/** Map cursor position to intrinsic SVG coordinates (for loupe alignment). */
function clientToSvgCoords(svg: SVGSVGElement, clientX: number, clientY: number): PointerPoint {
  const rect = svg.getBoundingClientRect();
  const rw = rect.width > 0 ? rect.width : 1;
  const rh = rect.height > 0 ? rect.height : 1;
  const viewBox = svg.viewBox?.baseVal;
  const intrinsicW = viewBox?.width || svg.scrollWidth || rw;
  const intrinsicH = viewBox?.height || svg.scrollHeight || rh;
  return {
    x: ((clientX - rect.left) / rw) * intrinsicW,
    y: ((clientY - rect.top) / rh) * intrinsicH,
  };
}

export function MermaidDiagram({ chart }: { chart: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const loupeInnerRef = useRef<HTMLDivElement>(null);

  const [error, setError] = useState<string | null>(null);
  const [needsZoom, setNeedsZoom] = useState(false);
  const [finePointer, setFinePointer] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  const [loupeVisible, setLoupeVisible] = useState(false);
  const [loupePos, setLoupePos] = useState({ x: 0, y: 0 });
  const [loupeTransform, setLoupeTransform] = useState('');

  const [touchView, setTouchView] = useState<TouchView>({ x: 0, y: 0, scale: 1 });
  const [showTouchHint, setShowTouchHint] = useState(false);

  const touchViewRef = useRef(touchView);
  touchViewRef.current = touchView;

  const finePointerRef = useRef(finePointer);
  finePointerRef.current = finePointer;

  const pointersRef = useRef<Map<number, PointerPoint>>(new Map());
  const panStartRef = useRef<{ pointerX: number; pointerY: number; viewX: number; viewY: number } | null>(
    null,
  );
  const pinchStartRef = useRef<{
    distance: number;
    scale: number;
    center: PointerPoint;
    viewX: number;
    viewY: number;
  } | null>(null);

  useEffect(() => {
    const fineMq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const motionMq = window.matchMedia('(prefers-reduced-motion: reduce)');

    const updateFine = () => setFinePointer(fineMq.matches);
    const updateMotion = () => setReducedMotion(motionMq.matches);

    updateFine();
    updateMotion();
    fineMq.addEventListener('change', updateFine);
    motionMq.addEventListener('change', updateMotion);
    return () => {
      fineMq.removeEventListener('change', updateFine);
      motionMq.removeEventListener('change', updateMotion);
    };
  }, []);

  const measureChart = useCallback(() => {
    const viewport = viewportRef.current;
    const svg = getSvg(containerRef.current);
    if (!viewport || !svg || viewport.clientWidth === 0) {
      return;
    }
    const zoom = chartNeedsZoom(viewport, svg);
    setNeedsZoom(zoom);
    if (zoom && !finePointerRef.current) {
      setShowTouchHint(true);
    }
  }, []);

  const syncLoupeClone = useCallback(() => {
    const svg = getSvg(containerRef.current);
    const loupeInner = loupeInnerRef.current;
    if (!svg || !loupeInner) return;
    loupeInner.innerHTML = '';
    loupeInner.appendChild(svg.cloneNode(true));
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
          if (cancelled) return;
          measureChart();
          syncLoupeClone();
        });
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to render diagram');
        }
      }
    };

    setNeedsZoom(false);
    setLoupeVisible(false);
    setTouchView({ x: 0, y: 0, scale: 1 });
    void renderChart();

    return () => {
      cancelled = true;
      el.innerHTML = '';
      if (loupeInnerRef.current) loupeInnerRef.current.innerHTML = '';
    };
  }, [chart, measureChart, syncLoupeClone]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const observer = new ResizeObserver(() => {
      measureChart();
      syncLoupeClone();
    });
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [measureChart, syncLoupeClone]);

  const updateLoupe = useCallback((clientX: number, clientY: number) => {
    const svg = getSvg(containerRef.current);
    if (!svg || !needsZoom) return;

    const { x: mx, y: my } = clientToSvgCoords(svg, clientX, clientY);
    const half = LENS_SIZE / 2;
    setLoupeTransform(`translate(${half - mx * LENS_ZOOM}px, ${half - my * LENS_ZOOM}px) scale(${LENS_ZOOM})`);

    let left = clientX + LENS_OFFSET;
    let top = clientY + LENS_OFFSET;
    left = clamp(left, 8, window.innerWidth - LENS_SIZE - 8);
    top = clamp(top, 8, window.innerHeight - LENS_SIZE - 8);
    setLoupePos({ x: left, y: top });
  }, [needsZoom]);

  const handleMouseEnter = useCallback(
    (event: React.MouseEvent) => {
      if (!finePointer || !needsZoom) return;
      setLoupeVisible(true);
      updateLoupe(event.clientX, event.clientY);
    },
    [finePointer, needsZoom, updateLoupe],
  );

  const handleMouseLeave = useCallback(() => {
    setLoupeVisible(false);
  }, []);

  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (!finePointer || !needsZoom) return;
      updateLoupe(event.clientX, event.clientY);
    },
    [finePointer, needsZoom, updateLoupe],
  );

  const clampPan = useCallback((x: number, y: number, scale: number) => {
    const viewport = viewportRef.current;
    const svg = getSvg(containerRef.current);
    if (!viewport || !svg) return { x, y };

    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    const sw = svg.scrollWidth * scale;
    const sh = svg.scrollHeight * scale;

    return {
      x: clamp(x, Math.min(0, vw - sw), 0),
      y: clamp(y, Math.min(0, vh - sh), 0),
    };
  }, []);

  const resetTouchView = useCallback(() => {
    setTouchView({ x: 0, y: 0, scale: 1 });
    pointersRef.current.clear();
    panStartRef.current = null;
    pinchStartRef.current = null;
  }, []);

  const getLocalPoint = (event: React.PointerEvent): PointerPoint => {
    const viewport = viewportRef.current!;
    const rect = viewport.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const handlePointerDown = useCallback(
    (event: React.PointerEvent) => {
      if (finePointer || !needsZoom) return;
      const viewport = viewportRef.current;
      if (!viewport) return;

      event.preventDefault();
      viewport.setPointerCapture(event.pointerId);
      const point = getLocalPoint(event);
      pointersRef.current.set(event.pointerId, point);

      if (pointersRef.current.size === 1) {
        const view = touchViewRef.current;
        panStartRef.current = {
          pointerX: point.x,
          pointerY: point.y,
          viewX: view.x,
          viewY: view.y,
        };
        pinchStartRef.current = null;
      } else if (pointersRef.current.size === 2) {
        const pts = [...pointersRef.current.values()];
        const dist = pointerDistance(pts[0], pts[1]);
        const center = pointerCenter(pts[0], pts[1]);
        const view = touchViewRef.current;
        pinchStartRef.current = {
          distance: Math.max(dist, 1),
          scale: view.scale,
          center,
          viewX: view.x,
          viewY: view.y,
        };
        panStartRef.current = null;
      }
      setShowTouchHint(false);
    },
    [finePointer, needsZoom],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent) => {
      if (finePointer || !needsZoom) return;
      if (!pointersRef.current.has(event.pointerId)) return;

      const point = getLocalPoint(event);
      pointersRef.current.set(event.pointerId, point);

      if (pointersRef.current.size >= 2 && pinchStartRef.current) {
        const pts = [...pointersRef.current.values()].slice(0, 2);
        const dist = Math.max(pointerDistance(pts[0], pts[1]), 1);
        const start = pinchStartRef.current;
        const ratio = dist / start.distance;
        const nextScale = clamp(start.scale * ratio, MIN_SCALE, MAX_SCALE);
        const scaleRatio = nextScale / start.scale;
        const cx = start.center.x;
        const cy = start.center.y;
        const nextX = cx - (cx - start.viewX) * scaleRatio;
        const nextY = cy - (cy - start.viewY) * scaleRatio;
        const clamped = clampPan(nextX, nextY, nextScale);
        setTouchView({ x: clamped.x, y: clamped.y, scale: nextScale });
        return;
      }

      if (pointersRef.current.size === 1 && panStartRef.current) {
        const start = panStartRef.current;
        const dx = point.x - start.pointerX;
        const dy = point.y - start.pointerY;
        const clamped = clampPan(start.viewX + dx, start.viewY + dy, touchViewRef.current.scale);
        setTouchView({ x: clamped.x, y: clamped.y, scale: touchViewRef.current.scale });
      }
    },
    [finePointer, needsZoom, clampPan],
  );

  const handlePointerUp = useCallback((event: React.PointerEvent) => {
    pointersRef.current.delete(event.pointerId);
    if (pointersRef.current.size === 0) {
      panStartRef.current = null;
      pinchStartRef.current = null;
    } else if (pointersRef.current.size === 1) {
      pinchStartRef.current = null;
      const remaining = [...pointersRef.current.values()][0];
      const view = touchViewRef.current;
      panStartRef.current = {
        pointerX: remaining.x,
        pointerY: remaining.y,
        viewX: view.x,
        viewY: view.y,
      };
    }
  }, []);

  const touchActive = needsZoom && !finePointer;
  const canResetTouch =
    touchActive && (touchView.scale !== 1 || touchView.x !== 0 || touchView.y !== 0);
  const showLoupe = finePointer && needsZoom && loupeVisible && !error;

  return (
    <div
      ref={rootRef}
      className={`${CHART_SHELL_CLASS}${touchActive ? ' blog-mermaid-chart--touch' : ''}`}
      role="group"
      aria-label="Diagram. Pinch or drag to explore on touch devices."
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      <div
        ref={viewportRef}
        className={`blog-mermaid-viewport${finePointer ? ' blog-mermaid-viewport--scroll' : ''}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div
          className="blog-mermaid-transform"
          style={{
            transform: touchActive
              ? `translate(${touchView.x}px, ${touchView.y}px) scale(${touchView.scale})`
              : undefined,
            transformOrigin: '0 0',
          }}
        >
          <div ref={containerRef} className="blog-mermaid-svg-host" role="img" aria-label="Diagram" />
        </div>
      </div>

      <div
        className={`blog-mermaid-loupe${reducedMotion ? ' blog-mermaid-loupe--static' : ''}${showLoupe ? '' : ' blog-mermaid-loupe--hidden'}`}
        style={{ left: loupePos.x, top: loupePos.y, width: LENS_SIZE, height: LENS_SIZE }}
        aria-hidden
      >
        <div
          ref={loupeInnerRef}
          className="blog-mermaid-loupe-inner"
          style={{ transform: loupeTransform }}
        />
      </div>

      {showTouchHint && touchActive ? (
        <p className="blog-mermaid-hint">Pinch or drag to explore</p>
      ) : null}

      {canResetTouch ? (
        <button type="button" className="blog-mermaid-reset" onClick={resetTouchView}>
          Reset view
        </button>
      ) : null}

      {error ? <p className="text-red-600 dark:text-red-400 text-sm font-medium mt-2">{error}</p> : null}
    </div>
  );
}
