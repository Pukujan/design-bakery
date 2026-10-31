# TASK-DB-0097 — install agent stack 1.0.1 from one checkout

| Field | Value |
|-------|-------|
| **Created** | 2026-10-31 |
| **Issue** | none (owner-directed; continues [TASK-DB-0062](TASK-DB-0062-stack-train-upgrade.md)) |
| **Branch** | `task/TASK-DB-0097-agent-stack-1-0-0` (branched from `main` @ `20280d3`) |
| **Status** | In progress — installed and checked locally; PR open. |

## Goal

The agent stack used to ship from four repositories and now ships from one,
`Pukujan/agent-stack-train`, certified as 1.0.1 at `2e32f2c`. Move this repo onto
it by rerunning the ACS installer from that checkout.

## Done

- `stack-manifest.json` lists one pin, `agent-stack-train`, left empty so the repo keeps following the train.
- `.coord/assignment.json` and `.coord/hotload.lock.json` pin PCM 0.7.0, CGM 0.5.13 and OIO 0.3.0 to `2e32f2c`. Seats are unchanged: `agents` and `boss_failover` are untouched, only `recorded_at`, `notes` and `pins` moved.
- OIO 0.3.0 replaces its managed files (issue form, triage script, installer, ontology, schemas). `issue-triage.yml` changes only to read its runner from the repository variable `OIO_RUNS_ON` (new in stack 1.0.1); unset, it stays on `ubuntu-latest`.
- `oio-close-on-merge.yml` and `oio-close-sweep.yml` are new. A merged pull request closes the issues it names with Closes, Fixes or Resolves; Refs never closes. The sweep only reports until the repository variable `OIO_CLOSE_SWEEP_APPLY` is `true`.

## Not changed

- No boot instruction or script here points at the four old checkouts, so there were no paths to move. The Windows paths in `tasks/` stay as the record of what was true then.
- `.content-system/system-version.json` still names CGM 0.5.12 at `62340f3`. The CGM validator only requires the fields to be present.

## Checks (local, 2026-10-31)

- ACS installer from Pukujan/agent-stack-train#26, `--stack-root` at `v1.0.1`: `acs_install: OK (state=READY)`.
- `check_manifest.py` against the live train: OK.
- `oio_installer.py --check`: VALID.
- `hotload_check.py`: OK.
- Every workflow parses as YAML.

## Next step

- Merge this PR when `quality` is green. Pukujan/agent-stack-train#26 is merged.
- Optional: set `OIO_CLOSE_SWEEP_APPLY=true` after reading the sweep's first report.
- Decide whether to move the `.content-system/system-version.json` pointer to CGM 0.5.13 at `2e32f2c`, as TASK-DB-0062 did for 0.5.12.
