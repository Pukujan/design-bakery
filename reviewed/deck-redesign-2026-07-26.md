# Cortex deck redesign, 2026-07-26

File: `frontend/public/case-studies/cortex/a/presentation.html`. Full rewrite of content and chrome; navigation model (arrows, Home/End, dots, swipe, `#n` hashes, theme toggle) kept intact.

## What the owner reported, and what was done about each

**"I didn't understand anything on many things."** The old deck was written in the author's vocabulary: "fail-closed authorisation, not transactional rollback", "the composition apply site", "effect routes" with no definition. Every slide was rewritten for a smart reader with zero context. Jargon now lives only where it is the point (the engineer column of the two-vocabularies slide). Terms that had to stay are defined in the sentence that uses them: an effect route is introduced as "the editing tool, the shell, git itself" before 21-of-25 appears; "the composition apply site / pull site" became "changes land in two places; at the second, the checking function is never called at all."

**"More clean and guided."** Eight overloaded slides became ten lighter ones. The overloaded problem slide was split: the problem is now one idea (too much access, no record, no control over what leaves), and the benchmark comparison got its own slide with a 9-segment strip showing the 5 lost rows. A new slide 3 carries the underplayed core selling point, every decision runs on the owner's machine, with the model-is-not-local caveat in the same paragraph, plus a two-column "stays local / still cloud" ledger so it cannot be read as an on-prem claim. A progress bar and a consistent "Boundary N of 3" eyebrow give a sense of place.

**"In mobile some things ran weird."** The old fixed banner used side padding tuned for desktop and collided with the floating Case-study/theme buttons at 390px. The chrome was rebuilt as a single header (nav row, then the caution line on its own row, then the progress bar), so nothing can overlap. The footer dots wrapped to a second row on slide 10 (wider "10 / 10" counter); fixed with tighter mobile sizing. Swipe now requires a mostly-horizontal drag so vertical scrolling on tall slides does not flip pages.

**"A bit aesthetic, with animation."** The permit/archival design language was kept deliberately (cool greys, stamp indigo, serif headings, mono labels) and extended: maturity labels are now rotated double-ring ink stamps, so "partly built / roadmap, not built / the most built part" reads as designed record-keeping rather than apology; honest-gap panels have a mono label ("THE MEASURED GAP", "NOT BUILT", "CORRECTIONS, KEPT IN VIEW") and a rule, styled like a filed note. Entrance animation is a staggered fade-rise on slide children and flow steps, fully disabled under `prefers-reduced-motion: reduce`. No external assets; the flow diagram remains hand-built CSS so it renders offline in a live demo.

## Honesty inventory (all preserved verbatim or strengthened)

- Persistent caution banner on every slide.
- Maturity stamp on each boundary slide.
- "21 of 25 effect routes still reach the repository without passing the check" (plus the derived "the check sits on 4 of them", arithmetic on the same claim).
- "None of the data boundary is built."
- Benchmark: "lost 5 of the 9 rows", plus "that benchmark has not been run" for the open question.
- Honest-status slide: holds-in-test with scope, holds-one-site-of-two, refuted tamper-resistance (5 latent defects), not in production.
- Closing finding: 11 findings, 10 distinct, 6 code defects, 4 contract ambiguities, 1 fixed; the withdrawn "nine", the contract-was-shown correction, the 7-of-11 prompted-angle caveat, and the cross-model-not-independent caveat, all kept in a labeled corrections panel.
- Zero em dashes; the old `&mdash;` entities (which render as U+2014) are gone too.

## Render measurements

Playwright (Chrome channel), serving `frontend/dist` over http, one fresh page load per slide (hash init does not re-run on an already-loaded page). For each of 10 slides x {390x844, 1280x800} x {dark, light} = 40 renders, measured `documentElement.scrollWidth <= clientWidth`, active-slide `scrollWidth <= clientWidth`, and per-element bounding boxes outside the viewport (excluding elements inside `overflow-x:auto` containers). Result: **40/40 pass, zero horizontal overflow**. Screenshots inspected at mobile (slides 1, 4, 5, 10) and desktop (3, 4, 7, 9) in both themes; one defect found and fixed (footer dot wrap on mobile slide 10), then re-measured: 40/40 pass.
