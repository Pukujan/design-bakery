# TASK-DB-0146: AI Pujan points at a paper's charts and diagrams

**Goal.** On a research paper, the copilot's summary and citations went only to headings and text. The owner asked for it to point at the charts and diagrams too, as they show more.

**Done.**
- `backend/src/copilot/sections.ts`: with `visuals` (papers only, set in `knowledge.ts`), a `<figure data-figure="NAME">` is a section `figure-NAME` titled by its caption's first sentence ("Figure 1. …"), with the caption as its quotable block; the Nth ```mermaid block is `diagram-N`, titled "Diagram: <section heading>". The surrounding section keeps its text. No new regex.
- `buildPassages`: when a paper has a visual and the summary picked none, the first visual replaces the passage nearest it (never the opening one), in reading order.
- `tools.ts`: `cite_section` tells the model to point at a Figure or Diagram heading when it shows what it is saying; `summarize_page` tells it to say what a chart shows.
- `frontend/src/app/modules/lab/Article.tsx` (the live paper renderer): figures get `id="figure-NAME"`, diagrams `id="diagram-N"`, both `data-copilot-visual`. `quoteHighlight.ts` treats such an element as its own section, so a caption quote is highlighted inside it.

**Evidence.**
- `node scripts/test-copilot-cite.mjs` (new case: ids, titles, caption quote, summary includes the figure, order) and `node scripts/test-copilot-tools.mjs` pass.
- Local stack, db-r-2026-010: "summarize this paper" gave "Jump to Figure 1. A judge's score depends on whether skipped questions count."; pressing it scrolled to the chart, the cursor sat beside it and the caption was highlighted. db-r-2026-009: the summary offered "Diagram: 2. The cycle" and it scrolled to the mermaid diagram.

**Next.** Blog posts with diagrams could get the same (pass `visuals` for `/blogs/<id>`); left out, as the ask was research.
