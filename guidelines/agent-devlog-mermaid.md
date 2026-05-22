# Agent devlog — Blog Mermaid (do not break)

**For Cursor agents.** Read this **before** any change to blog Mermaid styling or rendering.

**In-repo pointers (so this doc is not missed):**
- `extras/design changes to blog details/app/components/BlogDetailPage.tsx` — comment above `mermaid.initialize`
- `src/styles/globals.css` — comment above `.blog-mermaid-chart`
- `.cursor/rules/blog-mermaid.mdc` — auto-attached when editing those files

**Canonical implementation:** `extras/design changes to blog details/app/components/MermaidDiagram.tsx` (imported by `BlogDetailPage.tsx`).  
**Styles:** `src/styles/globals.css` (`.blog-mermaid-chart` only).  
**Test URL:** http://localhost:5300/endtoend-engineer/blogs/1 (dev port **5300**).

---

## What works (keep this pattern)

| Piece | Setting |
|-------|---------|
| Init | `startOnLoad: false`, `theme: 'default'`, `securityLevel: 'loose'` |
| Render | `mermaid.render(uniqueId, chart)` per diagram in `useEffect` |
| Mount | Empty container with `ref`; inject SVG via `el.innerHTML = svg`; call `bindFunctions?.(el)` |
| Cleanup | On unmount / chart change: `cancelled = true`, `el.innerHTML = ''` |
| Wrapper class | `blog-mermaid-chart` (not `mermaid` on the wrapper — avoids `contentLoaded` scanning) |
| Colors | CSS on `.blog-mermaid-chart svg g.node …` in `globals.css` (fills, labels, dark-mode arrows) |
| IDs | `blog-mmd-${random}` per render — never `#mermaid-<timestamp>` in CSS |

**Do not** call `mermaid.contentLoaded()` on the blog page or inside each diagram when using `render()`.

---

## What breaks charts (avoid)

These have all caused “broken” or blank Mermaid on blog detail in this project:

1. **`theme: 'base'` + large `themeVariables` objects** — unreliable; charts fail silently or render wrong.
2. **Post-render SVG mutation in JS** — e.g. `applyMermaidNodeGradient()`, hover handlers changing `transform`/`stroke` on `g.node`, injecting `<linearGradient>` and rewriting `fill` attributes after `contentLoaded`.
3. **`mermaid.contentLoaded()` + React** — especially **twice** (per `MermaidDiagram` and again in `BlogDetailPage` on `blog?.content`): race / double-parse with HMR.
4. **Raw chart text in `<div class="mermaid">`** with `startOnLoad: true` while also calling `contentLoaded()` — fragile with re-renders.
5. **Heavy global overrides** — broad `!important` on all node types across `.mermaid` without scoping; old `.blog-mermaid-diagram` zoom/scale hacks.
6. **CSS targeting dynamic IDs** — `#mermaid-1234567890` breaks on every render.

---

## Zoom + scroll viewport

Every diagram has a **toolbar**: zoom out / zoom in buttons, **% label**, and a **slider** (75%–300%).

- Zoom applies via `transform: scale()` on `.blog-mermaid-zoom-layer` inside a sized `.blog-mermaid-zoom-spacer` so scroll area grows correctly.
- Scroll frame (`.blog-mermaid-viewport--scroll`) when the chart is large at 100% **or** when zoom &gt; 1: `max-height: min(70vh, 520px)`, `overflow: auto`.
- **Phones** (`pointer: coarse` / `hover: none`): **pinch** on the viewport updates zoom (same state as slider); **one-finger swipe** scrolls inside the frame (native overflow, not a custom drag layer).
- **Do not** mutate SVG node styles after render — only wrapper transform.

**Test:** http://localhost:5300/endtoend-engineer/blogs/7

---

## Authoring diagrams in `blog-data.json` / `posts/*.md`

For **new long-form posts**, default to **`flowchart TD`** or **`sequenceDiagram`**. Horizontal `graph LR` often overflows the blog detail column and looks broken on mobile. Post id **8** (regulatory databases) is the reference for vertical-only charts.

---

## Safe ways to change appearance

| Goal | Safe approach |
|------|----------------|
| Node fill / border color | Edit `.blog-mermaid-chart svg g.node …` in `globals.css` |
| Label color | `.blog-mermaid-chart svg .nodeLabel`, `g.node text`, etc. |
| Dark-mode arrows | `.dark .blog-mermaid-chart svg .flowchart-link`, `.edgePath path`, `marker path` |
| Slightly different palette | Change hex in CSS only; **keep** `theme: 'default'` in JS |

**Risky (test on `/blogs/1` immediately):** `theme: 'base'`, `themeVariables`, gradient fills, JS that touches SVG after render.

**Not supported without high break risk:** true left-to-right gradient fills (`#dbd5a4` → `#649173`) via DOM injection; use a solid CSS fill instead.

---

## History (why this file exists)

| Attempt | Result |
|---------|--------|
| `contentLoaded()` + `.mermaid` div, `theme: 'default'` | Worked |
| `theme: 'base'` + many `themeVariables` (bluish-white, green, etc.) | Broke |
| JS gradient / hover on nodes | Broke |
| `contentLoaded()` on page + per diagram | Broke (intermittent) |
| `mermaid.render()` + `theme: 'default'` + scoped CSS `.blog-mermaid-chart` | **Current — stable** |

---

## Checklist before merging Mermaid changes

- [ ] Still `theme: 'default'` (no `themeVariables` unless explicitly re-tested and approved)
- [ ] Still `startOnLoad: false` + `mermaid.render()` per chart
- [ ] No `contentLoaded()` in `BlogDetailPage`
- [ ] No post-render SVG JS (gradients, hover, attribute rewrites)
- [ ] Styles scoped to `.blog-mermaid-chart`, not `#mermaid-*`
- [ ] Hard refresh http://localhost:5300/endtoend-engineer/blogs/1 — multiple diagrams visible, no red error text in chart boxes

---

## Related files

- `extras/design changes to blog details/app/components/MermaidDiagram.tsx` — render + scroll viewport
- `extras/design changes to blog details/app/components/BlogDetailPage.tsx` — markdown `code` for `language-mermaid`
- `src/app/modules/engineering/BlogDetailPage/BlogDetailPage.tsx` — re-export only
- `src/styles/globals.css` — `.blog-mermaid-chart` rules
- `guidelines/dev-log-2026-05-20.md` — broader blog detail session log
- `guidelines/agent-devlog-index.md` — master agent index
- `guidelines/agent-devlog-contract.md` — devlog + CodeGraph workflow
