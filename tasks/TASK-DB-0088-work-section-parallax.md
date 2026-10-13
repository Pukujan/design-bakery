# TASK-DB-0088 — replace the procedural sakura tree with a layered photographic parallax and featured-work cards

| Field | Value |
|-------|-------|
| **Created** | 2026-10-12 |
| **Issues** | None filed — owner direction in session. **This direction was carried in session and never written down durably until this file** — see *Provenance* below. |
| **Branch** | `task/TASK-DB-0088-work-section-parallax` (not yet created) |
| **Base** | `origin/main` @ `a3f9d6c` |
| **Status** | **Requirement captured — not started.** No code exists. Open questions below need the owner before any run. |

## Goal

Replace the **procedural silhouette sakura tree** in the `/version-2` Work section with a
**layered photographic parallax scene** — a painted Japanese sunset with out-of-focus sakura branches
crossing the frame — and put the projects on **translucent "featured work" cards** floating over it.

Owner's words, verbatim:

> *"so instead of the horrible image 6 sakura tree design we have right now the plan was to change
> it to more dynamic sakura tree parallax of other images as u can see that was the idea but
> apparently it was never written down durably in issue log and repo"*

**Full design direction with the reference images:**
[`additionals/handoffs/version-2-work-parallax/README.md`](../additionals/handoffs/version-2-work-parallax/README.md).

## Provenance — why this file exists

The owner asked whether a featured-projects and sakura-tree redesign had ever been requested. It had
— in session, repeatedly — but it was never recorded: no GitHub issue, no task file, no dev log
entry. `grep -ri featured frontend/version-2-app/src` returns **nothing**; the only "featured project"
in the repo was on the *shell* homepage (#99 added it, #105 removed it as rejected). The direction
survived only in conversation.

This file and the handoff beside it are that record. The reference images are committed at
`additionals/handoffs/version-2-work-parallax/references/` so it cannot evaporate again.

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
  - Layout is read on `ResizeObserver` only, never inside the scroll frame (that discipline is worth
    keeping in whatever replaces it).
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

## What the references establish

Full detail in the handoff; the essentials:

- **Photographic and layered** — sunset sky, sun low over water, misty mountains, pagodas on a
  right-hand cliff, a lantern-lit lakeside village, a red torii in the shallows, a small boat.
- **Depth comes from the foreground** — heavily blurred sakura branches and blossom masses crossing
  the top, left, right and bottom edges, passing **in front of** the cards (clearest in `ref-03`).
- **Cards are translucent glass**, not opaque panels — the scene reads through them; rounded, dark,
  generously padded, hairline rule above the actions.
- **Card anatomy** — eyebrow (`01 —— FEATURED WORK` / `01 —— WORK`), display-serif title, italic
  tagline, body paragraph, tag pills, hairline, then action pills (one primary `View Project ↗`; a
  secondary `Watch Film` with a play glyph in `ref-02`).
- **Cards alternate sides** down the column — which `ProjectMoment`'s `side` already does.

## Open questions for the owner — answer before starting

1. **The tree.** Fully replaced by the photographic layers, or the layers **plus** the procedural
   tree kept as a faint overlay? The owner's words ("instead of") point at full replacement, but the
   tree is the only element tying the section to the rest of the journey.
2. **The eyebrow.** `ref-01`/`ref-02` read `FEATURED WORK` / `FEATURED PROJECT`; `ref-03` reads
   `WORK`. A single featured card, or the whole column?
3. **The root system and node ignition.** If the tree goes, do the roots and the eleven
   `.db-root-node` dots go with it, or are they kept as a subtle line the cards hang from?
4. **Are the reference scenes the art to produce, or a composition guide?** Match these specific
   sunsets and pagodas, or generate our own in the same language?
5. **Card density.** The references show one prominent card at a time; today all eleven render in one
   long column. Keep eleven in a column, or introduce a featured/rest split?

## Deliverable shape (proposed — subject to the answers above)

1. **New scene plates** for the Work section: background (sky/mountains/lake), midground
   (torii/lanterns/pagodas), foreground (blurred sakura crossing the frame edges). Generated through
   ABA's runner in iterate mode, per `docs/DRIVING_ABA.md` — **not** hand-drawn into the app.
2. **Parallax on scroll** — foreground fastest, midground slower, background slowest, driven from the
   **existing eased clock** (`journey.scrollY` / `--p` in `useJourneyScroll.ts`). A second scroll
   listener would reintroduce the two-clocks defect TASK-DB-0087 removed.
3. **`SakuraTree.tsx` replaced** — the canopy/trunk/boughs SVG and `buildRoots` go; the root system
   and `--rN` variables go with them unless the owner keeps them (open question 3).
4. **Project cards restyled** to the translucent panel in the references.
5. **Reduced motion** composes a full static scene (today it draws every root and lights every node
   by computed style — the replacement needs an equivalent).

## Constraints

- **Do not undo TASK-DB-0087** — one eased clock, and the reveal registry sweeps each frame's
  segment. Read that task file before touching the scroll path.
- **The content contract is frozen** — 11 projects, 5 roles, brand, About; `src/data/content.ts` is
  verbatim and nothing may be invented or dropped.
- **The seam cut, washi tear, arrival and night scenes, nav and contact links stay.** Work section
  only.
- Mobile 390 px: no horizontal overflow.

## Verification

- Extend `.scratch/spike-cinematic-home/verify-iterate.mjs`: parallax layers present and moving at
  **different** rates; every in-view reveal still revealed after a hard flick (the TASK-DB-0087
  assertions must stay green); 11 projects still in the rendered DOM; reduced-motion static compose;
  zero page errors; no overflow at 1440 and 390.
- `tsc --noEmit`, `pnpm build`, root `pnpm lint`, `pnpm test:version-2-app`,
  `pnpm find:orphans --strict`.
- Visual comparison against the references at 1440×900 (the composition loop the fluffy-v4 handoff
  describes — judge by repeated browser screenshots, not by code diff).

## Non-goals

- No change to routing, hosting, deploy or the shell homepage.
- No change to the cut/seam, the arrival, the night scene, About, nav or contact.

## Done means

- The Work section is the layered photographic parallax in the references; the procedural silhouette
  tree is gone.
- The 11 projects still render with the real content contract intact.
- `tsc` + build + lint green; the TASK-DB-0087 harness assertions still pass; no mobile overflow.
- Made through ABA's runner in iterate mode, sources vendored back into
  `frontend/version-2-app/`, PR merged, and live at `https://www.design-bakery.com/version-2`.
