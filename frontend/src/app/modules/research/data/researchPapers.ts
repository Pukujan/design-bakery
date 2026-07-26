/**
 * Design Bakery research, the single source of truth.
 *
 * Every paper body is a markdown file under `../content/`, imported raw (Vite
 * `?raw`) so triple-backtick fences, tables and Unicode operators survive
 * verbatim. There is no second system: the former static renders under
 * `public/research/papers/` were archived on 2026-07-26 and this module is what
 * `/research` and `/research/papers/:paperId` render.
 *
 * Status `approved` = owner-approved for public claim; `pending` = draft /
 * awaiting approval. Nothing is promoted without the owner.
 *
 * To add a paper: drop `content/db-r-YYYY-NNN.md` in place, import it below,
 * add an entry, and list it in RESEARCH_PAPERS. No static HTML needed.
 */

import PAPER_001_MD from '../content/db-r-2026-001.md?raw';
import PAPER_002_MD from '../content/db-r-2026-002.md?raw';
import PAPER_003_MD from '../content/db-r-2026-003.md?raw';
import PAPER_004_MD from '../content/db-r-2026-004.md?raw';
import PAPER_005_MD from '../content/db-r-2026-005.md?raw';
import PAPER_006_MD from '../content/db-r-2026-006.md?raw';
import PAPER_007_MD from '../content/db-r-2026-007.md?raw';
import PAPER_008_MD from '../content/db-r-2026-008.md?raw';
import PAPER_009_MD from '../content/db-r-2026-009.md?raw';

import SOURCE_EMOTION_MD from '../content/sources/ai-emotional-development-landscape.md?raw';
import SOURCE_SELFLEARN_MD from '../content/sources/self-learning-ai-survey.md?raw';

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

/**
 * Supporting material, working landscape/survey notes that papers cite.
 * Deliberately a separate type from ResearchPaper: these are NOT peer-style
 * papers and must never be listed as if they were. They exist so that a
 * citation resolves to something a reader can actually open.
 */
export interface ResearchSource {
  id: string;
  title: string;
  kind: 'landscape-note' | 'survey';
  compiled: string; // ISO date
  summary: string;
  content: string;
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
  content: PAPER_001_MD,
  bibtex: `@techreport{db-r-2026-001,
  title       = {Cortex reliability kernel: composition status and evidence boundaries},
  author      = {Pujan},
  institution = {Design Bakery},
  year        = {2026}, month = {7}, number = {db-r-2026-001},
  note        = {Working paper; status pending owner approval.}
}`,
};

const PAPER_002: ResearchPaper = {
  id: 'db-r-2026-002',
  title: 'Deny-by-default authorization for tool-using agents: the Cortex kernel model',
  authors: ['Pujan', 'Design Bakery'],
  submitted: '2026-07-22',
  status: 'pending',
  tags: ['cortex', 'authorization', 'kernel', 'security'],
  abstract:
    'The Cortex kernel model for tool-using agents: a structured request, deny-by-default authorization, explicit and scoped authority, a policy gate at the effect boundary, brokered effects through a sole writer, and content-bound receipts. A restatement of the reference-monitor and least-privilege principles specialised for agent effects. No benchmark claims.',
  content: PAPER_002_MD,
  bibtex: `@techreport{db-r-2026-002,
  title  = {Deny-by-default authorization for tool-using agents: the Cortex kernel model},
  author = {Pujan}, institution = {Design Bakery}, year = {2026}, month = {7},
  number = {db-r-2026-002}, note = {Working paper; pending owner approval; no numeric claims.}
}`,
};

