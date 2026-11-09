/**
 * The copilot's tools. Look-ups run here; page moves (navigate, show projects, links,
 * booking) are sent to the browser as actions, which the site carries out with its own
 * router, so the conversation and any voice call stay open while the page changes.
 */
import { tool } from 'ai';
import { z } from 'zod';
import type { Citations } from './citations.js';
import { buildPassages, checkQuote, findSection, MAX_PASSAGES, QUOTE_MAX, SUMMARY_PASSAGES } from './sections.js';
import { CONSULT_SERVICES,  nextStep, type BookingFlow, type BookingState } from './bookingState.js';
import { neighbour, nextTourStop } from './walk.js';
import { contactMailConfigured, sendContactMessage } from './contactMail.js';
import { loadBlogs, loadPapers, loadProjects, projectPath, readBlog, readPaper, sectionsForPath, SITE_PAGES, SOCIAL_LINKS } from './knowledge.js';
import { songsConfigured, startSong } from './songs.js';

export { CONSULT_SERVICES };

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
  | { kind: 'ask'; text: string }
  /** A song being made (or a saved one): the page shows a player that waits for it and plays it once (songs.ts). */
  | { kind: 'song'; id: string; title?: string | null; cached?: boolean };

const clip = (text: string, max: number) => (text.length > max ? `${text.slice(0, max)}…` : text);

