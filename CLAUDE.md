# CLAUDE.md — Facet for Claude Code

This file tells Claude Code how to integrate with Facet, the task-aware MCP tool surface router.

## What Facet does

Facet reduces tool-schema token overhead by routing a task-specific subset of MCP tools to the agent. Instead of loading all 20+ tool schemas on every turn, Facet selects the ~8–12 tools most relevant to the current task.

**Typical savings: 50–65% of tool-schema tokens per subtask.**

## Setup

```bash
claude mcp add facet -- npx -y @kioie/facet mcp
```

## How to use Facet

1. **Register your tools once per session:**
   ```
   Call: facet_register_manifest
   With: { tools: <your full tool list>, id: "session-1" }
   Returns: { manifestId: "session-1", totalTokens: 3210 }
   ```

2. **Before each major subtask, plan the surface:**
   ```
   Call: facet_plan_surface
   With: { task: "fix the login validation bug", manifestId: "session-1", budget: 6000 }
   Returns: { selected: [...8 tools...], deferred: [...15 tools...], savingsPercent: 63.9 }
   ```

3. **Use only the `selected` tools for this subtask.**

4. **Re-plan when the goal shifts significantly.**

## Budget guidelines

| Task type | Budget |
|-----------|--------|
| Focused bugfix | 4,000–6,000 |
| Feature implementation | 6,000–8,000 |
| Code review | 3,000–4,000 |

## Pinning tools

Add safety-critical tools to the `pin` list in `facet.json` so they are always included:

```json
{
  "profiles": [{
    "name": "coding",
    "pin": ["mcp__filesystem__read_file", "mcp__shell__run"],
    "prefer": ["filesystem", "git"],
    "budget": 6000
  }]
}
```

## Audit

To see the token cost breakdown of your current tool manifest:
```
Call: facet_audit_tools
With: { manifestId: "session-1" }
Returns: { totalTokens: 3210, clusters: [{ id: "github", tokens: 356 }, ...] }
```

## More

- Full API reference: [AGENTS.md](./AGENTS.md)
- Routing algorithm: [SPEC.md](./SPEC.md)
- llms.txt: [llms.txt](./llms.txt)
