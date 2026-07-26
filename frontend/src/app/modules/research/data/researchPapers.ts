/**
 * Design Bakery research papers, local, data-driven source (mirrors the blog's
 * local-data path). Each paper carries arXiv-style metadata plus a markdown body
 * rendered by the React research pages. Status "approved" = owner-approved for
 * public claim; "pending" = draft / awaiting approval.
 *
 * To add a paper: append an entry here. No static HTML needed.
 */

export type ResearchStatus = 'approved' | 'pending';

export interface ResearchPaper {
  id: string;
  title: string;
  authors: string[];
  submitted: string; // ISO date
  status: ResearchStatus;
  tags: string[];
  abstract: string;
  /** Markdown body (supports GFM tables + ```mermaid fenced diagrams). */
  content: string;
  /** Optional BibTeX string shown/downloadable on the paper page. */
  bibtex?: string;
}

const PAPER_001: ResearchPaper = {
  id: 'db-r-2026-001',
  title: 'Cortex reliability kernel: composition status and evidence boundaries',
  authors: ['Pujan', 'Design Bakery'],
  submitted: '2026-07-20',
  status: 'pending',
  tags: ['cortex', 'reliability', 'benchmarks'],
  abstract:
    'Cortex is reliability infrastructure for AI agent runtimes: contract-first process, deny-by-default authorization, content-bound receipts, and independent evaluation. This note separates component-tested mechanisms from composed product-path status, and states documentation rules for benchmarks so green tests are not silently promoted to production-governance claims. Owner approval required before any numeric result is treated as published.',
  content: `> **Owner gate.** This document is a scaffold for arXiv-style research presentation. Claims, tables, and citations below are structural placeholders until the owner marks the paper \`approved\` and accepts the numeric content.

## Abstract

Cortex is reliability infrastructure for AI agent runtimes: contract-first process, deny-by-default authorization, content-bound receipts, and independent evaluation. This note separates *component-tested* mechanisms from *composed product path* status, and states documentation rules for benchmarks so green tests are not silently promoted to production-governance claims.

## 1. Scope and non-claims

- Does not claim live Cortex-governed production runs unless an approved table says so.
- Does not treat builder self-report as independent evaluation.
- Composition status remains blocked until an owner-approved recovery/holdout path says otherwise.
- Does not invent metrics, pass rates, or latency figures for empty benchmark cells.

## 2. Method (documentation)

Public research entries require: stable id, authors, abstract, citation list with resolvable links or in-repo paths, and explicit status (\`pending\` | \`approved\`). Benchmark rows require method name, date, environment, and artifact pointer. Literature-facing claims should prefer verified identifiers (DOI, arXiv id) over ungrounded paraphrase.

## 3. Evidence boundaries

Component suites and sealed holdouts may exist in engineering workspaces; that does not authorize public product claims. Status language on this site tracks the research catalog only. The matrix below is a *qualitative* boundary map: it records what each mechanism demonstrates in isolation versus its status in the reviewed composition branch, and carries **no numeric claims**.

| Mechanism | Component evidence (isolated) | Composition status (reviewed branch) |
| --- | --- | --- |
| Contract-first plan | Merged and component-tested. | **Blocked** (no durable owner-frozen plan receipt demonstrated). |
| Deny-by-default apply gate | Standalone pure path gate, tested in isolation. | **Blocked** (composition calls the gate without a broker-mediated apply boundary). |
| Content-bound receipts | Receipt components merged and tested. | **Blocked** (composition accepts an arbitrary callback result as its approval receipt). |
| Independent evaluation / recovery | Independent review performed; focused tests observed passing. | **Blocked** (projection permitted APPROVED without a hash; repair path: builder repair, independent holdout, owner review). |

## 4. Benchmarks (owner approval required)

No benchmark table in this revision. This paper makes no numeric claim, so an empty table would imply results that do not exist. Measured results live in the repository ledger evals/results.jsonl, where every figure carries a provenance tag (committed-artifact / recomputed / reconciled / prose-only). Figures are cited from there, never restated here.

## References

1. Design Bakery. *Cortex case study*. 2026. [/case-studies/cortex/](/case-studies/cortex/)
2. Stupidly Simple Cortex. *Start here / capability status* (in-repo harness docs). Local workspace documentation; not an external peer-reviewed source.`,
  bibtex: `@techreport{db-r-2026-001,
  title       = {Cortex reliability kernel: composition status and evidence boundaries},
  author      = {Pujan},
  institution = {Design Bakery},
  year        = {2026}, month = {7}, number = {db-r-2026-001},
  note        = {Working paper; status pending owner approval.}
}`,
};

// Papers 002–004 are appended from a companion module to keep this file readable.
import { PAPER_002, PAPER_003, PAPER_004, PAPER_005, PAPER_006, PAPER_007 } from './researchPapers.longform';

export const RESEARCH_PAPERS: ResearchPaper[] = [
  PAPER_007,
  PAPER_006,
  PAPER_005,
  PAPER_004,
  PAPER_003,
  PAPER_002,
  PAPER_001,
];

export function getResearchPaper(id: string): ResearchPaper | undefined {
  return RESEARCH_PAPERS.find((p) => p.id === id);
}
