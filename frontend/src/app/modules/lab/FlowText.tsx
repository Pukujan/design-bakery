import { useEffect, useRef, type ReactNode } from 'react';
import { prepareWithSegments, type PreparedTextWithSegments } from '@chenglou/pretext';
import { flowField, flowLines, normalise, type FlowLine } from './flow';
import './flow.css';

/** Below this width the text stays as the browser sets it: the bodies are small there and the lines would crowd them. */
const NARROW = '(max-width: 760px)';

/** Computed font-stretch percentages, named the way the canvas font shorthand names them. */
const STRETCH: [number, string][] = [
  [50, 'ultra-condensed'],
  [62.5, 'extra-condensed'],
  [75, 'condensed'],
  [87.5, 'semi-condensed'],
  [100, 'normal'],
  [112.5, 'semi-expanded'],
  [125, 'expanded'],
  [150, 'extra-expanded'],
  [200, 'ultra-expanded'],
];

function stretchKeyword(computed: string): string {
  const percent = parseFloat(computed);
  if (!Number.isFinite(percent)) return 'normal';
  return STRETCH.reduce((best, item) => (Math.abs(item[0] - percent) < Math.abs(best[0] - percent) ? item : best))[1];
}

/** A rendered run of text as Pretext measures it: the text, and where each of its characters sits in the raw text. */
type Source = { text: string; map: number[]; nodes: { node: Text; start: number }[] };

type Frame = { lines: FlowLine[]; lineHeight: number; insetLeft: number; insetTop: number; extraHeight: number };

/** One run's flow: read its box and lay it out, then paint the lines. */
type Flow = {
  /** Reads the box and lays the text out; null while the run is off screen, on a phone, or not yet prepared. */
  measure: () => Frame | null;
  /** Writes the lines. Every run measures before any paints, so reads and writes never interleave. */
  paint: (frame: Frame) => void;
};

/** Every flowing run on screen shares one frame loop, which runs only while one is mounted. */
const flows = new Set<Flow>();
let frameId = 0;

function tick() {
  const frames: [Flow, Frame][] = [];
  for (const flow of flows) {
    const frame = flow.measure();
    if (frame) frames.push([flow, frame]);
  }
  for (const [flow, frame] of frames) flow.paint(frame);
  frameId = requestAnimationFrame(tick);
}

function subscribe(flow: Flow): () => void {
  flows.add(flow);
  if (flows.size === 1) frameId = requestAnimationFrame(tick);
  return () => {
    flows.delete(flow);
    if (flows.size === 0) cancelAnimationFrame(frameId);
  };
}

function sourceOf(root: HTMLElement): Source {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Source['nodes'] = [];
  let raw = '';
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    nodes.push({ node: node as Text, start: raw.length });
    raw += node.nodeValue ?? '';
  }
  const { text, map } = normalise(raw);
  return { text, map, nodes };
}

/** The text node and offset at a raw character index: where a character starts, or where one ends. */
function locate(nodes: Source['nodes'], index: number, end: boolean): [Text, number] | null {
  for (const { node, start } of nodes) {
    const offset = index - start;
    const inside = end ? offset > 0 && offset <= node.data.length : offset >= 0 && offset < node.data.length;
    if (inside) return [node, offset];
  }
  return null;
}

/** The markup of a run of the text, cloned, so emphasis and links survive on their line. */
function fragmentOf(source: Source, from: number, to: number): DocumentFragment | null {
  const start = locate(source.nodes, source.map[from], false);
  const end = locate(source.nodes, source.map[to - 1] + 1, true);
  if (!start || !end) return null;
  const range = document.createRange();
  range.setStart(start[0], start[1]);
  range.setEnd(end[0], end[1]);
  return range.cloneContents();
}

/** Replaces the host's lines with one span per laid-out line, each holding its slice of the rendered markup. */
function buildLines(source: Source, lines: FlowLine[], host: HTMLElement): HTMLSpanElement[] {
  const spans: HTMLSpanElement[] = [];
  let from = 0;
  for (const line of lines) {
    const span = document.createElement('span');
    span.className = 'flow-line';
    const wanted = line.text.trim();
    const at = wanted ? source.text.indexOf(wanted, from) : -1;
    const fragment = at >= 0 ? fragmentOf(source, at, at + wanted.length) : null;
    if (fragment) {
      span.append(fragment);
      from = at + wanted.length;
    } else {
      span.textContent = line.text;
    }
    spans.push(span);
  }
  host.replaceChildren(...spans);
  return spans;
}

/**
 * Text whose lines wrap round the lensed bodies in the sky. The children render as usual and turn invisible, but keep their place, so their width holds
 * once the flow paints. Pretext sets each line in the widest free span beside a body, and each line is
 * cloned from the rendered text, so its emphasis and links come with it. On phones the text stays native.
 */
