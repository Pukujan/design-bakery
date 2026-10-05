# TASK-DB-0061: install the ACS multi-agent hotloader and OIO issue-log intake

| Field | Value |
|-------|-------|
| **Created** | 2026-10-05 |
| **Issue** | none (owner-directed; no design-bakery issue opened) |
| **Branch** | `task/TASK-DB-0061-acs-oio-hotload` |
| **Status** | In progress — both installs landed locally and validate; PR opened for review. |

## Goal

Give this repository a shared way for several coding agents to work it: roles, a
decision boss with a lease, a claim queue, and proposals that become PRs (the ACS
multi-agent hotloader), plus the OIO observational/operational issue-log intake
(the issue form and its triage workflow). Both install surfaces are pinned
external packs; nothing is vendored into this repo.

## What was installed

- **`.content-system/`** — the CGM adapter this repo needs before ACS will install.
  ACS refuses to install without it, and authoring the adapter is CGM's job, not
  ACS's, so it was written from this repo's own material: the palette from
  `frontend/src/styles/globals.css`, the social card from
  `frontend/public/images/site-og.png`, and the product framing from the
  portfolio content. Six files: `system-version.json`, `project-brief.json`
  (v2, with two repository-artifact evidence items pinned to commit
  `9b3441f`), `brand-language.json`, `visual-style.json`, `asset-manifest.json`,
  `review-rubric.json`.
- **`.coord/`** — the ACS coordination surface written by `acs_install.py`:
  `assignment.json` (pins + boss lease + watchdog) and `hotload.lock.json`
  (portable install record; no absolute local paths).
- **`.oio/`, `.github/ISSUE_TEMPLATE/observational-issue.yml`,
  `.github/workflows/issue-triage.yml`, `.github/scripts/oio_*.py`** — the OIO
  package, plus a marked OIO block in `AGENTS.md` between
  `<!-- oio:issue-log-guidance:start -->` and `...:end -->`.

## Pins

| Pack | Version | Commit |
|------|---------|--------|
| ACS multi-agent-hotload | 0.1.0 | `c15e53fc17e8158e9182709d5d3b6f255bcc11f2` |
| PCM | CLI 0.6.0 | `4e2385474b4af9249ca009cbdcb38c4498932475` |
| CGM | 0.5.12 (eight modules) | `6831f91e165b62d719c05eb492f7375fa932b560` |
| OIO | 0.1.0 | `469adf1e9cb12b004424118c77270e3ca0e71217` |

Pinned dependency checkouts live under `%LOCALAPPDATA%\acs\deps\`, not in the dev
root (ACS dev-root hygiene).

## Checks (local, 2026-10-05)

- `validate_content_system.py --root <cgm> --adapter .content-system --project-root .` — `VALID`.
- `hotload_check.py --adopter-root . --cgm-root <cgm>` — `OK` (FULL PCM + FULL CGM 0.5.12 + runtime).
- `oio_installer.py --target . --check` — `VALID: OIO package, project ontology, and managed files match`.
- `hotload_check` dev-root check reports three pre-existing warnings in
  `D:\development` (`colab-cli` and `grok` are plain folders with no `.git`;
  `app building automation` is a second checkout of `app-builder-automation`).
  These are environment hygiene notes, not install failures, and are outside
  this repo.

## Notes

- **OIO does not install on native Windows.** Its installer needs
  descriptor-relative no-follow filesystem operations (`os.supports_dir_fd` for
  open/mkdir/stat/unlink/rename plus `O_NOFOLLOW`/`O_DIRECTORY`) and fails
  closed without them. It was installed from WSL Ubuntu 22.04 against
  `/mnt/d/development/design-bakery.com`. Re-run the same way to upgrade.
- **Line endings matter for OIO.** OIO records byte-exact SHA-256 hashes of its
  managed files. With `core.autocrlf=true`, a Windows checkout rewrites them to
  CRLF and OIO's `--check` then refuses them as edited. `.gitattributes` now
  pins `eol=lf` for `AGENTS.md` and the OIO-managed set, and OIO was reinstalled
  from an LF-canonical copy of its source so the manifest hashes match the bytes
  git stores. Re-run the installer from that copy
  (`%LOCALAPPDATA%\acs\scratch\oio-lf`) when upgrading.
- `PROMPT_INJECT.md` is written by `hotload_check` into the ACS pack checkout
  (`%LOCALAPPDATA%\acs\deps\acs\...`), not into this repo — it is a pack
  artifact, not a repo file. Its `acs_prompt_inject.system_block` is meant to be
  pasted into an agent's system prompt at session boot.
- The GitHub-side steps the installer does not automate: branch protection on
  `main` already requires the `quality` check and auto-merge is already enabled
  at repo level, so no change was needed there.

## Next step

- Owner review of the PR; merge when the `quality` check is green.
- Optional follow-ups: fill in OIO project priority paths 1–100 with real
  meanings, and maintain `account_authority` with authenticated GitHub numeric
  account IDs (both flagged by the OIO installer).
- Optional: edit `.coord/assignment.json`'s `agents` seed list and check-in to
  match real seats.
