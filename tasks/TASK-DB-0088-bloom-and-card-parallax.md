# TASK-DB-0088 — `/version-2`: intro bloom animation + project-card parallax

| Field | Value |
|-------|-------|
| **Created** | 2026-10-12 |
| **Issues** | None filed — owner direction in session. **This direction was carried in session and never written down durably until this file** — see *Provenance* below. |
| **Branch** | `task/TASK-DB-0088-bloom-and-card-parallax` |
| **Base** | `origin/main` @ `a3f9d6c` |
| **Status** | **Requirement captured — not started.** No code exists. Plates must be generated through ABA's runner before any UI work. |

## Goal

Two sequences in the `/version-2` journey, and nothing else changes. Owner's words, verbatim:

> *"so instead of the horrible image 6 sakura tree design we have right now the plan was to change
> it to more dynamic sakura tree parallax of other images as u can see that was the idea but
> apparently it was never written down durably in issue log and repo"*

> *"here like this, for intro and the project cards, everythign else can stay same"* — introducing the
> storyboard.

1. **Intro / hero** — a one-time **blooming animation** on load (~2.5 s), then ambient motion only.
2. **Project cards** — **layered parallax** where blurred foreground branches cover and reveal each
   card as it passes through the viewport. **No blooming here.**

The procedural silhouette sakura tree (`SakuraTree.tsx`) is replaced by photographic layers in both.

**Full design direction, both storyboards transcribed, and all five reference images:**
[`additionals/handoffs/version-2-bloom-and-parallax/README.md`](../additionals/handoffs/version-2-bloom-and-parallax/README.md).

## Provenance — why this file exists

