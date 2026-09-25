/**
 * SVG inspection for the chart rules.
 *
 * Two shapes of SVG show up in this repo:
 *  - hand-authored charts with real `<text>` elements and classes;
 *  - matplotlib exports that draw glyphs as `<path>` and keep the label text in
 *    an XML comment inside `<g id="text_N">`. Those comments are the visible
 *    text, so they are read as text too.
 */

export interface SvgText {
  text: string;
  x: number;
  y: number;
  /** Relative font size (matplotlib `scale()`, or `font-size`). */
  size: number;
  /** `title` | `subtitle` | `footer` | `annotation` | `legend` | `reference` */
  role?: string;
  rotated: boolean;
  /** Offset of the text in the file, for line/column reporting. */
  offset: number;
}

export interface SvgMark {
  x: number;
  y: number;
  /** Index of the marker collection this mark belongs to. */
  series: number;
}

export interface SvgLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  offset: number;
}

export interface ReferenceLine {
  line: SvgLine;
  label?: SvgText;
}

export interface SvgInfo {
  viewBox: { width: number; height: number };
  texts: SvgText[];
  title?: SvgText;
  subtitle: SvgText[];
  footer?: SvgText;
  marks: SvgMark[];
  /** Distinct dot-marker collections (matplotlib) or marker groups. */
  markerSeries: number;
  circles: { x: number; y: number; offset: number }[];
  connectors: SvgLine[];
  referenceLines: ReferenceLine[];
  colors: string[];
  rotatedText: SvgText[];
  legend: boolean;
  /** Subtitle/annotation text that mentions hollow-vs-filled dots. */
  hollowTell: boolean;
  /** Visible text that names an interval or error bar. */
  intervalTell: boolean;
}

const ROLE_PATTERNS: [RegExp, string][] = [
  [/sub-?title|chart-desc|chart-description/i, 'subtitle'],
  [/chart-title|svg-title|^title$|^chartTitle$/i, 'title'],
  [/footer|source|credit/i, 'footer'],
  [/annotation/i, 'annotation'],
  [/legend/i, 'legend'],
  [/reference|baseline|threshold/i, 'reference'],
];

function roleOf(...candidates: (string | undefined)[]): string | undefined {
  const joined = candidates.filter(Boolean).join(' ');
  if (!joined) return undefined;
  for (const [pattern, role] of ROLE_PATTERNS) {
    if (pattern.test(joined)) return role;
  }
  return undefined;
}

