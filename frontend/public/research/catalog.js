/** Design Bakery research catalog.
 *  status: "approved" = owner-approved for public claim surface
 *          "pending"  = draft / awaiting approval (shown only when filter allows)
 */
window.DB_RESEARCH = {
  schema: "design-bakery.research.catalog.v1",
  updated: "2026-07-22",
  papers: [
    {
      id: "db-r-2026-004",
      title: "Black-box and grey-box validation of autonomous agent work",
      authors: ["Pujan", "Design Bakery"],
      submitted: "2026-07-22",
      status: "pending",
      tags: ["cortex", "validation", "agents", "testing"],
      href: "/research/papers/db-r-2026-004.html",
      abstract:
        "Validating autonomous agent output without trusting the agent: a black-box outcome oracle over external state, a grey-box process oracle over invariants, and grey-box holdouts that receive real signatures (not implementations). A deterministic checker — never a model vote — decides pass or fail.",
      pdf: null,
      bib: "/research/papers/db-r-2026-004.bib"
    },
    {
      id: "db-r-2026-003",
      title: "Mechanically constraining an LLM orchestrator: control-plane authority and a same-family bias firewall",
      authors: ["Pujan", "Design Bakery"],
      submitted: "2026-07-22",
      status: "pending",
      tags: ["cortex", "orchestration", "bias", "evaluation"],
      href: "/research/papers/db-r-2026-003.html",
      abstract:
        "The orchestrator is the most privileged component of a multi-agent system. Rather than debias a probabilistic planner, remove its authority: the model proposes and a deterministic controller owns state, permissions, retries, and commits. A same-family bias firewall makes a model's judgement of its own family advisory-only, with provenance-preserving blinding. Some 2026 arXiv identifiers are AI-suggested and unverified.",
      pdf: null,
      bib: "/research/papers/db-r-2026-003.bib"
    },
    {
      id: "db-r-2026-002",
      title: "Deny-by-default authorization for tool-using agents: the Cortex kernel model",
      authors: ["Pujan", "Design Bakery"],
      submitted: "2026-07-22",
      status: "pending",
      tags: ["cortex", "authorization", "kernel", "security"],
      href: "/research/papers/db-r-2026-002.html",
      abstract:
        "The Cortex kernel model for tool-using agents: a structured request, deny-by-default authorization, explicit and scoped authority, a policy gate at the effect boundary, brokered effects through a sole writer, and content-bound receipts. A restatement of the reference-monitor and least-privilege principles specialised for agent effects. No benchmark claims.",
      pdf: null,
      bib: "/research/papers/db-r-2026-002.bib"
    },
    {
      id: "db-r-2026-001",
      title: "Cortex reliability kernel: composition status and evidence boundaries",
      authors: ["Pujan", "Design Bakery"],
      submitted: "2026-07-20",
      status: "pending",
      tags: ["cortex", "reliability", "benchmarks"],
      href: "/research/papers/db-r-2026-001.html",
      abstract:
        "Describes the Cortex case-study framing of component-tested mechanisms versus blocked composition, and the documentation rules for benchmarks that must not over-claim live production governance. Owner approval required before any numeric result is treated as published.",
      pdf: null,
      bib: "/research/papers/db-r-2026-001.bib"
    }
  ]
};
