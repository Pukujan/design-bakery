/**
 * What the site copilot knows (TASK-DB-0098). Everything is read from the site's own
 * sources at request time, so the copilot follows content changes without its own
 * copy: the portfolio JSON and research markdown in `frontend/src`, and published
 * blog posts from the database. Files are re-read when they change; blogs are cached
 * for a minute.
 */
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getBlogByNumericId, listBlogPosts } from '../../services/lib/content/blogPosts.js';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const PORTFOLIO = path.join(REPO, 'frontend/src/app/portfolios/endtoend-engineer/engineering');
const RESEARCH = path.join(REPO, 'frontend/src/app/modules/research');

export const SOCIAL_LINKS = [
  { label: 'LinkedIn', url: 'https://www.linkedin.com/in/pujan3645' },
  { label: 'GitHub', url: 'https://github.com/pukujan' },
  { label: 'Behance', url: 'https://www.behance.net/pujan3645' },
  { label: 'Email', url: 'mailto:pujan3645@gmail.com' },
] as const;

/** Site sections the copilot can send a visitor to. */
export const SITE_PAGES = [
  { path: '/', label: 'Home' },
  { path: '/#about', label: 'About' },
  { path: '/#experience', label: 'Work history' },
  { path: '/#projects', label: 'Projects' },
  { path: '/#contact', label: 'Contact' },
  { path: '/blogs', label: 'Blog' },
  { path: '/research', label: 'Research' },
] as const;

export type ProjectLink = { label: string; url: string };
export type Project = {
  id: number;
  slug: string;
  title: string;
  category?: string;
  tagline: string;
  description: string;
  tech: string[];
  status?: string;
  links?: ProjectLink[];
};
type Experience = {
  company: string;
  role: string;
  period: string;
  location?: string;
  expandedSummary?: string;
  collapsedSummary?: string;
  highlights?: string[];
};
type About = { roleTitle?: string; paragraphs?: string[]; highlights?: unknown };
type Hero = { titleLine1?: string; titleLine2?: string; description?: string; badge?: string };
type SkillCategory = { title: string; skills: string[] };

export type Paper = { id: string; title: string; status: string; submitted: string; abstract: string };
export type BlogSummary = { id: number; title: string; excerpt: string; date: string; tags: string[] };

const fileCache = new Map<string, { mtimeMs: number; value: unknown }>();

/** A file's parsed content, re-read only when its mtime changes. */
async function cached<T>(file: string, parse: (text: string) => T): Promise<T> {
  const { mtimeMs } = await stat(file);
  const hit = fileCache.get(file);
  if (hit && hit.mtimeMs === mtimeMs) return hit.value as T;
  const value = parse(await readFile(file, 'utf8'));
  fileCache.set(file, { mtimeMs, value });
  return value;
}

const json = <T>(name: string) => cached<T>(path.join(PORTFOLIO, name), (text) => JSON.parse(text) as T);

export const loadProjects = () => json<Project[]>('projects.json');

