/**
 * The per-turn citation record (TASK-DB-0129). A section is pointed at only on a real page, under a heading it has, with a quote
 * found in that section's text (sections.ts). Until TASK-DB-0153 a post or paper could be cited only after another tool read it
 * this turn; cite_section and outline_passages now read the page's sections themselves, which is the same grounding, because
 * the refusal stopped the page following a paper read in the same step or a turn earlier. check() remains for callers that
 * want the old test. Plain code, no model call.
 */

export type CitationRecord = { path: string; anchor?: string; quote?: string; ok: boolean; reason?: string };

export function createCitations() {
  const retrieved = new Set<string>();
  const log: CitationRecord[] = [];
  /** Moves allowed in this answer: 3 for a summary, 4 only when the visitor asked for the whole post (outline_passages depth full). */
  let limit = 3;
  /** How the page shows them: a summary swipes through the post while he talks; a cite or the whole-post walk perches at each heading. */
  let mode: 'swipe' | 'perch' = 'perch';
  const clean = (path: string) => path.split('#')[0];
  return {
    /** A tool returned this page's content (a post or paper read, a search hit, a project). */
    retrieve(path: string) {
      retrieved.add(clean(path));
    },
    wasRetrieved: (path: string) => retrieved.has(clean(path)),
    /** The guard: a cite is allowed only for a page this turn retrieved. */
    check(path: string): { ok: true } | { ok: false; reason: string } {
      return retrieved.has(clean(path)) ? { ok: true } : { ok: false, reason: 'not retrieved this turn: read it first (read_blog, read_paper or search_site), then cite' };
    },
    setLimit(n: number) {
      limit = Math.min(4, Math.max(1, n));
    },
    limit: () => limit,
    setMode(m: 'swipe' | 'perch') {
      mode = m;
    },
    mode: () => mode,
    record(entry: CitationRecord) {
      log.push(entry);
    },
    log: () => [...log],
    /** One word per citation for the trace: path#anchor, or path!reason when the guard refused it. */
    summary: () => log.map((c) => (c.ok ? `${c.path}#${c.anchor ?? ''}${c.quote ? ` "${c.quote.slice(0, 40)}"` : ''}` : `${c.path}!${c.reason?.split(':')[0] ?? 'refused'}`)),
  };
}

export type Citations = ReturnType<typeof createCitations>;
