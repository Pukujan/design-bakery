# TASK-DB-0103 — readable research pages, corner backdrop, contact heading

| Field | Value |
|-------|-------|
| **Created** | 2026-11-02 |
| **Branch** | `task/TASK-DB-0103-backdrop-and-research-reading` (from `main` @ `8f55b9a`) |
| **Status** | In review |

## Goal

The owner found Pretext text flying around on several screens, the sky body splitting research pages in half, a visible hard edge on the reading panel, and a black panel behind the Contact heading on phones.

## Done

- Research papers and blog posts set their title, abstract and body as plain text (`flow={false}`); Pretext stays on the list pages and the homepage.
- On `/research/papers/*`, `/research/sources/*` and `/blogs/<slug>`, the sky body moves to the bottom-right corner at 45% size (`corner` on `LabBackdrop`) and eases back when leaving.
- The reading panel (`.post-body::before`) is one dim surface masked to fade out on all four sides. No box-shadow, so there is no edge to clip.
- Contact on phones: removed the dark scrim and moved the heading below the pulsar (`padding-top: 17rem`).

## Checks

- tsc, eslint and `find-orphans --strict` pass.
- Local dev server: Contact on a 375px viewport shows the heading under the pulsar with no panel; a research paper shows plain text with the body in the corner.

## Not done

- On Contact the fixed pulsar still passes behind the form as the page scrolls on phones.
- The text-colour bug and the white bubble on the homepage (#145) are still not reproduced.
