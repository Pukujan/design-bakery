import {
  layoutNextLineRange,
  materializeLineRange,
  type LayoutCursor,
  type PreparedTextWithSegments,
} from '@chenglou/pretext';

/**
 * Text that flows round the lensed bodies (TASK-DB-0098). Pretext does the line breaking: each line
 * is laid out in the widest free span beside a body's disc, so the text wraps round it. The discs
 * come from the backdrop every frame, so the text moves as the bodies do.
 */

/** A point on screen, in viewport pixels. */
export type FlowPoint = { x: number; y: number };

/** Something on screen that text flows round: a disc, or a triangle such as a blade of light. */
export type FlowObstacle =
  | { kind: 'disc'; x: number; y: number; r: number }
  | { kind: 'shape'; points: FlowPoint[] };

/** The discs the backdrop publishes this frame. Only the backdrop writes it; the text reads it. */
export const flowField: { obstacles: FlowObstacle[] } = { obstacles: [] };

export type FlowLine = { text: string; x: number; y: number };

/** A line never takes less than this share of the column; if it cannot, it runs over the disc. */
const MIN_SPAN = 0.38;
/** ...and never less than this many line heights, so a short label is not broken into a column of letters. */
const MIN_EM = 4;
const MAX_LINES = 400;
/** Heights within a line that are checked for bodies: a body that crosses a tall line is avoided at every height of it. */
const SAMPLES = [0.15, 0.5, 0.85];

type Span = { start: number; end: number };

/** The parts of [0, width] that the blocked spans leave free. */
function freeSpans(width: number, blocked: Span[]): Span[] {
  const spans: Span[] = [];
  let from = 0;
  for (const block of [...blocked].sort((a, b) => a.start - b.start)) {
    if (block.start > from) spans.push({ start: from, end: Math.min(block.start, width) });
    from = Math.max(from, block.end);
  }
  if (from < width) spans.push({ start: from, end: width });
  return spans;
}

/** The span a disc covers on the line at height y, or null when the line misses it. */
function discSpan(disc: { x: number; y: number; r: number }, y: number): Span | null {
  const dy = y - disc.y;
  if (Math.abs(dy) >= disc.r) return null;
  const half = Math.sqrt(disc.r * disc.r - dy * dy);
  return { start: disc.x - half, end: disc.x + half };
}

/**
 * The span a convex shape covers on the line at height y, or null when the line misses it. Where the line
 * crosses the shape's outline is always on a segment between two of its points, so those segments give the span.
 */
function shapeSpan(points: FlowPoint[], y: number): Span | null {
  const top = Math.min(...points.map((point) => point.y));
  const bottom = Math.max(...points.map((point) => point.y));
  if (y < top || y > bottom) return null;
  const xs: number[] = [];
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const p = points[i];
      const q = points[j];
      if (Math.min(p.y, q.y) > y || Math.max(p.y, q.y) < y) continue;
      xs.push(p.y === q.y ? p.x : p.x + ((y - p.y) * (q.x - p.x)) / (q.y - p.y));
      if (p.y === q.y) xs.push(q.x);
    }
  }
  if (xs.length === 0) return null;
  return { start: Math.min(...xs), end: Math.max(...xs) };
}

/**
 * Lays a paragraph out line by line. `top` and `left` are where the paragraph sits in the viewport,
 * and the discs are in the same coordinates. A line that would cross a disc is set in the widest
 * free span beside it, so the lines wrap round the disc's edge.
 */
export function flowLines(
  prepared: PreparedTextWithSegments,
  width: number,
  lineHeight: number,
  top: number,
  left: number,
  obstacles: FlowObstacle[],
): FlowLine[] {
  const lines: FlowLine[] = [];
  if (width <= 0) return lines;
  let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };
  while (lines.length < MAX_LINES) {
    const row = lines.length;
    const blocked: Span[] = [];
    for (const fraction of SAMPLES) {
      const y = top + (row + fraction) * lineHeight;
      for (const shape of obstacles) {
        const span = shape.kind === 'disc' ? discSpan(shape, y) : shapeSpan(shape.points, y);
        if (span) blocked.push({ start: span.start - left, end: span.end - left });
      }
    }
    let span: Span = { start: 0, end: width };
    let widest = -1;
    for (const free of freeSpans(width, blocked)) {
      if (free.end - free.start > widest) {
        span = free;
        widest = free.end - free.start;
      }
    }
    if (widest < Math.max(width * MIN_SPAN, lineHeight * MIN_EM)) span = { start: 0, end: width };

    const range = layoutNextLineRange(prepared, span.end - span.start, cursor);
    if (!range) break;
    // A line that consumed nothing would repeat forever; stop rather than loop.
    if (range.end.segmentIndex === cursor.segmentIndex && range.end.graphemeIndex === cursor.graphemeIndex) break;

    lines.push({ text: materializeLineRange(prepared, range).text, x: span.start, y: row * lineHeight });
    cursor = range.end;
  }
  return lines;
}

/**
 * The text as Pretext measures it: whitespace runs collapsed to one space, and leading and trailing
 * whitespace dropped. `map` gives, for each character of that text, its index in the raw text.
 */
export function normalise(raw: string): { text: string; map: number[] } {
  let text = '';
  const map: number[] = [];
  let gap = -1;
  for (let i = 0; i < raw.length; i++) {
    if (/\s/.test(raw[i])) {
      if (gap < 0 && text.length > 0) gap = i;
      continue;
    }
    if (gap >= 0) {
      text += ' ';
      map.push(gap);
      gap = -1;
    }
    text += raw[i];
    map.push(i);
  }
  return { text, map };
}
