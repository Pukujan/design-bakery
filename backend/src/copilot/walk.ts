/**
 * Moving through the site's lists, as data for the tools (tools.ts): the next or previous paper, post or project of the page the
 * visitor is on, and the next stop of a tour. The model decides when to call them; nothing here reads a visitor's words.
 */
import { blogTime, loadBlogs, loadPapers, loadProjects, projectPath, type BlogSummary, type Paper, type Project } from './knowledge.js';
import { orderProjectsForShowcase } from './projectOrder.js';

export type Stop = { path: string; title: string; kind: 'project' | 'paper' | 'blog'; blurb: string };
type Site = { projects: Project[]; papers: Paper[]; blogs: BlogSummary[] };

const squash = (text: string) => Array.from(text, (c) => (c.trim() === '' ? ' ' : c)).join('').split(' ').filter(Boolean).join(' ');
/** Without its closing punctuation. */
function trimEnd(text: string): string {
  let out = squash(text);
  while (out && '.!?… '.includes(out.at(-1) as string)) out = out.slice(0, -1);
  return out;
}
/** The start of a text, cut at a sentence end when it can be, at most about `limit` characters. */
export function lead(text: string, limit: number): string {
  const sentences = squash(text).split('. ');
  let out = '';
  for (const sentence of sentences) {
    if (out && `${out}. ${sentence}`.length > limit) break;
    out = out ? `${out}. ${sentence}` : sentence;
    if (out.length >= limit * 0.6) break;
  }
  return out;
}
const projectBlurb = (p: Project, size: number) => [p.tagline, lead(p.description, size)].filter(Boolean).map(trimEnd).join('. ');

const newestBlog = (blogs: BlogSummary[]) => [...blogs].sort((a, b) => blogTime(b) - blogTime(a))[0];
const newestPaper = (papers: Paper[]) => [...papers].sort((a, b) => b.submitted.localeCompare(a.submitted))[0];

async function site(): Promise<Site> {
  const [projects, papers, blogs] = await Promise.all([loadProjects(), loadPapers(), loadBlogs()]);
  return { projects, papers, blogs };
}

/** The tour, in order: shipped projects, the newest approved paper, the newest post, then the remaining projects. */
export function tourStops(s: Site): Stop[] {
  const asStop = (p: Project): Stop => ({ path: projectPath(p), title: p.title, kind: 'project', blurb: projectBlurb(p, 110) });
  const stops = s.projects.filter((p) => p.category === 'shipped').map(asStop);
  const paper = newestPaper(s.papers.filter((p) => p.status === 'approved'));
  if (paper) stops.push({ path: `/research/papers/${paper.id}`, title: paper.title, kind: 'paper', blurb: lead(paper.abstract, 120) });
  const blog = newestBlog(s.blogs);
  if (blog) stops.push({ path: `/blogs/${blog.id}`, title: blog.title, kind: 'blog', blurb: lead(blog.excerpt, 120) });
  stops.push(...s.projects.filter((p) => p.category !== 'shipped').map(asStop));
  return stops;
}

/** The first stop of the tour that the conversation has not named yet; `said` is what was said so far. */
export async function nextTourStop(said: string): Promise<{ stop: Stop; after?: Stop } | null> {
  const heard = said.toLowerCase();
  const stops = tourStops(await site());
  const at = stops.findIndex((stop) => !heard.includes(stop.title.toLowerCase()));
  return at < 0 ? null : { stop: stops[at], after: stops[at + 1] };
}

/** The list the visitor is in, as stops in page order, and where they are in it (-1 on the list page itself). */
function listAround(s: Site, path: string): { items: Stop[]; at: number; noun: string; other: string } | null {
  const parts = path.split('#')[0].split('/').filter(Boolean);
  const [top, ...rest] = parts;
  if (top === 'research' && (parts.length === 1 || (rest[0] === 'papers' && parts.length <= 3))) {
    const items = s.papers.map((p): Stop => ({ path: `/research/papers/${p.id}`, title: p.title, kind: 'paper', blurb: lead(p.abstract, 120) }));
    return { items, at: parts.length === 3 ? items.findIndex((i) => i.path === path.split('#')[0]) : -1, noun: 'paper', other: 'the blog or the projects' };
  }
  if (top === 'work' && parts.length === 2) {
    const items = orderProjectsForShowcase(s.projects).map((p): Stop => ({ path: projectPath(p), title: p.title, kind: 'project', blurb: projectBlurb(p, 100) }));
    return { items, at: items.findIndex((i) => i.path === `/work/${parts[1]}`), noun: 'project', other: 'the research or the blog' };
  }
  if (top === 'blogs' && parts.length <= 2) {
    const items = s.blogs.map((b): Stop => ({ path: `/blogs/${b.id}`, title: b.title, kind: 'blog', blurb: lead(b.excerpt, 120) }));
    return { items, at: parts.length === 2 ? items.findIndex((i) => i.path === `/blogs/${parts[1]}`) : -1, noun: 'post', other: 'the research or the projects' };
  }
  return null;
}

/** The item next to the page `path` in its list: `stop` to open, or `end` when there is none that way, or null when `path` is in no list. */
export async function neighbour(path: string, dir: 1 | -1): Promise<{ stop: Stop; after?: Stop } | { end: string } | null> {
  const list = listAround(await site(), path);
  if (!list || !list.items.length) return null;
  const to = list.at + dir;
  if (to < 0 || to >= list.items.length) {
    return { end: dir > 0 ? `That was the last ${list.noun}. Offer to go to ${list.other}.` : `This is the first ${list.noun}. Offer to take them through the others with next.` };
  }
  return { stop: list.items[to], after: dir > 0 ? list.items[to + 1] : undefined };
}
