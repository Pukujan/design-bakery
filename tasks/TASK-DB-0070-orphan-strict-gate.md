# TASK-DB-0070 — promote the orphan detector to a strict gate

| Field | Value |
|-------|-------|
| **Created** | 2026-10-06 |
| **Issue** | [#78](https://github.com/Pukujan/design-bakery/issues/78) (remaining modular restructuring) |
| **Branch** | `task/TASK-DB-0070-orphan-strict-gate` |
| **Status** | Complete — verified locally; PR open. |

## Goal

TASK-DB-0069 took the orphan backlog from 267 to 12 intentional keeps, so the
report-only `orphans` CI job can now fail on regressions instead of printing a
list nobody reads. This is issue #78's closing step.

## Done

- `scripts/find-orphans.mjs`: added an `ALLOW` list — intentional orphans that
  never fail `--strict`, each with a reason:
  - `frontend/src/app/modules/photo-gallery/**` — unrouted WIP for open issue
    [#24](https://github.com/Pukujan/design-bakery/issues/24); unfinished, not dead.
  - `packages/cover-studio-kit/examples/**` — reference examples, not imported by design.
  - `main()` now reports allowlisted keeps separately and exits non-zero only when
    an **unexpected** orphan remains.
- `.github/workflows/ci.yml`: the `orphans` job runs `node scripts/find-orphans.mjs
  --strict` (node directly — the job installs no dependencies, so the script stays
  dependency-free; `pnpm find:orphans:strict` is the local equivalent).

## Evidence (Windows 11 / Node 24)

- `node scripts/find-orphans.mjs` → 12 allowlisted keeps, "No unexpected orphaned
  files found.", exit 0.
- `node scripts/find-orphans.mjs --strict` → same, exit 0.
- Regression proof: dropped a probe file (`frontend/src/app/__orphan_probe.ts`) →
  strict printed it as an orphan and exited **1**; removed the probe → exit 0.

## Next step

- Merge when CI is green, then add `orphans` to `main`'s required status checks so
  it actually blocks a merge with new dead code.
