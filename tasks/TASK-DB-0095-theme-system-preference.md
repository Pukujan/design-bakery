# TASK-DB-0095 — theme follows the system colour preference

| Field | Value |
|-------|-------|
| **Created** | 2026-10-26 |
| **Branch** | `task/TASK-DB-0095-theme-system-preference` (branched from `origin/main` @ `2ea93c0`) |
| **Issue** | [#133](https://github.com/Pukujan/design-bakery/issues/133) — observational, class 3 (`human-via-agent` claimed, awaiting owner attestation) |
| **Status** | Done — merged ([#134](https://github.com/Pukujan/design-bakery/pull/134), `c715789`) and auto-deployed on the Mac; verified live |

## Goal

A visitor whose OS is set to dark gets the dark theme on first load. An explicit
choice made with the toggle still wins over the OS, including on later visits.

## Defect

`ThemeSwitcher` read `localStorage.mode` and nothing else. Nothing in the app read
`prefers-color-scheme`, and `index.html` shipped no theme bootstrap, so with no stored
value the page rendered light for everyone — and the class was applied in a React
`useEffect`, so a stored dark choice still flashed light first. Measured on the
production build: `os=dark mode=unset -> class="" bg=rgb(255,249,240)`.

## Change

- `frontend/index.html` — a pre-paint inline script resolves `stored choice ?? OS scheme`
  and sets `html.dark`. Storage access is wrapped in `try/catch` and fails open to the OS.
- `frontend/src/app/components/ThemeSwitcher.tsx` — the icon state comes from the existing
  `useDarkMode` hook instead of a parallel `useState(false)`, so the control cannot disagree
  with the page. While no choice is stored it keeps following the OS live (`matchMedia`
  `change`); a click writes an explicit `light`/`dark` and stops following. Added an
  `aria-label` that names the theme the button switches to.
- `frontend/src/styles/globals.css` — `color-scheme: light` on `:root` and
  `color-scheme: dark` on `.dark`, so native UI (scrollbars, form controls) follows.
- `scripts/test-theme-preference.mjs` (+ `pnpm test:theme-preference`, CI `quality`) —
  six scheme/storage combinations, live OS change while unset, click-wins-over-OS across a
  reload, class present before the app bundle runs, and blocked storage failing open.

## Verification

- `pnpm test:theme-preference` — passes.
- `pnpm lint`, `pnpm --dir frontend run typecheck`, `pnpm run build` — pass.
- `pnpm test:homepage-content`, `test:icon-coverage`, `test:ire-app`, `test:version-2-app`,
  `find-orphans --strict` — pass.
- Local preview of the built output: all six combinations resolve as documented, and the
  live OS change is followed without writing a preference.
- Production `https://www.design-bakery.com/` after the auto-deploy (`assets/index-CY4hw1qO.js`):
  all six combinations resolve as documented, a live OS change is followed with nothing
  stored, a click wins and survives reload, and the class is on `<html>` before the bundle
  runs. `/`, `/blogs`, `/research`, `/version-2` and `/ire` all answer 200; `/ire` stays
  light (`bg rgb(244,243,235)`) and `/version-2` keeps its own scene background
  (`rgb(21,10,22)`), both unaffected under a dark OS.

## Non-goals

- `/version-2` and `/ire` are separate documents with their own theme rules; `/ire` stays
  light-only by design (`<meta name="color-scheme" content="light">`).
- No "system" option in the UI. The stored `mode` key and its `light`/`dark` values are
  unchanged, so existing choices keep working.
