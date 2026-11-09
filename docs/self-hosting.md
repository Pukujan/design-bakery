# Hosting design-bakery

design-bakery.com (the site and its API) runs on the owner's VPS (`ssh vps`, Tailscale
`octo-vps`), behind Cloudflare Tunnel. Where services run is decided in
`pukujan-lab-2/server-management`, file `vps/PLAN.md`; if this page and that plan disagree,
the plan wins.

The deploy kit is in `deploy/vps/`. Earlier hosts (gravebuster, the MacBook Pro, Vercel,
Railway) are retired; their runbooks are in git history.

---

## 1. Architecture

```
browser ──► Cloudflare edge (design-bakery.com zone)
              └─ www / apex ──► tunnel A (octo-cloudflared) ──► design-bakery-web:80
                                                                 │  Caddy, static
                                                                 ├─ /api/*          ─► api:8787 (Express)
                                                                 └─ blog/case-study ─► api:8787 (link previews)
```

| Piece | Value |
| --- | --- |
| Host | the VPS, user `ubuntu` |
| Deploy checkout | `~/apps/design-bakery` (detached HEAD at the deployed SHA; managed by `deploy.sh`, do not develop in it) |
| Compose project | `design-bakery` (`deploy/vps/docker-compose.yml` + `docker-compose.edge.yml`) |
| Containers | `design-bakery-web` (Caddy on `:80`, healthcheck `/healthz`), `design-bakery-api` (`node backend/lib/server.js`, healthcheck `/health`) |
| Ports | `127.0.0.1:8085` (web), `127.0.0.1:8789` (api); loopback only |
| Networks | both on `design-bakery_default`; web also on `study-os_edge`, which tunnel A reaches |
| Images | `design-bakery-web:<sha12>-<UTC timestamp>` (~182 MB), `design-bakery-api:<sha12>-<UTC timestamp>` (~1 GB) |
| Logs | `docker logs design-bakery-web` / `design-bakery-api`, `deploy/vps/deploy.log` |

**Build.** `deploy/vps/Dockerfile` runs `pnpm install --frozen-lockfile` and
`pnpm --dir frontend run build` on `node:24-bookworm-slim`, and `caddy:2-alpine` serves
`frontend/dist`. `Dockerfile.api` builds `backend/services` and `backend`, and installs
`fontconfig` + `fonts-dejavu-core` for the publish kit's SVG text.

**Routing.** `deploy/vps/Caddyfile` is the source of truth for every redirect and
rewrite (the CI tests assert against it):

1. Redirects run **before** the filesystem (`/studyos[/…]` → `https://study.design-bakery.com/…` 307, `/ire/app` → `/ire/` 301).
2. Rewrites run **after** the filesystem, so `/case-studies/cortex` serves the real
   `case-studies/cortex/index.html`, and only paths that exist solely as rewrites hit them.
3. The final `handle` (→ `/index.html`) is the SPA fallback; paths ending in `.html` 404
   instead of falling back.
4. The apex → `https://www.design-bakery.com` 307 lives in the Caddyfile (`@apex`), so both
   hostnames can point at this container.

**The `/version-2` sub-app.** `frontend/version-2-app` builds with `base: "/version-2/"`,
`scripts/build-version-2-app.mjs` copies it into `frontend/dist/version-2`, and the
Caddyfile's `@version2` block rewrites `/version-2[/]` to its `index.html`. `/` is the site
shell SPA.

---

## 2. Deploy

**A merge to `main` is the deploy.** Komodo (on the VPS) runs the action
`design-bakery-deploy-on-push` every 5 minutes. When GitHub's `main` is ahead of the running
`design-bakery-web` image, it deploys the stack `design-bakery-vps`, whose pre-deploy runs
`deploy/vps/deploy.sh`. Both are defined in `server-management`,
`komodo/resources/stacks-vps.toml`. Do not deploy by hand-pulling an unmerged branch.

What `deploy.sh` does, in order:

1. Take the deploy lock (`deploy/vps/.deploy.lock`, a directory; a second caller
   exits at once instead of queueing).
2. `git fetch --prune origin`, resolve the ref (default `origin/main`), and note the running
   web and API images.
3. `git checkout --force --detach <sha>`, then re-exec the freshly checked-out `deploy.sh`,
   so the incoming revision's smoke checks are the ones that run.
4. Build both images, tagged `<sha12>-<UTC timestamp>` (and `<sha12>`).
5. Swap `api`, health-check `127.0.0.1:8789/health` (up to 180 s); swap `web`,
   health-check `127.0.0.1:8085/healthz` (up to 90 s).
6. Smoke-check `/`, `/healthz`, `/research/papers/db-r-2026-010`, `/robots.txt`,
   `/version-2` and a journey plate, `/ire` (200), `/ire/app` (301), `/studyos` (307), and
   `/api/public/blogs` through Caddy. `/` and `/version-2` are body checks, so a routing
   mistake that serves the wrong document with a 200 is caught. A gateway status on
   `/api/*` fails the deploy; a 500 only warns (data or secrets, not routing).
