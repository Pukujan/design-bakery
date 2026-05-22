/** Strip markdown for card text (title area / blurb). */
export function stripMarkdownForCard(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]+`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_~>#]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** First N non-empty paragraphs, capped by chars (for meta LLM — not images). */
export function leadParagraphs(markdown: string, maxParas = 3, maxChars = 1200): string {
  const paras = markdown
    .split(/\n\s*\n/)
    .map((p) => stripMarkdownForCard(p))
    .filter((p) => p.length > 20);
  return paras.slice(0, maxParas).join('\n\n').slice(0, maxChars);
}

/** Card blurb: excerpt, else first paragraph of body. */
export function resolveCardBlurb(excerpt: string, content: string, max = 160): string {
  const ex = stripMarkdownForCard(excerpt);
  if (ex.length >= 24) return truncate(ex, max);
  const lead = leadParagraphs(content, 1, max + 40);
  return truncate(lead || ex, max);
}

function truncate(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}
