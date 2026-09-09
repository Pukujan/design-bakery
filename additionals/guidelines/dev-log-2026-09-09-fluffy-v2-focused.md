# Dev log — 2026-09-09 (Fluffy v2 focused gallery)

| Field | Value |
|-------|-------|
| **Document date** | 2026-09-09 |
| **Created** | 2026-09-09 |
| **Last updated** | 2026-09-09 |

## Summary

Created a separate unlisted Fluffy System v2 gallery using a new quality rule: one deeply worked primary marketing page per product/audience, plus one dedicated Three.js experiment. This replaces batch option generation as the default review model.

## Why this round is different

The owner observed that single-page HTML work tends to be much stronger than multi-option generation. The v2 gallery treats choice generation and design refinement as separate tasks.

Instead of several rapid variants per subject, v2 contains:

- one focused Fluffy product-marketing page;
- one focused Project Assurance Modules page;
- one public-safe focused Research Assurance page;
- one focused Three.js Fluffy exploration.

The positioning and brand research may branch before rendering. Finished pages are generated and reviewed serially.

## Files

| File | Purpose |
|------|---------|
| `frontend/public/experiments/fluffy-system-v2/index.html` | Separate v2 review gallery |
| `frontend/public/experiments/fluffy-system-v2/fluffy.html` | Fluffy product marketing page |
| `frontend/public/experiments/fluffy-system-v2/pam.html` | PAM AI-era project-preflight market page |
| `frontend/public/experiments/fluffy-system-v2/research-assurance.html` | Public-safe RA market page |
| `frontend/public/experiments/fluffy-system-v2/fluffy-3d.html` | Three.js fuzzy-to-sharp spatial concept |

## Market context used

### Fluffy

- Ahrefs 2025 survey: 87% of 879 marketers said they use AI to help create content; AI users in the sample published 42% more content per month.
- Research on perceived AI authorship and marketing authenticity is used as market context, not as product efficacy evidence.

### PAM

- Stack Overflow 2025: 84% use or plan to use AI in development, 69% do not plan AI use for project planning, and 66% report “almost right” AI solutions as a frustration.
- DORA 2026: AI adoption can increase both throughput and instability; audit/verification work often absorbs some creation-time savings.
- PAM issue #10 remains the concrete product incident.

### Research Assurance

- Stanford AI Index 2026: 362 documented AI incidents in 2025, up from 233 in 2024.
- NIST material is used to support the multidimensional measurement/assurance framing.
- Public page does not link the private Research Assurance source repository.

## Gallery boundary

- Route: `https://www.design-bakery.com/experiments/fluffy-system-v2/`
- `noindex,nofollow`
- no sitemap entry
- no homepage link
- no featured-project promotion
- owner may select, combine, iterate, or reject all

## Three.js

`fluffy-3d.html` uses Three.js as progressive enhancement. Product, buyer, market, proof, and brand begin spatially scattered and align as the page progresses. Core content remains semantic HTML, and the page keeps a readable fallback if the module import fails.
