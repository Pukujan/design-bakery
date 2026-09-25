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
 * Two `<picture>` elements, not one: the theme is a `.dark` class and a media
 * query cannot see it, so light and dark are separate elements and CSS picks
 * one. Each carries a `<source>` for the narrow render, because a 720px SVG
 * scaled into a 390px phone shrinks its labels below legibility.
 */
import { Suspense, lazy, useEffect, useState, type ComponentType } from 'react';
import { useParams } from 'react-router-dom';
import type { Dataset } from './types.generated';
import { STACKED_BREAKPOINT, chartSlug, type ChartSpec } from './spec';
import { loadDataset } from './dataset';
import type { ResearchChartProps } from './ResearchChart';

/** Separate chunk: d3, the layout maths and the marks all live behind this. */
const LazyResearchChart = lazy(() => import('./ResearchChart'));

export const CHART_ASSET_BASE = '/research/charts';

const NARROW_MEDIA = `(max-width: ${STACKED_BREAKPOINT - 1}px)`;

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
  // A missing asset (the build step never ran, a stale deploy) must degrade to
  // a message, not to a broken-image icon the size of a chart.
  const [staticOk, setStaticOk] = useState(true);

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
  const alt = spec.caption ?? `${spec.metric} chart from the dataset ${spec.data}`;
  // Kept in the DOM once the chart is live, and hidden by `.rc-embed--hydrated`:
  // the static figure stays until the interactive one has actually mounted.
  const showStatic = staticOk;

  const Chart = LazyResearchChart as ComponentType<ResearchChartProps>;

  return (
    <div className={`rc-embed${hydrated ? ' rc-embed--hydrated' : ''}`}>
      {showStatic ? (
        <>
          <picture className="rc-embed__static rc-embed__static--light">
            <source media={NARROW_MEDIA} srcSet={`${base}.light.narrow.svg`} />
            <img
              className="rc-embed__svg"
              src={`${base}.light.svg`}
              alt={alt}
              onError={() => setStaticOk(false)}
            />
          </picture>
          <picture className="rc-embed__static rc-embed__static--dark" aria-hidden="true">
            <source media={NARROW_MEDIA} srcSet={`${base}.dark.narrow.svg`} />
            <img className="rc-embed__svg" src={`${base}.dark.svg`} alt="" />
          </picture>
        </>
      ) : null}

      {state.status === 'ready' && state.dataset ? (
        <Suspense fallback={null}>
          <Chart dataset={state.dataset} spec={spec} onReady={() => setHydrated(true)} />
        </Suspense>
      ) : null}

      {state.status === 'error' ? (
        <p className="rc-embed__error" role="status">
          This chart could not load its dataset ({state.message}).
          {staticOk ? ' The figure above is the build-time render of the same data.' : ''}
        </p>
      ) : null}
    </div>
  );
}
