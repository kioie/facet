# Facet

**Task-aware MCP tool surface for coding agents.**

[![npm](https://img.shields.io/npm/v/facet?color=orange)](https://www.npmjs.com/package/facet)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![eval](https://img.shields.io/badge/eval-6%2F6-brightgreen)](#evaluation)
[![MCP](https://img.shields.io/badge/MCP-native-purple)](docs/cursor.md)

---

> **The problem:** Your coding agent loads every MCP tool schema at session start — filesystem, git, GitHub, Notion, Slack, Stripe, browser, database… That's 8,000–20,000 tokens consumed before the first message.
>
> **Facet:** Tell it the task, get back only the tools that matter — scored by capability cluster, distilled for token efficiency, routed under your budget.

---

## Before / After

**Before Facet** — all MCP tools loaded every session:
```
mcp__filesystem__read_file        (320 tok)
mcp__filesystem__write_file       (290 tok)
mcp__filesystem__grep             (280 tok)
mcp__shell__run                   (310 tok)
mcp__git__status                  (180 tok)
mcp__git__diff                    (220 tok)
mcp__notion__search               (350 tok)
mcp__notion__create_page          (410 tok)
mcp__github__create_pull_request  (520 tok)
mcp__slack__post_message          (290 tok)
mcp__stripe__create_payment_intent (480 tok)
mcp__datadog__query_metrics       (360 tok)
...10 more tools...
Total: ~8,400 tokens consumed per session
```

**After Facet** — task-targeted surface in one call:
```
facet plan "fix the login validation bug" --budget 4000

Task: fix the login validation bug
Tools: 5/22  |  8,400 tok → 1,240 tok  (85% saved)

  ✓ mcp__filesystem__read_file   score=0.85  cluster=filesystem
  ✓ mcp__filesystem__grep        score=0.72  cluster=filesystem
  ✓ mcp__shell__run              score=0.61  cluster=runtime
  ✓ mcp__git__diff               score=0.54  cluster=git
  ✓ mcp__git__status             score=0.48  cluster=git

  · deferred: mcp__notion__search, mcp__slack__post_message, mcp__stripe__*, ...
```

**Result: 1,240 tokens instead of 8,400. Same task. Less noise.**

---

## Install

```bash
npm install -g facet
facet doctor
```

Or zero-install with npx:

```bash
npx facet demo
```

## Quick start

```bash
# 1. See what's in your tool manifest
facet audit ./tools.json

# 2. Route tools for a task under a budget
facet plan "fix login validation bug" --manifest ./tools.json --budget 4000

# 3. Try the built-in demo (no manifest needed)
facet demo

# 4. Write a facet.json config with coding/review profiles
facet init
```

## Cursor / Claude Code / Codex

**One-command setup for Cursor:**
```bash
facet cursor
# → prints the JSON snippet — paste into Cursor MCP settings
```

**Claude Code:**
```bash
claude mcp add facet -- npx -y facet mcp
```

**Any MCP client (Cursor, Claude Code, Codex, Zed...):**
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

Once connected, agents call `facet_plan_surface` at the start of each subtask.

## MCP tools

| Tool | What it does |
|------|-------------|
| `facet_plan_surface` | Select tools for the current task under a token budget — returns `selected`, `deferred`, savings %, and selection reasons |
| `facet_audit_tools` | Measure token cost and capability clusters for your full tool manifest |
| `facet_register_manifest` | Cache the full tool list server-side once; re-plan cheaply across subtasks |

**Typical agent loop:**

```
1. facet_register_manifest(tools)              — once, at session start

2. facet_plan_surface(task, budget=6000)       — before each subtask
   → { selected, deferred, tokensBefore, tokensAfter, savingsPercent, reasons }

3. <use only selected tools for this subtask>

4. Task changes? Call facet_plan_surface again with updated task string.
```

## How it works

```
Cluster → Score → Distill → Route
```

1. **Cluster** — group tools by capability (filesystem, git, web, data, observability, …)
2. **Score** — rank tools by token overlap between task string and tool names/descriptions
3. **Distill** — compact JSON schemas (trim long descriptions, collapse unused enum variants)
4. **Route** — pick a budget-feasible subset, always respecting pinned tools and floor counts

See [SPEC.md](./SPEC.md) for the full algorithm.

## Evaluation

```bash
npm run eval
```

Current score: **6/6** across agent-tools and MCP-heavy fixtures.

```
✓ read the login validation source file   → filesystem tools selected
✓ show git diff for auth module           → git tools selected
✓ run unit tests in terminal              → runtime tools selected
✓ create a pull request for the bugfix    → github + filesystem selected
✓ search notion docs for onboarding       → notion tools selected
✓ read config yaml from repo              → filesystem selected
```

See [eval/results.md](./eval/results.md) for the full report.

## Demo

```bash
facet demo
```

Runs Facet on a built-in 22-tool manifest (filesystem, git, GitHub, Notion, Slack, Stripe, Datadog…) and shows before/after savings for three realistic tasks. No manifest file needed.

## Library API

```typescript
import { routeTools, auditToolSurface } from "facet";

const plan = routeTools("fix stripe webhook validation", tools, { budget: 6000 });
// plan.selected      — tools to pass to your LLM for this task
// plan.deferred      — tools held back to save tokens
// plan.tokensBefore  — total token cost before routing
// plan.tokensAfter   — total token cost after routing
// plan.savingsPercent — % reduction
// plan.reasons       — per-tool routing decision

const audit = auditToolSurface(tools);
// audit.totalTools   — tool count
// audit.totalTokens  — total token cost
// audit.clusters     — breakdown by capability cluster
```

## Profiles

`facet init` writes `facet.json` with `coding` and `review` profiles. Use `--profile coding` or pass `profile: "coding"` to `facet_plan_surface`.

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

## For AI agents

- [llms.txt](./llms.txt) — machine-readable tool docs and agent loop
- [AGENTS.md](./AGENTS.md) — full integration playbook with budget guidance
- [docs/agent-api.json](./docs/agent-api.json) — JSON schemas with example responses
- [integrations/](./integrations/) — Cursor, Claude Code, and GitHub Action configs

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Stars help more devs find Facet — if it saves you tokens, give it one.

MIT License.
