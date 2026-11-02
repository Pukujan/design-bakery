# TASK-DB-0117 — one space theme file, six named themes, contact in the home's language

| Field | Value |
|-------|-------|
| **Created** | 2026-11-02 |
| **Branch** | `task/TASK-DB-0117-space-theme` (stacked on `task/TASK-DB-0116-shared-scroll-cursor`) |
| **Status** | In review |

## Goal

White text kept landing on lime buttons because the colours lived in three copies of the same tokens plus hardcoded values, and the owner asked for one place to change the theme, with star, galaxy and space names. They also found the contact redesign (cards, fills, glows) did not match the home's flat editorial style.

## What existed before

- Two systems: the legacy Tailwind/shadcn tokens (`--background`, `--primary`, `src/styles/default_theme.css`) for the old pages, and the lab tokens (`--lab-*`), defined three separate times (`lab.css` twice, `copilot.css`) with hardcoded lime in ten more places.

## Done

- `frontend/src/styles/space-theme.css` is the single source for the lab tokens: ink, paper, muted, line, accent, accent-ink (text on accent), accent-rgb, hot, cool, violet, glass, fonts. The duplicate blocks are removed and the hardcoded lime (orb, callouts, diagram, 3D sky, lens ring, gather stars) now reads the tokens.
- Six named themes: black-hole (default, the original), red-giant, blue-star, green-nebula, pulsar, supernova. `?theme=name` on any address switches and remembers; `setTheme('name')` in the console does the same; `setTheme()` resets (`src/app/theme/spaceTheme.ts`).
- Text on accent: one `.on-accent` registry rule makes anything accent-filled use `--lab-accent-ink`, so a lime or red surface can never get white text again.
- The contact flow is restyled flat: numbered rows, hairlines, big condensed type, the accent only as a rule and a dot. No cards, fills or glows.

## Checks

- tsc and eslint pass. Local dev: `?theme=red-giant` on `/contact` gives accent `#ff4d2e` with dark text on it; `?theme=black-hole` and the restyled `/contact` steps 1 and 2 checked on screen.

## Not done

- The 3D sky reads the theme once when it is built, so switching themes needs a reload for the sky (the page colours change instantly).
- `voice-orb.css` changes in TASK-DB-0114 (themed Mute/End buttons) still use fixed rgb values; swap them for the tokens when 0114 merges.
