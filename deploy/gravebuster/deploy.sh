#!/usr/bin/env bash
#
# Deploy design-bakery (TASK-DB-0055). Runs on the Mac host since TASK-DB-0082.
#
# Pulls a git ref into the deploy checkout, builds a new tagged image, swaps the
# container, smoke-checks the running site and records the previous image tag so
# rollback.sh can put it back. Nothing here touches the Cloudflare Tunnel or the
# study-os stack.
#
# Usage (the deploy checkout, e.g. ~/apps/design-bakery):
#   deploy/gravebuster/deploy.sh                     # deploy origin/main
#   deploy/gravebuster/deploy.sh --ref <sha|branch>   # deploy something else
#   deploy/gravebuster/deploy.sh --with-edge          # also join the tunnel network
#   deploy/gravebuster/deploy.sh --no-edge            # drop the tunnel network for this run
#   deploy/gravebuster/deploy.sh --with-api           # also build/swap the API container
#   deploy/gravebuster/deploy.sh --no-api             # web only, even if the API is enabled
#   deploy/gravebuster/deploy.sh --no-pull            # use the local checkout as-is
#
# With the site tunnel-fronted, set WITH_EDGE=1 in deploy/gravebuster/.env so every
# deploy keeps the `web` container on the tunnel network (a plain deploy would
# otherwise drop it and the tunnel would 502).
#
# Only one deploy or rollback runs at a time: each takes an exclusive lock DIRECTORY
# (deploy/gravebuster/.deploy.lock) and exits at once if another already holds it.
#
# The API container is deployed when WITH_API=1 or deploy/gravebuster/.env.api exists;
# --with-api / --no-api override that for a single run.
#
# Config comes from deploy/gravebuster/.env (see .env.example) and/or the environment.
set -euo pipefail

# Docker Desktop on macOS installs the CLI in /usr/local/bin, which is NOT on the
# default non-interactive SSH PATH (a login shell has it, `ssh host <script>` does
# not). Harmless on Linux. The Mac host runs this over plain SSH.
PATH="/usr/local/bin:$PATH"

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
SELF="$SCRIPT_DIR/$(basename "${BASH_SOURCE[0]}")"
REPO_DIR=${DEPLOY_REPO_DIR:-$(cd "$SCRIPT_DIR/../.." && pwd)}
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"
EDGE_OVERLAY="$SCRIPT_DIR/docker-compose.edge.yml"
API_ENV_FILE="$SCRIPT_DIR/.env.api"
STATE_FILE=${DEPLOY_STATE_FILE:-$SCRIPT_DIR/.deploy-state}
LOG_FILE=${DEPLOY_LOG_FILE:-$SCRIPT_DIR/deploy.log}
# The lock is a DIRECTORY (see acquire_lock below) — macOS has no flock(1).
LOCK_DIR=${DEPLOY_LOCK_DIR:-$SCRIPT_DIR/.deploy.lock}
STALE_LOCK_MINUTES=${STALE_LOCK_MINUTES:-60}
STALE_LOCK_MAX_MINUTES=${STALE_LOCK_MAX_MINUTES:-1440}
IMAGE_REPO=${DESIGN_BAKERY_IMAGE_REPO:-design-bakery-web}
CONTAINER=${DESIGN_BAKERY_CONTAINER:-design-bakery-web}
API_IMAGE_REPO=${DESIGN_BAKERY_API_IMAGE_REPO:-design-bakery-api}
API_CONTAINER=${DESIGN_BAKERY_API_CONTAINER:-design-bakery-api}
HEALTH_TIMEOUT=${HEALTH_TIMEOUT:-90}
HEALTH_PATH=${HEALTH_PATH:-/healthz}
# The API image is ~1 GB and Node cold-starts slower than Caddy, so it gets its own
# (longer) budget. /health proves the process is up, not that it can reach Octo.
API_HEALTH_TIMEOUT=${API_HEALTH_TIMEOUT:-180}
API_HEALTH_PATH=${API_HEALTH_PATH:-/health}

