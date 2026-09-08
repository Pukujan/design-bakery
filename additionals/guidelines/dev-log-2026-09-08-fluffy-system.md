# Dev log — 2026-09-08

| Field | Value |
|-------|-------|
| **Document date** | 2026-09-08 |
| **Created** | 2026-09-08 |
| **Last updated** | 2026-09-08 |

## Summary

Published the first Fluffy System creative bakeoff as an unlisted Design Bakery gallery. The experiment compares multiple market-story and visual directions for Project Assurance Modules (PAM) and Research Assurance, including two Three.js-enhanced candidates, without promoting any candidate to the homepage or sitemap.

## Changes Made

### 1. Hidden creative review gallery

- Added `/experiments/fluffy-system/` as the owner-facing comparison surface.
- Added `noindex,nofollow` to the gallery and every candidate page.
- Kept the experiment out of the homepage, project cards, and sitemap.
- Gallery opens each candidate in a full-screen review frame and also supports opening candidates in a new tab.
- The gallery explicitly treats choosing one, combining ideas, iterating, or rejecting all as valid outcomes.

### 2. PAM candidate set

Published four materially different PAM directions:

- `pam-preflight.html` — warm launch/preflight framing; human problem first.
- `pam-blueprint.html` — blueprint/editorial architecture direction; OpenDesign workflow-informed but implemented natively.
- `pam-proof.html` — incident-led "Proof of Homework" story using the real PAM build-vs-reuse loophole as the narrative spine; Casa-sequence-informed but implemented natively.
- `pam-3d.html` — Mission Control 3D; Three.js enhancement uses spatial project gates to embody project preflight.

### 3. Research Assurance candidate set

Published four materially different Research Assurance directions:

- `ra-calibration.html` — scientific calibration/instrument aesthetic; independent assurance dimensions.
- `ra-editorial.html` — editorial Evidence Stack; most accessible human-first explanation of why sourced/relevant can still be wrong.
- `ra-control-plane.html` — founder/investor-oriented market framing around evaluation composition and exact research-stack identity.
- `ra-3d.html` — Assurance Constellation 3D; interactive assurance nodes show that a passing layer cannot silently certify another.

### 4. Three.js behavior

- Three.js is loaded as a progressive enhancement from jsDelivr in the two 3D candidates.
- Core copy, navigation, evidence links, and calls to action remain semantic HTML.
- Both pages include a non-WebGL/module fallback visual.
- Both honor `prefers-reduced-motion` by avoiding continuous animation.
- Three.js is not a dependency of the rest of Design Bakery.

### 5. Market evidence and claim boundaries

- PAM pages use public PAM sources and the real build-vs-reuse defect in PAM issue #10.
- PAM market framing references the 2025 Stack Overflow Developer Survey for current AI-development adoption, planning reluctance, trust, and frustration signals.
- Research Assurance remains a private product source, so candidate pages do not link to the private repository.
- Research Assurance market framing uses public external sources such as NIST AI measurement/TEVV work, ARES RAG evaluation dimensions, and the Stanford 2026 AI Index.
- Main pages use evidence as lightweight receipts rather than exposing the internal research/assurance model as an audit interface.

## Files touched

| File | Notes |
|------|-------|
| `frontend/public/experiments/fluffy-system/index.html` | Unlisted gallery and full-screen candidate viewer |
| `frontend/public/experiments/fluffy-system/pam-preflight.html` | PAM native HTML control |
| `frontend/public/experiments/fluffy-system/pam-blueprint.html` | PAM blueprint/editorial candidate |
| `frontend/public/experiments/fluffy-system/pam-proof.html` | PAM incident-led candidate |
| `frontend/public/experiments/fluffy-system/pam-3d.html` | PAM Three.js candidate |
| `frontend/public/experiments/fluffy-system/ra-calibration.html` | Research Assurance scientific-instrument candidate |
| `frontend/public/experiments/fluffy-system/ra-editorial.html` | Research Assurance editorial candidate |
| `frontend/public/experiments/fluffy-system/ra-control-plane.html` | Research Assurance founder/investor candidate |
| `frontend/public/experiments/fluffy-system/ra-3d.html` | Research Assurance Three.js candidate |
| `additionals/guidelines/dev-log-2026-09-08-fluffy-system.md` | This session record |
| `additionals/guidelines/agent-devlog-index.md` | Session-log index entry |

## Test URLs

- Gallery: `https://www.design-bakery.com/experiments/fluffy-system/`
- PAM Preflight: `https://www.design-bakery.com/experiments/fluffy-system/pam-preflight.html`
- PAM Blueprint: `https://www.design-bakery.com/experiments/fluffy-system/pam-blueprint.html`
- PAM Proof: `https://www.design-bakery.com/experiments/fluffy-system/pam-proof.html`
- PAM 3D: `https://www.design-bakery.com/experiments/fluffy-system/pam-3d.html`
- Research Assurance Calibration: `https://www.design-bakery.com/experiments/fluffy-system/ra-calibration.html`
- Research Assurance Editorial: `https://www.design-bakery.com/experiments/fluffy-system/ra-editorial.html`
- Research Assurance Control Plane: `https://www.design-bakery.com/experiments/fluffy-system/ra-control-plane.html`
- Research Assurance 3D: `https://www.design-bakery.com/experiments/fluffy-system/ra-3d.html`

## Agent topic logs updated

- None. This is a new isolated static experiment surface rather than a fragile shared subsystem.

## Next steps

- Owner reviews the rendered candidates and gives qualitative feedback.
- Iterate or combine only the directions the owner wants to keep.
- Do not add any candidate to homepage/featured-project surfaces until the owner explicitly selects a winner.
