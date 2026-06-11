# Agent devlog — Blog Mermaid (do not break)

| Field | Value |
|-------|-------|
| **Document date** | 2026-05-18 |
| **Created** | 2026-05-18 |
| **Last updated** | 2026-05-27 |

**For Cursor agents.** Read this **before** any change to blog Mermaid styling or rendering.

### Revision history

| Date | Notes |
|------|--------|
| 2026-05-18 | Mermaid on blog detail; globals.css chart shell |
| 2026-05-20 | Blog detail v2 integration |
| 2026-05-21 | Interactive zoom toolbar; scroll viewport |
| 2026-05-27 | Dark-mode arrows: `themeVariables` at render + expanded `.blog-mermaid-chart` edge CSS |

**In-repo pointers (so this doc is not missed):**
- `src/app/modules/engineering/BlogDetailPage/MermaidDiagram.tsx` — `mermaid.initialize`
- `src/app/modules/engineering/BlogDetailPage/BlogDetailPage.tsx` — markdown `code` for `language-mermaid`
- `src/styles/globals.css` — comment above `.blog-mermaid-chart`
- `.cursor/rules/blog-mermaid.mdc` — auto-attached when editing those files

**Canonical implementation:** `src/app/modules/engineering/BlogDetailPage/MermaidDiagram.tsx` (imported by `BlogDetailPage.tsx`).  
**Styles:** `src/styles/globals.css` (`.blog-mermaid-chart` only).  
**Test URL:** http://localhost:5300/endtoend-engineer/blogs/1 (first free dev port from 5300 — see Vite log).

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
- **Focal zoom:** after each zoom change, scroll is adjusted so the point under the cursor / pinch center stays fixed (not top-left growth only).
- Scroll frame (`.blog-mermaid-viewport--scroll`) when the chart is large at 100% **or** when zoom &gt; 1: `max-height: min(70vh, 520px)`, `overflow: auto`.
- **Loading placeholder:** shimmer + inline `min-height` from chart line-count estimate (cap 520px). Do not reset `chartSize` unless the `chart` string changed.
- **Lazy render:** `useInView` + `rootMargin: 240px` — `mermaid.render()` only when the block nears the viewport.
- **Queue:** `enqueueMermaidRender()` in `mermaidRenderQueue.ts` — one diagram at a time on diagram-heavy posts.
- **Pinch** (touchscreen or trackpad that reports two pointers): updates zoom, synced with slider.
- **Mouse / trackpad wheel:** **Shift+scroll** or **Ctrl+scroll** (Windows/Linux) or **⌘+scroll** (Mac) on the viewport zooms toward the cursor.
- **Pan:** scroll / swipe inside the frame (native `overflow: auto`); one-finger on touch, wheel or drag scroll on laptop.
- **Scroll chaining:** `overscroll-behavior: auto` on the viewport — at top/bottom/edge, continued scrolling moves the **page** (do not use `contain`; it traps scroll inside the chart).
- **Do not** mutate SVG node styles after render — only wrapper transform.

**Test:** http://localhost:5300/endtoend-engineer/blogs/9 (CodeGraph agents post; was `/blogs/7` before 2026-05 swap with post 9)

---

## Authoring diagrams in `blog-data.json` / `posts/*.md`

For **new long-form posts**, default to **`flowchart TD`** or **`sequenceDiagram`**. Horizontal `graph LR` often overflows the blog detail column and looks broken on mobile. Post id **8** (regulatory databases) is the reference for vertical-only charts.

---

## Safe ways to change appearance

| Goal | Safe approach |
|------|----------------|
| Node fill / border color | Edit `.blog-mermaid-chart svg g.node …` in `globals.css` |
| Label color | `.blog-mermaid-chart svg .nodeLabel`, `g.node text`, etc. |
| Dark-mode arrows | `configureMermaid(isDark)` in `MermaidDiagram.tsx` sets `themeVariables` (`lineColor`, `arrowheadColor`, `signalColor`, …); CSS fallback on `.arrowheadPath` **fill**, `.marker`, `.messageLine0/1` in `globals.css` |
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

- [ ] Still `theme: 'default'` (edge-only `themeVariables` for light/dark arrows is OK; no `theme: 'base'`)
- [ ] Still `startOnLoad: false` + `mermaid.render()` per chart
- [ ] No `contentLoaded()` in `BlogDetailPage`
- [ ] No post-render SVG JS (gradients, hover, attribute rewrites)
- [ ] Styles scoped to `.blog-mermaid-chart`, not `#mermaid-*`
- [ ] Hard refresh blog detail URL on the port Vite printed at startup — multiple diagrams visible, no red error text in chart boxes

---

## Related files

- `src/app/modules/engineering/BlogDetailPage/MermaidDiagram.tsx` — render + scroll viewport
- `src/app/modules/engineering/BlogDetailPage/BlogDetailPage.tsx` — markdown `code` for `language-mermaid`
- `src/styles/globals.css` — `.blog-mermaid-chart` rules
- `guidelines/dev-log-2026-05-20.md` — broader blog detail session log
- `guidelines/agent-devlog-index.md` — master agent index
- `guidelines/agent-devlog-contract.md` — devlog + CodeGraph workflow