7. On success, write `.deploy-state` (`SHA`, current and previous images, `DEPLOYED_AT`)
   and the live tags (`DESIGN_BAKERY_IMAGE`, `DESIGN_BAKERY_API_IMAGE`) into `.env`, so
   Komodo's `compose up` changes nothing.
8. On failure, swap the previous images back, health-check them and exit 1.

By hand on the VPS (to retry a failed deploy, or to deploy a merged commit at once):

```bash
cd ~/apps/design-bakery
deploy/vps/deploy.sh --ref origin/main
```

Flags: `--no-pull`, `--with-edge` / `--no-edge`, `--with-api` / `--no-api`, `--port <n>`,
`--no-rollback`. Keep `WITH_EDGE=1` in `.env`: without it a deploy recreates `web` without
`study-os_edge` and the tunnel returns 502.

### Config (git-ignored, on the VPS in `deploy/vps/`)

- **`.env`**: public values only (ports, `EDGE_NETWORK`, `WITH_EDGE`, image tags,
  `VITE_SITE_URL`, `VITE_BLOG_API_URL=https://www.design-bakery.com`). The `VITE_*` values
  are build args: change them, then redeploy. `VITE_BLOG_API_URL` being the site's own
  absolute origin lets the SPA call the Caddy `/api/*` proxy same-origin and lets the
  build-time sitemap fetch the live blog list.
- **`.env.api`**: the API's secrets (mode 600). `.env.api.example` lists every variable and
  where it comes from. The API is deployed whenever this file exists (or `WITH_API=1`).
  Missing values fail per request, not at boot: the API still answers `/health`, and the
  affected routes return a 5xx (see `docker logs design-bakery-api`).

The ones the API cannot serve without:

| Variable | Kind | Source |
| --- | --- | --- |
| `ADMIN_JWT_SECRET` | secret | `openssl rand -base64 48` |
| `ADMIN_EMAIL` (+ `ALLOWED_ADMIN_EMAILS`) | config | the admin login address(es) |
| `ADMIN_PASSWORD_HASH` | secret | `node backend/scripts/hash-admin-password.mjs '<pw>'` |
| `OPENROUTER_API_KEY` | secret | openrouter.ai → Keys |
| `OCTO_WORKSPACE_ID` | config | the design-bakery workspace UUID |
| `OCTO_API_KEY` | secret | the workspace key (scopes read, write, files, delete) |
| `ALLOWED_ORIGINS` | public | `https://www.design-bakery.com,https://design-bakery.com` |

`OCTO_API_BASE` defaults to `https://octodb.design-bakery.com`.

---

## 3. Rollback

```bash
cd ~/apps/design-bakery
deploy/vps/rollback.sh              # back to PREVIOUS_IMAGE from .deploy-state
deploy/vps/rollback.sh --list       # image tags on the host
deploy/vps/rollback.sh --image design-bakery-web:<tag>
```

`rollback.sh` takes the same lock, swaps to the recorded previous tags (web and API),
health-checks them, and flips current/previous so the same command rolls forward again. No
rebuild, so it takes seconds. A later merge to `main` deploys again on Komodo's next tick.

Old images are never deleted by the scripts; prune deliberately:

```bash
docker images design-bakery-web
docker image prune -a --filter 'until=720h'
```

Host lost: clone to `~/apps/design-bakery`, restore `.env` and `.env.api`, run
`deploy.sh --ref <sha>`; the images are reproducible from the commit.

---

## 4. Link previews (Open Graph)

Blog and case-study URLs need per-post `<title>` / `og:*` tags for link previews. The API
serves them (`backend/src/api/ogPreview.ts`) and the Caddyfile routes those paths to it.

- **Matcher.** `@ogPreview` in the Caddyfile: `/blogs`, `/blogs/:id`,
  `/{endtoend|legal-workflow|ai|forward-deployed}-engineer/blogs[/:id]`, and every
  `/case-studies/*` path, excluding `*.html`. It sits after the filesystem handlers, so a
  real file or static case-study directory is served from disk.
- **The two matchers must agree.** `pnpm test:og-routing` fails CI if Caddy's matcher and
  the router's regexes drift; `pnpm test:og-contract` checks `blogSocialMeta.ts`.
- **Crawler vs browser.** Crawlers get a copy of the shell with the tags injected; browsers
  get the untouched shell. Responses carry `Vary: User-Agent` and
  `Cache-Control: public, max-age=0, must-revalidate`.
- **Without the API**, Caddy's `handle_errors` degrades these paths to the plain shell (a
  200, not a 502). Errors under `/api/*` still error.
- `SITE_URL` (default `https://www.design-bakery.com`) feeds canonical and `og:image` URLs;
  the shell comes from `OG_SHELL_ORIGIN` (default `http://web:80`).

---

## 5. Operational notes

