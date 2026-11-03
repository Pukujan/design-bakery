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
import { homeSections, loadBlogs, loadExperience, loadHero, loadPapers, loadProjects, loadSkills, projectPath, readBlog, readPaper, SOCIAL_LINKS } from './knowledge.js';
import { sectionsOfMarkdown, sectionsOfProject } from './sections.js';

export type SiteKind = 'project' | 'paper' | 'blog' | 'home' | 'contact';
/** One indexed section: what the sync script sends to Octo. */
export type SiteDocument = { title: string; path: string; anchor?: string; heading?: string; kind: SiteKind; pageTitle: string; text: string };
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
 * Below these a chunk is not passed on. The reranker's score is a logit: an answering section scores around 0 and
 * above, unrelated ones -4 to -8. Without it, cosine similarity: an answering section ~0.6, noise ~0.3–0.45.
 * Neither tells small talk apart reliably ("hello" reranks a page that greets visitors at 0.37), so the prompt, not
 * this floor, decides whether a passage is used.
 */
export const RERANK_FLOOR = -3;
export const SIMILARITY_FLOOR = 0.5;
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

type OctoMatch = { title?: string; content?: string; similarity?: number | null; rerankScore?: number };
export type OctoConfig = { base: string; workspaceId: string; key: string };
export type RetrieveOptions = { fetch?: typeof fetch; timeoutMs?: number; env?: NodeJS.ProcessEnv; rerank?: boolean; limit?: number };

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
export function mapMatches(matches: OctoMatch[], titles: Map<string, string>, reranked: boolean): Passage[] {
  const out: Passage[] = [];
  const seen = new Set<string>();
  for (const match of matches) {
    const address = parseTitle(match.title);
    const pageTitle = address && titles.get(address.path);
    if (!address || !pageTitle || seen.has(address.ref)) continue;
    const score = reranked ? (match.rerankScore ?? -Infinity) : (match.similarity ?? 0);
    if (score < (reranked ? RERANK_FLOOR : SIMILARITY_FLOOR)) continue;
    seen.add(address.ref);
    const content = match.content ?? '';
    // The first chunk of a section starts with its context line "<page>: <heading>"; that names the heading.
    const head = /^([^\n]*?): ([^\n]+)\n/.exec(content);
    const heading = head && head[1] === pageTitle ? head[2].trim() : undefined;
    out.push({ ...address, kind: kindOf(address.path)!, pageTitle, heading, text: heading ? content.replace(CONTEXT_LINE, '') : content, score });
  }
  return out;
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
  const map = await titles;
  const best = new Map<string, Passage>();
  for (const { matches, reranked } of answered) {
    // Scores from the reranker and from the vector arm are not comparable; a fallback query ranks below reranked ones.
    for (const passage of mapMatches(matches, map, reranked)) {
      const ranked = reranked ? passage : { ...passage, score: passage.score - 100 };
      const held = best.get(passage.ref);
      if (!held || ranked.score > held.score) best.set(passage.ref, ranked);
    }
  }
  return [...best.values()].sort((a, b) => b.score - a.score).slice(0, options.limit ?? MAX_PASSAGES);
}

/**
 * The queries for a turn: the message itself, and the message with the conversation just before it, so a follow-up
 * ("how is it built?", "what else?") finds the thing being talked about. Both run at once and their results merge.
 */
export function turnQueries(messages: Array<{ role: string; content: string }>): string[] {
  const question = messages.at(-1)?.content.trim() ?? '';
  if (!question) return [];
  const earlier = messages.slice(0, -1);
  const lastUser = [...earlier].reverse().find((m) => m.role === 'user')?.content ?? '';
  const lastReply = earlier.at(-1)?.role === 'assistant' ? (earlier.at(-1)?.content ?? '') : '';
  const context = squash(`${clip(lastUser, 200)} ${clip(lastReply, 300)}`);
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
const body = (pageTitle: string, heading: string, parts: string[]) => [`${pageTitle}: ${heading}`, ...parts.map(squash).filter(Boolean)].join('\n\n');

/** Every section the index should hold, from the live content: the sync script's input. */
export async function siteDocuments(): Promise<SiteDocument[]> {
  const [projects, papers, blogs, home, hero, skills, experience] = await Promise.all([
    loadProjects(), loadPapers(), loadBlogs(), homeSections(), loadHero(), loadSkills(), loadExperience(),
  ]);
  const docs: SiteDocument[] = [];
  const add = (path: string, kind: SiteKind, pageTitle: string, anchor: string | undefined, heading: string, text: string) =>
    docs.push({ title: `${SITE_PREFIX}${anchor ? `${path}#${anchor}` : path}`, path, anchor, heading, kind, pageTitle, text });

  for (const p of projects) {
    for (const s of sectionsOfProject(p)) {
      // The tagline sits above What it is; Go deeper shows link labels, and the model needs their addresses for share_link.
      const lead = s.id === 'what-it-is' ? [p.tagline] : [];
      const links = s.id === 'go-deeper' ? (p.links ?? []).filter((l) => l.url && l.url !== '#').map((l) => `${l.label}: ${l.url}`) : [];
      add(projectPath(p), 'project', p.title, s.id, s.heading, body(p.title, s.heading, [...lead, ...s.blocks, ...links]));
    }
  }
  for (const paper of papers) {
    const markdown = await readPaper(paper.id);
    if (!markdown) continue;
    const path = `/research/papers/${paper.id}`;
    const status = paper.status === 'approved' ? [] : ['A working paper, awaiting my approval.'];
    for (const s of sectionsOfMarkdown(markdown, { levels: [1, 2, 3] })) {
      if (s.blocks.length) add(path, 'paper', paper.title, s.id, s.heading, body(paper.title, s.heading, [...status, ...s.blocks]));
    }
  }
  for (const blog of blogs) {
    const post = await readBlog(blog.id);
    if (!post) continue;
    for (const s of sectionsOfMarkdown(post.content, { levels: [1, 2, 3] })) {
      if (s.blocks.length) add(`/blogs/${blog.id}`, 'blog', blog.title, s.id, s.heading, body(blog.title, s.heading, s.blocks));
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
    add('/', 'home', s.id === 'story-about' ? 'About me' : 'Work history', s.id, s.heading, body(s.id === 'story-about' ? 'About me' : 'Work history', s.heading, [...s.blocks, ...extra]));
  }
  const contact = [
    'To reach me, open the Contact page: pick an area and a time for a free 30-minute consultation call.',
    'I consult on AI engineering, product design, marketing, and full-stack development.',
    ...SOCIAL_LINKS.map((l) => `${l.label}: ${l.url.replace(/^mailto:/, '')}`),
  ];
  add('/contact', 'contact', 'Contact', undefined, 'Contact and consultations', body('Contact', 'Contact and consultations', contact));
  return docs;
}
