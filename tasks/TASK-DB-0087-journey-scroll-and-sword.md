# TASK-DB-0087 — fix the `/version-2` scroll defect (skipped frames) and remove the sword

| Field | Value |
|-------|-------|
| **Created** | 2026-10-12 |
| **Issues** | None filed — owner directed both fixes in session |
| **Branch** | `task/TASK-DB-0087-journey-scroll-and-sword` |
| **Base** | `origin/main` @ `60bc668` |
| **Status** | **In progress** — iterate run via ABA on the Mac |

## Goal

Two changes to the cinematic journey at `/version-2`, owner's words verbatim:

1. **Fix the scrolling / parallax defect.** *"i thought we were gonna change
   version-2's parellex and fix its scrolling problem where certain frame are
   skipped and it goes weird"* — sections and their reveals can be skipped
   entirely when scrolling at speed, and the parallax story "goes weird" when
   that happens.
2. **Remove the sword.** *"pls remove that stupid sword it looks stupid anyway"*
   — the katana blade (`BladeArc.tsx` and everything that drives it) goes away
   entirely.

Keep everything else: the content contract (11 projects, 5 roles, brand,
About — frozen in `src/data/content.ts`), the seam cut / washi tear, the sakura
tree, the plates, the nav and contact links, the whole day→night story.

## Why the scroll skips (diagnosis)

- Every text block renders through `Reveal` (`useInView`), which is a **binary
  IntersectionObserver** (`threshold 0.28`, `rootMargin "0px 0px -8% 0px"`).
  An element that enters **and** leaves the viewport between two IO samples
  (fast scroll, momentum flick, anchor jump) coalesces to one callback with
  `isIntersecting: false`, so `data-inview` stays `"false"` and the block sits
  at `opacity: 0` **forever** — the "skipped frame".
- The same observer drives `SakuraTree`'s ignition, so the tree can be skipped
  the same way.
- The scroll driver (`useJourneyScroll`) itself is eased-follow and sound, but
  its scene anchors (`measure()`) and the binary reveals can disagree after a
  fast pass — the world is mid-scene while the content in it never lit up,
  which reads as "it goes weird".
- A previous verify harness already hit this shape (scroll slowed to
  ~120 px/120 ms to make the observer fire) and recorded it as a harness
  artifact; the owner has now confirmed it is a real defect.

## Scope

**Change 1 — scroll/reveal fix** (in `frontend/version-2-app/`):

- Reveals must never be permanently skippable: an observer-based system needs a
  fallback pass (or a scroll-position-based truth) so that anything below the
  current scroll position that was passed at speed still ignites — both
  directions must stay honest (reverse scroll un-reveals as before).
- `SakuraTree` ignition gets the same guarantee.
- The driver's eased follow stays; if the ordering of `target`/`current` in
  `frame()` (target assigned after easing) contributes, fix it.
- No new dependencies; no `data-testid`; mobile 390 px must not overflow.

**Change 2 — sword removal** (in `frontend/version-2-app/`):

- Delete `BladeArc.tsx` and its mount in `Stage.tsx`.
- Delete the blade CSS blocks in `src/styles/journey.css` (`.db-blade*`,
  `.db-sword-depth`, the reduced-motion entry).
- Remove the blade driver vars and math from `useJourneyScroll.ts`
  (`--blade-op/--blade-thrust/--blade-arc/--blade-tf`,
  `bladeSweep/thrust/slash/impact/bladeTravel`) and the `journey.blade` /
  `journey.impact` fields if the particle field no longer reads them (sparks
  either go with the sword or are re-aimed at the tear's own flash — either is
  acceptable, pick what looks right).
- **Keep `SeamCut.tsx`** — the tear is not the sword.

**Guard updates** (repo-level):

- `scripts/test-version-2-app.mjs` asserts today's shape; update whatever it
  pins that this change moves (no assertions on the blade should remain, and a
  "no sword" assertion is welcome).
- The verify harness gains a fast-scroll pass: sections must never end
  un-revealed after a full-speed programmatic scroll in both directions.

## Non-goals

- No routing, build, deploy or homepage changes (TASK-DB-0085's wiring is
  correct).
- No redesign of the scenes, plates, seam or tree beyond what the fixes need.
- The change is made **through ABA's runner in iterate mode** on the Mac, per
  `docs/DRIVING_ABA.md` — not hand-edited into the generated app.

## Done means

- Fast programmatic scroll down and back up over the built app leaves **zero**
  un-revealed blocks (headless browser check).
- The katana is gone from the DOM, CSS and the scroll driver; nothing throws
  `ReferenceError`/`undefined var` from the removal.
- `tsc` + `vite build` green in `version-2-app`; content contract still holds
  in the rendered DOM (11/11 projects, 5/5 roles, 0 invented names).
- Mobile 390 px: no horizontal overflow.
- Sources vendored back into `frontend/version-2-app/`, repo tests updated,
  PR merged; live at `https://www.design-bakery.com/version-2` via the Mac
  auto-deploy.
