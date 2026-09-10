# Agent devlog — Fluffy V4 visual rebuild

| Field | Value |
|---|---|
| **Document date** | 2026-09-10 |
| **Created** | 2026-09-10 |
| **Last updated** | 2026-09-10 |

For coding agents. Read before editing `frontend/public/experiments/fluffy-system-v4/` visual pages or gallery previews.

## Canonical handoff

Read [`../handoffs/fluffy-v4-visual-rebuild/README.md`](../handoffs/fluffy-v4-visual-rebuild/README.md) first. Its bundled reference images are the visual source of truth for the current rebuild.

## Canonical implementation paths

- `frontend/public/experiments/fluffy-system-v4/index.html`
- `frontend/public/experiments/fluffy-system-v4/*.html`
- `frontend/public/experiments/fluffy-system-v4/assets/`
- reference bundle: `additionals/handoffs/fluffy-v4-visual-rebuild/`

## Stable rules

| Safe / required | Avoid |
|---|---|
| Normal `.webp` / `.avif` / `.png` / `.svg` assets | Inline `data:image/...;base64,...` production art |
| Important copy and controls as real HTML | Full-page screenshot used as the webpage |
| Separate hero/card art where the reference has independent visuals | One generic background reused for the whole page |
| SVG/CSS UI icons | AI-rasterized icons with fuzzy text |
| Grid/Flex for major layout | Fixed desktop canvas scaled down on mobile |
| Dedicated focal positions/mobile crops where needed | Forced image sizing such as `64% 100%` |
| Browser screenshot comparison before approval | Calling visual work finished from code inspection alone |

## First milestone

Rebuild Study Partner only, matching `additionals/handoffs/fluffy-v4-visual-rebuild/references/study-partner-reference.webp`, then establish the pattern for the other seven directions.

The currently merged `assets/fluffy-study-partner.avif` solved the base64 transport issue but is **not** the accepted visual direction. It may be replaced/removed when the faithful Study Partner asset set lands.

## Visual QA

Local Vite port is the first free port from 5300; use the startup log. Test:

- `/experiments/fluffy-system-v4/fluffy-study-partner.html`
- desktop around 1448×1086 plus 1440×900 / 1920×1080
- mobile 390×844, 430×932, 360×800

Compare screenshots against the bundled reference. Check that the rebuilt page has no `data:image` payload, no horizontal mobile overflow, and normal asset requests return 200.

## Before merge

- [ ] Desktop screenshot compared to reference.
- [ ] Mobile screenshot compared and intentionally rearranged.
- [ ] Important text is HTML.
- [ ] New images are real repo assets.
- [ ] SVG icons remain vector.
- [ ] No base64 production art reintroduced.
- [ ] PR includes easy-to-review desktop/mobile screenshots or links.
- [ ] This devlog and handoff remain accurate if architecture changes.

## Revision history

- 2026-09-10 — created after V4 image/base64 and fidelity debugging; established reference-driven, asset-based responsive rebuild workflow.
