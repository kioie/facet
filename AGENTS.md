# AGENTS.md — Facet integration playbook

## Purpose

Facet reduces MCP tool-schema bloat by routing a **task-aware subset** of tools under a token budget.

## Recommended workflow

1. On session start or task change, call `facet_register_manifest` with the full tool list (once).
2. Before each major subtask, call `facet_plan_surface` with the current `task` string.
3. Use only `selected` tools for the next agent turns unless the task shifts.
4. Run `facet_audit_tools` when adding new MCP servers to quantify baseline cost.

## Cursor setup

Run `facet cursor` and merge the JSON into Cursor MCP settings, or add:

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

## Claude Code setup

```bash
claude mcp add facet -- npx -y facet mcp
```

## Budget guidance

| Session type | Suggested budget |
|--------------|------------------|
| Focused bugfix | 4000–6000 |
| Feature work | 6000–8000 |
| Review / read-only | 3000–4000 |

## Profiles

Initialize with `facet init`, then pass `profile: "coding"` or `profile: "review"` to `facet_plan_surface`.

## Do not

- Silently drop pinned safety tools — add them to `facet.json` `pin` list
- Assume deferred tools are unavailable forever — re-plan when the task changes