REF=origin/main
DO_PULL=1
# Empty so deploy/gravebuster/.env (sourced below) can set it — a literal default
# here would shadow the .env value and re-introduce the dropped-edge 502.
WITH_EDGE=""
# Set by --with-edge / --no-edge; wins over the .env value.
WITH_EDGE_FLAG=""
# Empty for the same reason; resolved after .env is sourced.
WITH_API=""
WITH_API_FLAG=""
AUTO_ROLLBACK=1

log() { printf '[%s] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*" | tee -a "$LOG_FILE"; }
die() { log "ERROR: $*"; exit 1; }

usage() {
	sed -n '2,26p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
	exit "${1:-0}"
}

while [ $# -gt 0 ]; do
	case "$1" in
		--ref) REF=${2:?--ref needs a value}; shift 2 ;;
		--no-pull) DO_PULL=0; shift ;;
		--with-edge) WITH_EDGE_FLAG=1; shift ;;
		--no-edge) WITH_EDGE_FLAG=0; shift ;;
		--with-api) WITH_API_FLAG=1; shift ;;
		--no-api) WITH_API_FLAG=0; shift ;;
		--no-rollback) AUTO_ROLLBACK=0; shift ;;
		--port) WEB_HOST_PORT=${2:?--port needs a value}; shift 2 ;;
		-h|--help) usage 0 ;;
		*) die "unknown argument: $1 (try --help)" ;;
	esac
done

# .env is optional; it only ever holds non-secret deployment knobs.
if [ -f "$SCRIPT_DIR/.env" ]; then
	set -a
	# shellcheck disable=SC1091
	. "$SCRIPT_DIR/.env"
	set +a
fi
WEB_HOST_PORT=${WEB_HOST_PORT:-8085}
API_HOST_PORT=${API_HOST_PORT:-8789}

# Edge (tunnel-network) attachment is sticky: once the site is tunnel-fronted the
# `web` container must stay on the shared network or a plain deploy drops it and the
# tunnel 502s. Set WITH_EDGE=1 in deploy/gravebuster/.env to make that permanent;
# --with-edge / --no-edge override it for a single run.
[ -n "$WITH_EDGE_FLAG" ] && WITH_EDGE=$WITH_EDGE_FLAG
WITH_EDGE=${WITH_EDGE:-0}

# The API container is deployed when WITH_API=1, or automatically once its secret
# file deploy/gravebuster/.env.api exists (without it the container starts but every
# content route 500s). --with-api / --no-api override for a single run.
if [ -z "$WITH_API_FLAG" ] && [ -z "$WITH_API" ]; then
	if [ -f "$API_ENV_FILE" ]; then WITH_API=1; else WITH_API=0; fi
fi
[ -n "$WITH_API_FLAG" ] && WITH_API=$WITH_API_FLAG
WITH_API=${WITH_API:-0}
if [ "$WITH_API" = "1" ]; then
	if [ -f "$API_ENV_FILE" ]; then
		log "API: enabled (.env.api present)"
	else
		log "API: enabled but $API_ENV_FILE is missing — /health will answer, but content routes will 500"
	fi
else
	log "API: disabled (no $API_ENV_FILE, WITH_API unset)"
fi

COMPOSE=(docker compose -f "$COMPOSE_FILE")
if [ "$WITH_EDGE" = "1" ]; then
	COMPOSE+=(-f "$EDGE_OVERLAY")
fi
compose() { "${COMPOSE[@]}" "$@"; }

[ -d "$REPO_DIR/.git" ] || die "no git checkout at $REPO_DIR"
command -v docker >/dev/null || die "docker not found"
command -v curl >/dev/null || die "curl not found"

