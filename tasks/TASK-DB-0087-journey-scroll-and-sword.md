# TASK-DB-0087 — fix the `/version-2` scroll defect (skipped frames) and remove the sword

| Field | Value |
|-------|-------|
| **Created** | 2026-10-12 |
| **Issues** | None filed — owner directed both fixes in session |
| **Branch** | `task/TASK-DB-0087-journey-scroll-and-sword` |
| **Base** | `origin/main` @ `60bc668` |
| **Status** | **Merged and deployed** — sword removed, driver unified on the eased clock, reveal registry rewritten to sweep each frame's segment (a hard jump at 15 fps leapfrogged the point sample). Merged ([#121](https://github.com/Pukujan/design-bakery/pull/121), `79eee3f`, CI `quality` + `orphans` green) and auto-deployed on the Mac by the launchd agent with no hand run (`deploy OK: 79eee3fccc35`). **53/53 headless checks pass against the live production page** at 1440×900 and 390×844, both directions, including a single-teleport no-descent case; the app type-checks, builds and lints green. |
| **Result** | `origin/main` @ `79eee3f` — see the *Record* section at the end. |

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

---

## Diagnosis (reproduced on the live site, not inferred)

All paths under `frontend/version-2-app/` unless noted.

### Defect A — reveals can be skipped permanently (the primary skip)

`src/hooks/useInView.ts` is a plain binary `IntersectionObserver`
(`threshold 0.28`, `rootMargin "0px 0px -8% 0px"`) feeding a **non-latching**
`inView`. Both `Reveal.tsx` (every story beat) and `SakuraTree.tsx`'s
`ProjectRow` (threshold 0.25, latch-on-`lit`) consume it.

Per the IO spec (§3.2.10 step 18) an entry is queued only when
`thresholdIndex` / `isIntersecting` / `isVisible` **changes**. An element that
goes from fully-below to fully-above the root between two observer runs has
ratio 0 and `isIntersecting: false` at *both* samples, queues nothing, and the
callback never fires.

- `Reveal.tsx` is non-latching → a passed block stays `opacity: 0` until it
  re-enters the viewport (it recovers if you stop on it, but a fast pass leaves
  a run of invisible beats).
- `SakuraTree.tsx`'s `ProjectRow` **latches** (`if (inView) setLit(true)`) — so
  once skipped, that node is dead for the rest of the session. Worst case.

**Measured on the live page** (`https://www.design-bakery.com/version-2`,
1440×900, headless Chromium):

- fast flick (900 px per frame, `behavior:"instant"`) → **7 / 11** tree nodes
  lit;
- 250 px / 70 ms → **6 / 11**;
- 120 px / 120 ms → **7 / 11**.

So the ignition is flaky at *any* speed, not just at a flick. The prior pass
recorded the same shape in `.scratch/spike-cinematic-home/verify-iterate.mjs`
(its comment: "250px per 70ms lit only 10") and treated it as a harness
artifact; the owner has now confirmed it is a real defect.

### Defect B — the driver runs two clocks (the "goes weird")

`src/hooks/useJourneyScroll.ts` `frame()`:

- `--p`, the parallax offsets (`--par-far/mid/near`), `--veil`, `--fg-day/night`,
  `--nav-dark` are computed from the **eased** value `sp` (`sp = current`).
- `through` — which feeds `bladeSweep`, `tear`, `nightT`, the seam offsets,
  `--seam-op`, `--seam-flash`, `--eyes-*`, `--orb-t`, `--sun-sink` — is computed
  from **raw** `window.scrollY`.

On a fast flick the raw-derived half of the world snaps to its final state in
1–2 frames while the eased half catches up over ~200 ms: the seam rips open
instantly under day-lit lanterns, then the light catches up. That inconsistency
is visible by construction.

### Defect C — narrow effect windows are leapable

- `impact = sin³(phase(bladeSweep, 0.34, 0.66))` where
  `bladeSweep = phase(through, 0.02, 0.24)` over the ~210 vh cut beat — the whole
  spark spike lives in ~680 px of scroll. A flick can step over it.
- `--seam-op` ramps over `phase(tear, 0.01, 0.05)` — ~160 px, even narrower.

