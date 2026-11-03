/**
 * The copilot's tools. Look-ups run here; page moves (navigate, show projects, links,
 * booking) are sent to the browser as actions, which the site carries out with its own
 * router, so the conversation and any voice call stay open while the page changes.
 */
import { tool } from 'ai';
import { z } from 'zod';
import type { Citations } from './citations.js';
import { buildPassages, checkQuote, findSection, MAX_PASSAGES, QUOTE_MAX, SUMMARY_PASSAGES } from './sections.js';
import { blogTime, loadBlogs, loadPapers, loadProjects, loadShownExperience, projectPath, readBlog, readPaper, sectionsForPath, SITE_PAGES, SOCIAL_LINKS } from './knowledge.js';
import { searchSite } from './siteSearch.js';

export const CONSULT_SERVICES = ['AI engineering', 'Product design', 'Marketing', 'Full-stack development'] as const;

export type CopilotAction =
  | { kind: 'navigate'; path: string; label: string; go?: boolean }
  | { kind: 'projects'; slugs: string[] }
  | { kind: 'link'; label: string; url: string }
  | { kind: 'book'; url: string; name?: string; email?: string; topic?: string }
  /** Voice calls only: scroll to a section when the spoken answer reaches character `at`. */
  | { kind: 'scrollstep'; path: string; at: number }
  /** Point at a real section of a post, paper or project: scroll to `anchor`, tap it, and highlight `quote` if one was checked. */
  | { kind: 'cite'; path: string; anchor: string; heading: string; quote?: string; mode?: 'swipe' | 'perch' }
  /** An expansion chip: a follow-up question that stays in the chat. The server sets `chip` on every action (chips.ts). */
  | { kind: 'ask'; text: string };

const clip = (text: string, max: number) => (text.length > max ? `${text.slice(0, max)}…` : text);

export type CatalogItem = { title: string; path: string; status?: string; category?: string; date?: string };
/** `filter` matches status or category, so "shipped" finds the Shipped category and "approved" a paper's status. */
export type CatalogQuery = { kind: 'projects' | 'papers' | 'posts' | 'roles'; filter?: string; newest?: number };

/**
 * Lists and counts from the content itself, not from search (TASK-DB-0142): "how many papers", "latest post", "which
 * projects are shipped". Search returns the top few passages, so it cannot answer these completely; this is the one
 * kind of fact a reply takes from the loaders instead of the retrieved passages. Posts and roles come newest first.
 */
