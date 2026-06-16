# Facet

**Task-aware MCP tool surface for coding agents.**

Facet helps agents spend context on tools that matter for the current task — not every MCP schema loaded at session start.

## Install

```bash
npm install -g facet
facet doctor
facet init
```

## Quick start

```bash
# Audit a tool manifest
facet audit ./tools.json

# Plan a routed surface for a task
facet plan "fix login validation bug" --manifest ./tools.json --budget 6000

# Cursor MCP integration
facet cursor
```

## MCP server

Add to Cursor, Claude Code, or any MCP host:

```json
{
  "mcpServers": {
    "facet": {
      "command": "npx",
      "args": ["-y", "facet", "mcp"]
    }
  }
}
```

### Tools exposed to agents

| Tool | Purpose |
|------|---------|
| `facet_audit_tools` | Measure token cost of tool definitions |
| `facet_plan_surface` | Select tools for a task under a budget |
| `facet_register_manifest` | Cache manifest for repeated planning |

## How it works

1. **Cluster** — group tools by capability (filesystem, git, web, data, …)
2. **Score** — rank tools against the task string
3. **Distill** — compact JSON schemas (shorter descriptions, trimmed properties)
4. **Route** — pick a budget-feasible subset with pinned/floor tools

## Profiles

`facet init` writes `facet.json` with `coding` and `review` profiles. Use `--profile coding` on `facet plan`.

## Evaluation

```bash
npm run eval
```

## For AI agents

See [llms.txt](./llms.txt) and [AGENTS.md](./AGENTS.md) for machine-readable integration guidance.

## License

MIT
