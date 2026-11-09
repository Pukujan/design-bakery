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
import { sectionsOfMarkdown, sectionsOfProject, type Section } from './sections.js';
import { getCmsArray, getCmsObject } from '../../services/lib/content/cmsDocuments.js';

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
  { path: '/#work', label: 'Projects' },
  { path: '/contact', label: 'Contact' },
  { path: '/blogs', label: 'Blog' },
  { path: '/research', label: 'Research' },
] as const;

/**
 * What the page at this path is, in words, from the site's own content: "the Contact page", "the paper db-r-2026-008, \"…\"".
 * The page sends document.title too, but that is the same site-wide title on most pages, so it said nothing; on the
 * 2026-11-08 call the copilot told a visitor on /contact three times that they were on the paper they had left.
 */
export async function describePage(pagePath: string): Promise<string> {
  const clean = pagePath.split('#')[0] || '/';
  const parts = clean.split('/').filter(Boolean);
  if (parts[0] === 'research' && parts[1] === 'papers' && parts[2]) {
    const paper = (await loadPapers()).find((p) => p.id === parts[2]);
    if (paper) return `the paper ${paper.id}, "${paper.title}"`;
  }
  if (parts[0] === 'blogs' && parts[1]) {
    const post = (await loadBlogs()).find((b) => String(b.id) === parts[1]);
    if (post) return `the blog post "${post.title}"`;
  }
  if (parts[0] === 'work' && parts[1]) {
    const project = (await loadProjects()).find((p) => p.slug === parts[1]);
    if (project) return `the ${project.title} project page`;
  }
  const page = SITE_PAGES.find((p) => p.path === pagePath) ?? SITE_PAGES.find((p) => p.path === clean);
  return page ? `the ${page.label} page` : 'a page of this site';
}

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
  stats?: Array<{ label: string }>;
  /** One measured outcome line (TASK-DB-0161). */
  outcome?: string;
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
type About = {
  roleTitle?: string;
  paragraphs?: string[];
  highlights?: unknown;
  reach?: { value: string; label: string };
  impact?: { value: string; label: string }[];
  aiSection?: { headline?: string; items?: { title: string; desc: string }[] };
};
type Hero = { titleLine1?: string; titleLine2?: string; description?: string; badge?: string };
type SkillCategory = { title: string; skills: string[] };

export type Paper = { id: string; title: string; status: string; submitted: string; abstract: string; result?: string };
export type BlogSummary = { id: number; title: string; excerpt: string; date: string; tags: string[]; publishedAt?: string };

/**
 * When a post was written, for ordering. `date` is the display date the author set ("June 18 2026",
 * "November 2025"), which as text sorts November after June; `publishedAt` is only the fallback, since posts
 * imported in one batch all share an import time.
 */
export const blogTime = (post: Pick<BlogSummary, 'date' | 'publishedAt'>) => Date.parse(post.date) || Date.parse(post.publishedAt ?? '') || 0;

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

/**
 * Octo is the source for the portfolio content (cms_documents, portfolio endtoend-engineer, key prefix ete__).
 * The repo JSON is the fallback when Octo cannot be read. Octo reads are cached for a minute.
 */
const OCTO_DOCS: Record<string, { collection: string; wrapper: 'item' | 'items' }> = {
  'hero.json': { collection: 'engineering_hero_content', wrapper: 'item' },
  'about.json': { collection: 'engineering_about_content', wrapper: 'item' },
  'projects.json': { collection: 'engineering_projects', wrapper: 'items' },
  'skill-categories.json': { collection: 'engineering_skills', wrapper: 'items' },
  'skills-meta.json': { collection: 'engineering_skills_meta', wrapper: 'item' },
  'relevant-experience.json': { collection: 'relevant_experience_content', wrapper: 'item' },
};
const octoCache = new Map<string, { at: number; value: unknown }>();

async function fromOcto<T>(name: string): Promise<T | null> {
  const doc = OCTO_DOCS[name];
  if (!doc) return null;
  const hit = octoCache.get(name);
  if (hit && Date.now() - hit.at < 60_000) return hit.value as T | null;
  try {
    const key = `ete__${doc.collection}`;
    const value = doc.wrapper === 'items' ? await getCmsArray(key, [] as unknown[]) : await getCmsObject(key, null);
    const empty = Array.isArray(value) && value.length === 0;
    const result = (value && !empty ? value : null) as T | null;
    if (result) octoCache.set(name, { at: Date.now(), value: result });
    return result;
  } catch {
    return null;
  }
}

const json = async <T>(name: string): Promise<T> => {
  const fromDb = await fromOcto<T>(name);
  if (fromDb) return fromDb;
  return cached<T>(path.join(PORTFOLIO, name), (text) => JSON.parse(text) as T);
};

export const loadProjects = () => json<Project[]>('projects.json');

export const loadExperience = () => json<{ experiences: Experience[] }>('relevant-experience.json');

