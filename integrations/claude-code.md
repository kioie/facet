# Facet + Claude Code

## Install

```bash
claude mcp add facet -- npx -y facet mcp
```

Or globally:
```bash
npm install -g facet
claude mcp add facet -- facet mcp
```

## Verify

```bash
claude mcp list
# should show: facet
```

## Agent loop

Once Facet is registered, Claude Code will see the three MCP tools. The recommended usage in your CLAUDE.md or project rules:

```markdown
At session start:
1. Call facet_register_manifest with all available tools
2. Before each subtask, call facet_plan_surface with the current task and budget=6000
3. Use only the tools in selected[] for this subtask
4. Re-plan when the task domain changes
```

## Example CLAUDE.md snippet

```markdown
## Tool routing

Use Facet to route tools by task before loading all schemas:

1. `facet_register_manifest(tools=[...])` — once at session start
2. `facet_plan_surface(task="your task here", budget=6000)` — before each subtask
3. Use only `selected[]` tools for this subtask; re-plan when task shifts

Budget guide: bugfix=3000-5000, feature=5000-7000, multi-domain=7000-10000
```

## Zero-install for one-off use

```bash
npx facet plan "fix login validation" --manifest ./tools.json --budget 4000
```
