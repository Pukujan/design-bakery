#!/usr/bin/env bash
# CodeGraph smoke eval — proves the local index can resolve real project symbols.
# Run from repo root: bash scripts/codegraph-eval.sh
# Requires: codegraph CLI on PATH (npx @colbymchenry/codegraph or global install)

set -euo pipefail
cd "$(dirname "$0")/.."

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass=0
fail=0

require_cmd() {
  if ! command -v codegraph >/dev/null 2>&1; then
    echo -e "${RED}codegraph CLI not found.${NC} Install: npx @colbymchenry/codegraph"
    exit 1
  fi
}

assert_query() {
  local name="$1"
  local expect_path="$2"
  local json
  json=$(codegraph query "$name" -l 3 -j 2>/dev/null || echo "[]")
  if echo "$json" | grep -q "$expect_path"; then
    echo -e "${GREEN}PASS${NC} query \"$name\" → $expect_path"
    pass=$((pass + 1))
  else
    echo -e "${RED}FAIL${NC} query \"$name\" — expected path containing: $expect_path"
    echo "  Got: $(echo "$json" | head -c 200)"
    fail=$((fail + 1))
  fi
}

require_cmd

echo "=== CodeGraph eval (design-bakery) ==="
echo ""

if [[ ! -f .codegraph/codegraph.db ]]; then
  echo -e "${YELLOW}No .codegraph/codegraph.db — running init index...${NC}"
  codegraph init -i
else
  echo "DB: .codegraph/codegraph.db ($(du -h .codegraph/codegraph.db | cut -f1))"
fi

echo ""
codegraph status 2>&1 | sed -n '1,12p'
echo ""

# Symbol → expected file (proves AST index, not just full-text)
assert_query "BlogPostHead" "BlogDetailPage/BlogPostHead.tsx"
assert_query "invokeBlogAgent" "agent/agentClient.ts"
assert_query "runSeoAudit" "agent/seo/seoRules.ts"
assert_query "BlogContactFab" "components/BlogContactFab.tsx"
assert_query "MermaidDiagram" "extras/design changes to blog details/app/components/BlogDetailPage.tsx"

echo ""
if command -v rg >/dev/null 2>&1; then
  callers=$(rg -l "BlogPostHead" --glob '*.tsx' 2>/dev/null | head -5 | tr '\n' ' ')
  echo -e "${GREEN}INFO${NC} ripgrep callers of BlogPostHead: $callers"
  echo "  (CodeGraph MCP codegraph_callers should agree in Cursor when MCP is enabled)"
fi

echo ""
if [[ $fail -eq 0 ]]; then
  echo -e "${GREEN}All $pass checks passed.${NC} CodeGraph CLI index is working."
  echo ""
  echo "MCP (Cursor): ~/.cursor/mcp.json should list codegraph serve."
  echo "  Restart Cursor → Settings → MCP → enable codegraph"
  echo "  In chat, ask: \"Use codegraph_search for BlogPostHead\""
  exit 0
else
  echo -e "${RED}$fail failed, $pass passed.${NC} Try: codegraph index"
  exit 1
fi
