# TASK-DB-0052: Study OS Live App link

| Field | Value |
|-------|-------|
| **Created** | 2026-09-24 |
| **Issue** | #46 |
| **Branch** | `task/TASK-DB-0052-study-os-live-app` |
| **Status** | PR open with auto-merge queued |

## Goal

The Study OS showcase card links to the live Study OS web app with a **Live App** button.

## Findings

- The app will be served at **`https://study.design-bakery.com/`**. Source: Study-os decision D018 (`docs/webapp/D018_AMENDMENT.md` on `task/SOS-0004-first-slice`, PR Pukujan/Study-os#100). Under D018 the built assets are served from gravebuster by the API container, with Vite `base: '/'`, same-origin `/api/*`, a Cloudflare tunnel and no Vercel. It replaces SOS-0003's plan of a Vercel `study-os-web` project behind a `design-bakery.com/study-os` rewrite.
- As of 2026-09-24 about 18:15 ET, `study.design-bakery.com` does not resolve (not deployed yet), and Study-os has no Vite or deploy config yet.
- design-bakery serves on the custom domain `www.design-bakery.com` (Cloudflare in front; the apex redirects to www with a 307) as well as on `design-bakery.vercel.app`.

## Done

- `projects.json`: added a Study OS link `{"label": "Live App", "url": "https://study.design-bakery.com/"}`, reusing the existing `links` rendering (an external link opens in a new tab). No new field was needed.
- `vercel.json`: added non-permanent **redirects** from `/studyos` and `/studyos/:path*` to `https://study.design-bakery.com/…`. Vercel applies redirects before rewrites, so the SPA catch-all can't swallow them. I didn't use a proxy rewrite: with `base: '/'`, the app's `/assets/*` and `/api/*` would resolve against design-bakery.
- `test:homepage-content`: asserts the Live App link and both redirects.

## Next step

- Until Study OS deploys, the Live App button and `/studyos` lead to an unresolvable host.
- If Study OS ever moves under a sub-path of design-bakery, it would need Vite `base: '/studyos/'` plus a proxy rewrite placed before the SPA catch-all.
