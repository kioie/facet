#!/usr/bin/env bash
# Add Facet to Claude Code MCP
# Run: bash integrations/claude-code-setup.sh

set -e

echo "Adding Facet to Claude Code..."
claude mcp add facet -- npx -y facet mcp

echo ""
echo "Done! Facet is now available as an MCP server in Claude Code."
echo ""
echo "To verify:"
echo "  claude mcp list"
echo ""
echo "Quick start in Claude Code:"
echo "  1. Ask: 'call facet_register_manifest with my current tools'"
echo "  2. Before each task: 'call facet_plan_surface with task: <your goal>'"
echo "  3. Use only the returned selected tools for that subtask"
