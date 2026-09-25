#!/usr/bin/env bash
#
# Deploy design-bakery on gravebuster (TASK-DB-0055).
#
# Pulls a git ref into the deploy checkout, builds a new tagged image, swaps the
# container, smoke-checks the running site and records the previous image tag so
# rollback.sh can put it back. Nothing here touches the Cloudflare Tunnel or the
# study-os stack.
#
# Usage (on gravebuster):
#   deploy/gravebuster/deploy.sh                     # deploy origin/main
#   deploy/gravebuster/deploy.sh --ref <sha|branch>   # deploy something else
#   deploy/gravebuster/deploy.sh --with-edge          # also join the tunnel network
#   deploy/gravebuster/deploy.sh --no-pull            # use the local checkout as-is
#
# Config comes from deploy/gravebuster/.env (see .env.example) and/or the environment.
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_DIR=${DEPLOY_REPO_DIR:-$(cd "$SCRIPT_DIR/../.." && pwd)}
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"
EDGE_OVERLAY="$SCRIPT_DIR/docker-compose.edge.yml"
STATE_FILE=${DEPLOY_STATE_FILE:-$SCRIPT_DIR/.deploy-state}
LOG_FILE=${DEPLOY_LOG_FILE:-$SCRIPT_DIR/deploy.log}
IMAGE_REPO=${DESIGN_BAKERY_IMAGE_REPO:-design-bakery-web}
CONTAINER=${DESIGN_BAKERY_CONTAINER:-design-bakery-web}
HEALTH_TIMEOUT=${HEALTH_TIMEOUT:-90}
HEALTH_PATH=${HEALTH_PATH:-/healthz}

REF=origin/main
DO_PULL=1
WITH_EDGE=0
AUTO_ROLLBACK=1

log() { printf '[%s] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*" | tee -a "$LOG_FILE"; }
die() { log "ERROR: $*"; exit 1; }

usage() {
	sed -n '2,20p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
	exit "${1:-0}"
}

while [ $# -gt 0 ]; do
	case "$1" in
		--ref) REF=${2:?--ref needs a value}; shift 2 ;;
		--no-pull) DO_PULL=0; shift ;;
		--with-edge) WITH_EDGE=1; shift ;;
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

COMPOSE=(docker compose -f "$COMPOSE_FILE")
if [ "$WITH_EDGE" = "1" ]; then
	COMPOSE+=(-f "$EDGE_OVERLAY")
fi
compose() { "${COMPOSE[@]}" "$@"; }

[ -d "$REPO_DIR/.git" ] || die "no git checkout at $REPO_DIR"
command -v docker >/dev/null || die "docker not found"
command -v curl >/dev/null || die "curl not found"

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
		echo "DEPLOYED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
	} >"$tmp"
	mv "$tmp" "$STATE_FILE"
}

http_code() {
	curl -sS -o /dev/null -w '%{http_code}' --max-time 10 "$1" 2>/dev/null || echo "000"
}

# Smoke test: the health endpoint plus the routes that exercise the vercel.json
# parity rules (SPA fallback, static asset, proxy redirect, external redirect).
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
	check 200 "$HEALTH_PATH"
	check 200 /
	check 200 /research/papers/db-r-2026-010
	check 200 /robots.txt
	check 308 /ai-for-good
	check 307 /studyos
	return "$failures"
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

# ---------------------------------------------------------------------------- deploy
log "=== deploy start (ref=$REF, repo=$REPO_DIR, port=$WEB_HOST_PORT, edge=$WITH_EDGE) ==="

if [ "$DO_PULL" = "1" ]; then
	log "fetching origin"
	git -C "$REPO_DIR" fetch --prune origin
fi
SHA=$(git -C "$REPO_DIR" rev-parse --verify "$REF^{commit}") || die "cannot resolve ref $REF"
SHORT=$(git -C "$REPO_DIR" rev-parse --short=12 "$SHA")
log "resolved $REF -> $SHORT"

PREVIOUS_IMAGE=$(docker inspect -f '{{.Config.Image}}' "$CONTAINER" 2>/dev/null || true)
[ -n "$PREVIOUS_IMAGE" ] || PREVIOUS_IMAGE=$(state_get CURRENT_IMAGE)
log "previous image: ${PREVIOUS_IMAGE:-<none>}"

NEW_IMAGE="$IMAGE_REPO:$SHORT-$(date -u +%Y%m%dT%H%M%SZ)"

log "checking out $SHORT (detached)"
git -C "$REPO_DIR" checkout --force --detach "$SHA" >/dev/null 2>&1 || die "checkout failed"

log "building $NEW_IMAGE"
if ! DESIGN_BAKERY_IMAGE="$NEW_IMAGE" compose build --pull web; then
	die "build failed for $SHORT — nothing was swapped, still running ${PREVIOUS_IMAGE:-<none>}"
fi
docker tag "$NEW_IMAGE" "$IMAGE_REPO:$SHORT"

log "starting container with $NEW_IMAGE"
DESIGN_BAKERY_IMAGE="$NEW_IMAGE" compose up -d --no-deps web

if wait_healthy; then
	log "health endpoint is up; running smoke test"
	if smoke; then
		state_write "$SHA" "$NEW_IMAGE" "$PREVIOUS_IMAGE"
		log "deploy OK: $SHORT -> $NEW_IMAGE"
		log "rollback with: deploy/gravebuster/rollback.sh"
		exit 0
	fi
	log "smoke test failed"
else
	log "health check timed out after ${HEALTH_TIMEOUT}s"
fi

# -------------------------------------------------------------------- auto-rollback
if [ "$AUTO_ROLLBACK" = "1" ] && [ -n "$PREVIOUS_IMAGE" ] && docker image inspect "$PREVIOUS_IMAGE" >/dev/null 2>&1; then
	log "rolling back to $PREVIOUS_IMAGE"
	DESIGN_BAKERY_IMAGE="$PREVIOUS_IMAGE" compose up -d --no-deps web
	if wait_healthy; then
		log "rollback healthy; site is serving $PREVIOUS_IMAGE"
	else
		log "rollback did NOT come up healthy — manual attention required"
	fi
	state_write "$(state_get SHA)" "$PREVIOUS_IMAGE" "$(state_get PREVIOUS_IMAGE)"
else
	log "no usable previous image to roll back to"
fi
exit 1
