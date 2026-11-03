/**
 * Retrieval over the site (TASK-DB-0142). Every turn's facts come from Octo's RAG index: hybrid lexical + vector
 * search, then the reranker. scripts/sync-copilot-rag.mjs keeps one document per page section there, titled with the
 * section's address, `site:<path>#<anchor>` (`site:/work/precedent#built-with`, `site:/#story-about`), or
 * `site:<path>` for a page with no sections to point at (`site:/contact`). So every retrieved chunk knows its page and
 * heading, and the page can be moved to it (cite.ts). The indexed text is the text the page shows, with one context
 * line on top ("<page title>: <heading>") so a section is found by its page's name too.
 *
 * When Octo is not configured, errors or is slow, search_site falls back to the old keyword count, and the turn
 * falls back to the full site brief (route.ts), so the copilot never loses its facts.
 */
import { homeSections, loadBlogs, loadHero, loadPapers, loadProjects, loadShownExperience, loadSkills, projectPath, readBlog, readPaper, SOCIAL_LINKS } from './knowledge.js';
import { dbQueryAll, isDataLayerConfigured } from '../../services/lib/db.js';
import { sectionsOfMarkdown, sectionsOfProject } from './sections.js';

export type SiteKind = 'project' | 'paper' | 'blog' | 'home' | 'contact';
/** A section's kind in the site_sections table (supabase/migrations/013_site_sections.sql). */
export type SectionKind = 'project' | 'paper' | 'post' | 'experience' | 'about' | 'skills' | 'contact';
/**
 * One indexed section: what the sync script sends to Octo. `text` starts with the context header
 * "<itemTitle>: <heading>" (the project, paper or post title, or the company of a role), so a short section such as
 * a Built with list still names what it belongs to; quotes are only ever taken from the text after it.
 */
export type SiteDocument = {
  title: string;
  path: string;
  anchor?: string;
  heading?: string;
  kind: SiteKind;
  sectionKind: SectionKind;
  pageTitle: string;
  itemTitle: string;
  text: string;
};
/** A site_sections row, as the API reads it to map a search hit to its page move. */
export type SectionRow = { path: string; anchor: string; heading: string; kind: SectionKind; item_title: string; octo_document_id: string | null };
/** One retrieved section: the best chunk Octo returned for it. `score` is the reranker's, or the vector similarity without it. */
export type Passage = { ref: string; path: string; anchor?: string; heading?: string; kind: SiteKind; pageTitle: string; text: string; score: number };
/** search_site's output: one per page. */
export type SiteHit = { kind: SiteKind; ref: string; title: string; summary: string };

export const SITE_PREFIX = 'site:';
export const MAX_HITS = 6;
/** Passages given to the model per turn. */
export const MAX_PASSAGES = 6;
/** A reranked query took ~0.7–1.4 s warm (2026-11-03); past this the turn goes on without waiting. */
export const RAG_TIMEOUT_MS = 2500;
/** Without the reranker a query takes ~0.35–0.45 s. */
export const RAG_FAST_TIMEOUT_MS = 1500;
/**
 * Which chunks are passed on. The reranker's score is a logit and not comparable across questions: the answering
 * section of "What stack is Precedent built with?" scores 2.4, of "What experience do you have?" -6, while "hello"
 * reranks the About section at -0.4. So the cut is relative: the best chunk must clear RERANK_FLOOR (a misheard name
 * with no match tops out around -7), and the rest must be within RERANK_SPREAD of it. Without the reranker, cosine
 * similarity: an answering section ~0.5–0.65, noise ~0.3–0.45. Neither tells small talk apart, so the prompt, not
 * this cut, decides whether a passage is used, and the cite needs the reply to share the passage's words.
 */
export const RERANK_FLOOR = -6.5;
export const RERANK_SPREAD = 3;
export const SIMILARITY_FLOOR = 0.45;
/** Chunks asked of Octo: a long section returns several, and only the best per section is kept. */
const RAG_CHUNKS = 15;

const clip = (text: string, max: number) => (text.length > max ? `${text.slice(0, max)}…` : text);
const squash = (text: string) => text.replace(/\s+/g, ' ').trim();

