#!/usr/bin/env bash
#
# Roll design-bakery back to the previously deployed image on gravebuster.
#
# deploy.sh keeps the previous image tag in deploy/gravebuster/.deploy-state and never
# deletes old images, so a rollback is just an image swap — no rebuild. The API
# container is swapped back with the web container under the same enable rule.
#
# Usage (on gravebuster):
#   deploy/gravebuster/rollback.sh                  # back to PREVIOUS_IMAGE
#   deploy/gravebuster/rollback.sh --image <tag>    # to a specific tag
#   deploy/gravebuster/rollback.sh --with-edge      # keep the tunnel network attached
#   deploy/gravebuster/rollback.sh --with-api       # also swap the API container
#   deploy/gravebuster/rollback.sh --no-api         # web only, even if the API is enabled
#   deploy/gravebuster/rollback.sh --list           # show deployed images
#
# Only one deploy or rollback runs at a time: each takes an exclusive lock on
# deploy/gravebuster/.deploy.lock and exits at once if another already holds it.
#
# The API container is rolled back when WITH_API=1 or deploy/gravebuster/.env.api
# exists; --with-api / --no-api override that for a single run (see deploy.sh).
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_DIR=${DEPLOY_REPO_DIR:-$(cd "$SCRIPT_DIR/../.." && pwd)}
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"
EDGE_OVERLAY="$SCRIPT_DIR/docker-compose.edge.yml"
API_ENV_FILE="$SCRIPT_DIR/.env.api"
STATE_FILE=${DEPLOY_STATE_FILE:-$SCRIPT_DIR/.deploy-state}
LOG_FILE=${DEPLOY_LOG_FILE:-$SCRIPT_DIR/deploy.log}
LOCK_FILE=${DEPLOY_LOCK_FILE:-$SCRIPT_DIR/.deploy.lock}
IMAGE_REPO=${DESIGN_BAKERY_IMAGE_REPO:-design-bakery-web}
CONTAINER=${DESIGN_BAKERY_CONTAINER:-design-bakery-web}
API_CONTAINER=${DESIGN_BAKERY_API_CONTAINER:-design-bakery-api}
HEALTH_TIMEOUT=${HEALTH_TIMEOUT:-90}
HEALTH_PATH=${HEALTH_PATH:-/healthz}
API_HEALTH_PATH=${API_HEALTH_PATH:-/health}
TARGET_IMAGE=""
# Empty so deploy/gravebuster/.env (sourced below) can set it; --with-edge / --no-edge
# override for a single run. A sticky WITH_EDGE=1 keeps a rollback from dropping the
# tunnel network (see deploy.sh).
WITH_EDGE=""
WITH_EDGE_FLAG=""
# Empty for the same reason; resolved after .env is sourced.
WITH_API=""
WITH_API_FLAG=""

log() { printf '[%s] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*" | tee -a "$LOG_FILE"; }
die() { log "ERROR: $*"; exit 1; }

usage() { sed -n '2,21p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit "${1:-0}"; }

while [ $# -gt 0 ]; do
	case "$1" in
		--image) TARGET_IMAGE=${2:?--image needs a tag}; shift 2 ;;
		--with-edge) WITH_EDGE_FLAG=1; shift ;;
		--no-edge) WITH_EDGE_FLAG=0; shift ;;
		--with-api) WITH_API_FLAG=1; shift ;;
		--no-api) WITH_API_FLAG=0; shift ;;
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
API_HOST_PORT=${API_HOST_PORT:-8789}

# See deploy.sh: the tunnel-network attachment is sticky so a rollback does not drop it.
[ -n "$WITH_EDGE_FLAG" ] && WITH_EDGE=$WITH_EDGE_FLAG
WITH_EDGE=${WITH_EDGE:-0}

# Same enable rule as deploy.sh: the API is in play when WITH_API=1, or automatically
# once deploy/gravebuster/.env.api exists. --with-api / --no-api override for a run.
if [ -z "$WITH_API_FLAG" ] && [ -z "$WITH_API" ]; then
	if [ -f "$API_ENV_FILE" ]; then WITH_API=1; else WITH_API=0; fi
fi
[ -n "$WITH_API_FLAG" ] && WITH_API=$WITH_API_FLAG
WITH_API=${WITH_API:-0}

COMPOSE=(docker compose -f "$COMPOSE_FILE")
if [ "$WITH_EDGE" = "1" ]; then
	COMPOSE+=(-f "$EDGE_OVERLAY")