const PAPER_003: ResearchPaper = {
  id: 'db-r-2026-003',
  title: 'Mechanically constraining an LLM orchestrator: control-plane authority and a same-family bias firewall',
  authors: ['Pujan', 'Design Bakery'],
  submitted: '2026-07-22',
  status: 'pending',
  tags: ['cortex', 'orchestration', 'bias', 'evaluation'],
  abstract:
    "The orchestrator is the most privileged component of a multi-agent system. Rather than debias a probabilistic planner, remove its authority: the model proposes and a deterministic controller owns state, permissions, retries, and commits. A same-family bias firewall makes a model's judgement of its own family advisory-only, with provenance-preserving blinding. Some 2026 arXiv identifiers are AI-suggested and unverified.",
  content: PAPER_003_MD,
  bibtex: `@techreport{db-r-2026-003,
  title  = {Mechanically constraining an LLM orchestrator: control-plane authority and a same-family bias firewall},
  author = {Pujan}, institution = {Design Bakery}, year = {2026}, month = {7},
  number = {db-r-2026-003}, note = {Working paper; pending; some 2026 arXiv IDs unverified.}
}`,
};

const PAPER_004: ResearchPaper = {
  id: 'db-r-2026-004',
  title: 'Black-box and grey-box validation of autonomous agent work',
  authors: ['Pujan', 'Design Bakery'],
  submitted: '2026-07-22',
  status: 'pending',
  tags: ['cortex', 'validation', 'agents', 'testing'],
  abstract:
    'Validating autonomous agent output without trusting the agent: a black-box outcome oracle over external state, a grey-box process oracle over invariants, and grey-box holdouts that receive real signatures (not implementations). A deterministic checker (never a model vote) decides pass or fail. A technical survey and position paper.',
  content: PAPER_004_MD,
  bibtex: `@techreport{db-r-2026-004,
  title  = {Black-box and grey-box validation of autonomous agent work},
  author = {Pujan}, institution = {Design Bakery}, year = {2026}, month = {7},
  number = {db-r-2026-004}, note = {Technical survey / position paper; pending; citations to be verified.}
}`,
};

const PAPER_005: ResearchPaper = {
  id: 'db-r-2026-005',
  title: 'Neuro-Symbolic Control for Reliable Multi-Model Coding Agents',
  authors: ['Pujan', 'Design Bakery'],
  submitted: '2026-07-22',
  status: 'pending',
  tags: ['cortex', 'control-plane', 'routing', 'reward', 'verification', 'agents'],
  abstract:
    "A hybrid architecture (the Neuro-Symbolic Coding Control Plane) that divides a coding agent's responsibilities across three layers: a deterministic safety/workflow kernel, a locally trained neural controller, and frontier LLM workers. The kernel owns permissions, budgets, artifact identity, and irreversible effects; the neural controller learns bounded structural decisions (which model to invoke, whether to test or revise, when to escalate); frontier models generate code but never control authoritative transitions. Central principle: the neural controller may optimize execution within a mechanically safe region, but may not redefine that region. Position, architecture, and experimental-methods paper; no original experimental results.",
  content: PAPER_005_MD,
  bibtex: `@techreport{db-r-2026-005,
  title  = {Neuro-Symbolic Control for Reliable Multi-Model Coding Agents},
  author = {Pujan}, institution = {Design Bakery}, year = {2026}, month = {7},
  number = {db-r-2026-005}, note = {Position/architecture/methods paper; pending; no original results; citations to be verified.}
}`,
};

const PAPER_006: ResearchPaper = {
  id: 'db-r-2026-006',
  title: 'Mechanical Bias Containment for Multi-Vendor LLM Orchestration',
  authors: ['Pujan', 'Design Bakery'],
  submitted: '2026-07-22',
  status: 'pending',
  tags: ['cortex', 'bias', 'orchestration', 'evaluation', 'conflict-of-interest'],
  abstract:
    'Rather than persuade or reward a frozen orchestrator into being unbiased, Mechanical Bias Containment mechanically limits the authority of potentially conflicted judgments via five mechanisms: provenance-preserving decision-local blinding, same-family conflict-of-interest exclusion, deterministic evidence precedence, authority-weighted external rewards, and refusal containment. A model may express a preference, but external software determines whether that preference has decision authority; reward alters routing and authority, never safety boundaries. Position and methods paper; no original experimental results.',
  content: PAPER_006_MD,
  bibtex: `@techreport{db-r-2026-006,
  title  = {Mechanical Bias Containment for Multi-Vendor LLM Orchestration},
  author = {Pujan}, institution = {Design Bakery}, year = {2026}, month = {7},
  number = {db-r-2026-006}, note = {Position/methods paper; pending; no original results; citations to be verified.}
}`,
};

