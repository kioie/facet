# Cursor integration

## Facet MCP server

1. Open **Cursor Settings → MCP**
2. Add server (or run `facet cursor` and paste JSON):

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

3. Restart Cursor

## Agent workflow

Ask the agent to:

1. Call `facet_register_manifest` once with your enabled tool list (optional)
2. Call `facet_plan_surface` with the current task before heavy tool use
3. Use only `selected` tools until the task changes

## Profiles

```bash
facet init
facet plan "review PR diff" --profile review --manifest ./tools.json
```
