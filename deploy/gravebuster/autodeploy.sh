#!/usr/bin/env bash
#
# Pull-based auto-deploy for design-bakery (TASK-DB-0055).
#
# gravebuster is not publicly reachable, so there is no GitHub webhook: this script
# polls origin/main and deploys when the SHA moves. It is meant to run from a systemd
# timer (deploy/gravebuster/systemd/) — see docs/self-hosting.md, "Auto-deploy".
# It is implemented but NOT enabled.
#
#   deploy/gravebuster/autodeploy.sh              # deploy if origin/main moved
#   deploy/gravebuster/autodeploy.sh --dry-run    # report what would happen
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_DIR=${DEPLOY_REPO_DIR:-$(cd "$SCRIPT_DIR/../.." && pwd)}
STATE_FILE=${DEPLOY_STATE_FILE:-$SCRIPT_DIR/.deploy-state}
LOG_FILE=${DEPLOY_LOG_FILE:-$SCRIPT_DIR/autodeploy.log}
REMOTE=${AUTODEPLOY_REMOTE:-origin}
BRANCH=${AUTODEPLOY_BRANCH:-main}
DRY_RUN=0

log() { printf '[%s] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*" | tee -a "$LOG_FILE"; }
die() { log "ERROR: $*"; exit 1; }

while [ $# -gt 0 ]; do
	case "$1" in
		--dry-run) DRY_RUN=1; shift ;;
		--branch) BRANCH=${2:?--branch needs a value}; shift 2 ;;
		-h|--help) sed -n '2,13p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 0 ;;
		*) die "unknown argument: $1" ;;
	esac
done

state_get() {
	[ -f "$STATE_FILE" ] || return 0
	sed -n "s/^$1=//p" "$STATE_FILE" | tail -1
}

[ -d "$REPO_DIR/.git" ] || die "no git checkout at $REPO_DIR"

git -C "$REPO_DIR" fetch --prune "$REMOTE" "$BRANCH" >/dev/null
REMOTE_SHA=$(git -C "$REPO_DIR" rev-parse "$REMOTE/$BRANCH^{commit}") || die "cannot resolve $REMOTE/$BRANCH"
DEPLOYED_SHA=$(state_get SHA)

if [ "$REMOTE_SHA" = "$DEPLOYED_SHA" ]; then
	log "up to date ($REMOTE/$BRANCH at $(git -C "$REPO_DIR" rev-parse --short=12 "$REMOTE_SHA"))"
	exit 0
fi

log "new commit on $REMOTE/$BRANCH: $(git -C "$REPO_DIR" rev-parse --short=12 "$REMOTE_SHA") (deployed: ${DEPLOYED_SHA:0:12})"
if [ "$DRY_RUN" = "1" ]; then
	log "dry run — would run deploy.sh --no-pull --ref $REMOTE_SHA"
	exit 0
fi

exec "$SCRIPT_DIR/deploy.sh" --no-pull --ref "$REMOTE_SHA"
