# TASK-DB-0098 — homepage redesign prototype (`/lab`)

| Field | Value |
|-------|-------|
| **Created** | 2026-11-01 |
| **Branch** | `task/TASK-DB-0098-homepage-lab-prototype` (branched from `main` @ `20280d3`) |
| **Status** | In progress (prototype, not linked from the site) |

## Goal

Prototype a more editorial, motion-led homepage, without touching the live one. The owner pointed to linamakesnoise.com as the bar for style and motion. They want the hero to be a chat you can use straight away (in the spirit of ChatGPT / obvious.com) that answers questions and gives a tour, so the page reads as an AI engineer's site.

## Done

- New route `/lab` (`frontend/src/app/modules/lab/`), own dark shell, no site nav, `noindex, nofollow`.
- Type: Bricolage Grotesque (condensed, heavy) for display, Instrument Serif italic for accent letters, JetBrains Mono for tags. All self-hosted via `@fontsource`.
- Hero: full-width "DESIGN BAKER" letter-by-letter reveal; letters flip to the serif on hover; parallax on scroll; drifting accent glow over a masked grid.
- Copilot (`LabCopilot.tsx`, `copilotAnswers.ts`): typed example questions in the placeholder, suggestion chips, streamed replies, project chips, and a "Start the tour" action. Answers come from `projects.json` + `hero.json` only; there is **no model call yet**.
- Work grid: uneven 12-column layout, clip-path reveal, parallax, Ken Burns drift, hover light sweep, custom cursor label.
- Key art: 16 images, one per project, generated with the Codex CLI image tool from a shared art direction (dark project colour, one accent, tactile 3D still life, no text). Stored as WebP in `frontend/public/lab/projects/`.
- Velocity marquee, Lenis smooth scroll, logo glyph that cycles fonts. Everything respects `prefers-reduced-motion`.

## Checks

- `pnpm --dir frontend run typecheck`
- Browser at 1440×900 and 375×812: no horizontal overflow; the chat thread grows inside the hero without pushing the page.

## Next step

1. Owner review of `/lab` and the key art (regenerate any image they don't like).
2. Wire the copilot to a real model: reuse Website Copilot's text mode (`copilot.send`, `Pukujan-lab/voice-agent-research` `demo/live-site/widget/sdk.ts`) with this site's content ingested into Octo RAG, and add a "scroll to section" tool for the tour. Keep `copilotAnswers.ts`'s answer shape.
3. If approved, move the design to `/`, and replace key art with short screen recordings where a project has a UI.