The owner asked whether a featured-projects and sakura-tree redesign had ever been requested. It had
— in session, repeatedly — but it was never recorded: no GitHub issue, no task file, no dev log
entry. `grep -ri featured frontend/version-2-app/src` returns **nothing**; the only "featured project"
in the repo was on the *shell* homepage (#99 added it, #105 removed it as rejected). The direction
survived only in conversation.

This file and the handoff beside it are that record. Five reference images are committed at
`additionals/handoffs/version-2-bloom-and-parallax/references/` so it cannot evaporate again.

## The two sequences (transcribed from the storyboard — the spec)

### Sequence 1 — Intro / hero title page: blooming animation

*"A one-time blooming animation when the page loads, creating a cinematic introduction.
TOTAL DURATION: ~2.5 SECONDS (THEN AMBIENT MOTION ONLY)"*

| # | State | Time | Spec |
|---|-------|------|------|
| 01 | INITIAL STATE | 0.0s | Branches present with mostly buds. Scene calm and slightly still. |
| 02 | FIRST BLOOM | 0.4s | First blossoms open near the main branch. A few petals start to drift. |
| 03 | BLOOMING SPREAD | 1.0s | Blossoms continue to open across branches. More petals drift naturally. |
| 04 | FULL BLOOM | 1.8s | Branches fully bloomed, beautifully framing the title. Title clearly visible. |
| 05 | AMBIENT STATE | 2.5s+ | Blooming stops. Subtle ambient motion continues (gentle sway, drifting petals). |

### Sequence 2 — Project cards: parallax reveal

*"No blooming here. Instead, layered parallax with foreground branches covering and revealing cards
as you scroll."*

| # | State | Card position | Spec |
|---|-------|---------------|------|
| 01 | APPROACHING | Below viewport | Mostly covered by foreground branches and blossoms; only a glimpse visible. **Foreground moves faster**, creating depth. |
| 02 | ENTERING VIEW | Scrolling up | Card starts to come into view. Foreground branches still cover parts of it — a sense of discovery. |
| 03 | CENTER REVEAL | At viewport center | Fully readable, most prominent. **Foreground branches move aside relative to the card due to parallax.** Subtle scale/opacity emphasis. |
| 04 | SCROLLING PAST | Moving up | Card begins to lose emphasis. Foreground blossoms start to cover it again. |
| 05 | EXITING VIEW | Above viewport | Mostly covered again as it leaves. **The next card starts to appear from below.** |

## Current state — measured, not inferred

All paths under `frontend/version-2-app/`.

- `src/components/journey/Work.tsx:15` mounts `<SakuraTree hostRef={columnRef} />` behind the column.
- `src/components/journey/SakuraTree.tsx` (331 lines) is entirely hand-authored SVG:
  - **Canopy** — `CANOPY_MASS` (one path), `CANOPY_LOBES` (4), `CANOPY_SKIRT` (6 strokes),
    `TRUNK`, `BOUGHS` (2), authored in a 1000×520 design space and scaled uniformly by `W / 1000`
    so the trunk base lands on the spine.
  - **Roots** — `buildRoots(W, H)` emits 1 spine + 11 main tendrils + 22 hairs, sorted by descent
    fraction, each with a reveal window `from`/`to`; drawn with `pathLength={1}` +
    `strokeDasharray="1 1"` + `strokeDashoffset: var(--rN)`, driven from the section's own progress.
  - **Growth** — `--tree-rise` lifts the canopy over the first 1/12 of the section
    (`SakuraTree.tsx:208`); `--rN` walks the roots down.
  - Layout is read on `ResizeObserver` only, never inside the scroll frame — **that discipline must
    survive the rewrite.**
- `src/components/journey/ProjectMoment.tsx` renders each project in a `Device` frame — one of
  `signboard | billboard | lantern | panel | passing` — with `db-plaque` styling, alternating
  `side: "left" | "right"`.
- `src/components/journey/SakuraTree.tsx` `ProjectRow` latches an 11th `.db-root-node` dot per
  project on first in-view (`useInView(0.25)`).
- **No parallax layers exist anywhere in the app.** `frontend/version-2-app/public/` holds only the
  seven scene plates (`plate-arrival.png` + six `generated-*.png`), `favicon.ico`, `placeholder.svg`
  and `robots.txt`. There is no foreground/midground/background set and no `*parallax*` asset.

The result is the muddy dark translucent mass in
`references/before-00-current-procedural-tree.webp`.

## Technical realities — implementation facts, not open questions

1. **Parallax needs the scene split into layers.** Every reference is a single flat image; you cannot
   translate part of one. The Work section needs at minimum three plates — background (sky, mountains,
   lake, sun), midground (torii, lanterns, pagodas, boat), foreground (blurred blossom crossing the
   frame edges) — with the foreground moving fastest.
2. **A bloom cannot be animated inside one photograph.** Sequence 1 needs the intro scene at two or
   three bloom stages — buds, partial, full — cross-faded (and scaled) over 2.5 s. The drifting petals
   are a particle layer; the existing `ParticleField.tsx` is the natural home.
3. **The parallax must ride the existing eased clock** (`journey.scrollY` / `--p` in
   `useJourneyScroll.ts`). A second scroll listener would reintroduce exactly the two-clocks defect
   TASK-DB-0087 removed.
4. **The card's "subtle scale/opacity emphasis" at centre** is a per-card scroll-driven curve keyed to
   the card's own position in the viewport — new, and it has to work with the reveal registry, not
   against it.
5. **Reduced motion needs a full static compose** — today it draws every root and lights every node by
   computed style; the replacement needs an equivalent (bloom completed, parallax frozen at a composed
   frame).
6. **Layout must stay read on resize only** — never inside the scroll frame.

## Deliverable shape

1. **New plates for the Work section** — background / midground / foreground, matching the reference
   scenes. Generated through ABA's runner in iterate mode, per `docs/DRIVING_ABA.md`.
2. **Bloom-stage plates for the intro** — buds / partial / full of the same scene, plus a petal layer.
3. **`SakuraTree.tsx` replaced** — canopy, trunk, boughs, `buildRoots` and the `--rN` variables go.
4. **Parallax on the eased clock** — foreground fastest, midground slower, background slowest.
5. **`ProjectMoment` restyled** to the translucent glass card in the references (eyebrow, serif title,
   italic tagline, body, tag pills, hairline, action pills), keeping `side` alternation.
6. **Per-card emphasis curve** — subtle scale/opacity keyed to the card's viewport position.
7. **`Arrival.tsx` gains the bloom sequence** — 2.5 s one-time, then ambient; arrival line
   `Design Bakery — AI Engineer` framed by the full bloom.

## Constraints

- **Do not undo TASK-DB-0087** — one eased clock, and the reveal registry sweeps each frame's
  segment. Read that task file before touching the scroll path.
- **The content contract is frozen** — 11 projects, 5 roles, brand, About; `src/data/content.ts` is
  verbatim and nothing may be invented or dropped.
- **The cut/seam, washi tear, night scene, About, nav and contact links stay.** This is the intro and
  the Work section only.
- Mobile 390 px: no horizontal overflow.

## Verification

- Extend `.scratch/spike-cinematic-home/verify-iterate.mjs`: parallax layers present and moving at
  **different** rates; the bloom reaches full state and settles (no infinite animation); every in-view
  reveal still revealed after a hard flick (the TASK-DB-0087 assertions must stay green); 11 projects
  still in the rendered DOM; reduced-motion static compose; zero page errors; no overflow at 1440 and
  390.
- `tsc --noEmit`, `pnpm build`, root `pnpm lint`, `pnpm test:version-2-app`,
  `pnpm find:orphans --strict`.
- Visual comparison against the references at 1440×900 (the composition loop the fluffy-v4 handoff
  describes — judge by repeated browser screenshots, not by code diff).

## Non-goals

- No change to routing, hosting, deploy or the shell homepage.
- No change to the cut/seam, the night scene, About, nav or contact.

## Done means

- The intro blooms once on load and settles into ambient motion; the Work section is the layered
  photographic parallax with foreground branches covering and revealing each card.
- The procedural silhouette tree is gone; the 11 projects still render with the real content contract.
- `tsc` + build + lint green; the TASK-DB-0087 harness assertions still pass; no mobile overflow.
- Made through ABA's runner in iterate mode, sources vendored back into
  `frontend/version-2-app/`, PR merged, and live at `https://www.design-bakery.com/version-2`.
