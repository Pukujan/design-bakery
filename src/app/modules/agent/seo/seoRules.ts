import {
  resolveBlogMetaDescription,
  resolveBlogMetaTitle,
} from '@/modules/engineering/blogSeo';
import type { SeoAuditInput, SeoAuditResult, SeoFinding } from './seoTypes';

function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]+`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/[#>*_~\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function push(
  findings: SeoFinding[],
  id: string,
  severity: SeoFinding['severity'],
  message: string,
  field?: SeoFinding['field']
) {
  findings.push({ id, severity, message, field });
}

function scoreFromFindings(findings: SeoFinding[]): number {
  let score = 100;
  for (const f of findings) {
    if (f.severity === 'error') score -= 18;
    else if (f.severity === 'warn') score -= 10;
  }
  return Math.max(0, Math.min(100, score));
}

/** Rule-based SEO audit (no LLM). guidelines/agent-devlog-blog-agents.md */
export function runSeoAudit(input: SeoAuditInput): SeoAuditResult {
  const findings: SeoFinding[] = [];
  const metaTitle = resolveBlogMetaTitle(input.title, input.seo);
  const metaDescription = resolveBlogMetaDescription(input.excerpt, input.seo);
  const plainContent = stripMarkdown(input.content);

  if (!input.title.trim()) {
    push(findings, 'title-missing', 'error', 'Post title is required.', 'title');
  } else if (input.title.trim().length < 12) {
    push(findings, 'title-short', 'warn', 'Title is quite short — aim for a clear, specific headline.', 'title');
  } else {
    push(findings, 'title-ok', 'pass', 'Title length looks good.', 'title');
  }

  if (!input.excerpt.trim()) {
    push(findings, 'excerpt-missing', 'error', 'Excerpt is required (used as meta description fallback).', 'excerpt');
  } else if (input.excerpt.trim().length < 50) {
    push(findings, 'excerpt-short', 'warn', 'Excerpt is short — expand for a stronger meta description fallback.', 'excerpt');
  } else {
    push(findings, 'excerpt-ok', 'pass', 'Excerpt is present.', 'excerpt');
  }

  if (metaTitle.length < 30) {
    push(findings, 'meta-title-short', 'warn', `Meta title is ${metaTitle.length} chars — 50–60 is ideal.`, 'metaTitle');
  } else if (metaTitle.length > 60) {
    push(findings, 'meta-title-long', 'warn', `Meta title is ${metaTitle.length} chars — may truncate in search results.`, 'metaTitle');
  } else {
    push(findings, 'meta-title-ok', 'pass', 'Meta title length is in a good range.', 'metaTitle');
  }

  if (metaDescription.length < 120) {
    push(findings, 'meta-desc-short', 'warn', `Meta description is ${metaDescription.length} chars — aim for 120–160.`, 'metaDescription');
  } else if (metaDescription.length > 160) {
    push(findings, 'meta-desc-long', 'warn', `Meta description is ${metaDescription.length} chars — may truncate.`, 'metaDescription');
  } else {
    push(findings, 'meta-desc-ok', 'pass', 'Meta description length is in a good range.', 'metaDescription');
  }

  if (!input.seo?.metaTitle?.trim()) {
    push(findings, 'meta-title-fallback', 'info', 'Meta title falls back to post title until you save custom SEO.', 'metaTitle');
  }

  if (!input.seo?.metaDescription?.trim()) {
    push(findings, 'meta-desc-fallback', 'info', 'Meta description falls back to excerpt until you save custom SEO.', 'metaDescription');
  }

  if (input.tags.length === 0) {
    push(findings, 'tags-missing', 'warn', 'Add at least one tag for discoverability.', 'tags');
  } else if (input.tags.length > 8) {
    push(findings, 'tags-many', 'warn', 'Many tags — consider focusing on 3–6 strong keywords.', 'tags');
  } else {
    push(findings, 'tags-ok', 'pass', 'Tags look reasonable.', 'tags');
  }

  if (plainContent.length < 300) {
    push(findings, 'content-thin', 'warn', 'Body content is thin — longer posts tend to rank better.', 'content');
  } else {
    push(findings, 'content-ok', 'pass', 'Body has substantial content.', 'content');
  }

  const suggested = {
    metaTitle: metaTitle.slice(0, 60),
    metaDescription: metaDescription.slice(0, 160),
  };

  return {
    score: scoreFromFindings(findings),
    findings,
    suggested,
  };
}
