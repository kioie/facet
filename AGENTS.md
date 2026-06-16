# AGENTS.md — Facet integration playbook

## Purpose

Facet reduces MCP tool-schema bloat by routing a **task-aware subset** of tools under a token budget.

**Core insight:** MCP tool schemas typically consume 8,000–20,000 tokens at session start — before any user message. Facet fixes this by clustering tools by capability and routing only the subset relevant to the current task.

## Recommended workflow

```
At session start:
1. Call facet_register_manifest(tools) — cache the full tool list once

Before each subtask:
2. Call facet_plan_surface(task, budget=6000)
   → { selected, deferred, tokensBefore, tokensAfter, savingsPercent, reasons }

3. Use ONLY selected[] tools for this subtask

4. Task shifts? Call facet_plan_surface again with the new task string.
```

## Setup

### Cursor

Run `facet cursor` and merge the JSON into Cursor MCP settings, or add manually:

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

### Claude Code

```bash
claude mcp add facet -- npx -y facet mcp
```

### Any MCP client

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

## MCP tool reference

### facet_plan_surface

Select tools for the current task under a token budget.

**Parameters:**
- `task` (string, required) — what the agent is trying to accomplish. Use verb + target: "fix login validation bug"
- `tools` (array, optional) — tool definitions (omit if manifest registered via `facet_register_manifest`)
- `budget` (number, default 6000) — token budget for selected tools
- `profile` (string, optional) — named profile from `facet.json` (`"coding"` | `"review"`)

**Returns:**
```json
{
  "task": "fix the login validation bug",
  "selected": [
    { "name": "mcp__filesystem__read_file", "description": "...", "inputSchema": {} },
    { "name": "mcp__git__diff", "description": "...", "inputSchema": {} }
  ],
  "deferred": ["...17 other tools..."],
  "tokensBefore": 8412,
  "tokensAfter": 1240,
  "savingsPercent": 85.3,
  "reasons": {
    "mcp__filesystem__read_file": "score=0.85 cluster=filesystem",
    "mcp__notion__search": "deferred: budget (350 tok)"
  }
}
```

### facet_audit_tools

Measure token cost and capability clusters for a tool manifest. Call once at session start to understand your baseline overhead.

**Parameters:**
- `tools` (array, required) — tool definitions to audit

**Returns:**
```json
{
  "totalTools": 22,
  "totalTokens": 8412,
  "clusters": [
    { "id": "filesystem", "toolCount": 4, "tokens": 1180 },
    { "id": "git", "toolCount": 3, "tokens": 680 }
  ]
}
```

### facet_register_manifest

Cache the full tool list server-side so `facet_plan_surface` can re-plan cheaply without re-sending the manifest on each call.

**Parameters:**
- `tools` (array, required) — full tool manifest to cache

**Returns:**
```json
{ "registered": 22, "totalTokens": 8412 }
```

## Budget guidance

| Session type | Suggested budget |
|--------------|------------------|
| Focused bugfix | 3000–5000 |
| Feature work (1–2 namespaces) | 5000–7000 |
| Multi-domain task | 7000–10000 |
| Review / read-only | 3000–4000 |

## Task string best practices

Good task strings use **verb + target + context**:

| Bad | Good |
|-----|------|
| "auth" | "fix login validation bug in auth middleware" |
| "PR" | "create a pull request for the bugfix branch" |
| "docs" | "search notion for onboarding documentation" |
| "metrics" | "query datadog for error rate spike in payments service" |

## Profiles

Initialize with `facet init`, then pass `profile: "coding"` or `"review"` to `facet_plan_surface`.

```json
{
  "profiles": [
    {
      "name": "coding",
      "prefer": ["filesystem", "git", "runtime"],
      "budget": 6000
    },
    {
      "name": "review",
      "prefer": ["git", "github"],
      "block": ["runtime"],
      "budget": 4000
    }
  ]
}
```

## When to re-plan

- Switching task domains (e.g., coding task → documentation task → ops task)
- Starting a new session
- After adding new MCP servers (run `facet_audit_tools` first to see the new baseline)

## Do not

- Silently drop pinned safety tools — add them to `facet.json` `pin` list
- Assume deferred tools are unavailable forever — re-plan when the task changes
- Use the same plan across very different tasks — routing is cheap, re-plan liberally

## Demo

```bash
facet demo
```

Runs Facet on a built-in 22-tool manifest and shows routing for 3 realistic tasks. Good for verifying install and seeing formatted output.