export function kindOf(path: string): SiteKind | null {
  if (/^\/work\/[^/#]+$/.test(path)) return 'project';
  if (/^\/research\/papers\/[^/#]+$/.test(path)) return 'paper';
  if (/^\/blogs\/\d+$/.test(path)) return 'blog';
  if (path === '/') return 'home';
  if (path === '/contact') return 'contact';
  return null;
}

/** `site:/work/precedent#built-with` → its page and anchor. Null for any other title. */
export function parseTitle(title: string | undefined): { ref: string; path: string; anchor?: string } | null {
  if (!title?.startsWith(SITE_PREFIX)) return null;
  const ref = title.slice(SITE_PREFIX.length);
  const hash = ref.indexOf('#');
  const path = hash < 0 ? ref : ref.slice(0, hash);
  const anchor = hash < 0 ? undefined : ref.slice(hash + 1) || undefined;
  return kindOf(path) ? { ref, path, anchor } : null;
}

/** Page titles by path, from the live content: a match is kept only if its page still exists. */
async function pageTitles(): Promise<Map<string, string>> {
  const [projects, papers, blogs] = await Promise.all([loadProjects(), loadPapers(), loadBlogs()]);
  return new Map([
    ['/', 'Home'],
    ['/contact', 'Contact'],
    ...projects.map((p) => [projectPath(p), p.title] as const),
    ...papers.map((p) => [`/research/papers/${p.id}`, p.title] as const),
    ...blogs.map((b) => [`/blogs/${b.id}`, b.title] as const),
  ]);
}

/** The keyword count search_site always used: one point per query word found in a page's title and summary text. */
export async function keywordSearch(query: string): Promise<SiteHit[]> {
  const words = query.toLowerCase().split(/\W+/).filter((w) => w.length > 2);
  const score = (text: string) => words.reduce((n, w) => n + (text.toLowerCase().includes(w) ? 1 : 0), 0);
  const [projects, papers, blogs] = await Promise.all([loadProjects(), loadPapers(), loadBlogs()]);
  return [
    ...projects.map((p) => ({ kind: 'project' as const, ref: projectPath(p), title: p.title, text: `${p.tagline}. ${p.description} ${p.tech.join(' ')}` })),
    ...papers.map((p) => ({ kind: 'paper' as const, ref: `/research/papers/${p.id}`, title: p.title, text: p.abstract })),
    ...blogs.map((b) => ({ kind: 'blog' as const, ref: `/blogs/${b.id}`, title: b.title, text: `${b.excerpt} ${b.tags.join(' ')}` })),
  ]
    .map((hit) => ({ ...hit, score: score(`${hit.title} ${hit.text}`) }))
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_HITS)
    .map(({ kind, ref, title, text }) => ({ kind, ref, title, summary: clip(text, 300) }));
}

type OctoMatch = { title?: string; documentId?: string; chunkIndex?: number; content?: string; similarity?: number | null; rerankScore?: number };
export type OctoConfig = { base: string; workspaceId: string; key: string };
export type RetrieveOptions = {
  fetch?: typeof fetch;
  timeoutMs?: number;
  env?: NodeJS.ProcessEnv;
  rerank?: boolean;
  limit?: number;
  /** The site_sections rows by Octo document id; read from the workspace database when not given. */
  sections?: Promise<Map<string, SectionRow>> | Map<string, SectionRow>;
};

/** Octo's address and key from the environment, or null when RAG is off or not set up. */
export function octoConfig(env: NodeJS.ProcessEnv = process.env): OctoConfig | null {
  const key = env.OCTO_API_KEY?.trim();
  const workspaceId = env.OCTO_WORKSPACE_ID?.trim();
  if (!key || !workspaceId || env.COPILOT_RAG === 'off') return null;
  const base = (env.OCTO_API_BASE ?? 'https://octodb.design-bakery.com').trim().replace(/\/+$/, '').replace(/\/api$/, '');
  return { base, workspaceId, key };
}

/** The headings of a section's context line, "<page title>: <heading>", which is indexed text but not page text. */
const CONTEXT_LINE = /^[^\n]*\n+/;

/**
 * Matches in rank order, mapped to sections: only `site:` documents whose page still exists, above the relevance
 * floor, the best chunk per section.
 */
export function mapMatches(matches: OctoMatch[], titles: Map<string, string>, reranked: boolean, sections: Map<string, SectionRow> = new Map()): Passage[] {
  const out: Passage[] = [];
  const seen = new Set<string>();
  // A hit maps to its page move by document id through site_sections; the `site:` title is the fallback when the
  // table cannot be read or the row is not there yet.
  const located = matches.flatMap((match) => {
    const row = match.documentId ? sections.get(match.documentId) : undefined;
    const address = row ? { ref: row.anchor ? `${row.path}#${row.anchor}` : row.path, path: row.path, anchor: row.anchor || undefined } : parseTitle(match.title);
    const pageTitle = address && titles.get(address.path);
    return address && pageTitle ? [{ match, row, address, pageTitle }] : [];
  });
  const top = Math.max(...located.map((l) => l.match.rerankScore ?? -Infinity));
  const floor = reranked ? (top < RERANK_FLOOR ? Infinity : top - RERANK_SPREAD) : SIMILARITY_FLOOR;
  for (const { match, row, address, pageTitle } of located) {
    if (seen.has(address.ref)) continue;
    const score = reranked ? (match.rerankScore ?? -Infinity) : (match.similarity ?? 0);
    if (score < floor) continue;
    seen.add(address.ref);
    const content = match.content ?? '';
    let heading: string | undefined;
    let text = content;
    if (row) {
      // The first chunk starts with the context header; the passage is the body after it.
      heading = row.heading || undefined;
      const header = `${row.item_title}: ${row.heading}`;
      if (content.startsWith(header)) text = content.slice(header.length).replace(/^\s+/, '');
    } else {
      // No row: the header names the heading when its item is the page's own title (projects, papers, posts).
      const head = /^([^\n]*?): ([^\n]+)\n/.exec(content);
      if (head && head[1] === pageTitle) heading = head[2].trim();
      if (heading || (match.chunkIndex === 0 && head)) text = content.replace(CONTEXT_LINE, '');
    }
    out.push({ ...address, kind: kindOf(address.path)!, pageTitle, heading, text, score });
  }
  return out;
}

const SECTIONS_TTL_MS = 60_000;
let sectionsCache: { at: number; rows: Promise<Map<string, SectionRow>> } | null = null;

/** site_sections by Octo document id, cached for a minute. Empty when the table cannot be read (the titles still map). */
export function sectionRows(): Promise<Map<string, SectionRow>> {
  if (sectionsCache && Date.now() - sectionsCache.at < SECTIONS_TTL_MS) return sectionsCache.rows;
  const rows = dbQueryAll<SectionRow>('select path, anchor, heading, kind, item_title, octo_document_id from public.site_sections where octo_document_id is not null')
    .then((list) => new Map(list.map((r) => [r.octo_document_id!, r])))
    .catch(() => new Map<string, SectionRow>());
  sectionsCache = { at: Date.now(), rows };
  return rows;
}

async function queryOcto(query: string, config: OctoConfig, rerank: boolean, options: RetrieveOptions): Promise<{ matches: OctoMatch[]; reranked: boolean }> {
  const res = await (options.fetch ?? fetch)(`${config.base}/api/rag/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workspaceId: config.workspaceId,
      query,
      limit: RAG_CHUNKS,
      rerank,
      filter: { titlePrefix: SITE_PREFIX, latestVersionOnly: true },
    }),
    signal: AbortSignal.timeout(options.timeoutMs ?? (rerank ? RAG_TIMEOUT_MS : RAG_FAST_TIMEOUT_MS)),
  });
  if (!res.ok) throw new Error(`octo rag query: HTTP ${res.status}`);
  const body = (await res.json()) as { matches?: OctoMatch[]; reranked?: boolean };
  return { matches: body.matches ?? [], reranked: Boolean(rerank && body.reranked) };
}

/**
 * The sections that answer any of `queries`, best first, at most `limit`. Throws when Octo is not configured or no
 * query got an answer; a reranked query that fails or times out is retried once without the reranker (it can be cold:
 * a first reranked query once took 66 s).
 */
export async function retrieve(queries: string[], options: RetrieveOptions = {}): Promise<Passage[]> {
  const config = octoConfig(options.env);
  if (!config) throw new Error('octo rag: not configured');
  const rerank = options.rerank ?? true;
  const titles = pageTitles();
  const sections = options.sections ?? (isDataLayerConfigured() ? sectionRows() : new Map<string, SectionRow>());
  const one = async (query: string) => {
    try {
      return await queryOcto(query, config, rerank, options);
    } catch (error) {
      if (!rerank) throw error;
      return queryOcto(query, config, false, { ...options, timeoutMs: RAG_FAST_TIMEOUT_MS });
    }
  };
  const settled = await Promise.allSettled(queries.filter((q) => q.trim()).map(one));
  const answered = settled.flatMap((s) => (s.status === 'fulfilled' ? [s.value] : []));
  if (!answered.length) throw new Error('octo rag: no query answered');
  const [map, rows] = await Promise.all([titles, sections]);
  const best = new Map<string, Passage>();
  for (const { matches, reranked } of answered) {
    // Scores from the reranker and from the vector arm are not comparable; a fallback query ranks below reranked ones.
    for (const passage of mapMatches(matches, map, reranked, rows)) {
      const ranked = reranked ? passage : { ...passage, score: passage.score - 100 };
      const held = best.get(passage.ref);
      if (!held || ranked.score > held.score) best.set(passage.ref, ranked);
    }
  }
  return [...best.values()].sort((a, b) => b.score - a.score).slice(0, options.limit ?? MAX_PASSAGES);
}

/**
 * The queries for a turn: the message itself, and the message with the conversation just before it and the content
 * page the visitor is on and any known name the message sounds like, so a follow-up ("how is it built?", "what else?"),
 * "this project" or a misheard "President" finds the thing being talked about. Both run at once and their results merge.
 */
export function turnQueries(messages: Array<{ role: string; content: string }>, page?: { path: string; title: string }, names: string[] = []): string[] {
  const question = messages.at(-1)?.content.trim() ?? '';
  if (!question) return [];
  const earlier = messages.slice(0, -1);
  const lastUser = [...earlier].reverse().find((m) => m.role === 'user')?.content ?? '';
  const lastReply = earlier.at(-1)?.role === 'assistant' ? (earlier.at(-1)?.content ?? '') : '';
  const onPage = page && ['project', 'paper', 'blog'].includes(kindOf(page.path) ?? '') ? `on the page "${clip(page.title, 100)}"` : '';
  // Names the message sounds like (names.ts) go in with the context, never in place of the visitor's words.
  const alike = names.length ? `probably ${names.join(', ')}` : '';
  const context = squash(`${alike} ${onPage} ${clip(lastUser, 200)} ${clip(lastReply, 300)}`);
  return context ? [question, `${question} (context: ${context})`] : [question];
}

/** The passages as the model reads them, numbered, each with its address. */
export function passagesBlock(passages: Passage[], maxChars = 700): string {
  if (!passages.length) return '';
  return passages
    .map((p, i) => `[${i + 1}] ${p.pageTitle}${p.heading ? ` › ${p.heading}` : ''} (${p.anchor ? `${p.path}#${p.anchor}` : p.path})\n${clip(squash(p.text), maxChars)}`)
    .join('\n\n');
}

/** search_site: sections from Octo grouped by page; the keyword count when Octo is off, fails, times out or finds nothing. */
export async function searchSite(query: string, options: RetrieveOptions = {}): Promise<{ hits: SiteHit[]; source: 'rag' | 'keyword' }> {
  try {
    const passages = await retrieve([query], { ...options, limit: 12 });
    const hits: SiteHit[] = [];
    for (const p of passages) {
      if (p.kind === 'home' || p.kind === 'contact' || hits.some((h) => h.ref === p.path)) continue;
      hits.push({ kind: p.kind, ref: p.path, title: p.pageTitle, summary: clip(`${p.heading ? `${p.heading}: ` : ''}${squash(p.text)}`, 300) });
      if (hits.length >= MAX_HITS) break;
    }
    if (hits.length) return { hits, source: 'rag' };
  } catch {
    // Fall through: a search that answers from the keyword count beats one that fails.
  }
  return { hits: await keywordSearch(query), source: 'keyword' };
}

/** Section text for the index: the context line, then the page's own text. */
const body = (itemTitle: string, heading: string, parts: string[]) => [`${itemTitle}: ${heading}`, ...parts.map(squash).filter(Boolean)].join('\n\n');

/** Every section the index should hold, from the live content: the sync script's input. */
export async function siteDocuments(): Promise<SiteDocument[]> {
  const [projects, papers, blogs, home, hero, skills, experience] = await Promise.all([
    loadProjects(), loadPapers(), loadBlogs(), homeSections(), loadHero(), loadSkills(), loadShownExperience(),
  ]);
  const docs: SiteDocument[] = [];
  const add = (path: string, kind: SiteKind, sectionKind: SectionKind, pageTitle: string, itemTitle: string, anchor: string | undefined, heading: string, parts: string[]) =>
    docs.push({ title: `${SITE_PREFIX}${anchor ? `${path}#${anchor}` : path}`, path, anchor, heading, kind, sectionKind, pageTitle, itemTitle, text: body(itemTitle, heading, parts) });

  for (const p of projects) {
    for (const s of sectionsOfProject(p)) {
      // The tagline sits above What it is; Go deeper shows link labels, and the model needs their addresses for share_link.
      const lead = s.id === 'what-it-is' ? [p.tagline] : [];
      const links = s.id === 'go-deeper' ? (p.links ?? []).filter((l) => l.url && l.url !== '#').map((l) => `${l.label}: ${l.url}`) : [];
      add(projectPath(p), 'project', 'project', p.title, p.title, s.id, s.heading, [...lead, ...s.blocks, ...links]);
    }
  }
  for (const paper of papers) {
    const markdown = await readPaper(paper.id);
    if (!markdown) continue;
    const path = `/research/papers/${paper.id}`;
    const status = paper.status === 'approved' ? [] : ['A working paper, awaiting my approval.'];
    for (const s of sectionsOfMarkdown(markdown, { levels: [1, 2, 3] })) {
      if (s.blocks.length) add(path, 'paper', 'paper', paper.title, paper.title, s.id, s.heading, [...status, ...s.blocks]);
    }
  }
  for (const blog of blogs) {
    const post = await readBlog(blog.id);
    if (!post) continue;
    for (const s of sectionsOfMarkdown(post.content, { levels: [1, 2, 3] })) {
      if (s.blocks.length) add(`/blogs/${blog.id}`, 'blog', 'post', blog.title, blog.title, s.id, s.heading, s.blocks);
    }
  }
  // The home page. About also carries the hero line and the skills, which the page does not show under that heading:
  // they are found through it, but a quote is only ever taken from the visible text (cite.ts checks it).
  for (const s of home) {
    const job = experience.experiences.find((j) => s.heading === squash(j.role) && s.blocks[0]?.startsWith(squash(j.company)));
    const extra =
      s.id === 'story-about'
        ? [hero.description ?? '', ...skills.map((g) => `${g.title}: ${g.skills.join(', ')}`)]
        : job
          ? [`${job.role} at ${job.company}, ${job.period}.`, job.expandedSummary ?? '', ...(job.highlights ?? []), (job.tags ?? []).join(', ')]
          : [];
    if (s.id === 'story-about') add('/', 'home', 'about', 'About me', 'About me', s.id, s.heading, [...s.blocks, ...extra]);
    else add('/', 'home', 'experience', 'Work history', job?.company ?? 'Work history', s.id, s.heading, [...s.blocks, ...extra]);
  }
  const contact = [
    'To reach me, open the Contact page: pick an area and a time for a free 30-minute consultation call.',
    'I consult on AI engineering, product design, marketing, and full-stack development.',
    ...SOCIAL_LINKS.map((l) => `${l.label}: ${l.url.replace(/^mailto:/, '')}`),
  ];
  add('/contact', 'contact', 'contact', 'Contact', 'Contact', undefined, 'Contact and consultations', contact);
  return docs;
}
