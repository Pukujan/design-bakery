# TASK-DB-0065 — stop bundling the whole lucide icon set into the entry chunk

| Field | Value |
|-------|-------|
| **Created** | 2026-10-05 |
| **Issue** | [#73](https://github.com/Pukujan/design-bakery/issues/73) (modular restructuring) |
| **Branch** | `task/TASK-DB-0065-trim-lucide-icons` |
| **Status** | Complete — verified in a browser; PR open. |

## Goal

`iconResolver.ts` used `import * as LucideIcons from 'lucide-react'`, which pulls the entire icon set (≈1500 icons) into the entry chunk — the largest single remaining cause of the bundle after step 3. Replace it with an explicit allowlist of the icons content can actually name.

## Scope

- `frontend/src/app/lib/iconResolver.ts` only: swap the namespace import for a curated map.
- New guard `scripts/test-icon-coverage.mjs` (`pnpm test:icon-coverage`) plus a CI step, so a new content icon name fails the build instead of silently falling back to `ExternalLink`.

Out of scope: route-level code splitting (see Next step).

## Done

- `frontend/src/app/lib/iconResolver.ts`: `import * as LucideIcons` → an explicit `ICONS` map; `resolveIcon`'s contract (resolve by name, fall back otherwise) is unchanged. An unmapped name now `console.warn`s in dev (production build is unchanged).
- `scripts/test-icon-coverage.mjs`: walks the content JSON, collects every `icon` value, and asserts each is allowlisted (or the local `Behance` brand icon).
- `package.json` + `.github/workflows/ci.yml`: `test:icon-coverage` wired in.

## Evidence

- Entry chunk on main's base: **3,412.59 kB → 2,650.47 kB** (−762 kB, −22%); gzip **≈885 → 748.05 kB**.
- The reachable names are bounded and static: relevant-experience JSON supplies Brain/Code/Lightbulb/Rocket/Shield; `social-links.json` supplies Behance/Github/Linkedin/Mail — and `socialIconResolver.tsx` already resolves those four through its own explicit map before `resolveIcon` is reached.
- The guard was verified to **fail** when `Shield` is removed from the allowlist, then restored.
- An unmapped name warns in dev, so a non-static source (a CMS-driven icon, say) is visible during development even though `test:icon-coverage` only inspects the checked-in JSON.
- Browser check (Playwright/Chromium against the built `dist`, `/`): all five experience icons render (`lucide-brain`, `lucide-code`, `lucide-lightbulb`, `lucide-rocket`, `lucide-shield`), no console errors.
- `pnpm lint`, `pnpm test:icon-coverage`, and `pnpm run build` pass.

**Caveat:** `pnpm --dir frontend run typecheck` reports 5 errors in the `calendar.tsx` files that TASK-DB-0063 deletes. They are an artifact of the local `node_modules` already having `react-day-picker` removed while this branch is cut from `main`; they are identical with and without this change, and none are in a touched file. CI (fresh install from this branch's lockfile) is unaffected.

## Next step

Route-level code splitting. Combined with TASK-DB-0064 the entry is ≈2.03 MB; the remaining weight is the statically-imported pages. This carries an SEO risk (Suspense fallbacks can drop the head tags) and needs its own verification.
