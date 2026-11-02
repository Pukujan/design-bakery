/**
 * The copilot's tools. Look-ups run here; page moves (navigate, show projects, links,
 * booking) are sent to the browser as actions, which the site carries out with its own
 * router, so the conversation and any voice call stay open while the page changes.
 */
import { tool } from 'ai';
import { z } from 'zod';
import { loadBlogs, loadPapers, loadProjects, projectPath, readBlog, readPaper, SITE_PAGES, SOCIAL_LINKS } from './knowledge.js';

export const CONSULT_SERVICES = ['AI engineering', 'Product design', 'Marketing', 'Full-stack development'] as const;

export type CopilotAction =
  | { kind: 'navigate'; path: string; label: string; go?: boolean }
  | { kind: 'projects'; slugs: string[] }
  | { kind: 'link'; label: string; url: string }
  | { kind: 'book'; url: string; name?: string; email?: string; topic?: string };

const clip = (text: string, max: number) => (text.length > max ? `${text.slice(0, max)}…` : text);

/** Paths the copilot may send a visitor to: the site's own pages, nothing else. */
async function knownPath(path: string): Promise<boolean> {
  const clean = path.split('#')[0] || '/';
  if (SITE_PAGES.some((page) => page.path.split('#')[0] === clean)) return true;
  const [projects, papers, blogs] = await Promise.all([loadProjects(), loadPapers(), loadBlogs()]);
  if (projects.some((p) => projectPath(p) === clean)) return true;
  if (papers.some((p) => `/research/papers/${p.id}` === clean)) return true;
  return blogs.some((b) => `/blogs/${b.id}` === clean);
}

/** The booking page with what the visitor already said filled in (Cal.com reads these). */
export function bookingUrl(base: string, who: { name?: string; email?: string; topic?: string }): string {
  const url = new URL(base);
  if (who.name) url.searchParams.set('name', who.name);
  if (who.email) url.searchParams.set('email', who.email);
  if (who.topic) url.searchParams.set('notes', who.topic);
  return url.toString();
}

/**
 * `canNavigate` is true only when the visitor has just said yes to an offer to open a
 * page (route.ts decides that). Without it, navigate refuses and the model must ask.
 */
export function makeTools(emit: (action: CopilotAction) => void, options: { canNavigate: boolean }) {
  return {
    search_site: tool({
      description: 'Search projects, research papers and blog posts by keywords. Use it when the brief is not enough.',
      inputSchema: z.object({ query: z.string().min(1).max(200) }),
      execute: async ({ query }) => {
        const words = query.toLowerCase().split(/\W+/).filter((w) => w.length > 2);
        const score = (text: string) => words.reduce((n, w) => n + (text.toLowerCase().includes(w) ? 1 : 0), 0);
        const [projects, papers, blogs] = await Promise.all([loadProjects(), loadPapers(), loadBlogs()]);
        const hits = [
          ...projects.map((p) => ({ kind: 'project', ref: projectPath(p), title: p.title, text: `${p.tagline}. ${p.description} ${p.tech.join(' ')}` })),
          ...papers.map((p) => ({ kind: 'paper', ref: `/research/papers/${p.id}`, title: p.title, text: p.abstract })),
          ...blogs.map((b) => ({ kind: 'blog', ref: `/blogs/${b.id}`, title: b.title, text: `${b.excerpt} ${b.tags.join(' ')}` })),
        ]
          .map((hit) => ({ ...hit, score: score(`${hit.title} ${hit.text}`) }))
          .filter((hit) => hit.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 6);
        return hits.map(({ kind, ref, title, text }) => ({ kind, ref, title, summary: clip(text, 300) }));
      },
    }),

    read_blog: tool({
      description: 'Read one blog post in full, by its numeric id from the brief.',
      inputSchema: z.object({ id: z.number().int().positive() }),
      execute: async ({ id }) => {
        const post = await readBlog(id);
        return post ? { title: post.title, text: clip(post.content, 6000) } : { error: 'not found' };
      },
    }),

    read_paper: tool({
      description: 'Read one research paper, by its id (db-r-YYYY-NNN).',
      inputSchema: z.object({ id: z.string() }),
      execute: async ({ id }) => {
        const body = await readPaper(id);
        return body ? { text: clip(body, 8000) } : { error: 'not found' };
      },
    }),

    navigate: tool({
      description:
        'Open a page on this site for the visitor, while the conversation stays open: a section (/#about, /#experience, /#work), /contact, /work/<slug>, /blogs, /blogs/<id>, /research, /research/papers/<id>. Only call it after the visitor has said yes to your question "Want me to open the <page> page?". Never call it unasked, even for a tour or a direct request.',
      inputSchema: z.object({ path: z.string(), label: z.string().max(60) }),
      execute: async ({ path, label }) => {
        if (!options.canNavigate) {
          return { ok: false, error: 'The visitor has not said yes yet. Ask first, "Want me to open the <page> page?", and wait for a yes.' };
        }
        if (!(await knownPath(path))) return { ok: false, error: 'not a page on this site' };
        emit({ kind: 'navigate', path, label, go: true });
        return { ok: true };
      },
    }),

    show_projects: tool({
      description: 'Show project cards under your answer, by slug. Use for "which projects…" questions.',
      inputSchema: z.object({ slugs: z.array(z.string()).min(1).max(4) }),
      execute: async ({ slugs }) => {
        const known = new Set((await loadProjects()).map((p) => p.slug));
        const valid = slugs.filter((slug) => known.has(slug));
        if (valid.length) emit({ kind: 'projects', slugs: valid });
        return { shown: valid };
      },
    }),

    share_link: tool({
      description: 'Give the visitor a link button: LinkedIn, GitHub, Behance, Email, or a project link from the brief.',
      inputSchema: z.object({ label: z.string().max(60), url: z.string().url() }),
      execute: async ({ label, url }) => {
        const projects = await loadProjects();
        const allowed = [...SOCIAL_LINKS.map((l) => l.url), ...projects.flatMap((p) => (p.links ?? []).map((l) => l.url))];
        if (!allowed.includes(url)) return { ok: false, error: 'only links from the brief' };
        emit({ kind: 'link', label, url });
        return { ok: true };
      },
    }),

    book_call: tool({
      description:
        'Offer a free 30-minute consultation call with me. I consult on four things: AI engineering, product design, marketing, and full-stack development. If they have not said which one, ask once; the topic is optional. As soon as the area is known and the visitor agrees ("ok", "yes", "sure", or any topic at all), call this straight away; never ask the same question twice. It shows a booking card; the visitor picks the time. Use it only on the Contact page or when the visitor asks to book in chat.',
      inputSchema: z.object({
        service: z.enum(CONSULT_SERVICES).optional(),
        name: z.string().max(80).optional(),
        email: z.string().email().optional(),
        topic: z.string().max(300).optional(),
      }),
      execute: async (who) => {
        const base = process.env.COPILOT_BOOKING_URL?.trim();
        if (!base) {
          emit({ kind: 'link', label: 'Email me', url: 'mailto:pujan3645@gmail.com' });
          return { ok: false, note: 'Booking is not set up yet; an email link was shown instead.' };
        }
        const topic = [who.service, who.topic].filter(Boolean).join(': ') || undefined;
        emit({ kind: 'book', url: bookingUrl(base, { ...who, topic }), name: who.name, email: who.email, topic });
        return { ok: true };
      },
    }),
  };
}
