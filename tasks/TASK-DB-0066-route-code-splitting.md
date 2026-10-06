# TASK-DB-0066 — route-level code splitting

| Field | Value |
|-------|-------|
| **Created** | 2026-10-05 |
| **Issue** | [#73](https://github.com/Pukujan/design-bakery/issues/73) (modular restructuring) |
| **Branch** | `task/TASK-DB-0066-route-code-splitting` |
| **Status** | Complete — verified in a browser; PR open. |

## Goal

Split every page route into its own chunk so a visitor downloads only the code for the page they are on. This is the modularization plan's step 3 (route half); the plan's step 2 (the `mermaid` half) shipped separately as [TASK-DB-0064](TASK-DB-0064-lazy-load-mermaid.md).

## Scope

- `App.tsx`: every substantive page route becomes a lazily-imported component.
- `adminRoutes.tsx`: the 15 admin editor routes likewise.
- New `lib/lazyPage.tsx` (the wrapper) and `components/RouteFallback.tsx` (the loading fallback).
- Kept **eager** on purpose: the layouts (`PortfolioPublicLayout`, `AdminLayoutShell`), `DefaultSiteHead`, the tiny redirect stubs (Cortex/Fossil/Study OS/Fluffy V4/IRE) and `NotFoundPage`. Lazy-loading a redirect only adds a chunk request before it navigates, and the 404 must render even when a chunk fails to load.

## Done

- `frontend/src/app/lib/lazyPage.tsx`: `lazyPage(loader)` — calls `lazy()` once at module scope and gives each page its own `<Suspense>` boundary, so a page inside a layout suspends without unmounting the layout's nav.
- `frontend/src/app/components/RouteFallback.tsx`: minimal spinner.
- `frontend/src/app/App.tsx` and `modules/admin/adminRoutes.tsx`: eager page imports replaced with `lazyPage(...)`.

## Evidence

Measured on this branch's base (`main`), Windows 11 / Node 24.

- Entry JS: **3,412.59 kB → 710.45 kB** (−79%); gzip **≈885 → 217.63 kB**.
- Entry CSS: **644.83 → 206.42 kB**; CSS is now split per route too (the case-study pages carry their own stylesheets).
- Per-page JS+CSS actually transferred on load:

  | Page | Before | After |
  |------|--------|-------|
  | `/` | 3,412.59 kB (one chunk) | 1,744 kB |
  | `/blogs` | 3,412.59 kB | 955 kB |
  | `/research` | 3,412.59 kB | 1,276 kB |

- The `/` figure is dominated by a **744 kB `socialIconResolver` chunk** — the whole lucide icon set, pulled in by `iconResolver.ts`'s namespace import. That is exactly what [TASK-DB-0065](TASK-DB-0065-trim-lucide-icons.md) (PR #76) removes. **With both changes `/` is ≈777 kB** — the two changes are complementary, not redundant: splitting moves the icon import into the lazy home chunk, and #76 shrinks that chunk.

Browser verification (Playwright/Chromium against the built `dist`, served locally):

- `/` loads 21 chunks and **none** matching case-study, mermaid, admin, research or editor.
- Head tags intact after splitting: `/` and `/blogs/8` both render a correct `<title>`, `meta[name=description]` and `link[rel=canonical]`. `DefaultSiteHead` sits outside the Suspense boundary, so the default tags are always present.
- `/case-studies/invest-ai` loads its own chunk; `/admin/login` loads its own chunk; blog diagrams still render.
- Only console error in the run is an unrelated external `i.imgur.com` image returning 403.

`pnpm lint`, `pnpm --dir frontend run typecheck` (no errors in changed files) and `pnpm run build` pass.

## Note — mermaid now loads with the detail page

Rollup merged mermaid's dynamic import into the shared `MermaidDiagram` chunk (927 kB), so on a blog/research detail page mermaid arrives with the page rather than when a diagram scrolls into view. The trade is acceptable: only detail-page visitors download it, and it is ready before they scroll, while `useInView` still defers the expensive *render*. Restoring the on-scroll download would need `manualChunks` to force mermaid into its own chunk — left as a follow-up rather than risk the diagram path the mermaid devlog warns against touching.

## Next step

Merge #74/#75/#76/#77 together and re-measure `main`; then consider `manualChunks` for a vendor chunk if the entry is still heavy. The CSS chunk (206 kB entry, 683 kB total across routes) is the remaining unexamined cost — see the note on issue #73.
