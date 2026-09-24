# HANDOFF — start here in a fresh session

1. Read **[AGENTS.md](AGENTS.md)** (repo rules, layout, dev commands).
2. Read **[checkpoints/CURRENT.md](checkpoints/CURRENT.md)** (what state the repo is in, open threads).
3. Open the active task file in **[tasks/](tasks/)** and continue from its **Next step**.

## Setup (once per machine)

- Node **24** (`.node-version`), pnpm **10.32.1** via corepack (`packageManager` in `package.json`).
- `pnpm install --frozen-lockfile`
- Env: copy `frontend/.env.example` → `frontend/.env` and `backend/.env.example` → `backend/.env` ([additionals/doc/env.md](additionals/doc/env.md)). Never commit either file.

## Everyday commands

| What | Command |
|------|---------|
| Frontend only (port 5300+) | `pnpm run dev:web` |
| API only (port 8787) | `pnpm run dev:api` |
| Both + services watch | `pnpm run dev:stack` |
| CI checks (same order as `.github/workflows/ci.yml`) | `pnpm lint && pnpm run build && pnpm --dir frontend run typecheck && pnpm --dir backend run build && pnpm --dir backend/services run test:publish-kit-fonts && pnpm test:homepage-content` |

## Conventions

- One task file per unit of work: `tasks/TASK-DB-####-short-slug.md` (goal, done, evidence, next step).
- Branch `task/TASK-DB-####-slug`; commit messages start with `TASK-DB-####:`; PR against `main`.
- Update `checkpoints/CURRENT.md` when a task finishes or the repo state changes meaningfully.
- New showcase project: add an entry to `frontend/src/app/portfolios/endtoend-engineer/engineering/projects.json` (exactly 3 stats; icons `Users|TrendingUp|Award|Sparkles`; `"startedAt"` `YYYY-MM[-DD]` + `"startedAtSource"` evidence — the carousel sorts newest first automatically; `"status": "ongoing"` for in-progress work). Only use facts from the project's repo. For a standalone case study, copy the study-os / fluffy-v4 static-page pattern (see `checkpoints/CURRENT.md`).
- Git history is the archive — delete stale material instead of copying it into archive folders.
