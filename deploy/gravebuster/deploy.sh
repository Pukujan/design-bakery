#!/usr/bin/env bash
# The deploy kit moved to deploy/vps/. This stand-in covers the switch-over on the VPS:
#
# The first deploy after the move is started by the old deploy/gravebuster/deploy.sh. It
# checks out the new commit and then re-runs itself from the same path, which is now
# this file. Here the host's own files (secrets, deploy record, the lock the old script
# holds, logs) move to deploy/vps/, and the real script takes over with the lock intact.
#
# Remove this folder once Komodo's design-bakery-vps stack runs deploy/vps/ and one
# deploy has gone through it.
set -euo pipefail

OLD=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
NEW=$(cd "$OLD/../vps" && pwd)

shopt -s nullglob dotglob
for item in "$OLD"/.env "$OLD"/.env.api "$OLD"/.env.api.bak* "$OLD"/.deploy-state "$OLD"/.deploy.lock "$OLD"/*.log; do
	name=$(basename "$item")
	if [ -e "$NEW/$name" ]; then
		echo "deploy/gravebuster: keeping deploy/vps/$name; the old copy stays in $OLD" >&2
	else
		mv "$item" "$NEW/$name"
		echo "deploy/gravebuster: moved $name to deploy/vps/" >&2
	fi
done

exec "$NEW/deploy.sh" "$@"
