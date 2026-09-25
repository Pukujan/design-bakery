#!/usr/bin/env bash
#
# Roll design-bakery back to the previously deployed image on gravebuster.
#
# deploy.sh keeps the previous image tag in deploy/gravebuster/.deploy-state and never
# deletes old images, so a rollback is just an image swap — no rebuild.
#
# Usage (on gravebuster):
#   deploy/gravebuster/rollback.sh                  # back to PREVIOUS_IMAGE
#   deploy/gravebuster/rollback.sh --image <tag>    # to a specific tag
#   deploy/gravebuster/rollback.sh --list           # show deployed images
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
TARGET_IMAGE=""
WITH_EDGE=0

log() { printf '[%s] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*" | tee -a "$LOG_FILE"; }
die() { log "ERROR: $*"; exit 1; }

usage() { sed -n '2,14p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit "${1:-0}"; }

while [ $# -gt 0 ]; do
	case "$1" in
		--image) TARGET_IMAGE=${2:?--image needs a tag}; shift 2 ;;
		--with-edge) WITH_EDGE=1; shift ;;
		--port) WEB_HOST_PORT=${2:?--port needs a value}; shift 2 ;;
		--list) docker images --format '{{.Repository}}:{{.Tag}}\t{{.CreatedSince}}\t{{.Size}}' "$IMAGE_REPO"; exit 0 ;;
		-h|--help) usage 0 ;;
		*) die "unknown argument: $1 (try --help)" ;;
	esac
done

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
		echo "ROLLED_BACK_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
	} >"$tmp"
	mv "$tmp" "$STATE_FILE"
}

http_code() {
	curl -sS -o /dev/null -w '%{http_code}' --max-time 10 "$1" 2>/dev/null || echo "000"
}

CURRENT_IMAGE=$(docker inspect -f '{{.Config.Image}}' "$CONTAINER" 2>/dev/null || true)
[ -n "$CURRENT_IMAGE" ] || CURRENT_IMAGE=$(state_get CURRENT_IMAGE)
[ -n "$TARGET_IMAGE" ] || TARGET_IMAGE=$(state_get PREVIOUS_IMAGE)

[ -n "$TARGET_IMAGE" ] || die "no previous image recorded in $STATE_FILE — pass --image <tag>"
docker image inspect "$TARGET_IMAGE" >/dev/null 2>&1 || die "image $TARGET_IMAGE is not on this host (try --list)"
[ "$TARGET_IMAGE" != "$CURRENT_IMAGE" ] || die "already running $TARGET_IMAGE"

log "=== rollback: $CURRENT_IMAGE -> $TARGET_IMAGE ==="
DESIGN_BAKERY_IMAGE="$TARGET_IMAGE" compose up -d --no-deps web

deadline=$((SECONDS + HEALTH_TIMEOUT))
while [ "$SECONDS" -lt "$deadline" ]; do
	if [ "$(http_code "http://127.0.0.1:$WEB_HOST_PORT$HEALTH_PATH")" = "200" ]; then
		# Swap the tags so a second rollback returns to the newer image.
		state_write "$(state_get SHA)" "$TARGET_IMAGE" "$CURRENT_IMAGE"
		log "rollback OK: now serving $TARGET_IMAGE"
		log "re-deploy the newer build with: deploy/gravebuster/deploy.sh --no-pull --ref $(state_get SHA)"
		exit 0
	fi
	sleep 2
done

die "rolled-back container is not healthy — check: docker logs $CONTAINER"