const PAPER_007: ResearchPaper = {
  id: 'db-r-2026-007',
  title: 'Multi-Network Character Minds: LLM Orchestration, Affective Development, and the Open Gap',
  authors: ['Pujan', 'Design Bakery'],
  submitted: '2026-07-24',
  status: 'pending',
  tags: ['character-ai', 'multi-network', 'emotion', 'agents', 'architecture', 'survey'],
  abstract:
    'Survey of multi-network character AI: four architectural patterns (prompt-modular, LLM orchestrator + specialized nets, multi-net without LLM, hybrid LLM + world model), industry vs open stacks, affective development vs recognition, self-learning agents, and a dual-brain design thesis (LLM as slow control + specialized nets). Pending owner approval; no numeric product claims.',
  content: PAPER_007_MD,
  bibtex: `@techreport{db-r-2026-007,
  title  = {Multi-Network Character Minds: LLM Orchestration, Affective Development, and the Open Gap},
  author = {Pujan}, institution = {Design Bakery}, year = {2026}, month = {7},
  number = {db-r-2026-007}, note = {Landscape survey and design thesis; pending; no original results.}
}`,
};

/**
 * Drafted as db-r-2026-005 in the static system on 2026-07-26, unaware that id
 * was already held by the NSCCP paper above (registered 2026-07-22). Following
 * the rule this paper's own "Identifier note" states, take the next free id
 * rather than publish over an existing document, it moved to db-r-2026-008.
 * The reassignment is provisional and awaits owner confirmation. No text,
 * number, claim or status was altered by the move.
 */
const PAPER_008: ResearchPaper = {
  id: 'db-r-2026-008',
  title:
    'Verification independence without opinion aggregation: adversarial input generation with deterministic adjudication',
  authors: ['Pujan', 'Design Bakery'],
  submitted: '2026-07-26',
  status: 'pending',
  tags: ['cortex', 'verification', 'evaluation', 'multi-model', 'benchmarks'],
  abstract:
    "Criticism of multi-model ensembles targets opinion aggregation - debate, voting, consensus - and is well founded. A different use of model diversity is not covered by it: a second, different-vendor model generates adversarial INPUTS that the incumbent's blind spot excludes, and the verdict is decided by deterministic execution rather than by any model's judgement. These are distinct mechanisms with different failure modes; opinion aggregation fails verdict-corruptingly, input generation fails only yield-reducingly. Includes observational evidence from one codebase (n is small throughout), a three-incident mechanism trace, and a falsifiable four-arm benchmark protocol with judge-free ground truth. No controlled benchmark was run.",
  content: PAPER_008_MD,
  bibtex: `@techreport{pujan2026verificationindependence,
  title       = {Verification independence without opinion aggregation: adversarial input generation with deterministic adjudication},
  author      = {Pujan},
  institution = {Design Bakery Research},
  number      = {db-r-2026-008},
  year        = {2026},
  month       = {jul},
  note        = {Working paper, pending owner approval. No controlled benchmark was run; Section 6 is a protocol.
                 Drafted as db-r-2026-005; reassigned to db-r-2026-008 on 2026-07-26 to resolve an id collision.}
}`,
};

/**
 * Commissioned 2026-07-26 as a description of the development cycle as actually
 * practised, not as a proposal. Two conventions it follows deliberately, both
 * inherited from 008: every internal number carries a repository path, and the
 * figures that could not be substantiated are enumerated in the paper itself
 * (§6.6) rather than reconstructed. It uses the AUDITED cold-start count
 * (11 raised / 10 distinct / 6 defects / 4 ambiguities / 1 fixed); the earlier
 * "nine defects" headline was withdrawn on 2026-07-26 as not derivable from its
 * source, and §2.6 records the withdrawal instead of quietly dropping it.
 */
