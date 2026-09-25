/**
 * The bridge between a ```chart fence and the chart.
 *
 * Three things happen here, in this order:
 *
 *  1. the build-time SVG for the spec is rendered as an `<img>`, light and dark,
 *     so something correct is on screen before any JavaScript for the chart
 *     exists — and stays on screen if it never arrives;
 *  2. the dataset is fetched lazily, because the fence only carries an id;
 *  3. the interactive chart is pulled in through `React.lazy`, so d3 and the
 *     chart code stay out of the main bundle, and replaces the static image
 *     once it is on screen.
 *
 * The SVG is chosen by CSS (`.dark` on `<html>`), not by JS, so it follows the
 * site's theme toggle and prints correctly either way.
 */
import { Suspense, lazy, useEffect, useState, type ComponentType } from 'react';
import { useParams } from 'react-router-dom';
import type { Dataset } from './types.generated';
import { chartSlug, type ChartSpec } from './spec';
import { loadDataset } from './dataset';
import type { ResearchChartProps } from './ResearchChart';

/** Separate chunk: d3, the layout maths and the marks all live behind this. */
const LazyResearchChart = lazy(() => import('./ResearchChart'));

export const CHART_ASSET_BASE = '/research/charts';

export interface ResearchChartEmbedProps {
  spec: ChartSpec;
  /** Owning paper/source id, used to namespace the static SVG. Falls back to the route. */
  paperId?: string;
}

interface LoadState {
  status: 'loading' | 'ready' | 'error';
  dataset?: Dataset;
  message?: string;
}

export function ResearchChartEmbed({ spec, paperId }: ResearchChartEmbedProps) {
  const params = useParams<{ paperId?: string; sourceId?: string }>();
  const owner = paperId ?? params.paperId ?? params.sourceId ?? 'shared';

  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    setHydrated(false);
    loadDataset(spec.data)
      .then((dataset) => {
        if (!cancelled) setState({ status: 'ready', dataset });
      })
      .catch((error: Error) => {
        if (!cancelled) setState({ status: 'error', message: error.message });
      });
    return () => {
      cancelled = true;
    };
  }, [spec.data]);

  const slug = chartSlug(spec);
  const base = `${CHART_ASSET_BASE}/${owner}/${slug}`;
  const alt =
    spec.caption ?? `${spec.metric} chart from the dataset ${spec.data}`;

  const Chart = LazyResearchChart as ComponentType<ResearchChartProps>;

  return (
    <div className={`rc-embed${hydrated ? ' rc-embed--hydrated' : ''}`}>
      <span className="rc-embed__static">
        {/* Two files, one visible: an <img> cannot read the page's .dark class. */}
        <img className="rc-embed__svg rc-embed__svg--light" src={`${base}.light.svg`} alt={alt} />
        <img className="rc-embed__svg rc-embed__svg--dark" src={`${base}.dark.svg`} alt="" aria-hidden="true" />
      </span>

      {state.status === 'ready' && state.dataset ? (
        <Suspense fallback={null}>
          <Chart dataset={state.dataset} spec={spec} onReady={() => setHydrated(true)} />
        </Suspense>
      ) : null}

      {state.status === 'error' ? (
        <p className="rc-embed__error" role="status">
          This chart could not load its dataset ({state.message}). The figure above is the
          build-time render of the same data.
        </p>
      ) : null}
    </div>
  );
}
