# TASK-DB-0064 — lazy-load Mermaid so it leaves the entry chunk (modularization step 3)

| Field | Value |
|-------|-------|
| **Created** | 2026-10-05 |
| **Issue** | [#73](https://github.com/Pukujan/design-bakery/issues/73) (modular restructuring) |
| **Branch** | `task/TASK-DB-0064-lazy-load-mermaid` |
| **Status** | Complete — verified in a browser; PR open. |

## Goal

Move the mermaid diagram engine out of the 3.4 MB entry chunk (plan step 3) so a visitor who never opens a diagram never downloads it.

## Scope

- `MermaidDiagram.tsx` only: replace the static `import mermaid from 'mermaid'` with a cached dynamic `import()` inside the existing render effect.
- The engine now loads only when a diagram nears the viewport (the existing `useInView` gate) and is fetched once per session.
- Out of scope here: route-level code splitting (deferred, see Next step) and the separate lucide-icon finding (own task).

## Done

- `frontend/src/app/modules/blog/render/MermaidDiagram.tsx`: static import removed; added a memoized `loadMermaid()`; the resolved API is passed into `configureMermaid`.
- No behaviour change: still `theme: 'default'`, `startOnLoad: false`, `mermaid.render()` per chart ([agent-devlog-mermaid.md](../additionals/guidelines/agent-devlog-mermaid.md) checklist holds).

## Evidence

- Entry chunk: **3,412.59 kB → 2,796.25 kB** (−616 kB, −18%); gzip **≈885 → 738.4 kB** (−147 kB).
- `mermaid.core-*.js` (610 kB) is now a separate async chunk; mermaid v11 already split its per-diagram types, so those were async before.
- Browser check (Playwright/Chromium against the built `dist`, served locally, `/blogs/8`): **0 mermaid requests before the diagram scrolled into view**, then the `mermaid.core` chunk loads and **17 diagrams render**, with **no console errors**.
- `pnpm --dir frontend run typecheck` and `pnpm run build` pass.

## Next step

Fix the lucide icon import before attempting route splitting. `frontend/src/app/lib/iconResolver.ts` uses `import * as LucideIcons from 'lucide-react'`, which pulls the whole icon set into the entry chunk (≈1574 references) — the largest single remaining cause of the 2.8 MB entry, and a smaller, lower-risk change than route splitting. Route-level splitting carries an SEO risk (Suspense fallbacks can drop the head tags) and needs its own verification.
