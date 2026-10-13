# Design direction — `/version-2` Work section: photographic parallax + featured cards

| Field | Value |
|-------|-------|
| **Document date** | 2026-10-12 |
| **Created** | 2026-10-12 |
| **Last updated** | 2026-10-12 |
| **Repo** | `Pukujan/design-bakery` |
| **Code** | `frontend/version-2-app/src/components/journey/Work.tsx`, `SakuraTree.tsx`, `ProjectMoment.tsx` |
| **Task** | [TASK-DB-0088](../../../tasks/TASK-DB-0088-work-section-parallax.md) |

## Why this document exists

The owner carried this direction in session and it was **never written down durably** — no issue, no
task file, no dev log. It survived only in conversation, which is exactly how it got lost. This file
and the task file beside it are the durable record. The reference images are committed next to this
document so the direction cannot evaporate again.

## Mission

Replace the **procedural silhouette sakura tree** in the `/version-2` Work section with a
**layered photographic parallax scene** — a painted Japanese sunset with out-of-focus sakura
branches crossing the frame — and put the projects on **translucent "featured work" cards**
floating over it.

Owner's words, verbatim:

> *"so instead of the horrible image 6 sakura tree design we have right now the plan was to change
> it to more dynamic sakura tree parallax of other images as u can see that was the idea but
> apparently it was never written down durably in issue log and repo"*

## Read first

1. `AGENTS.md` (repo rules), `HANDOFF.md` (setup + conventions).
2. `checkpoints/CURRENT.md` — current state; the `/version-2` entry.
3. [TASK-DB-0088](../../../tasks/TASK-DB-0088-work-section-parallax.md) — the task this belongs to.
4. [TASK-DB-0087](../../../tasks/TASK-DB-0087-journey-scroll-and-sword.md) — the scroll/clock work
   this must not undo. **The reveal registry and the single eased clock are load-bearing here.**
5. `docs/DRIVING_ABA.md` — the plates are image-generation calls made through ABA's runner, not
   hand-drawn art.

## The references

### `before-00-current-procedural-tree.webp` — what we have now (the thing to replace)

![Current Work section](references/before-00-current-procedural-tree.webp)

The muddy dark translucent mass through the middle of the frame **is** the sakura tree. It is
hand-authored SVG (`SakuraTree.tsx`): a canopy mass, four lobes, six skirt strokes, a trunk and two
boughs, plus a generated root system (one spine, eleven tendrils, twenty-two hairs) revealed by
`stroke-dashoffset`. At full opacity it reads as a smudge rather than a tree, and it competes with
the project cards instead of framing them.

### `ref-01-featured-work-card-serenity.webp` — the target composition

![Featured work card — Serenity](references/ref-01-featured-work-card-serenity.webp)

### `ref-02-featured-project-card-kizuna.webp` — the same shape, two actions

![Featured project card — Kizuna](references/ref-02-featured-project-card-kizuna.webp)

### `ref-03-work-column-two-cards.webp` — the Work column

![Work column — two cards](references/ref-03-work-column-two-cards.webp)

## What the references establish

**The scene is photographic and layered.** Sunset sky with heavy cloud, the sun low over water, a
misty mountain range, pagodas on a cliff at the right, a lakeside village of lit lanterns, a red
torii standing in the shallows, a small boat. Nothing in it is procedurally drawn.

**The depth comes from the foreground.** Out-of-focus sakura branches and blossom masses cross the
**top, left, right and bottom** edges of the frame, heavily blurred, and they pass **in front of**
the cards (clearest in `ref-03`, where blossom crosses the second card). That foreground plane is
what makes the scene read as deep — and it is the plane that should move fastest on scroll.

**The cards are translucent glass, not opaque panels.** The scene reads through them; they are dark,
rounded, generously padded, with a hairline divider above the actions.

**Card anatomy** (identical in all three references):

- eyebrow — `01 —— FEATURED WORK`, or `01 —— WORK` in the column reference
- title in the display serif — `Serenity`, `Kizuna`, `Solara`
- italic tagline — *Where tradition meets tomorrow.*, *Technology that feels human.*
- one body paragraph
- tag pills, wrapping
- a hairline rule
- action pills — one primary (`View Project ↗` / `View Case Study ↗` / `Case Study ↗`), and in
  `ref-02` a secondary `Watch Film` with a circular play glyph

**Cards alternate sides down the column** (`ref-03`: 01 left, 02 right), which is what the current
`ProjectMoment` `side: "left" | "right"` already does.

## Open questions for the owner

These are the things the references do **not** settle. They need an answer before the work starts.

1. **The tree.** Fully replaced by the photographic layers, or the photographic layers **plus** the
   procedural tree kept as a faint overlay? The owner's words ("instead of") point at full
   replacement, but the tree is the only element that ties the section to the rest of the journey.
2. **The eyebrow.** `ref-01`/`ref-02` read `FEATURED WORK` / `FEATURED PROJECT`; `ref-03` reads
   `WORK`. Which is it — a single featured card, or the whole column?
3. **The root system and node ignition.** `SakuraTree.tsx` generates the roots *and* the eleven
   `.db-root-node` dots that ignite per project on first in-view. If the tree goes, does the root
   system go with it, or is it kept as a subtle line the cards hang from?
4. **Are the reference scenes the art to produce, or a composition guide?** i.e. match these
   specific sunsets and pagodas, or generate our own in the same language?
5. **Card density.** The references show one prominent card at a time; today all eleven render in a
   single long column. Keep eleven in a column, or introduce a featured/rest split?

## Constraints

- **Do not undo TASK-DB-0087.** The parallax must be driven from the existing eased clock
  (`journey.scrollY` / `--p` in `useJourneyScroll.ts`), **not** a second scroll listener — a second
  listener reintroduces exactly the two-clocks defect that task removed.
- **The content contract is frozen.** Eleven projects, five roles, brand, About — `src/data/content.ts`
  is transcribed verbatim and nothing in it may be invented or dropped.
- **The seam cut, the washi tear, the arrival and night scenes, the nav and the contact links stay.**
  This is the Work section only.
- **Plates are generated through ABA's runner in iterate mode** (`docs/DRIVING_ABA.md`), as
  TASK-DB-0087 was — not hand-drawn into the app.
- **Reduced motion must still compose a full static scene.** The reduced-motion path currently draws
  the whole tree and lights every node by computed style; whatever replaces it needs an equivalent.
