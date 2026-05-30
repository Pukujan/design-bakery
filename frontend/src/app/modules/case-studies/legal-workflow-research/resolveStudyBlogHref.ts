import {
  resolveBlogNumericId,
  type BlogSummary,
} from '@/modules/blog/data/blogData';
import type { StudyBlogEntry } from './legalWorkflowCaseStudyData';

function normalizeTitle(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

const TITLE_KEYWORDS: Record<string, string[]> = {
  'the extraction is easy. the confidence is hard.': ['extraction', 'confidence'],
  'from legal hallucinations to litigation intelligence': ['hallucination', 'litigation intelligence'],
  'stop building god-object orchestrators in ai pipelines': ['god-object', 'orchestrator'],
  'stop accumulating agent memory. start engineering context.': ['agent memory', 'engineering context'],
  'why modular monoliths fracture at scale': ['modular monolith', 'fracture'],
};

function titleMatches(postTitle: string, targetTitle: string): boolean {
  const post = normalizeTitle(postTitle);
  const target = normalizeTitle(targetTitle);
  if (post === target) return true;
  const head = target.slice(0, 28);
  if (post.includes(head) || target.includes(post.slice(0, 28))) return true;
  const keywords = TITLE_KEYWORDS[target];
  if (!keywords) return false;
  return keywords.every((word) => post.includes(word));
}

export function resolveStudyBlogHref(
  entry: Pick<StudyBlogEntry, 'title' | 'fallbackNumericId'>,
  blogs: BlogSummary[],
): string {
  const match = blogs.find((blog) => titleMatches(blog.title, entry.title));
  const numericId = match
    ? resolveBlogNumericId(match)
    : entry.fallbackNumericId;
  return numericId ? `/endtoend-engineer/blogs/${numericId}` : '/endtoend-engineer/blogs';
}
