# Examples

Terminal output and usage patterns for Facet. Run `npm run build && node dist/cli/bin.js demo` to reproduce the numbers below.

---

## Demo command

```bash
npx @kioie/facet demo
```

Output:

```
facet demo — task-aware tool routing
────────────────────────────────────────────────────────────
Manifest: 23 tools  |  3,210 tokens before routing
Clusters: filesystem, shell, git, browser, notion, github, slack, linear, postgres, datadog, sentry, figma, stripe

Task: "fix the login validation bug in auth middleware"
  3,210 tok → 1,160 tok  (64% saved)  10 selected / 0 deferred / 13 filtered
    ✓ mcp__git__log
    ✓ mcp__filesystem__grep
    ✓ mcp__shell__run
    ✓ mcp__git__status
    ✓ mcp__git__diff
    ✓ mcp__browser__navigate
    + 4 more

Task: "search notion for onboarding documentation"
  3,210 tok → 1,385 tok  (57% saved)  12 selected / 0 deferred / 11 filtered
    ✓ mcp__notion__search
    ✓ mcp__filesystem__grep
    ✓ mcp__notion__get_page
    ✓ mcp__filesystem__search_files
    ✓ mcp__notion__create_page
    ✓ mcp__shell__run
    + 6 more

Task: "create a pull request for the bugfix branch"
  3,210 tok → 2,122 tok  (34% saved)  16 selected / 0 deferred / 7 filtered
    ✓ mcp__github__create_pull_request
    ✓ mcp__filesystem__write_file
    ✓ mcp__notion__create_page
    ✓ mcp__linear__create_issue
    ✓ mcp__stripe__create_payment_intent
    ✓ mcp__stripe__list_customers
    + 10 more

────────────────────────────────────────────────────────────
Add to Cursor / Claude Code in one command:
  npx @kioie/facet cursor  →  paste snippet into MCP settings
  claude mcp add facet -- npx -y @kioie/facet mcp
```

The demo uses a token budget of 4,000 and a built-in 23-tool manifest. Savings vary by task — broader tasks (e.g. creating a pull request) surface more tools and save less.

---

## Audit a manifest

```bash
facet audit my-tools.json
```

```json
{
  "totalTools": 23,
  "totalTokens": 3210,
  "clusters": [
    { "id": "filesystem", "label": "filesystem", "toolCount": 4, "tokens": 634 },
    { "id": "github",     "label": "github",     "toolCount": 2, "tokens": 349 },
    { "id": "notion",     "label": "notion",     "toolCount": 3, "tokens": 382 },
    { "id": "stripe",     "label": "stripe",     "toolCount": 2, "tokens": 320 },
    { "id": "git",        "label": "git",        "toolCount": 3, "tokens": 307 },
    { "id": "browser",    "label": "browser",    "toolCount": 2, "tokens": 236 },
    { "id": "linear",     "label": "linear",     "toolCount": 1, "tokens": 176 },
    { "id": "shell",      "label": "shell",      "toolCount": 1, "tokens": 152 },
    { "id": "slack",      "label": "slack",      "toolCount": 1, "tokens": 142 },
    { "id": "datadog",    "label": "datadog",    "toolCount": 1, "tokens": 122 },
    { "id": "figma",      "label": "figma",      "toolCount": 1, "tokens": 120 },
    { "id": "sentry",     "label": "sentry",     "toolCount": 1, "tokens": 120 },
    { "id": "postgres",   "label": "postgres",   "toolCount": 1, "tokens": 125 }
  ]
}
```

---

## Library API

```typescript
import { routeTools } from "@kioie/facet";

const plan = routeTools("fix the auth bug", myTools, { budget: 6000 });

console.log(`${plan.savingsPercent.toFixed(0)}% saved`);
console.log(plan.selected.map((t) => t.name));
```

---

## MCP agent loop

```
Agent:  facet_register_manifest({ tools: [...23 tools...] })
Facet:  { manifestId: "s1", totalTokens: 3210 }

Agent:  facet_plan_surface({ task: "fix login bug", manifestId: "s1", budget: 6000 })
Facet:  { selected: [...10 tools...], savingsPercent: 64, tokensBefore: 3210, tokensAfter: 1160 }

Agent:  [uses only the selected tools for this subtask]
```

---

## Profiles

`facet.json`:

```json
{
  "profiles": [
    {
      "name": "coding",
      "prefer": ["filesystem", "git", "shell"],
      "pin": ["mcp__filesystem__read_file"],
      "budget": 6000
    },
    {
      "name": "review",
      "prefer": ["git", "github"],
      "block": ["mcp__stripe__create_payment_intent", "mcp__postgres__query"],
      "budget": 4000
    }
  ]
}
```

```bash
facet plan "review PR for security issues" --profile review
```

---

## Cursor integration

```bash
npx @kioie/facet cursor
```

Paste into `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "facet": {
      "command": "npx",
      "args": ["-y", "@kioie/facet", "mcp"]
    }
  }
}
```

---

## Evaluation

```bash
npm run eval
```

Current aggregate score: **6/6** across agent-tools and mcp-heavy fixtures. See [eval/results.md](./eval/results.md).