export function FlowText({
  text,
  as = 'p',
  className,
  children,
}: {
  /** The plain text of the run; a change re-lays it out. */
  text: string;
  /** The element the run sits in. */
  as?: 'p' | 'span' | 'div';
  className?: string;
  children: ReactNode;
}) {
  const rendered = useRef<HTMLSpanElement>(null);
  const host = useRef<HTMLSpanElement>(null);
  const Tag = as;

  useEffect(() => {
    const source = rendered.current;
    const lines = host.current;
    const element = source?.parentElement;
    if (!source || !lines || !element) return;

    const content = sourceOf(source);

    let prepared: PreparedTextWithSegments | null = null;
    let fontKey = '';
    let onScreen = true;
    let key = '';
    let spans: HTMLSpanElement[] = [];
    let unsubscribe: (() => void) | null = null;
    let disposed = false;

    const narrowScreen = window.matchMedia(NARROW);
    let narrow = narrowScreen.matches;
    // On a phone the rendered text is shown as it is; back on a wide screen the next paint lays it out again.
    const syncNarrow = () => {
      narrow = narrowScreen.matches;
      if (!narrow) return;
      source.style.visibility = '';
      lines.replaceChildren();
      element.style.height = '';
      key = '';
      spans = [];
    };
    syncNarrow();
    narrowScreen.addEventListener('change', syncNarrow);
    // A later font load can change glyph widths without changing the CSS font string.
    const refreshFont = () => { fontKey = ''; };
    document.fonts.addEventListener('loadingdone', refreshFont);

    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
    }, { rootMargin: '200px 0px' });
    observer.observe(element);

    const flow: Flow = {
      measure: () => {
        if (!prepared || !onScreen || narrow) return null;
        const style = getComputedStyle(element);
        const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.5;
        const font = `${style.fontStyle} ${style.fontWeight} ${stretchKeyword(style.fontStretch)} ${style.fontSize} ${style.fontFamily}`;
        const letterSpacing = parseFloat(style.letterSpacing) || 0;
        const nextFontKey = `${font}|${letterSpacing}`;
        if (nextFontKey !== fontKey) {
          prepared = prepareWithSegments(content.text, font, { letterSpacing });
          fontKey = nextFontKey;
        }
        const px = (value: string) => parseFloat(value) || 0;
        const left = px(style.paddingLeft);
        const right = px(style.paddingRight);
        const top = px(style.paddingTop);
        const bottom = px(style.paddingBottom);
        const borderLeft = px(style.borderLeftWidth);
        const borderTop = px(style.borderTopWidth);
        const width = element.clientWidth - left - right;
        if (width <= 0) return null;
        const box = element.getBoundingClientRect();
        const extraHeight = style.boxSizing === 'border-box'
          ? top + bottom + borderTop + px(style.borderBottomWidth)
          : 0;
        return {
          lines: flowLines(prepared, width, lineHeight, box.top + borderTop + top, box.left + borderLeft + left, flowField.obstacles),
          lineHeight, insetLeft: left, insetTop: top, extraHeight,
        };
      },
      paint: ({ lines: next, lineHeight: height, insetLeft, insetTop, extraHeight }) => {
        const nextKey = next.map((line) => line.text).join('\n');
        if (nextKey !== key) {
          key = nextKey;
          spans = buildLines(content, next, lines);
        }
        next.forEach((line, i) => {
          spans[i].style.transform = `translate(${line.x + insetLeft}px, ${line.y + insetTop}px)`;
        });
        element.style.height = `${(next.length ? next[next.length - 1].y + height : 0) + extraHeight}px`;
        source.style.visibility = 'hidden';
      },
    };

    // Prepare once the font is ready, since Pretext measures with the font it is given.
    void document.fonts.ready.then(() => {
      if (disposed || !element.isConnected || !content.text) return;
      // Prepare using the current computed style in measure(), after fonts have loaded.
      const style = getComputedStyle(element);
      const font = `${style.fontStyle} ${style.fontWeight} ${stretchKeyword(style.fontStretch)} ${style.fontSize} ${style.fontFamily}`;
      const letterSpacing = parseFloat(style.letterSpacing) || 0;
      prepared = prepareWithSegments(content.text, font, { letterSpacing });
      fontKey = `${font}|${letterSpacing}`;
      unsubscribe = subscribe(flow);
    });

    return () => {
      disposed = true;
      observer.disconnect();
      narrowScreen.removeEventListener('change', syncNarrow);
      document.fonts.removeEventListener('loadingdone', refreshFont);
      unsubscribe?.();
      source.style.visibility = '';
      lines.replaceChildren();
      element.style.height = '';
    };
  }, [text]);

  return (
    <Tag className={['flow-text', className].filter(Boolean).join(' ')}>
      <span ref={rendered} className="flow-source">
        {children}
      </span>
      <span ref={host} className="flow-lines" />
    </Tag>
  );
}