/** One section of a read post or paper, for a part the full read cut off (a long paper's References sit past its end). */
async function readSection(path: string, heading: string, point?: (anchor: string, heading: string) => void): Promise<{ heading: string; text: string } | { error: string; sections?: string[] }> {
  const sections = (await sectionsForPath(path)) ?? [];
  const section = findSection(sections, heading);
  if (!section) return { error: 'no such section', sections: sections.map((s) => s.heading).slice(0, 40) };
  // The part being read out is the part on screen: the model asked for the references and never pointed at them.
  point?.(section.id, section.heading);
  return { heading: section.heading, text: clip(section.blocks.join('\n\n'), 6000) };
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

/** True when every part appears in the text, ignoring case, spacing and quote marks. */
function readBack(text: string, parts: string[]): boolean {
  const flat = (t: string) => {
    let out = '';
    for (const ch of t.toLowerCase()) {
      if (ch === '"' || ch === '\u201c' || ch === '\u201d') continue;
      if (ch.trim() !== '') out += ch;
      else if (out !== '' && !out.endsWith(' ')) out += ' ';
    }
    return out.trimEnd();
  };
  const said = flat(text);
  return parts.every((part) => said.includes(flat(part)));
}

/** The reply before asked what kind of song (make_song makes one only after that question was answered). */
export function askedForStyle(lastReply: string): boolean {
  return lastReply.includes('?') && /\b(song|songs|music|tune|jingle|genre|style|vibe|mood)\b/i.test(lastReply);
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
export type BookingHold = { get: () => BookingFlow | null; set: (flow: BookingFlow | null) => void };

export type SongHold = { session: string; exempt: boolean };

export function makeTools(emit: (action: CopilotAction) => void, options: { canNavigate: boolean; citations?: Citations; voice?: boolean; page?: { path: string }; said?: string; lastReply?: string; booking?: BookingHold; notForMe?: () => void; songs?: SongHold }) {
  const citations = options.citations;
  let buttonsShown = false;
  let messageSent = false;
  let songStarted = false;
  /** Applies one step's slots to the booking state and says what comes next. */
  const step = (patch: Partial<BookingState>) => {
    if (!options.booking) return { ok: false, error: 'booking is only done on a call' };
    const data: BookingState = { ...(options.booking.get()?.data ?? {}), ...patch };
    options.booking.set({ kind: 'booking', data });
    return nextStep(data).next === 'finish' ? finish() : { ok: true, ...nextStep(data) };
  };
  /** Shows the booking button once every slot is filled and the name and email were read back and confirmed (nextStep says so). */
  const finish = () => {
    const data = options.booking?.get()?.data;
    if (!data) return { ok: false, error: 'no booking has been started' };
    const next = nextStep(data);
    if (next.next !== 'finish') return { ok: false, ...next };
    const base = process.env.COPILOT_BOOKING_URL?.trim();
    if (!base) return { ok: false, error: 'booking is not set up; tell them to use the Contact page' };
    emit({ kind: 'book', url: bookingUrl(base, { name: data.name, email: data.email, topic: data.area }), name: data.name, email: data.email, topic: data.area });
    options.booking?.set(null);
    return { ok: true, say: `Done. The Pick a time button is in the chat now, with ${data.say ?? data.name} and your email filled in, for ${data.area}. Tap it to choose a slot.` };
  };
  /** A cite for a section a tool read out, unless this answer already pointed there or used up its moves. */
  const pointAt = (path: string, anchor: string, heading: string) => {
    const done = citations?.log().filter((c) => c.ok) ?? [];
    if (done.length >= (citations?.limit() ?? 3) || done.some((c) => c.path === path && c.anchor === anchor)) return;
    citations?.record({ path, anchor, ok: true });
    emit({ kind: 'cite', path, anchor, heading, mode: 'perch' });
  };
  return {
    search_site: tool({
      description: 'Search projects, research papers and blog posts by keywords. Use it when the brief is not enough.',
      inputSchema: z.object({ query: z.string().min(1).max(200) }),
      execute: async ({ query }) => {
        const words = Array.from(query.toLowerCase(), (c) => (c.toLowerCase() !== c.toUpperCase() || (c >= '0' && c <= '9') ? c : ' ')).join('').split(' ').filter((w) => w.length > 2);
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
        for (const hit of hits) citations?.retrieve(hit.ref);
        return hits.map(({ kind, ref, title, text }) => ({ kind, ref, title, summary: clip(text, 300) }));
      },
    }),

    read_blog: tool({
      description: 'Read one blog post in full, by its numeric id from the brief. A long post is cut off: pass section (a heading from its "sections" list) to read that part whole.',
      inputSchema: z.object({ id: z.number().int().positive(), section: z.string().max(200).optional() }),
      execute: async ({ id, section }) => {
        const post = await readBlog(id);
        if (!post) return { error: 'not found' };
        citations?.retrieve(`/blogs/${id}`);
        if (section) return readSection(`/blogs/${id}`, section, (anchor, heading) => pointAt(`/blogs/${id}`, anchor, heading));
        const sections = (await sectionsForPath(`/blogs/${id}`)) ?? [];
        return { title: post.title, sections: sections.map((s) => s.heading), text: clip(post.content, 6000), ...(post.content.length > 6000 ? { cut: 'the text stops early: read a later section with section' } : {}) };
      },
    }),

    read_paper: tool({
      description: 'Read one research paper, by its id (db-r-YYYY-NNN). A long paper is cut off: pass section (a heading from its "sections" list, for example "References") to read that part whole.',
      inputSchema: z.object({ id: z.string(), section: z.string().max(200).optional() }),
      execute: async ({ id, section }) => {
        const body = await readPaper(id);
        if (!body) return { error: 'not found' };
        citations?.retrieve(`/research/papers/${id}`);
        // A call on 2026-11-08 asked for a paper's references three times: they were past the 8000 characters every time.
        if (section) return readSection(`/research/papers/${id}`, section, (anchor, heading) => pointAt(`/research/papers/${id}`, anchor, heading));
        const sections = (await sectionsForPath(`/research/papers/${id}`)) ?? [];
        return { sections: sections.map((s) => s.heading), text: clip(body, 8000), ...(body.length > 8000 ? { cut: 'the text stops early: read a later section (References, say) with section' } : {}) };
      },
    }),

    navigate: tool({
      description:
        'Open a page on this site for the visitor, while the conversation stays open: a section (/#about, /#experience, /#work), /contact, /work/<slug>, /blogs, /blogs/<id>, /research, /research/papers/<id>. In a text chat, only open a page the visitor asked for or said yes to; never unasked. On a voice call you may call it directly.',
      inputSchema: z.object({ path: z.string(), label: z.string().max(60) }),
      execute: async ({ path, label }) => {
        if (!(await knownPath(path))) return { ok: false, error: 'not a page on this site' };
        // Already there (a page button walks the visitor to a page, then asks for its summary): moving again would only jump.
        if (path === options.page?.path) return { ok: true, note: 'the visitor is already on this page; nothing moved' };
        emit({ kind: 'navigate', path, label, go: true });
        return { ok: true };
      },
    }),

    cite_section: tool({
      description: `Point at a section of a blog post, research paper or project while you talk about it: the page scrolls to that heading, the cursor taps it, and a short passage is highlighted. path is /blogs/<id>, /research/papers/<id> or /work/<slug>. heading must be a heading you saw in its "sections" list (a project page has What it is, Highlights, Built with, Go deeper). A paper's charts and diagrams are in that list too, as headings starting "Figure" or "Diagram": when one shows what you are saying, point at it rather than the text, since seeing the chart says more. quote is optional: a passage of at most ${QUOTE_MAX} characters copied word for word from that section. If it returns ok false, do not retry with a made-up heading; just keep talking.`,
      inputSchema: z.object({ path: z.string().max(200), heading: z.string().min(1).max(200), quote: z.string().max(400).optional() }),
      execute: async ({ path, heading, quote }) => {
        const clean = path.split('#')[0];
        if (!(await knownPath(clean))) {
          citations?.record({ path: clean, ok: false, reason: 'not a page on this site' });
          return { ok: false, error: 'not a page on this site' };
        }
        // The tool reads the page's sections itself, and the heading and quote are checked against them, so what is pointed at
        // is always on the page. It used to refuse a post or paper no tool had read this turn; on a call that refused read_paper
        // and cite_section sent in the same step (they run side by side) and every pointer for a paper read a turn earlier.
        citations?.retrieve(clean);
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
      description: `For a walk through one post, paper or project: the passages to talk about, in order, each with its heading and a first sentence you may quote. A normal "summarise it" gets ${SUMMARY_PASSAGES} passages: one short sentence each (15 to 20 seconds in all), then a short offer to go deeper into one part. Only when the visitor asks to be walked through the whole post, or to go deeper, pass depth "full" for up to ${MAX_PASSAGES} passages (about 35 seconds). The page follows the passages by itself as you speak them, in order: do not call cite_section for them.`,
      inputSchema: z.object({ path: z.string().max(200), depth: z.enum(['summary', 'full']).optional() }),
      execute: async ({ path, depth }) => {
        const clean = path.split('#')[0];
        if (!(await knownPath(clean))) return { ok: false, error: 'not a page on this site' };
        citations?.retrieve(clean);
        const sections = await sectionsForPath(clean);
        if (!sections?.length) return { ok: false, error: 'this page has no sections' };
        const max = depth === 'full' ? MAX_PASSAGES : SUMMARY_PASSAGES;
        const mode = depth === 'full' ? 'perch' : 'swipe';
        citations?.setLimit(max);
        citations?.setMode(mode);
        const passages = buildPassages(sections, max);
        // The page follows them by itself, as summarize_page does. Left to cite_section, the model pointed at none of them in
        // four of five walks through a paper on the 2026-11-08 call: the moon stayed put while the paper was explained.
        for (const p of passages) {
          citations?.record({ path: clean, anchor: p.anchor, quote: p.quote, ok: true });
          emit({ kind: 'cite', path: clean, anchor: p.anchor, heading: p.heading, ...(p.quote ? { quote: p.quote } : {}), mode });
        }
        return { ok: true, path: clean, passages };
      },
    }),

    summarize_page: tool({
      description: 'Summarise the post, paper or project the visitor is on (or one you name by path), in one step: it returns what the page is about and the passages to speak, and the page follows them by itself. Then SAY the summary: one short sentence per passage, three at most, about 20 seconds, ending with a short offer to go deeper. A passage whose heading starts "Figure" or "Diagram" is a chart the page is showing: say what it shows. Prefer this over read_paper, read_blog and outline_passages for any "summarise this", "what is this about", "explain this".',
      inputSchema: z.object({ path: z.string().max(200).optional() }),
      execute: async ({ path }) => {
        const clean = (path ?? options.page?.path ?? '').split('#')[0];
        if (!clean || !(await knownPath(clean))) return { ok: false, error: 'not a page on this site; use navigate first or answer from the brief' };
        const parts = clean.split('/').filter(Boolean);
        let about = '';
        let title = '';
        if (parts[0] === 'research' && parts[1] === 'papers') {
          const paper = (await loadPapers()).find((p) => p.id === parts[2]);
          if (!paper) return { ok: false, error: 'not found' };
          title = paper.title;
          about = `${clip(paper.abstract, 400)}${paper.status === 'approved' ? '' : ' (A pending draft awaiting my approval: say so.)'}`;
        } else if (parts[0] === 'blogs' && parts[1]) {
          const post = (await loadBlogs()).find((b) => String(b.id) === parts[1]);
          if (!post) return { ok: false, error: 'not found' };
          title = post.title;
          about = clip(post.excerpt, 400);
        } else if (parts[0] === 'work' && parts[1]) {
          const project = (await loadProjects()).find((p) => p.slug === parts[1]);
          if (!project) return { ok: false, error: 'not found' };
          title = project.title;
          about = clip(`${project.tagline}. ${project.description}`, 400);
        } else return { ok: false, error: 'only a post, a paper or a project can be summarised; a list page cannot' };
        const sections = (await sectionsForPath(clean)) ?? [];
        const passages = buildPassages(sections, SUMMARY_PASSAGES);
        // The page follows the summary: each passage is pointed at in order, swiping to its heading.
        for (const p of passages) {
          citations?.record({ path: clean, anchor: p.anchor, quote: p.quote, ok: true });
          emit({ kind: 'cite', path: clean, anchor: p.anchor, heading: p.heading, ...(p.quote ? { quote: p.quote } : {}), mode: 'swipe' });
        }
        return { ok: true, title, about, passages: passages.map((p) => ({ heading: p.heading, sentence: p.quote })) };
      },
    }),

    suggest_followups: tool({
      description: 'The buttons under your answer. questions: up to three short follow-up questions, each something the visitor might ask next (for example "What is it built with?"); each is sent as their message when clicked, so write it as the visitor would say it. pages: up to two pages of this site worth opening next (same paths as navigate), each a button that opens it only when pressed; nothing moves now. A page button is how a chat offers a page.',
      inputSchema: z.object({
        questions: z.array(z.string().min(3).max(80)).min(1).max(3),
        pages: z.array(z.object({ path: z.string().max(200), label: z.string().min(2).max(40) })).max(2).optional(),
      }),
      execute: async ({ questions, pages = [] }) => {
        // One set of buttons per reply: a second call would stack them twice.
        if (buttonsShown) return { ok: false, error: 'the buttons for this reply are already shown' };
        buttonsShown = true;
        // A page button that would lead nowhere is left out, and the model is told which.
        const unknown: string[] = [];
        for (const page of pages) {
          // A button to the page already on screen would only walk the visitor to where they are.
          if (page.path === options.page?.path) continue;
          if (await knownPath(page.path)) emit({ kind: 'navigate', path: page.path, label: page.label });
          else unknown.push(page.path);
        }
        for (const text of questions) emit({ kind: 'ask', text });
        return unknown.length ? { ok: true, left_out: unknown, error: 'not pages on this site' } : { ok: true };
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

    step_list: tool({
      description: 'Open the next or previous paper, post or project of the page the visitor is on (a paper goes to the next paper, a project to the next project; on a list page, next starts at the first). Use it when they say next, previous, go on, keep going, back, another one. Say one sentence about where they landed.',
      inputSchema: z.object({ direction: z.enum(['next', 'previous']) }),
      execute: async ({ direction }) => {
        const found = await neighbour(options.page?.path ?? '/', direction === 'next' ? 1 : -1);
        if (!found) return { ok: false, error: 'this page is not in a list of papers, posts or projects; use tour_next or navigate instead' };
        if ('end' in found) return { ok: false, error: found.end };
        emit({ kind: 'navigate', path: found.stop.path, label: `Open ${found.stop.title}`, go: true });
        return { ok: true, title: found.stop.title, about: found.stop.blurb, after: found.after?.title };
      },
    }),

    tour_next: tool({
      description: 'Take the visitor to the next stop of a tour of my best work that you have not named yet in this conversation. Use it when they leave the choice to you ("show me anything", "you pick", "surprise me", "give me a tour", "keep going" on a tour). Say one thing about the stop and what comes after it.',
      inputSchema: z.object({}),
      execute: async () => {
        const next = await nextTourStop(options.said ?? '');
        if (!next) return { ok: false, error: 'the tour is finished; offer a free call' };
        emit({ kind: 'navigate', path: next.stop.path, label: `Open ${next.stop.title}`, go: true });
        return { ok: true, title: next.stop.title, about: next.stop.blurb, after: next.after?.title };
      },
    }),

    not_for_me: tool({
      description: 'Call this, and write nothing at all, when the line was clearly said to someone else in the visitor\'s room (they call another person by name, or talk about their own errands) and not to you. When in doubt, it was for you: answer it.',
      inputSchema: z.object({ who: z.string().max(60).optional() }),
      execute: async () => {
        options.notForMe?.();
        return { ok: true };
      },
    }),

    // One tool per booking step. Which of them the model is offered is decided before it runs (bookingTools in bookingState.ts, used
    // by route.ts), so it cannot skip a step or confirm early: the tool for that is not there.
    booking_start: tool({
      description: 'The caller wants a free call: starts the booking. Say what it returns, word for word. Speech recognition garbles things ("book it for me", "set that up", "I want the call"): when the sense is that they want to book, start it.',
      inputSchema: z.object({}),
      execute: async () => {
        if (!options.booking) return { ok: false, error: 'booking is only done on a call' };
        options.booking.set({ kind: 'booking', data: {} });
        // The contact page is where a call is booked: the page moves from here, not by the model remembering to.
        emit({ kind: 'navigate', path: '/contact', label: 'Contact page', go: true });
        return { ok: true, ...nextStep({}) };
      },
    }),

    booking_give_name: tool({
      description: 'The caller gave their name. Only a person\'s name, capitalised (a sentence or a complaint is not a name: booking_repeat). Say what it returns, word for word.',
      inputSchema: z.object({ name: z.string().min(2).max(60) }),
      execute: async ({ name }) => step({ name, nameOk: false }),
    }),

    booking_confirm_name: tool({
      description: 'The caller answered the read-back of their name. correct is true for a yes. If they said no and gave the right name or spelled it, send correct false and that name; a bare no is correct false with no name.',
      inputSchema: z.object({ correct: z.boolean(), name: z.string().min(2).max(60).optional() }),
      execute: async ({ correct, name }) => {
        if (correct) return step({ nameOk: true });
        return name ? step({ name, nameOk: false }) : { ...step({ name: undefined, nameOk: false }), say: 'Sorry about that. Spell your name for me, letter by letter.' };
      },
    }),

    booking_give_pronunciation: tool({
      description: 'How the caller says their name, as hyphenated syllables like "Poo-jun". If they say the spelling is fine as it is, send the name itself. Never a yes or a no: that is booking_repeat.',
      inputSchema: z.object({ say: z.string().min(2).max(60) }),
      execute: async ({ say }) => step({ say }),
    }),

    booking_give_email: tool({
      description: 'The caller gave their email: the full address in lower case, digits as digits ("oh" next to digits is a zero), "at" is @, "dot" is a full stop. Letters they spell win over your guess.',
      inputSchema: z.object({ email: z.string().email() }),
      execute: async ({ email }) => step({ email: email.toLowerCase(), emailOk: false }),
    }),

    booking_confirm_email: tool({
      description: 'The caller answered the read-back of their email. correct is true for a yes (add area if they also named one). A whole new address or a spelling after a no is correct false with the corrected email; a bare no is correct false with no email.',
      inputSchema: z.object({ correct: z.boolean(), email: z.string().email().optional(), area: z.enum(CONSULT_SERVICES).optional() }),
      execute: async ({ correct, email, area }) => {
        if (correct) return step({ emailOk: true, ...(area ? { area } : {}) });
        return email ? step({ email: email.toLowerCase(), emailOk: false }) : { ...step({ email: undefined, emailOk: false }), say: 'Sorry about that. Say the whole address again, and spell the part before the at sign letter by letter.' };
      },
    }),

    booking_give_area: tool({
      description: 'The area the call should cover, one of the four. Once it is accepted the booking button is shown at once; say what it returns.',
      inputSchema: z.object({ area: z.enum(CONSULT_SERVICES) }),
      execute: async ({ area }) => step({ area }),
    }),

    booking_repeat: tool({
      description: 'The line does not answer the current booking step: a complaint ("I just told you"), a yes or no where a name or an email was asked, noise, or a question about something else. Nothing is stored. Returns the question to ask again; say it, or answer their question first and then ask it.',
      inputSchema: z.object({}),
      execute: async () => {
        const data = options.booking?.get()?.data;
        if (!data) return { ok: false, error: 'no booking has been started' };
        return { ok: true, ...nextStep(data) };
      },
    }),

    booking_cancel: tool({
      description: 'The caller no longer wants to book. Clears the booking.',
      inputSchema: z.object({}),
      execute: async () => {
        options.booking?.set(null);
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

    make_song: tool({
      description:
        'Make the visitor a short song (about a minute to make, on Flow Music). Always ask first, in one short question, what kind of song they want: the style or mood, and what it should be about (offer a fun idea, for example a song about the page they are on). Call this only in a later reply, once they have answered; it refuses otherwise. style: the genre and mood in a few words ("upbeat synth-pop", "lo-fi jazz, sleepy"). about: the subject in a sentence, never a real person by name. lyrics: optional, short lyrics you write for them with [Verse] and [Chorus] tags; leave it out and Flow Music writes them. Never imitate or name a real artist. Say once, in one short sentence, that it is being written and will play here in about a minute (not before the call and again after it), then keep chatting.',
      inputSchema: z.object({
        style: z.string().min(2).max(80),
        about: z.string().min(3).max(300),
        lyrics: z.string().max(1500).optional(),
        instrumental: z.boolean().optional(),
      }),
      execute: async (ask) => {
        if (!options.songs || !songsConfigured()) return { ok: false, note: 'Songs are resting right now. Offer a short rap or a limerick in words instead.' };
        if (songStarted) return { ok: false, error: 'a song was already started in this reply' };
        if (!askedForStyle(options.lastReply ?? '')) {
          return { ok: false, note: 'Not started. Ask them first, in one short question, what kind of song they want (style or mood, and what about). Make it in your next reply, after they answer.' };
        }
        const started = await startSong(ask, options.songs.session, options.songs.exempt).catch(() => ({ ok: false as const, reason: 'down' as const }));
        if (!started.ok) {
          const why = {
            visitor_limit: 'They have had their songs for today: say so kindly, and offer a short rap or limerick in words instead.',
            daily_limit: 'The site has made all its songs for today: say so, and offer a short rap or limerick in words instead.',
            busy: 'A few songs are being made already: ask them to try again in a couple of minutes.',
            down: 'The song maker is asleep right now: say so, and offer a short rap or limerick in words instead.',
          }[started.reason];
          return { ok: false, note: why };
        }
        songStarted = true;
        emit({ kind: 'song', id: started.id, title: started.title ?? null, cached: started.cached });
        return started.cached
          ? { ok: true, note: 'This exact song was made before, so it plays right away. Say so in a few words.' }
          : { ok: true, note: 'It is being made: about a minute. It plays here by itself when it is ready.' };
      },
    }),

    send_message: tool({
      description:
        'Email a message from the visitor to me (Pujan). Use it when they want to send me a message, leave a note, or reach me without booking a call. You need three things: their name, their email address so I can reply, and the message. Whatever they have said they want to tell or ask me is the message: do not ask for it again. Send their own words; do not add a greeting or a signature (the email carries their name). Ask only for what is missing. Before calling, read the exact message, name and email back in one short line and ask if you should send it; call this only in a later reply, after they say yes to that read-back, with the same words you read back (it refuses otherwise). After it succeeds, tell them it is sent and I will reply by email; never say it is sent unless this returned ok.',
      inputSchema: z.object({
        name: z.string().min(1).max(80),
        email: z.string().email().max(200),
        message: z.string().min(2).max(4000),
      }),
      execute: async ({ name, email, message }) => {
        if (messageSent) return { ok: false, error: 'a message was already sent in this reply' };
        // The visitor must have seen the exact message and email in my last reply and answered it: a read-back and a
        // send in the same reply never reaches Gmail. (Unset, the email link below shows straight away.)
        if (contactMailConfigured() && !readBack(options.lastReply ?? '', [email, message])) {
          return { ok: false, note: 'Not sent. Read the exact message, name and email back to them in one short line and ask if you should send it, then stop. Send it in your next reply, after they say yes. Do not say it is sent.' };
        }
        const result = await sendContactMessage({ name, email, message, page: options.page?.path });
        if (result.ok) {
          messageSent = true;
          return { ok: true };
        }
        emit({ kind: 'link', label: 'Email me', url: 'mailto:pujan3645@gmail.com' });
        const why = result.reason === 'not_set_up' ? 'Sending is not set up yet' : result.reason === 'daily_limit' ? 'Too many messages today' : 'Sending failed';
        return { ok: false, note: `${why}; an email link was shown instead. Tell them, and that the link opens their own mail app.` };
      },
    }),
  };
}
