/**
 * Highlights a quoted passage under a heading the agent has cited (TASK-DB-0129). The passage is looked up in the live
 * page text, not by position, so it keeps working however the post is edited; if the text is not there nothing is marked.
 */

const HIGHLIGHT_NAME = 'agent-quote';
let clearTimer: ReturnType<typeof setTimeout> | undefined;

const fold = (text: string) => text.replace(/\s+/g, ' ').trim().normalize('NFC').toLowerCase();

/** The elements that make up a heading's section: the siblings after it up to the next heading, or its container when it has none. */
function sectionElements(heading: Element): Element[] {
  // A chart or diagram the copilot points at is its own section: its caption is inside it.
  if (heading.hasAttribute('data-copilot-visual')) return [heading];
  const out: Element[] = [];
  for (let el = heading.nextElementSibling; el && !/^H[1-3]$/.test(el.tagName); el = el.nextElementSibling) out.push(el);
  if (out.length) return out;
  // A heading alone in its container (a project page's boxes): that container is its section.
  const box = heading.parentElement;
  return box && box.querySelectorAll('h1, h2, h3').length === 1 ? [box] : [];
}

/** A Range over `quote` inside `scope`, matching across inline markup and ignoring case and extra whitespace. */
function rangeFor(scope: Element, quote: string): Range | null {
  const wanted = fold(quote);
  if (!wanted) return null;
  const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
  let folded = '';
  const where: Array<{ node: Text; offset: number }> = [];
  let lastSpace = true;
  for (let node = walker.nextNode() as Text | null; node; node = walker.nextNode() as Text | null) {
    const text = node.data;
    for (let i = 0; i < text.length; i += 1) {
      const isSpace = /\s/.test(text[i]);
      if (isSpace && lastSpace) continue;
      folded += isSpace ? ' ' : text[i].toLowerCase();
      where.push({ node, offset: i });
      lastSpace = isSpace;
    }
  }
  const at = folded.indexOf(wanted);
  if (at < 0) return null;
  const start = where[at];
  const end = where[at + wanted.length - 1];
  const range = document.createRange();
  range.setStart(start.node, start.offset);
  range.setEnd(end.node, end.offset + 1);
  return range;
}

/** Take the highlight off. */
export function clearQuote() {
  clearTimeout(clearTimer);
  (CSS as unknown as { highlights?: Map<string, unknown> }).highlights?.delete(HIGHLIGHT_NAME);
  document.querySelectorAll('[data-agent-quote]').forEach((el) => el.removeAttribute('data-agent-quote'));
}

/** The range's on-screen element, so the cursor can tap the passage. Null when the quote is not under this heading. */
export function highlightQuote(heading: Element, quote: string, ms = 9000): Element | null {
  clearQuote();
  for (const scope of sectionElements(heading)) {
    const range = rangeFor(scope, quote);
    if (!range) continue;
    const highlights = (CSS as unknown as { highlights?: Map<string, unknown> }).highlights;
    const Highlight = (window as unknown as { Highlight?: new (...ranges: Range[]) => unknown }).Highlight;
    const block = (range.startContainer.parentElement?.closest('p, li, blockquote, td') ?? scope) as Element;
    if (highlights && Highlight) highlights.set(HIGHLIGHT_NAME, new Highlight(range));
    else block.setAttribute('data-agent-quote', '');
    clearTimer = setTimeout(clearQuote, ms);
    return block;
  }
  return null;
}
