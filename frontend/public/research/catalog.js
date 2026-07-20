/** Design Bakery research catalog.
 *  status: "approved" = owner-approved for public claim surface
 *          "pending"  = draft / awaiting approval (shown only when filter allows)
 */
window.DB_RESEARCH = {
  schema: "design-bakery.research.catalog.v1",
  updated: "2026-07-20",
  papers: [
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