/** Paper metadata from researchPapers.ts, read as text: id, title, status, date and abstract. */
export async function loadPapers(): Promise<Paper[]> {
  return cached(path.join(RESEARCH, 'data/researchPapers.ts'), (text) => {
    const papers: Paper[] = [];
    const publicList = /export const RESEARCH_PAPERS:\s*ResearchPaper\[\]\s*=\s*\[([\s\S]*?)\];/.exec(text)?.[1] ?? '';
    const publicNames = new Set(publicList.match(/\bPAPER_\d+\b/g) ?? []);
    const blocks = text.split(/\nconst (PAPER_\d+): ResearchPaper = \{/).slice(1);
    for (let i = 0; i < blocks.length; i += 2) {
      if (!publicNames.has(blocks[i])) continue;
      const block = blocks[i + 1];
      const str = (key: string) => {
        const m = new RegExp(`\\n  ${key}:\\s*'((?:[^'\\\\]|\\\\.)*)'`).exec(block);
        return m ? m[1].replace(/\\'/g, "'") : '';
      };
      const id = str('id');
      if (id) papers.push({ id, title: str('title'), status: str('status'), submitted: str('submitted'), abstract: str('abstract'), result: str('result') || undefined });
    }
    return papers;
  });
}

/** One paper's markdown body, by id (db-r-YYYY-NNN). */
export async function readPaper(id: string): Promise<string | null> {
  if (!/^db-r-\d{4}-\d{3}$/.test(id)) return null;
  // The directory can contain drafts that are not listed on the public site.
  if (!(await loadPapers()).some((paper) => paper.id === id)) return null;
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
      publishedAt: post.publishedAt,
    }));
    // Newest first, so the brief and every "latest" answer agree.
    value.sort((a, b) => blogTime(b) - blogTime(a));
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
 * The whole site as a compact brief for the system prompt. Kept near 2k tokens: the
 * traces showed the first version sending about 8k on every turn, of which most was
 * abstracts and excerpts the model rarely needed. What is cut here is still reachable
 * through search_site and the read_* tools, which is where depth belongs.
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
  if (about.reach) lines.push(`Reach: ${about.reach.value} ${about.reach.label}`);
  for (const item of about.impact ?? []) lines.push(`- ${item.value} ${item.label}`);
  if (about.aiSection?.items?.length) {
    lines.push('', `## ${about.aiSection.headline ?? 'What I can do with AI'}`);
    for (const item of about.aiSection.items) lines.push(`- ${item.title}: ${clip(item.desc, 160)}`);
  }
  lines.push('', '## Work history');
  for (const job of experience.experiences) {
    lines.push(`- ${job.role}, ${job.company} (${job.period}${job.location ? `, ${job.location}` : ''}): ${clip(job.expandedSummary ?? job.collapsedSummary ?? '', 220)}`);
    for (const point of (job.highlights ?? []).slice(0, 2)) lines.push(`  - ${clip(point, 140)}`);
  }
  lines.push('', '## Skills', ...skills.map((group) => `- ${group.title}: ${group.skills.join(', ')}`));
  lines.push('', '## Projects (slug | title | category | status)');
  for (const p of projects) {
    lines.push(`- ${p.slug} | ${p.title} | ${p.category ?? ''} | ${p.status ?? ''}`);
    lines.push(`  ${clip(`${p.tagline}. ${p.description}`, 220)}`);
    if (p.outcome) lines.push(`  Outcome: ${clip(p.outcome, 200)}`);
    lines.push(`  Tech: ${p.tech.join(', ')}`);
    const links = (p.links ?? []).filter((link) => link.url && link.url !== '#');
    if (links.length) lines.push(`  Links: ${links.map((link) => `${link.label} ${link.url}`).join('; ')}`);
  }
  lines.push('', '## Research papers (id | title | status | submitted). All are working papers unless status is approved.');
  for (const paper of papers) {
    lines.push(`- ${paper.id} | ${paper.title} | ${paper.status} | ${paper.submitted}`, `  ${clip(paper.abstract, 150)}`);
    if (paper.result) lines.push(`  Result: ${clip(paper.result, 160)}`);
  }
  lines.push('', '## Blog posts, newest first (id | date | title)');
  for (const post of blogs) lines.push(`- ${post.id} | ${post.date} | ${post.title}: ${clip(post.excerpt, 80)}`);
  lines.push('', '## Links', ...SOCIAL_LINKS.map((link) => `- ${link.label}: ${link.url}`));
  lines.push('', '## Site pages', ...SITE_PAGES.map((page) => `- ${page.path} (${page.label})`), '- /work/<slug> (one presentation page per project)', '- /blogs/<id>', '- /research/papers/<id>');
  return lines.join('\n');
}

/** Where a path's sections come from: a blog post, a research paper or a project, read live. Null for any other page. */
export async function sectionsForPath(pagePath: string): Promise<Section[] | null> {
  const clean = pagePath.split('#')[0];
  const blog = /^\/blogs\/(\d+)$/.exec(clean);
  if (blog) {
    const post = await readBlog(Number(blog[1]));
    return post ? sectionsOfMarkdown(post.content, { levels: [1, 2, 3] }) : null;
  }
  const paper = /^\/research\/papers\/(db-r-\d{4}-\d{3})$/.exec(clean);
  if (paper) {
    const body = await readPaper(paper[1]);
    return body ? sectionsOfMarkdown(body, { levels: [1, 2, 3], visuals: true }) : null;
  }
  if (/^\/work\/[^/]+$/.test(clean)) {
    const project = (await loadProjects()).find((p) => projectPath(p) === clean);
    return project ? sectionsOfProject(project) : null;
  }
  return null;
}