fi
compose() { "${COMPOSE[@]}" "$@"; }

# Same lock as deploy.sh: a rollback must not interleave with a deploy's container swap.
# Non-blocking — a second caller exits at once instead of queueing.
exec 9>"$LOCK_FILE"
flock -n 9 || die "another deploy or rollback is running (lock: $LOCK_FILE)"

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
		echo "ROLLED_BACK_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
	} >"$tmp"
	mv "$tmp" "$STATE_FILE"
}

http_code() {
	curl -sS -o /dev/null -w '%{http_code}' --max-time 10 "$1" 2>/dev/null || echo "000"
}

wait_api_healthy() {
	local deadline=$((SECONDS + HEALTH_TIMEOUT))
	while [ "$SECONDS" -lt "$deadline" ]; do
		if [ "$(http_code "http://127.0.0.1:$API_HOST_PORT$API_HEALTH_PATH")" = "200" ]; then
			return 0
		fi
		sleep 2
	done
	return 1
}

CURRENT_IMAGE=$(docker inspect -f '{{.Config.Image}}' "$CONTAINER" 2>/dev/null || true)
[ -n "$CURRENT_IMAGE" ] || CURRENT_IMAGE=$(state_get CURRENT_IMAGE)
[ -n "$TARGET_IMAGE" ] || TARGET_IMAGE=$(state_get PREVIOUS_IMAGE)

# The API rolls back with the web container: its target is the api image recorded
# before the last deploy. Empty when the API was never deployed — then it is skipped.
CURRENT_API_IMAGE=""
TARGET_API_IMAGE=""
if [ "$WITH_API" = "1" ]; then
	CURRENT_API_IMAGE=$(docker inspect -f '{{.Config.Image}}' "$API_CONTAINER" 2>/dev/null || true)
	[ -n "$CURRENT_API_IMAGE" ] || CURRENT_API_IMAGE=$(state_get CURRENT_API_IMAGE)
	TARGET_API_IMAGE=$(state_get PREVIOUS_API_IMAGE)
fi

[ -n "$TARGET_IMAGE" ] || die "no previous image recorded in $STATE_FILE — pass --image <tag>"
docker image inspect "$TARGET_IMAGE" >/dev/null 2>&1 || die "image $TARGET_IMAGE is not on this host (try --list)"
[ "$TARGET_IMAGE" != "$CURRENT_IMAGE" ] || die "already running $TARGET_IMAGE"

log "=== rollback: $CURRENT_IMAGE -> $TARGET_IMAGE ==="
DESIGN_BAKERY_IMAGE="$TARGET_IMAGE" compose up -d --no-deps web

if [ "$WITH_API" = "1" ] && [ -n "$TARGET_API_IMAGE" ] && docker image inspect "$TARGET_API_IMAGE" >/dev/null 2>&1; then
	log "rolling api back: $CURRENT_API_IMAGE -> $TARGET_API_IMAGE"
	DESIGN_BAKERY_API_IMAGE="$TARGET_API_IMAGE" compose up -d --no-deps api
	if wait_api_healthy; then
		log "rolled-back api health endpoint is up"
	else
		log "rolled-back api is not healthy — check: docker logs $API_CONTAINER"
	fi
fi

deadline=$((SECONDS + HEALTH_TIMEOUT))
while [ "$SECONDS" -lt "$deadline" ]; do
	if [ "$(http_code "http://127.0.0.1:$WEB_HOST_PORT$HEALTH_PATH")" = "200" ]; then
		# Swap the tags so a second rollback returns to the newer image. A web-only
		# rollback (WITH_API=0) leaves the recorded API images untouched.
		if [ "$WITH_API" = "1" ]; then
			state_write "$(state_get SHA)" "$TARGET_IMAGE" "$CURRENT_IMAGE" "$TARGET_API_IMAGE" "$CURRENT_API_IMAGE"
		else
			state_write "$(state_get SHA)" "$TARGET_IMAGE" "$CURRENT_IMAGE" "$(state_get CURRENT_API_IMAGE)" "$(state_get PREVIOUS_API_IMAGE)"
		fi
		log "rollback OK: now serving $TARGET_IMAGE"
		log "re-deploy the newer build with: deploy/gravebuster/deploy.sh --no-pull --ref $(state_get SHA)"
		exit 0
	fi
	sleep 2
done

die "rolled-back container is not healthy — check: docker logs $CONTAINER"