function attr(tag: string, name: string): string | undefined {
  const match = new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`, 'i').exec(tag);
  return match?.[1];
}

function num(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

interface Transform {
  x: number;
  y: number;
  rotated: boolean;
  size: number;
}

function translateOf(transform: string | undefined): Transform | undefined {
  if (!transform) return undefined;
  const translate = /translate\(\s*([-\d.]+)[ ,]+([-\d.]+)\s*\)/.exec(transform);
  const rotate = /rotate\(\s*([-\d.]+)/.exec(transform);
  const scale = /scale\(\s*([-\d.]+)/.exec(transform);
  if (!translate) return undefined;
  return {
    x: Number.parseFloat(translate[1] ?? '0'),
    y: Number.parseFloat(translate[2] ?? '0'),
    rotated: rotate ? Math.abs(Number.parseFloat(rotate[1] ?? '0')) % 360 !== 0 : false,
    size: scale ? Math.abs(Number.parseFloat(scale[1] ?? '1')) : 1,
  };
}

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function inspectSvg(source: string): SvgInfo {
  const viewBoxMatch = /viewBox\s*=\s*"([^"]+)"/i.exec(source);
  const box = (viewBoxMatch?.[1] ?? '0 0 720 440').split(/[\s,]+/).map(Number);
  const width = Number.isFinite(box[2]) ? (box[2] ?? 720) : 720;
  const height = Number.isFinite(box[3]) ? (box[3] ?? 440) : 440;

  const elementTexts = extractElementTexts(source);
  const allTexts = elementTexts.length > 0 ? elementTexts : extractMatplotlibTexts(source);
  const { title, subtitle, footer } = classifyTexts(allTexts, height);

  const marks = extractMarks(source);
  const circles = extractCircles(source);
  const connectors = extractConnectors(source);
  const referenceLines = matchReferenceLines(extractDashedLines(source), allTexts);

  const visible = allTexts.map((text) => text.text).join(' \n ');

  return {
    viewBox: { width, height },
    texts: allTexts,
    ...(title ? { title } : {}),
    subtitle,
    ...(footer ? { footer } : {}),
    marks,
    markerSeries: new Set(marks.map((mark) => mark.series)).size,
    circles,
    connectors,
    referenceLines,
    colors: extractColors(source),
    rotatedText: allTexts.filter((text) => text.rotated),
    legend:
      /<g[^>]*class\s*=\s*"[^"]*legend[^"]*"/i.test(source) ||
      /<legend\b/i.test(source) ||
      allTexts.some((text) => text.role === 'legend'),
    hollowTell: /\b(?:hollow|filled|open (?:dot|circle|marker))\b/i.test(visible),
    intervalTell: /\b(?:95\s*%?\s*CI|confidence intervals?|error bars?|whiskers?)\b/i.test(visible),
  };
}

function extractElementTexts(source: string): SvgText[] {
  const texts: SvgText[] = [];
  const stack: { transform?: string; role?: string }[] = [];
  const tokenRe = /<\/?g\b[^>]*>|<text\b[^>]*>[\s\S]*?<\/text>|<text\b[^>]*\/>/gi;
  let match: RegExpExecArray | null;
  while ((match = tokenRe.exec(source)) !== null) {
    const token = match[0];
    if (/^<g\b/i.test(token)) {
      const entry: { transform?: string; role?: string } = {};
      const transform = attr(token, 'transform');
      const role = roleOf(attr(token, 'class'), attr(token, 'id'), attr(token, 'data-role'));
      if (transform !== undefined) entry.transform = transform;
      if (role !== undefined) entry.role = role;
      stack.push(entry);
      continue;
    }
    if (/^<\/g/i.test(token)) {
      stack.pop();
      continue;
    }
    const content = stripTags(token.replace(/^<text\b[^>]*>/i, '').replace(/<\/text>$/i, ''));
    if (!content) continue;
    const own = translateOf(attr(token, 'transform'));
    const inherited = [...stack].reverse().map((entry) => translateOf(entry.transform)).find(Boolean);
    const role = roleOf(attr(token, 'class'), attr(token, 'id'), attr(token, 'data-role'))
      ?? [...stack].reverse().map((entry) => entry.role).find(Boolean);
    const fontSize = num(attr(token, 'font-size'));
    const text: SvgText = {
      text: content,
      x: num(attr(token, 'x')) ?? own?.x ?? inherited?.x ?? 0,
      y: num(attr(token, 'y')) ?? own?.y ?? inherited?.y ?? 0,
      size: fontSize ?? own?.size ?? inherited?.size ?? 1,
      rotated: Boolean(own?.rotated || inherited?.rotated),
      offset: match.index,
    };
    if (role) text.role = role;
    texts.push(text);
  }
  return texts;
}

function extractMatplotlibTexts(source: string): SvgText[] {
  const texts: SvgText[] = [];
  const re = /<g id="text_\d+">\s*<!--([\s\S]*?)-->\s*<g style="[^"]*"\s*transform="translate\(([-\d.]+) ([-\d.]+)\)(\s+rotate\(([-\d.]+)\))?\s*scale\(([-\d.]+)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(source)) !== null) {
    const text = (match[1] ?? '').trim();
    if (!text) continue;
    texts.push({
      text,
      x: Number.parseFloat(match[2] ?? '0'),
      y: Number.parseFloat(match[3] ?? '0'),
      size: Math.abs(Number.parseFloat(match[6] ?? '1')),
      rotated: match[5] !== undefined && Math.abs(Number.parseFloat(match[5])) % 360 !== 0,
      offset: match.index,
    });
  }
  return texts;
}

function classifyTexts(texts: SvgText[], height: number): { title?: SvgText; subtitle: SvgText[]; footer?: SvgText } {
  if (texts.length === 0) return { subtitle: [] };
  const sorted = [...texts].sort((a, b) => a.y - b.y || a.x - b.x);
  const maxSize = Math.max(...sorted.map((text) => text.size));
  const positionalTitle = sorted.find((text) => text.size >= maxSize - 1e-6);
  const subtitle: SvgText[] = [];
  if (positionalTitle) {
    const limit = positionalTitle.y + height * 0.12;
    for (const text of sorted) {
      if (text === positionalTitle) continue;
      if (text.y > positionalTitle.y && text.y <= limit && text.size <= positionalTitle.size) subtitle.push(text);
    }
  }
  const positionalFooter = [...sorted].reverse().find((text) => text.y >= height * 0.9);

  const explicitTitle = texts.find((text) => text.role === 'title');
  const explicitSubtitle = texts.filter((text) => text.role === 'subtitle');
  const explicitFooter = [...texts].reverse().find((text) => text.role === 'footer');

  const title = explicitTitle ?? positionalTitle;
  const footer = explicitFooter ?? positionalFooter;
  const chosenSubtitle = explicitSubtitle.length > 0
    ? explicitSubtitle
    : subtitle.filter((text) => text !== title && text !== footer);

  return {
    ...(title ? { title } : {}),
    subtitle: chosenSubtitle,
    ...(footer ? { footer } : {}),
  };
}

function extractMarks(source: string): SvgMark[] {
  const marks: SvgMark[] = [];
  let seriesIndex = 0;
  for (const collection of source.matchAll(/<g id="PathCollection_\d+">([\s\S]*?)<\/g>\s*<\/g>/g)) {
    for (const use of (collection[1] ?? '').matchAll(/<use\b[^>]*\bx="([-\d.]+)"[^>]*\by="([-\d.]+)"/g)) {
      marks.push({ x: Number.parseFloat(use[1] ?? '0'), y: Number.parseFloat(use[2] ?? '0'), series: seriesIndex });
    }
    seriesIndex += 1;
  }
  for (const match of source.matchAll(/<circle\b[^>]*>/gi)) {
    const cx = num(attr(match[0], 'cx'));
    const cy = num(attr(match[0], 'cy'));
    if (cx === undefined || cy === undefined) continue;
    marks.push({ x: cx, y: cy, series: seriesIndex });
  }
  return marks;
}

function extractCircles(source: string): { x: number; y: number; offset: number }[] {
  const circles: { x: number; y: number; offset: number }[] = [];
  for (const match of source.matchAll(/<(?:circle|ellipse)\b[^>]*>/gi)) {
    const cx = num(attr(match[0], 'cx'));
    const cy = num(attr(match[0], 'cy'));
    if (cx === undefined || cy === undefined) continue;
    circles.push({ x: cx, y: cy, offset: match.index });
  }
  return circles;
}

function extractConnectors(source: string): SvgLine[] {
  const lines: SvgLine[] = [];
  for (const match of source.matchAll(/<line\b[^>]*>/gi)) {
    const tag = match[0];
    lines.push({
      x1: num(attr(tag, 'x1')) ?? 0,
      y1: num(attr(tag, 'y1')) ?? 0,
      x2: num(attr(tag, 'x2')) ?? 0,
      y2: num(attr(tag, 'y2')) ?? 0,
      offset: match.index,
    });
  }
  return lines;
}

/** Dashed lines and paths, which in practice are reference lines or gridlines. */
function extractDashedLines(source: string): SvgLine[] {
  const lines: SvgLine[] = [];
  for (const match of source.matchAll(/<line\b[^>]*stroke-dasharray[^>]*>/gi)) {
    const tag = match[0];
    lines.push({
      x1: num(attr(tag, 'x1')) ?? 0,
      y1: num(attr(tag, 'y1')) ?? 0,
      x2: num(attr(tag, 'x2')) ?? 0,
      y2: num(attr(tag, 'y2')) ?? 0,
      offset: match.index,
    });
  }
  for (const match of source.matchAll(/<path\b[^>]*stroke-dasharray[^>]*>/gi)) {
    const d = attr(match[0], 'd') ?? '';
    const pairs = d.match(/[ML]\s*([-\d.]+)[ ,]+([-\d.]+)/g) ?? [];
    if (pairs.length < 2) continue;
    const points = pairs.map((pair) => pair.replace(/^[ML]\s*/, '').split(/[ ,]+/).map(Number));
    const first = points[0] ?? [0, 0];
    const last = points[points.length - 1] ?? [0, 0];
    lines.push({
      x1: first[0] ?? 0,
      y1: first[1] ?? 0,
      x2: last[0] ?? 0,
      y2: last[1] ?? 0,
      offset: match.index,
    });
  }
  return lines;
}

/**
 * A dashed line only counts as a reference line when a visible label sits on it.
 * Matplotlib gridlines are dashed too, and have no label.
 */
function matchReferenceLines(lines: SvgLine[], texts: SvgText[]): ReferenceLine[] {
  const out: ReferenceLine[] = [];
  for (const line of lines) {
    const label = texts.find((text) => {
      if (/^[-\d.,%\s]+$/.test(text.text)) return false;
      const distance = distanceToSegment(text.x, text.y, line);
      return distance <= 60;
    });
    out.push(label ? { line, label } : { line });
  }
  return out;
}

function distanceToSegment(px: number, py: number, line: SvgLine): number {
  const dx = line.x2 - line.x1;
  const dy = line.y2 - line.y1;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return Math.hypot(px - line.x1, py - line.y1);
  let t = ((px - line.x1) * dx + (py - line.y1) * dy) / lengthSquared;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (line.x1 + t * dx), py - (line.y1 + t * dy));
}

function extractColors(source: string): string[] {
  const colors = new Set<string>();
  for (const group of source.matchAll(/<g id="PathCollection_\d+">([\s\S]*?)<\/g>\s*<\/g>/g)) {
    for (const color of (group[1] ?? '').matchAll(/(?:fill|stroke):\s*(#[0-9a-fA-F]{3,8})/g)) {
      if (color[1]) colors.add(color[1].toLowerCase());
    }
  }
  for (const match of source.matchAll(/<(?:rect|circle|path)\b[^>]*class\s*=\s*"[^"]*(?:series|bar|mark|segment)[^"]*"[^>]*>/gi)) {
    for (const color of match[0].matchAll(/(?:fill|stroke):\s*(#[0-9a-fA-F]{3,8})/g)) {
      if (color[1]) colors.add(color[1].toLowerCase());
    }
  }
  return [...colors];
}
