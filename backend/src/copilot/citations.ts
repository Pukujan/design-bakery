/**
 * The citation guard and per-turn record (TASK-DB-0129). A page or section may be cited only if one of this turn's tools
 * actually retrieved it, the way the Precedent safeguard refuses a draft that cites something it never fetched. Plain
 * code, no model call: the tools mark what they return, cite_section asks before it emits.
 */

export type CitationRecord = { path: string; anchor?: string; quote?: string; ok: boolean; reason?: string };

export function createCitations() {
  const retrieved = new Set<string>();
  const log: CitationRecord[] = [];
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
    record(entry: CitationRecord) {
      log.push(entry);
    },
    log: () => [...log],
    /** One word per citation for the trace: path#anchor, or path!reason when the guard refused it. */
    summary: () => log.map((c) => (c.ok ? `${c.path}#${c.anchor ?? ''}${c.quote ? ` "${c.quote.slice(0, 40)}"` : ''}` : `${c.path}!${c.reason?.split(':')[0] ?? 'refused'}`)),
  };
}

export type Citations = ReturnType<typeof createCitations>;