/** Paper metadata from researchPapers.ts, read as text: id, title, status, date and abstract. */
export async function loadPapers(): Promise<Paper[]> {
  return cached(path.join(RESEARCH, 'data/researchPapers.ts'), (text) => {
    const papers: Paper[] = [];
    const blocks = text.split(/\nconst PAPER_\d+: ResearchPaper = \{/).slice(1);
    for (const block of blocks) {
      const str = (key: string) => {
        const m = new RegExp(`\\n  ${key}:\\s*'((?:[^'\\\\]|\\\\.)*)'`).exec(block);
        return m ? m[1].replace(/\\'/g, "'") : '';
      };
      const id = str('id');
      if (id) papers.push({ id, title: str('title'), status: str('status'), submitted: str('submitted'), abstract: str('abstract') });
    }
    return papers;
  });
}

/** One paper's markdown body, by id (db-r-YYYY-NNN). */
export async function readPaper(id: string): Promise<string | null> {
  if (!/^db-r-\d{4}-\d{3}$/.test(id)) return null;
  const names = await readdir(path.join(RESEARCH, 'content'));
  if (!names.includes(`${id}.md`)) return null;
  return readFile(path.join(RESEARCH, 'content', `${id}.md`), 'utf8');
}

let blogCache: { at: number; value: BlogSummary[] } | null = null;

export async function loadBlogs(): Promise<BlogSummary[]> {
  if (blogCache && Date.now() - blogCache.at < 60_000) return blogCache.value;
  try {
    const posts = await listBlogPosts({ includeContent: false, publishedOnly: true });
    const value = posts.map((post) => ({
      id: Number(post.numericId),
      title: post.title.trim(),
      excerpt: post.excerpt,
      date: post.date,
      tags: post.tags,
    }));
    blogCache = { at: Date.now(), value };
    return value;
  } catch {
    // The database being away should not take the copilot down; it answers without blogs.
    return blogCache?.value ?? [];
  }
}

export async function readBlog(id: number): Promise<{ title: string; content: string } | null> {
  try {
    const { blog } = await getBlogByNumericId(id);
    return blog.publishedAt ? { title: blog.title, content: blog.content } : null;
  } catch {
    return null;
  }
}

export const projectPath = (project: Project) => `/work/${project.slug}`;

const clip = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

/**
 * The whole site as a compact brief for the system prompt. It is small (about 6k
 * tokens), so the model sees all of it on every turn instead of searching for it.
 */
export async function siteBrief(): Promise<string> {
  const [hero, about, experience, skills, projects, papers, blogs] = await Promise.all([
    json<Hero>('hero.json'),
    json<About>('about.json'),
    json<{ experiences: Experience[] }>('relevant-experience.json'),
    json<SkillCategory[]>('skill-categories.json'),
    loadProjects(),
    loadPapers(),
    loadBlogs(),
  ]);

  const lines: string[] = [];
  lines.push('## Who', [hero.titleLine1, hero.titleLine2].filter(Boolean).join(' '), hero.description ?? '', hero.badge ?? '');
  lines.push('', '## About', about.roleTitle ?? '', ...(about.paragraphs ?? []));
  lines.push('', '## Work history');
  for (const job of experience.experiences) {
    lines.push(`- ${job.role}, ${job.company} (${job.period}${job.location ? `, ${job.location}` : ''}): ${job.expandedSummary ?? job.collapsedSummary ?? ''}`);
    for (const point of (job.highlights ?? []).slice(0, 4)) lines.push(`  - ${point}`);
  }
  lines.push('', '## Skills', ...skills.map((group) => `- ${group.title}: ${group.skills.join(', ')}`));
  lines.push('', '## Projects (slug | title | category | status)');
  for (const p of projects) {
    lines.push(`- ${p.slug} | ${p.title} | ${p.category ?? ''} | ${p.status ?? ''}`);
    lines.push(`  ${p.tagline}. ${p.description}`);
    lines.push(`  Tech: ${p.tech.join(', ')}`);
    const links = (p.links ?? []).filter((link) => link.url && link.url !== '#');
    if (links.length) lines.push(`  Links: ${links.map((link) => `${link.label} ${link.url}`).join('; ')}`);
  }
  lines.push('', '## Research papers (id | title | status | submitted). All are working papers unless status is approved.');
  for (const paper of papers) lines.push(`- ${paper.id} | ${paper.title} | ${paper.status} | ${paper.submitted}`, `  ${clip(paper.abstract, 420)}`);
  lines.push('', '## Blog posts (id | date | title)');
  for (const post of blogs) lines.push(`- ${post.id} | ${post.date} | ${post.title}: ${clip(post.excerpt, 160)}`);
  lines.push('', '## Links', ...SOCIAL_LINKS.map((link) => `- ${link.label}: ${link.url}`));
  lines.push('', '## Site pages', ...SITE_PAGES.map((page) => `- ${page.path} (${page.label})`), '- /work/<slug> (one presentation page per project)', '- /blogs/<id>', '- /research/papers/<id>');
  return lines.join('\n');
}