# One deploy at a time. Two runs that overlap interleave their web/api container swaps,
# and on 2026-10-07 that left the api container stuck in `Created` while the tunnel
# answered 502. Non-blocking on purpose: the second caller fails fast with this message
# (and the autodeploy timer simply retries on its next tick) rather than queueing behind
# a deploy that may run to the full timeout.
#
# Portable lock: an exclusive mkdir on a lock DIRECTORY (atomic on Linux and macOS),
# released by rmdir on EXIT. macOS has no flock(1), which this used to rely on. The
# holder writes its pid; a live pid means busy, a dead pid means the holder crashed and
# the lock is taken over. A lock whose pid file is not yet written is only taken over
# once it is older than STALE_LOCK_MINUTES (the mkdir→write-pid window); a live-looking
# pid still loses after STALE_LOCK_MAX_MINUTES (pid-reuse safety valve — no deploy runs
# that long). A plain FILE at this path is a leftover of the old flock scheme.
acquire_lock() {
	# Guard the rm -rf below against a pathological LOCK_DIR.
	[ -n "$LOCK_DIR" ] && [ "/" != "$LOCK_DIR" ] && [ "$PWD" != "$LOCK_DIR" ] \
		|| die "refusing to lock at unsafe path: '$LOCK_DIR'"
	if [ -d "$LOCK_DIR" ]; then
		if [ -f "$LOCK_DIR/pid" ]; then
			local lock_pid
			lock_pid=$(cat "$LOCK_DIR/pid" 2>/dev/null || true)
			case "$lock_pid" in
				''|*[!0-9]*)
					log "removing unreadable lock at $LOCK_DIR (pid file is not a pid)"
					rm -rf "$LOCK_DIR" ;;
				*)
					if kill -0 "$lock_pid" 2>/dev/null \
						&& [ -z "$(find "$LOCK_DIR" -maxdepth 0 -mmin +"$STALE_LOCK_MAX_MINUTES" 2>/dev/null)" ]; then
						die "another deploy or rollback is running (lock: $LOCK_DIR, pid $lock_pid)"
					fi
					log "removing stale lock at $LOCK_DIR (pid $lock_pid not running, or lock older than ${STALE_LOCK_MAX_MINUTES}m)"
					rm -rf "$LOCK_DIR" ;;
			esac
		else
			if [ -z "$(find "$LOCK_DIR" -maxdepth 0 -mmin +"$STALE_LOCK_MINUTES" 2>/dev/null)" ]; then
				die "another deploy or rollback is starting (lock: $LOCK_DIR, pid not yet written)"
			fi
			log "removing stale lock at $LOCK_DIR (no pid, older than ${STALE_LOCK_MINUTES}m)"
			rm -rf "$LOCK_DIR"
		fi
	elif [ -e "$LOCK_DIR" ]; then
		log "removing stale lock FILE at $LOCK_DIR (pre-directory lock scheme)"
		rm -f "$LOCK_DIR"
	fi
	mkdir "$LOCK_DIR" 2>/dev/null || die "another deploy or rollback is running (lock: $LOCK_DIR)"
	if ! printf '%s\n' "$$" >"$LOCK_DIR/pid" 2>/dev/null; then
		rm -rf "$LOCK_DIR" 2>/dev/null || true
		die "could not write lock pid at $LOCK_DIR"
	fi
	# rm -rf, not rmdir: the lock dir holds the pid file, and rmdir only removes
	# empty directories — it would silently leave the lock behind on every run.
	trap 'rm -rf "$LOCK_DIR" 2>/dev/null || true' EXIT
}

# Take the deploy lock, unless this run is a re-exec (below) of the freshly checked-out
# script: `exec` keeps our pid, so the lock the first pass took is still ours. `exec` also
# clears the EXIT trap, so re-arm it here or the lock would be left behind.
if [ "${DEPLOY_REEXEC:-0}" = "1" ]; then
	[ -d "$LOCK_DIR" ] || die "re-exec lost the deploy lock at $LOCK_DIR"
	trap 'rm -rf "$LOCK_DIR" 2>/dev/null || true' EXIT
else
	acquire_lock
fi