const PAPER_009: ResearchPaper = {
  id: 'db-r-2026-009',
  title:
    'The development cycle of an agent-built system: seating, routing, and the instruments that were missing',
  authors: ['Pujan', 'Design Bakery'],
  submitted: '2026-07-26',
  status: 'pending',
  tags: ['cortex', 'methodology', 'seating', 'verification', 'multi-model', 'process'],
  abstract:
    "A description of one project's AI-agent development cycle as it actually ran: contract, build, wire, end-to-end test, cold-start adversarial review, cross-family verdict, merge gate, with the measurement from 2026-07-26 that shows what each stage catches and no earlier stage can. Three findings. Seat separation must be by model family, not by name: a frozen clause voided a fully passing 25/25 verification pack the day it was adopted, and Knight & Leveson 1986 explains why independent construction does not give independent failure, and therefore why varying the per-seat frame matters as much as varying the model. Some work is irreducibly sequential (fix custody defects, then the pack that judges them, then the wiring, because wiring makes latent defects live) while independent tracks over disjoint file sets parallelise cleanly; every observed coordination hazard is a dated shared-working-tree incident. And most usefully: this project built sealed holdouts, mutation scoring, adapter differentials and cross-model adversarial review while having no code coverage, no static type checking, and no test-running CI in the kernel repo at all. The losses are included: the benchmark against a conventional stack loses 5 of 9 rows, 1 of 23 effect routes reaches the authoriser, detection of a stand-in security component scores 0/5, and the regime is not independent V&V in the IEEE 1012 sense.",
  content: PAPER_009_MD,
  bibtex: `@techreport{pujan2026developmentcycle,
  title       = {The development cycle of an agent-built system: seating, routing, and the instruments that were missing},
  author      = {Pujan},
  institution = {Design Bakery Research},
  number      = {db-r-2026-009},
  year        = {2026},
  month       = {jul},
  note        = {Working paper, pending owner approval. Case report, n = 1; no controlled experiment.
                 Uses the audited cold-start count; the earlier "nine defects" figure was withdrawn 2026-07-26.}
}`,
};

/** Newest first. */
export const RESEARCH_PAPERS: ResearchPaper[] = [
  PAPER_009,
  PAPER_008,
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

/**
 * Supporting sources, working notes cited by the papers above, published so
 * those citations resolve. Not papers; listed separately and never mixed in.
 */
export const RESEARCH_SOURCES: ResearchSource[] = [
  {
    id: 'ai-emotional-development-landscape',
    title: 'AI Emotional Development: Research Landscape 2023–2026',
    kind: 'landscape-note',
    compiled: '2026-07-23',
    summary:
      'Working landscape note on AI systems that develop or change emotions over time rather than only recognising them: computational models of emotional emergence, emergent affective geometry in foundation models, emotion as a developmental capability, and the gaps (no shared benchmark, no longitudinal studies, no unified theory). Cited by db-r-2026-007.',
    content: SOURCE_EMOTION_MD,
  },
  {
    id: 'self-learning-ai-survey',
    title: 'Self-Learning Problem-Solving AI: State of the Field (2023-2026)',
    kind: 'survey',
    compiled: '2026-07-23',
    summary:
      'Working survey of self-directed and autonomous learning systems (Voyager, MetaGPT, LATS, CodeAct, FireAct, EvoLLM and others), separating what is demonstrated and replicated from what is architecture-paper-only, plus the open gaps in open-ended problem discovery and recursive self-improvement. Cited by db-r-2026-007.',
    content: SOURCE_SELFLEARN_MD,
  },
];

export function getResearchSource(id: string): ResearchSource | undefined {
  return RESEARCH_SOURCES.find((s) => s.id === id);
}
