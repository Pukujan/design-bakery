/**
 * search_site's search (TASK-DB-0142). Passages come from Octo's RAG index (hybrid lexical + vector search, then the
 * reranker), where scripts/sync-copilot-rag.mjs keeps one document per project, paper and blog post, each titled
 * `site:<page path>` so a match maps straight back to a page. When Octo is not configured, errors, is slow or finds
 * nothing on the site, the old keyword count answers instead, so the copilot never loses search.
 */
import { loadBlogs, loadPapers, loadProjects, projectPath, readBlog, readPaper } from './knowledge.js';

export type SiteHit = { kind: 'project' | 'paper' | 'blog'; ref: string; title: string; summary: string };
/** One indexed document: what the sync script sends to Octo. */
export type SiteDocument = { title: string; ref: string; kind: SiteHit['kind']; text: string };

export const SITE_PREFIX = 'site:';
export const MAX_HITS = 6;
/** A reranked query took ~1.0–1.2 s when measured (2026-11-03); past this the keyword search answers. */
export const RAG_TIMEOUT_MS = 2500;
/** Chunks asked of Octo: several can come from one long paper, and only the best per page is kept. */
const RAG_CHUNKS = 15;

const clip = (text: string, max: number) => (text.length > max ? `${text.slice(0, max)}…` : text);
const squash = (text: string) => text.replace(/\s+/g, ' ').trim();

export const kindOf = (ref: string): SiteHit['kind'] | null =>
  ref.startsWith('/work/') ? 'project' : ref.startsWith('/research/papers/') ? 'paper' : ref.startsWith('/blogs/') ? 'blog' : null;

/** Page titles by path, from the live content: a match is kept only if its page still exists. */
async function pageTitles(): Promise<Map<string, string>> {
  const [projects, papers, blogs] = await Promise.all([loadProjects(), loadPapers(), loadBlogs()]);
  return new Map([
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

type OctoMatch = { title?: string; content?: string };
export type OctoConfig = { base: string; workspaceId: string; key: string };

/** Octo's address and key from the environment, or null when RAG search is off or not set up. */
export function octoConfig(env: NodeJS.ProcessEnv = process.env): OctoConfig | null {
  const key = env.OCTO_API_KEY?.trim();
  const workspaceId = env.OCTO_WORKSPACE_ID?.trim();
  if (!key || !workspaceId || env.COPILOT_RAG === 'off') return null;
  const base = (env.OCTO_API_BASE ?? 'https://octodb.design-bakery.com').trim().replace(/\/+$/, '').replace(/\/api$/, '');
  return { base, workspaceId, key };
}

/** Matches in rank order, mapped to pages: only `site:` documents whose page still exists, the best chunk per page. */
export function mapMatches(matches: OctoMatch[], titles: Map<string, string>): SiteHit[] {
  const hits: SiteHit[] = [];
  const seen = new Set<string>();
  for (const match of matches) {
    if (!match.title?.startsWith(SITE_PREFIX)) continue;
    const ref = match.title.slice(SITE_PREFIX.length);
    const kind = kindOf(ref);
    const title = titles.get(ref);
    if (!kind || !title || seen.has(ref)) continue;
    seen.add(ref);
    hits.push({ kind, ref, title, summary: clip(squash(match.content ?? ''), 300) });
    if (hits.length >= MAX_HITS) break;
  }
  return hits;
}

/** Octo's hybrid search over the site's documents. Throws on any failure, including the timeout. */
export async function ragSearch(query: string, config: OctoConfig, options: { fetch?: typeof fetch; timeoutMs?: number } = {}): Promise<SiteHit[]> {
  const doFetch = options.fetch ?? fetch;
  const [res, titles] = await Promise.all([
    doFetch(`${config.base}/api/rag/query`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId: config.workspaceId, query, limit: RAG_CHUNKS, filter: { titlePrefix: SITE_PREFIX, latestVersionOnly: true } }),
      signal: AbortSignal.timeout(options.timeoutMs ?? RAG_TIMEOUT_MS),
    }),
    pageTitles(),
  ]);
  if (!res.ok) throw new Error(`octo rag query: HTTP ${res.status}`);
  const body = (await res.json()) as { matches?: OctoMatch[] };
  return mapMatches(body.matches ?? [], titles);
}

/** search_site: Octo RAG first; the keyword count when Octo is off, fails, times out or finds no site page. */
export async function searchSite(
  query: string,
  options: { fetch?: typeof fetch; timeoutMs?: number; env?: NodeJS.ProcessEnv } = {},
): Promise<{ hits: SiteHit[]; source: 'rag' | 'keyword' }> {
  const config = octoConfig(options.env);
  if (config) {
    try {
      const hits = await ragSearch(query, config, options);
      if (hits.length) return { hits, source: 'rag' };
    } catch {
      // Fall through: a search that answers from the keyword count beats one that fails.
    }
  }
  return { hits: await keywordSearch(query), source: 'keyword' };
}

/** Every page the index should hold, from the live content: the sync script's input. */
export async function siteDocuments(): Promise<SiteDocument[]> {
  const [projects, papers, blogs] = await Promise.all([loadProjects(), loadPapers(), loadBlogs()]);
  const docs: SiteDocument[] = [];
  for (const p of projects) {
    const highlights = (p.stats ?? []).map((s) => `- ${s.label}`);
    const text = [
      `# ${p.title}`,
      p.tagline,
      p.description,
      ...(highlights.length ? ['## Highlights', ...highlights] : []),
      `## Built with\n${p.tech.join(', ')}`,
    ].join('\n\n');
    docs.push({ title: `${SITE_PREFIX}${projectPath(p)}`, ref: projectPath(p), kind: 'project', text });
  }
  for (const paper of papers) {
    const body = await readPaper(paper.id);
    const text = body ?? `# ${paper.title}\n\n${paper.abstract}`;
    docs.push({ title: `${SITE_PREFIX}/research/papers/${paper.id}`, ref: `/research/papers/${paper.id}`, kind: 'paper', text });
  }
  for (const blog of blogs) {
    const post = await readBlog(blog.id);
    if (!post) continue;
    const text = `# ${post.title}\n\n${post.content}`;
    docs.push({ title: `${SITE_PREFIX}/blogs/${blog.id}`, ref: `/blogs/${blog.id}`, kind: 'blog', text });
  }
  return docs;
}