export async function siteCatalog(query: CatalogQuery): Promise<{ kind: string; count: number; items: CatalogItem[] }> {
  const wanted = query.filter?.trim().toLowerCase();
  let items: CatalogItem[];
  if (query.kind === 'projects') {
    items = (await loadProjects()).map((p) => ({ title: p.title, path: projectPath(p), status: p.status, category: p.category }));
  } else if (query.kind === 'papers') {
    items = (await loadPapers()).map((p) => ({ title: p.title, path: `/research/papers/${p.id}`, status: p.status === 'approved' ? 'approved' : 'working paper', date: p.submitted }));
  } else if (query.kind === 'posts') {
    items = [...(await loadBlogs())].sort((a, b) => blogTime(b) - blogTime(a)).map((b) => ({ title: b.title, path: `/blogs/${b.id}`, date: b.date }));
  } else {
    items = (await loadShownExperience()).experiences.map((j) => ({ title: `${j.role}, ${j.company}`, path: '/#experience', date: j.period }));
  }
  if (wanted) items = items.filter((item) => [item.status, item.category].some((v) => (v ?? '').toLowerCase().includes(wanted)));
  return { kind: query.kind, count: items.length, items: query.newest ? items.slice(0, query.newest) : items };
}

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
export function makeTools(emit: (action: CopilotAction) => void, options: { canNavigate: boolean; citations?: Citations }) {
  const citations = options.citations;
  return {
    site_catalog: tool({
      description:
        'The complete list of my projects, papers, blog posts or roles, with an exact count, optionally filtered by a status or category word ("shipped", "research", "experiment", "ongoing", "approved", "working paper"); posts newest first (newest: 1 for the latest). Use it for counts, "list", "latest" and "which are…" questions; search cannot answer those completely.',
      inputSchema: z.object({
        kind: z.enum(['projects', 'papers', 'posts', 'roles']),
        filter: z.string().max(60).optional(),
        newest: z.number().int().min(1).max(50).optional(),
      }),
      execute: async (query) => {
        const out = await siteCatalog(query);
        for (const item of out.items) citations?.retrieve(item.path);
        return out;
      },
    }),

    search_site: tool({
      description: 'Search the full text of projects, research papers and blog posts; returns the best-matching pages with a passage from each. Use it when the brief is not enough.',
      inputSchema: z.object({ query: z.string().min(1).max(200) }),
      execute: async ({ query }) => {
        const { hits } = await searchSite(query);
        for (const hit of hits) citations?.retrieve(hit.ref);
        return hits;
      },
    }),

    read_blog: tool({
      description: 'Read one blog post in full, by its numeric id from the brief.',
      inputSchema: z.object({ id: z.number().int().positive() }),
      execute: async ({ id }) => {
        const post = await readBlog(id);
        if (!post) return { error: 'not found' };
        citations?.retrieve(`/blogs/${id}`);
        const sections = (await sectionsForPath(`/blogs/${id}`)) ?? [];
        return { title: post.title, sections: sections.map((s) => s.heading), text: clip(post.content, 6000) };
      },
    }),

    read_paper: tool({
      description: 'Read one research paper, by its id (db-r-YYYY-NNN).',
      inputSchema: z.object({ id: z.string() }),
      execute: async ({ id }) => {
        const body = await readPaper(id);
        if (!body) return { error: 'not found' };
        citations?.retrieve(`/research/papers/${id}`);
        const sections = (await sectionsForPath(`/research/papers/${id}`)) ?? [];
        return { sections: sections.map((s) => s.heading), text: clip(body, 8000) };
      },
    }),

    navigate: tool({
      description:
        'Open a page on this site for the visitor, while the conversation stays open: a section (/#about, /#experience, /#work), /contact, /work/<slug>, /blogs, /blogs/<id>, /research, /research/papers/<id>. In a text chat, only call it after the visitor has said yes to your question "Want me to open the <page> page?", and never unasked. On a voice call you may call it directly.',
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

    cite_section: tool({
      description: `Point at a section of a blog post, research paper or project while you talk about it: the page scrolls to that heading, the cursor taps it, and a short passage is highlighted. path is /blogs/<id>, /research/papers/<id> or /work/<slug>. you must have read the post or paper this turn (read_blog or read_paper), or it is refused. heading must be a heading you saw in its "sections" list (a project page has What it is, Highlights, Built with, Go deeper). quote is optional: a passage of at most ${QUOTE_MAX} characters copied word for word from that section. If it returns ok false, do not retry with a made-up heading; just keep talking.`,
      inputSchema: z.object({ path: z.string().max(200), heading: z.string().min(1).max(200), quote: z.string().max(400).optional() }),
      execute: async ({ path, heading, quote }) => {
        const clean = path.split('#')[0];
        if (!(await knownPath(clean))) {
          citations?.record({ path: clean, ok: false, reason: 'not a page on this site' });
          return { ok: false, error: 'not a page on this site' };
        }
        // Projects are all in the brief; a post or paper must have been read this turn.
        if (citations && !/^\/work\//.test(clean)) {
          const verdict = citations.check(clean);
          if (!verdict.ok) {
            citations.record({ path: clean, ok: false, reason: verdict.reason });
            return { ok: false, error: verdict.reason };
          }
        }
        const sections = await sectionsForPath(clean);
        if (!sections?.length) return { ok: false, error: 'this page has no sections to point at' };
        const section = findSection(sections, heading);
        if (!section) {
          citations?.record({ path: clean, ok: false, reason: 'no such section' });
          return { ok: false, error: 'no such section', sections: sections.map((s) => s.heading).slice(0, 20) };
        }
        // At most MAX_PASSAGES moves in one answer, and a section is never pointed at twice.
        if (citations) {
          const done = citations.log().filter((c) => c.ok);
          if (done.length >= citations.limit()) return { ok: false, error: `already pointed at ${citations.limit()} sections; just talk now` };
          if (done.some((c) => c.path === clean && c.anchor === section.id)) return { ok: false, error: 'already pointed at that section this answer' };
        }
        const checked = checkQuote(section, quote);
        citations?.record({ path: clean, anchor: section.id, quote: checked, ok: true });
        emit({ kind: 'cite', path: clean, anchor: section.id, heading: section.heading, ...(checked ? { quote: checked } : {}), ...(citations ? { mode: citations.mode() } : {}) });
        return { ok: true, heading: section.heading, quoteShown: Boolean(checked) };
      },
    }),

    outline_passages: tool({
      description: `For a summary of one post, paper or project: the passages to talk about, in order, each with its heading and a first sentence you may quote. A normal "summarise it" gets ${SUMMARY_PASSAGES} passages: one short sentence each (15 to 20 seconds in all), then a short offer to go deeper into one part. Only when the visitor asks to be walked through the whole post, or to go deeper, pass depth "full" for up to ${MAX_PASSAGES} passages (about 35 seconds). Call cite_section for each passage in order as you reach it. Reading the page first (read_blog or read_paper) is required for a post or paper.`,
      inputSchema: z.object({ path: z.string().max(200), depth: z.enum(['summary', 'full']).optional() }),
      execute: async ({ path, depth }) => {
        const clean = path.split('#')[0];
        if (!(await knownPath(clean))) return { ok: false, error: 'not a page on this site' };
        if (citations && !/^\/work\//.test(clean)) {
          const verdict = citations.check(clean);
          if (!verdict.ok) return { ok: false, error: verdict.reason };
        }
        const sections = await sectionsForPath(clean);
        if (!sections?.length) return { ok: false, error: 'this page has no sections' };
        const max = depth === 'full' ? MAX_PASSAGES : SUMMARY_PASSAGES;
        citations?.setLimit(max);
        citations?.setMode(depth === 'full' ? 'perch' : 'swipe');
        return { ok: true, path: clean, passages: buildPassages(sections, max) };
      },
    }),

    suggest_followups: tool({
      description: 'Offer up to three short follow-up questions as buttons under your answer, each something the visitor might ask next about the same topic (for example "What is it built with?"). Each is sent as their message when clicked, so write it as the visitor would say it. Not for opening pages: use navigate or show_projects for that.',
      inputSchema: z.object({ questions: z.array(z.string().min(3).max(80)).min(1).max(3) }),
      execute: async ({ questions }) => {
        for (const text of questions) emit({ kind: 'ask', text });
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