state_get() {
	[ -f "$STATE_FILE" ] || return 0
	sed -n "s/^$1=//p" "$STATE_FILE" | tail -1
}

state_write() {
	local tmp="$STATE_FILE.tmp"
	{
		echo "SHA=$1"
		echo "CURRENT_IMAGE=$2"
		echo "PREVIOUS_IMAGE=$3"
		echo "CURRENT_API_IMAGE=$4"
		echo "PREVIOUS_API_IMAGE=$5"
		echo "DEPLOYED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
	} >"$tmp"
	mv "$tmp" "$STATE_FILE"
}

http_code() {
	curl -sS -o /dev/null -w '%{http_code}' --max-time 10 "$1" 2>/dev/null || echo "000"
}

# A run that does not touch the API container must not blank the recorded API images,
# or a later API-enabled rollback would find no target and silently skip the swap.
api_state_current() { # <value to record when the API was deployed this run>
	if [ "$WITH_API" = "1" ]; then printf '%s' "$1"; else state_get CURRENT_API_IMAGE; fi
}

api_state_previous() { # <value to record when the API was deployed this run>
	if [ "$WITH_API" = "1" ]; then printf '%s' "$1"; else state_get PREVIOUS_API_IMAGE; fi
}

# Smoke test: the health endpoint plus the routes that exercise the vercel.json
# parity rules (homepage identity, shell path, static asset, proxy redirect, external
# redirect).
smoke() {
	local base="http://127.0.0.1:$WEB_HOST_PORT"
	local failures=0
	check() { # <expected> <path>
		local got
		got=$(http_code "$base$2")
		if [ "$got" = "$1" ]; then
			log "  ok   $got $2"
		else
			log "  FAIL expected $1, got $got for $2"
			failures=$((failures + 1))
		fi
	}
	# <path> <needle> / <path> <needle>: the body must contain / must not contain the
	# needle. The needles are ASCII-only on purpose — the titles they come from carry an
	# em dash, and the deploy host's locale is not guaranteed UTF-8.
	body_has() {
		if curl -sS --max-time 10 "$base$1" 2>/dev/null | grep -qF -- "$2"; then
			log "  ok   body has \"$2\" at $1"
		else
			log "  FAIL body missing \"$2\" at $1"
			failures=$((failures + 1))
		fi
	}
	body_lacks() {
		if curl -sS --max-time 10 "$base$1" 2>/dev/null | grep -qF -- "$2"; then
			log "  FAIL body unexpectedly has \"$2\" at $1"
			failures=$((failures + 1))
		else
			log "  ok   body lacks \"$2\" at $1"
		fi
	}
	check 200 "$HEALTH_PATH"
	check 200 /
	# Homepage identity (TASK-DB-0084): `/` must BE the cinematic journey, not the site
	# shell. Vercel and Caddy evaluate rewrites *after* the filesystem, so no rule can
	# change what `/` serves — the swap is done at build time and this is the check that
	# proves it happened. The shell's title carries "Fullstack Design Engineer" and the
	# journey's does not, so the pair of body checks below pins the two documents apart.
	body_lacks / "Fullstack Design Engineer"
	check 200 /shell/index.html
	body_has /shell/index.html "Fullstack Design Engineer"
	check 200 /research/papers/db-r-2026-010
	check 200 /robots.txt
	# A journey scene plate, now served from the site root (the journey's assets land
	# beside the shell's after the swap).
	check 200 /plate-arrival.png
	# The dashboard's canonical path, and the old /ire/app path redirecting to it.
	check 200 /ire
	check 301 /ire/app
	# The journey's retired path permanently redirects to the homepage it became.
	check 308 /version-2
	check 308 /ai-for-good
	check 307 /studyos
	return "$failures"
}