Deriving every output from the eased clock (Defect B's fix) removes the whole
class: easing replays any jumped interval across many frames, so no window can
be stepped over.

### Minor

- `target = p` is assigned **after** the ease (one frame of stale chase).
- No scroll-snap anywhere. `scroll-behavior: smooth` exists
  (`src/globals.css:66`); it does not affect wheel/touch scroll but does affect
  programmatic scrolls — `TopNav.tsx:23` `go()` uses `behavior:"smooth"`, so a
  nav click is the most likely real-user trigger of the fast-jump case. The
  reveal fix must make those jumps safe.

---

## Sword-removal surface (exact)

- `journey.blade` is written by the driver and read by **nobody** — remove the
  field.
- `journey.impact` is read **only** at `ParticleField.tsx:165` (hot sparks +
  white-hot burst), and the emission site is already seam-derived
  (`w/2 + SEAM.nx * journey.seamD`, `ParticleField.tsx:167-168`), not
  blade-derived. Repurposing it to the tear leaves `ParticleField` functionally
  intact.
- `--slash` is consumed by `.db-eyes` (`journey.css:436`) — **keep** it and
  `SEAM.slash` in `art.ts`.
- `src/data/content.ts:30` has no sword reference — no content change.

---

## Implementation plan

**Order: sword removal first** (pure deletion, shrinks the math the driver fix
touches), then the driver unification, then the reveal rewrite, then harnesses.

### Step 1 — remove the sword

1. `src/hooks/useJourneyScroll.ts`: delete `bladeSweep`, `journey.blade = …`,
   the whole blade block (`thrust`, `slash`, `bladeTravel`, `bladeOp`,
   `thrustScale`), and the four `set()` calls `--blade-op` / `--blade-thrust` /
   `--blade-arc` / `--blade-tf`. Replace `impact`'s definition so the burst keys
   on the tear opening:
   `const impact = reduced ? 0 : Math.pow(Math.sin(Math.PI * clamp(phase(tear, 0.04, 0.24))), 3);`
2. `src/lib/journey-state.ts`: remove the `blade` field; keep `impact`, retitle
   its comment ("the rip itself — spikes once when the tear opens").
3. `src/components/journey/Stage.tsx`: remove the `BladeArc` import and the
   `<BladeArc />` mount.
4. Delete `src/components/journey/BladeArc.tsx`.
5. `src/styles/journey.css`: remove the `.db-blade` block, the `.db-sword-depth`
   comment+rule and `.db-blade-arc` (lines ~454–492); remove `.db-blade` from the
   reduced-motion selector group (~line 1054, keep `.db-canvas`,
   `.db-seam-texture`, `.db-seam`, `.db-bleed`); update the header layer-order
   comments (lines 3, 9) and the wording at ~line 616.
6. Comment-only touch-ups: `ParticleField.tsx` (~18, 159–163),
   `SeamCut.tsx` (~18), `Cut.tsx` (~4–8), `art.ts` (~32).
7. **`SeamCut.tsx` stays** — the washi tear is the scene's structural event and
   drives `nightT`; the owner asked only for the sword. Sparks **stay**,
   repurposed to the rip (Step 1.1).

### Step 2 — unify the driver on one eased clock

In `useJourneyScroll.ts` `frame()`:

1. Assign `target = p` **before** `current += (target - current) * k;`.
2. After `const sp = current;` add `const ey = sp * max;` and derive
   `const through = clamp((ey + vh - cut.top) / (cut.height + vh));`. Every
   tear-derived output now rides the same ~70 ms follow as `--p`.
   Set `journey.scrollY = ey` (no readers today).
3. Change nothing else: keep the `set()` dedup, the dirty gate, the `dt` clamp,
   and `measure()`'s `getBoundingClientRect` off the hot path — no per-frame
   layout reads introduced.

This fixes Defects B and C, and the nav-jump variant of A for the stage.

### Step 3 — make reveal deterministic (scroll math, not IO)

Rewrite `src/hooks/useInView.ts`, keeping the exact API `{ ref, inView }` and
default `threshold = 0.28`:

1. Module-level registry: one passive `scroll` listener + one rAF gate + one
   shared measure; a `Map` of `{ el, threshold, onFlip }` with cached
   `top = rect.top + window.scrollY` and `height`.
2. Per tick compute the overlap fraction
   `frac = (min(top+height, scrollY + 0.92*vh) − max(top, scrollY)) / height`
   and flip `inView = frac >= threshold`, calling the setter only on boolean
   change. This reproduces the IO's `0px 0px -8% 0px` margin and fractional
   threshold exactly, so trigger points — and the look — are unchanged.
3. Re-measure on the triggers the driver already uses: `resize`,
   `orientationchange`, `window load`, `document.fonts.ready`, and a
   `ResizeObserver` on `document.body`.
4. `Reveal.tsx` and `SakuraTree.tsx`'s `ProjectRow` need **no changes** — the
   hook keeps its signature and semantics, and `ProjectRow`'s latch keeps
   working.

Per-frame cost: ~20 entries × float compare, no layout reads on the hot path.

### Step 4 — verification

Extend `.scratch/spike-cinematic-home/verify-iterate.mjs` (ABA repo):

- `scrollThrough`: pass `behavior:"instant"`; after the fix increase the step to
  250–400 px and assert it still passes.
- Add a `fastFlick(page)` pass (desktop + mobile): instant jumps
  `0 → max*0.55 → max` with 80 ms dwells, then back up `max → max*0.30`, landing
  mid-cut (`max*0.62`), settle 1.5 s. Assert:
  1. every `.db-reveal` intersecting the viewport has `data-inview="true"`
     (the core no-skip assertion, both directions);
  2. 11/11 `.db-root-node[data-lit="true"]` after the full descent;
  3. computed `--p` on `<html>` ≈ `scrollY/max` within 0.01 after landing;
  4. easing replays windows: after an instant jump `0 → max*0.62`, poll
     `--tear`/`--p` every ~16 ms for 400 ms and assert ≥5 strictly increasing
     samples between 0.05 and 0.95 (no snap-to-final).
- Blade-gone assertions in `audit()`: `.db-blade` is `null`;
  `[class*="db-blade"], [class*="db-sword"]` count is 0; computed `--blade-op`
  on `<html>` is empty. Keep the existing checks (seam mask 152°, washi mirror,
  11 nodes) — they prove the tear survived.
- `verify.mjs`: same three blade-absence DOM checks per viewport; confirm beat
  screenshots at 0.45 / 0.52 / 0.62 still show the seam; `pageerror` stays empty.

Static gates: `npx tsc --noEmit`, `pnpm build`, `pnpm lint`. Retire
`probe-ignition.mjs` (it measured the coalescing the fix removes).

---

## Non-goals

- No routing, build, deploy or homepage changes (TASK-DB-0085's wiring is
  correct).
- No redesign of the scenes, plates, seam or tree beyond what the fixes need.
- The change is made **through ABA's runner in iterate mode** on the Mac, per
  `docs/DRIVING_ABA.md` — not hand-edited into the generated app.

## Open question for the owner

Whether the sparks should also die with the sword. Recommendation: keep them,
repurposed to the tear (the cut scene loses its peak otherwise). If they should
go, it is the one `impact` definition in Step 1.1.

## Risks

- **Tear lag on medium scrolls**: today the tear tracks scroll 1:1; after Step 2
  it follows with up to ~70 ms lag (invisible at reading speed, since
  eased≈raw for small deltas — but it is the biggest visual event). If the
  eyeball pass finds it laggy, tighten the time constant (`-dt/70` → `-dt/45`)
  rather than re-splitting the clocks.
- **Reveal trigger parity**: the scroll-math threshold is a re-derivation of the
  IO semantics; compare a couple of flip positions against the old build once
  before removing the IO.
- **Stale cached offsets**: re-measured only on resize / load / fonts / body
  resize. An intra-page reflow with unchanged body height would be missed —
  acceptable for a static page.

## Done means

- Fast programmatic scroll down and back up leaves **zero** on-screen
  un-revealed blocks (headless browser check, both directions).
- The katana is gone from the DOM, CSS and the driver; nothing throws from the
  removal.
- `tsc` + `vite build` green; content contract still holds in the rendered DOM
  (11/11 projects, 5/5 roles, 0 invented names).
- Mobile 390 px: no horizontal overflow.
- Sources vendored back into `frontend/version-2-app/`, repo tests updated,
  PR merged; live at `https://www.design-bakery.com/version-2` via the Mac
  auto-deploy.

---

## Record — merged and deployed

Made **through ABA's runner in iterate mode** on the Mac, per `docs/DRIVING_ABA.md`, not
hand-edited into the generated app. Three iterate runs were needed: the sword + one-clock
change, a first reveal registry that still point-sampled (it did **not** fix the skip), then
the swept-interval evaluation that did. The generated sources were vendored back into
`frontend/version-2-app/` by content hash, so exactly the intended files moved and no
scaffold residue leaked in.

- **Merged:** [PR #121](https://github.com/Pukujan/design-bakery/pull/121) squash-merged to
  `79eee3f` (CI `quality` pass 1m24s, `orphans` pass, Vercel pass).
- **Deployed:** by the launchd agent on the Mac, **no hand run** —
  `[2026-10-12T23:47:03Z] deploy OK: 79eee3fccc35 -> design-bakery-web:79eee3fccc35-20261012T234624Z`,
  every smoke line green including `ok 200 /version-2` and
  `ok body has "/version-2/assets/" at /version-2`.
- **Verified live:** the harness run against `https://www.design-bakery.com/version-2/`
  passes **53/53** — 11/11 tree nodes lit after a flick, 0 in-view reveals missed, `--p`
  tracks the scrollbar (`0.6198` vs `0.6200`), the eased clock replays rather than snaps,
  the blade is absent from the DOM/CSS/driver, the seam mask is still 152° with the washi
  mirror on the child, reduced motion draws all 60 root paths and lights 11/11 nodes, zero
  page errors, no horizontal overflow at either viewport.

**Done means — all met.** Zero un-revealed blocks on fast scroll, both directions (the
`hardJump` no-descent case is the strictest form of that assertion). Katana gone from the
DOM, CSS and driver. `tsc` + `vite build` + root lint green; content contract intact
(11 projects, 5 roles). No mobile overflow at 390 px. Vendored, PR merged, live via the
Mac auto-deploy.
