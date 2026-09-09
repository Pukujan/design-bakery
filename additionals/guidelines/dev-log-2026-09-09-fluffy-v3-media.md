# Dev log — 2026-09-09 (Fluffy V3 media direction)

| Field | Value |
|-------|-------|
| **Document date** | 2026-09-09 |
| **Created** | 2026-09-09 |
| **Last updated** | 2026-09-09 |

## Summary

Added a separate unlisted Fluffy System V3 gallery to test visual-media strategy rather than palette/layout variation. V2 remains untouched.

V3 deliberately keeps the focused-generation rule: one finished page per subject, plus one experimental mixed-media page.

## New gallery

- `frontend/public/experiments/fluffy-system-v3/index.html`
- `frontend/public/experiments/fluffy-system-v3/fluffy.html`
- `frontend/public/experiments/fluffy-system-v3/pam.html`
- `frontend/public/experiments/fluffy-system-v3/research-assurance.html`
- `frontend/public/experiments/fluffy-system-v3/mixed-media.html`
- `frontend/public/experiments/fluffy-system-v3/assets/fluffy-scene.webp.b64`

All V3 routes are `noindex,nofollow` and are not added to the homepage or sitemap.

## Media directions

### Fluffy

Dominant medium: generated editorial imagery.

The hero artwork was generated specifically for this V3 experiment, cropped/compressed, stored as a base64 WebP text asset, and loaded progressively by the page. Core copy, navigation, sources, diagrams, and CTAs remain HTML/SVG.

The page sells the gap between page generation and market judgment: buyer, alternatives, proof, market context, and brand research happen before the homepage is written.

### PAM

Dominant medium: custom SVG/vector illustration.

The page uses a project-preflight route and a bespoke projectization map. The marketing spine starts with implementation speed versus planning quality and the real PAM reuse-discovery loophole rather than a module inventory.

### Research Assurance

Dominant medium: scientific vector instrumentation.

Independent gauges represent source suitability, retrieval quality, temporal validity, and semantic support. The visual system reinforces the product boundary: a pass in one dimension does not visually imply a pass everywhere.

### Mixed media

Dominant idea: deliberate media composition.

Generated imagery provides atmosphere, inline SVG explains relationships, and Three.js provides a spatial field. This page is intentionally a stress test of whether richer media improves the story or simply adds noise.

Three.js is progressive enhancement, respects reduced-motion preference, and has a CSS fallback.

## Fluffy repo change

`Pukujan/fluffy-system` received `design/VISUAL_MEDIA_STRATEGY.md` and the Claude entrypoint now imports it. Future runs must choose whether a page is typography-led, screenshot-led, vector-led, generated-image-led, Three.js-led, or a restrained combination after positioning/brand research.

## Review rule

No V3 page is a featured-project decision. The owner may select, combine, iterate, or reject the set.

## Test URLs

- Gallery: `https://www.design-bakery.com/experiments/fluffy-system-v3/`
- Fluffy: `https://www.design-bakery.com/experiments/fluffy-system-v3/fluffy.html`
- PAM: `https://www.design-bakery.com/experiments/fluffy-system-v3/pam.html`
- Research Assurance: `https://www.design-bakery.com/experiments/fluffy-system-v3/research-assurance.html`
- Mixed media: `https://www.design-bakery.com/experiments/fluffy-system-v3/mixed-media.html`
