export type BlogTocEntry = {
  title: string;
  href: string;
};

export type BlogContentParts = {
  prefix: string;
  toc: BlogTocEntry[];
  suffix: string;
};

const TOC_HEADING_RE = /(?:^|\n)##\s+Table of Contents\s*\n/i;
const TOC_LINE_RE = /^\s*\d+\.\s+\[([^\]]+)\]\((#[^)]+)\)\s*$/;

/** Split collapsed `)2. [` / `)3. [` into separate lines before parsing. */
function normalizeTocBlock(block: string): string {
  return block
    .replace(/\)\s*(?=\d+\.\s+\[)/g, ')\n')
    .replace(/(\S)(\d+\.\s+\[)/g, '$1\n$2');
}

function parseTocLines(block: string): BlogTocEntry[] {
  const normalized = normalizeTocBlock(block.trim());
  const entries: BlogTocEntry[] = [];

  for (const line of normalized.split('\n')) {
    const match = line.trim().match(TOC_LINE_RE);
    if (match) {
      entries.push({ title: match[1].trim(), href: match[2].trim() });
    }
  }

  return entries;
}

/**
 * Pulls `## Table of Contents` + numbered link list out of markdown so we can
 * render a guaranteed decimal list (react-markdown list overrides are flaky).
 */
export function extractTableOfContents(markdown: string): BlogContentParts {
  const headingMatch = markdown.match(TOC_HEADING_RE);
  if (!headingMatch || headingMatch.index === undefined) {
    return { prefix: markdown, toc: [], suffix: '' };
  }

  const tocStart = headingMatch.index + headingMatch[0].length;
  const afterTocHeading = markdown.slice(tocStart);
  const nextSection = afterTocHeading.search(/\n##\s+/);
  const tocBlock =
    nextSection === -1 ? afterTocHeading : afterTocHeading.slice(0, nextSection);
  const suffixStart = nextSection === -1 ? markdown.length : tocStart + nextSection;

  const toc = parseTocLines(tocBlock);
  if (toc.length === 0) {
    return { prefix: markdown, toc: [], suffix: '' };
  }

  return {
    prefix: markdown.slice(0, headingMatch.index).trimEnd(),
    toc,
    suffix: markdown.slice(suffixStart).trimStart(),
  };
}
