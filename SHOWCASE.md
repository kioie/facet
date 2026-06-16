# Facet Showcase

Copy-paste demos, before/after examples, and social-ready output.

---

## The one-liner that shows everything

```bash
npx facet demo
```

Output:

```
facet demo — task-aware tool routing
────────────────────────────────────────────────────────────
Manifest: 23 tools  |  3,210 tokens before routing
Clusters: filesystem, git, browser, notion, github, slack, linear, postgres, datadog, sentry, figma, stripe

Task: "fix the login validation bug in auth middleware"
  3,210 tok → 1,160 tok  (64% saved)  10 selected / 13 deferred
    ✓ mcp__git__log
    ✓ mcp__filesystem__grep
    ✓ mcp__shell__run
    ✓ mcp__git__status
    ✓ mcp__git__diff
    + 5 more
    · deferred: mcp__slack__post_message, mcp__figma__get_file, mcp__stripe__list_customers +10

Task: "search notion for onboarding documentation"
  3,210 tok → 1,385 tok  (57% saved)  12 selected / 11 deferred
    ✓ mcp__notion__search
    ✓ mcp__notion__get_page
    ✓ mcp__notion__create_page
    ✓ mcp__filesystem__grep
    ✓ mcp__shell__run
    + 7 more
    · deferred: mcp__stripe__list_customers, mcp__figma__get_file, mcp__datadog__query_metrics +8

Task: "create a pull request for the bugfix branch"
  3,210 tok → 1,040 tok  (68% saved)  8 selected / 15 deferred
    ✓ mcp__github__create_pull_request
    ✓ mcp__github__list_issues
    ✓ mcp__git__diff
    ✓ mcp__git__log
    + 4 more
    · deferred: mcp__figma__get_file, mcp__stripe__list_customers, mcp__datadog__query_metrics +12

────────────────────────────────────────────────────────────
Add to Cursor / Claude Code in one command:
  npx facet cursor  →  paste snippet into MCP settings
  claude mcp add facet -- npx -y facet mcp
```

---

## Before / After — full session

**Before Facet** (typical Cursor session with 6 MCP servers):

```
Agent context at session start:
  Tool schemas:  3,210 tokens
  System prompt: 1,800 tokens
  User message:  120 tokens
  ──────────────────────────
  Total:         5,130 tokens  →  agent starts with context 40% full
```

**After Facet** (same session, bugfix task):

```
Agent context at session start:
  Tool schemas:  1,160 tokens   (64% reduction)
  System prompt: 1,800 tokens
  User message:  120 tokens
  ──────────────────────────
  Total:         3,080 tokens   →  agent starts with context 24% full
```

**2,050 tokens freed** for actual code, reasoning, and output.

---

## Audit a real manifest

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
    { "id": "runtime",    "label": "runtime",    "toolCount": 1, "tokens": 152 },
    { "id": "slack",      "label": "slack",      "toolCount": 1, "tokens": 142 },
    { "id": "datadog",    "label": "observability", "toolCount": 1, "tokens": 122 },
    { "id": "figma",      "label": "figma",      "toolCount": 1, "tokens": 120 },
    { "id": "sentry",     "label": "observability", "toolCount": 1, "tokens": 120 },
    { "id": "data",       "label": "postgres",   "toolCount": 1, "tokens": 125 }
  ]
}
```

---

## Library — 5 lines to route tools

```typescript
import { routeTools } from "facet";

const plan = routeTools("fix the auth bug", myTools, { budget: 6000 });

console.log(`${plan.savingsPercent.toFixed(0)}% saved`);  // "64% saved"
console.log(plan.selected.map(t => t.name));               // ["mcp__git__diff", ...]
```

---

## MCP — agent calls Facet itself

```
Agent:  facet_register_manifest({ tools: [...23 tools...] })
Facet:  { manifestId: "s1", totalTokens: 3210 }

Agent:  facet_plan_surface({ task: "fix login bug", manifestId: "s1", budget: 6000 })
Facet:  { selected: [...10 tools...], savingsPercent: 64, tokensBefore: 3210, tokensAfter: 1160 }

Agent:  [uses only the 10 selected tools for this subtask]
```

---

## Profiles example — coding vs review

`facet.json`:
```json
{
  "profiles": [
    {
      "name": "coding",
      "prefer": ["filesystem", "git", "runtime"],
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
# → 4 tools selected, 19 deferred, 68% saved
```

---

## Cursor integration — one command

```bash
facet cursor
```

Output (paste into `~/.cursor/mcp.json`):
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

---

## Eval — routing accuracy

```bash
npm run eval
```

```
# Eval: agent-tools.json
- [x] read the login validation source file → Read, Write, Glob, Grep
- [x] show git diff for auth module         → GitDiff, GitStatus, Read, Write
- [x] run unit tests in terminal            → Shell, Read, Write, Glob

Score: 3/3 (100%)

# Eval: mcp-heavy.json
- [x] create a pull request for the bugfix branch → mcp__github__create_pr
- [x] search notion docs for onboarding           → mcp__notion__search
- [x] read config yaml from repo                  → mcp__filesystem__read

Score: 3/3 (100%)

Aggregate: 6/6
```
