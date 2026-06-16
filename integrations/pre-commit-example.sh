#!/usr/bin/env bash
# Pre-commit hook: audit Facet tool manifest token budget
#
# Install:
#   cp integrations/pre-commit-example.sh .git/hooks/pre-commit
#   chmod +x .git/hooks/pre-commit
#
# Or with husky:
#   npx husky add .husky/pre-commit "bash integrations/pre-commit-example.sh"

set -e

MANIFEST="tools/mcp-manifest.json"
TOKEN_BUDGET=8000

if [ ! -f "$MANIFEST" ]; then
  exit 0
fi

if ! command -v facet &>/dev/null; then
  echo "facet not found — skipping token audit (install with: npm install -g @kioie/facet)"
  exit 0
fi

TOKENS=$(facet audit "$MANIFEST" | jq '.totalTokens' 2>/dev/null || echo 0)

if [ "$TOKENS" -gt "$TOKEN_BUDGET" ]; then
  echo ""
  echo "❌ Facet token audit failed"
  echo "   Manifest: $TOKENS tokens (budget: $TOKEN_BUDGET)"
  echo "   Run 'facet audit $MANIFEST' for breakdown"
  echo "   Tip: Remove unused tools or tighten schema descriptions"
  echo ""
  exit 1
fi

echo "✓ Facet token audit passed: $TOKENS / $TOKEN_BUDGET tokens"