- **Only touch this stack.** Other services share the VPS (Octo, Komodo, Precedent, ACS,
  the copilot voice stack and more; see `vps/PLAN.md`). This deploy touches only its own
  containers, image tags and ports 8085 / 8789.
- **The voice call.** The call's audio goes through the copilot stack's LiveKit server
  (`copilot.design-bakery.com`, Komodo stack `copilot` on the same VPS); this stack does not run one.
  Who answers depends on `.env.api`:
  - With `VOICE_LIVEKIT_KEY` and `VOICE_LIVEKIT_SECRET` set (the copilot LiveKit's keys), the API mints the
    call token itself (`backend/src/copilot/voiceToken.ts`) and asks for this repo's worker by name,
    `design-bakery-voice`. That worker is the `voice` service here (`voice-agent/`, TASK-DB-0152). It is
    behind the compose profile `voice` and deployed by `deploy.sh` once `deploy/vps/.env.voice` exists
    (from `.env.voice.example`). It joins the `copilot_default` network to reach `copilot-livekit:7880`
    and speech through the shared speech gateway at `host.docker.internal:18800` (Komodo stack
    `speech-gateway`, TASK-DB-0154), which sends each call to a speech server (the Pro for English) and keeps
    it there; the worker sends `X-Speech-Project: design-bakery` and `X-Speech-Call: <room>` and releases the
    call when it ends. When every server is full the call gets the usual speech error: no cloud voice. It goes last
    in a deploy and never fails one: a worker that does not register with LiveKit within
    `VOICE_TIMEOUT` (120 s) is put back on its previous image. `rollback.sh` leaves it alone.
  - Without them, the API asks the copilot stack for a token (`/api/voice/token`) and that stack's own
    worker answers.

  To switch calls to this repo's worker: create `.env.voice`, deploy, check that `docker logs
  design-bakery-voice` says `registered worker`, then add the two `VOICE_LIVEKIT_*` lines to `.env.api`
  and deploy again. To switch back, remove those two lines and deploy.
- **The song maker.** The `music` service (`music-agent/`, TASK-DB-0160) makes songs on the owner's Flow Music
  plan (www.flowmusic.app) by driving a signed-in Google Chrome. Chrome starts cold for each song and closes when it
  is done; only the Chrome profile (the sign-in) and the finished songs stay, in the `music-data` volume. Flow Music
  makes two takes of each song: both are saved (`songs/<id>.m4a` and `<id>-2.m4a`), then the API copies them to Octo's
  public files (`files.design-bakery.com`, URLs on the `copilot_songs` row) and the player loads them from there; the
  volume is only the first copy. The player is a card over the page, in chat and on calls, so the conversation goes on
  while a song is made; it switches between the two takes.

  **Limits and the catalogue.** A visitor makes `SONGS_PER_VISITOR_DAY` (2) new songs a day, counted by their visitor
  pass and by their address (an HMAC of it, `copilot_songs.ip`), so a new pass or browser does not reset it; the site
  makes `SONGS_PER_DAY` (20) in all, and the owner's addresses are exempt. Songs already made are free to play again
  with no limit: the copilot's `saved_songs` / `play_song` tools, `GET /api/copilot/songs`, and the player's
  "More songs" list.

  **Staying signed in.** Google's sign-in cannot be made permanent, but it lasts while it is used: every `CHECK_HOURS`
  (24) and a minute after each start, the song maker opens Flow Music for a few seconds (no credits), which renews it.
  `GET /status` shows the last check (`lastCheck.signedIn`) and `POST /check` runs one now; if it says false, sign in
  again as below. While signed out a song fails and the player says so. The API
  reaches it at `http://design-bakery-music:8790`. It is behind the compose profile `music` and deployed by
  `deploy.sh` once `deploy/vps/.env.music` exists (it may be empty); like the voice worker it goes last and never
  fails a deploy.

  **Signing in** (once, and again if Google signs it out). Open the remote screen, then sign in to Flow Music with
  Google in it yourself:

  ```bash
  ssh vps docker exec design-bakery-music curl -s -XPOST localhost:8790/signin
  ssh -N -L 6080:127.0.0.1:6080 vps
  ```

  Open `http://localhost:6080/vnc.html` and press Connect. The window closes by itself after `SIGNIN_MIN` (20)
  minutes, or at once with `POST /signin/done`, which also reports whether the sign-in took. The screen is on the
  VPS's loopback only; nobody reaches it without SSH. Do not sign out of Flow Music in it.

  The copilot's `make_song` tool is on when `.env.api` has `MUSIC_URL=http://design-bakery-music:8790`. It asks the
  visitor what kind of song first, saves every song in Octo (`copilot_songs`, migration 014) so the same ask plays
  the saved one, and allows `SONGS_PER_VISITOR_DAY` (2) per visitor and `SONGS_PER_DAY` (20) for the whole site; the
  owner's own addresses (`COPILOT_RATE_EXEMPT_IPS`) skip the limits. A song uses about 5 Flow Music credits.
- **Disk:** two images per deploy (~1.2 GB together); prune old tags (§3).
