#!/usr/bin/env bash
# Cursor sessionStart — background CodeGraph sync (stdin JSON ignored).
set -euo pipefail
cat >/dev/null || true

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

if [[ -f .codegraph/config.json ]]; then
  node scripts/codegraph-sync.mjs --quiet &
fi

exit 0