# End-to-end check that the Caddy `/api/*` rule actually reaches the API container and
# that the API can read its data layer. /health only proves the Node process is up, so
# this is the check that would have caught the original 502. A gateway status (502/503/
# 504) means the proxy rule is broken — fatal, like a smoke failure. A 5xx from the API
# itself (500) is a data-layer/secrets problem and only warns: a transient Octo blip
# should not roll back an otherwise-good web deploy.
api_content_smoke() {
	[ "$WITH_API" = "1" ] || return 0
	local got
	got=$(http_code "http://127.0.0.1:$WEB_HOST_PORT/api/public/blogs")
	case "$got" in
		200)
			log "  ok   200 /api/public/blogs (caddy proxy + data layer)"
			return 0 ;;
		502|503|504)
			log "  FAIL $got /api/public/blogs — the Caddy /api/* proxy is not reaching the api container"
			return 1 ;;
		*)
			log "  WARN /api/public/blogs returned $got — the api is up but not serving content; check its data-layer secrets in $API_ENV_FILE"
			return 0 ;;
	esac
}

wait_healthy() {
	local deadline=$((SECONDS + HEALTH_TIMEOUT))
	while [ "$SECONDS" -lt "$deadline" ]; do
		if [ "$(http_code "http://127.0.0.1:$WEB_HOST_PORT$HEALTH_PATH")" = "200" ]; then
			return 0
		fi
		sleep 2
	done
	return 1
}

# The API image runs the same server as Railway; /health answers without secrets.
wait_api_healthy() {
	local deadline=$((SECONDS + API_HEALTH_TIMEOUT))
	while [ "$SECONDS" -lt "$deadline" ]; do
		if [ "$(http_code "http://127.0.0.1:$API_HOST_PORT$API_HEALTH_PATH")" = "200" ]; then
			return 0
		fi
		sleep 2
	done
	return 1
}

# ---------------------------------------------------------------------------- deploy
log "=== deploy start (ref=$REF, repo=$REPO_DIR, port=$WEB_HOST_PORT, api=$WITH_API, edge=$WITH_EDGE) ==="

if [ "$DO_PULL" = "1" ]; then
	log "fetching origin"
	git -C "$REPO_DIR" fetch --prune origin
fi
SHA=$(git -C "$REPO_DIR" rev-parse --verify "$REF^{commit}") || die "cannot resolve ref $REF"
SHORT=$(git -C "$REPO_DIR" rev-parse --short=12 "$SHA")
log "resolved $REF -> $SHORT"

PREVIOUS_IMAGE=$(docker inspect -f '{{.Config.Image}}' "$CONTAINER" 2>/dev/null || true)
[ -n "$PREVIOUS_IMAGE" ] || PREVIOUS_IMAGE=$(state_get CURRENT_IMAGE)
log "previous web image: ${PREVIOUS_IMAGE:-<none>}"

PREVIOUS_API_IMAGE=""
if [ "$WITH_API" = "1" ]; then
	PREVIOUS_API_IMAGE=$(docker inspect -f '{{.Config.Image}}' "$API_CONTAINER" 2>/dev/null || true)
	[ -n "$PREVIOUS_API_IMAGE" ] || PREVIOUS_API_IMAGE=$(state_get CURRENT_API_IMAGE)
	log "previous api image: ${PREVIOUS_API_IMAGE:-<none>}"
fi

NEW_IMAGE="$IMAGE_REPO:$SHORT-$(date -u +%Y%m%dT%H%M%SZ)"
NEW_API_IMAGE=""

log "checking out $SHORT (detached)"
git -C "$REPO_DIR" checkout --force --detach "$SHA" >/dev/null 2>&1 || die "checkout failed"

# The checkout above rewrote THIS file. Bash reads a script incrementally, so continuing
# would run the *outgoing* revision's `smoke()` against the *incoming* container — the
# trap that once rolled a routing change back on its own smoke line (TASK-DB-0084).
# Re-exec the freshly checked-out script once, before anything is built, so the new
# revision's own checks run. `exec` keeps our pid, so the lock stays ours and the first
# pass's EXIT trap is re-armed by the branch above; DEPLOY_REEXEC is exported into the
# child so this block does not loop.
if [ "${DEPLOY_REEXEC:-0}" != "1" ]; then
	log "re-executing the checked-out revision's deploy script"
	DEPLOY_REEXEC=1 exec "$SELF" "$@"
fi

log "building $NEW_IMAGE"
if ! DESIGN_BAKERY_IMAGE="$NEW_IMAGE" compose build --pull web; then
	die "build failed for $SHORT — nothing was swapped, still running ${PREVIOUS_IMAGE:-<none>}"
fi
docker tag "$NEW_IMAGE" "$IMAGE_REPO:$SHORT"

if [ "$WITH_API" = "1" ]; then
	NEW_API_IMAGE="$API_IMAGE_REPO:$SHORT-$(date -u +%Y%m%dT%H%M%SZ)"
	log "building $NEW_API_IMAGE"
	if ! DESIGN_BAKERY_API_IMAGE="$NEW_API_IMAGE" compose build --pull api; then
		die "api build failed for $SHORT — nothing was swapped, still running ${PREVIOUS_IMAGE:-<none>}"
	fi
	docker tag "$NEW_API_IMAGE" "$API_IMAGE_REPO:$SHORT"
fi

log "starting container with $NEW_IMAGE"
DESIGN_BAKERY_IMAGE="$NEW_IMAGE" compose up -d --no-deps web

API_HEALTHY=1
if [ "$WITH_API" = "1" ]; then
	log "starting api container with $NEW_API_IMAGE"
	DESIGN_BAKERY_API_IMAGE="$NEW_API_IMAGE" compose up -d --no-deps api
	if wait_api_healthy; then
		log "api health endpoint is up"
	else
		log "api health check timed out after ${API_HEALTH_TIMEOUT}s"
		API_HEALTHY=0
	fi
fi

if [ "$API_HEALTHY" = "1" ] && wait_healthy; then
	log "health endpoint is up; running smoke test"
	if smoke; then
		if api_content_smoke; then
			state_write "$SHA" "$NEW_IMAGE" "$PREVIOUS_IMAGE" "$(api_state_current "$NEW_API_IMAGE")" "$(api_state_previous "$PREVIOUS_API_IMAGE")"
			log "deploy OK: $SHORT -> $NEW_IMAGE"
			log "rollback with: deploy/gravebuster/rollback.sh"
			exit 0
		fi
		log "the /api/* proxy check failed"
	else
		log "smoke test failed"
	fi
elif [ "$API_HEALTHY" = "0" ]; then
	log "deploy failed: the api container did not become healthy"
else
	log "health check timed out after ${HEALTH_TIMEOUT}s"
fi

# -------------------------------------------------------------------- auto-rollback
if [ "$AUTO_ROLLBACK" = "1" ] && [ -n "$PREVIOUS_IMAGE" ] && docker image inspect "$PREVIOUS_IMAGE" >/dev/null 2>&1; then
	log "rolling back to $PREVIOUS_IMAGE"
	DESIGN_BAKERY_IMAGE="$PREVIOUS_IMAGE" compose up -d --no-deps web
	if [ "$WITH_API" = "1" ] && [ -n "$PREVIOUS_API_IMAGE" ] && docker image inspect "$PREVIOUS_API_IMAGE" >/dev/null 2>&1; then
		log "rolling api back to $PREVIOUS_API_IMAGE"
		DESIGN_BAKERY_API_IMAGE="$PREVIOUS_API_IMAGE" compose up -d --no-deps api
	fi
	if wait_healthy; then
		log "rollback healthy; site is serving $PREVIOUS_IMAGE"
	else
		log "rollback did NOT come up healthy — manual attention required"
	fi
	state_write "$(state_get SHA)" "$PREVIOUS_IMAGE" "$(state_get PREVIOUS_IMAGE)" "$(api_state_current "$PREVIOUS_API_IMAGE")" "$(api_state_previous "$(state_get PREVIOUS_API_IMAGE)")"
else
	log "no usable previous image to roll back to"
fi
exit 1
