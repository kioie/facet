# Facet Growth Playbook

**Mission:** Make Facet the default tool surface layer for coding agents — the thing you add before anything else when setting up a new MCP-enabled environment.

---

## Positioning

**Facet is not context compression.** It does not shorten your messages, summarize history, or truncate outputs.

**Facet is tool surface routing.** It routes the *right tools* for the current *task* — reducing schema overhead without limiting what the agent can do.

| What Facet is | What Facet is not |
|---|---|
| Task-aware tool selection | Message compression |
| Token budget enforcement | Context window management |
| MCP manifest router | Prompt optimizer |
| Per-subtask tool focus | Global context limiter |

**One-line positioning:** *"Facet gives your agent exactly the tools it needs right now — not all 23 tools it might need someday."*

---

## Top 3 viral hooks

### Hook 1 — The number that stops the scroll

> "Your agent burns **3,200 tokens** on MCP tool schemas before it reads your first message.
> `npx facet demo` — watch it drop to 1,160."

This works because: concrete numbers + one command to verify = instant credibility.

### Hook 2 — The insight about waste

> "Every MCP server you add makes your agent slightly worse — not because the tools are bad,
> but because all their schemas load before the agent makes a single decision.
> Facet routes tools by task. 64% less schema overhead. Same tools, same capabilities."

This works because: reframes a problem developers didn't know they had, then solves it immediately.

### Hook 3 — The Show HN demo hook

> **Show HN: Facet — I measured MCP tool token costs and built a router**
>
> After adding GitHub, Notion, Slack, and Linear MCP servers to Cursor, I noticed the agent's
> first message was consistently worse — not because the model changed, but because 3,200 tokens
> of tool schema overhead left less context for actual reasoning.
>
> Facet routes a task-specific subset of tools to the agent. For "fix the login bug", it surfaces
> the git and filesystem tools and defers Slack, Stripe, and Figma. 64% saved. One config line.

---

## 30-Day Launch Calendar

### Week 1 — Foundation (Days 1–7)

- [ ] **Day 1** — Make GitHub repo public. Add topics: `mcp`, `ai-agents`, `cursor`, `claude-code`, `token-optimization`, `model-context-protocol`. Pin README with demo output.
- [ ] **Day 2** — Publish to npm. Verify `npx facet demo` works cleanly from zero install.
- [ ] **Day 3** — Post to r/cursor: "I measured how many tokens your MCP tools are costing you". Include the before/after table. Link to `npx facet demo`.
- [ ] **Day 4** — Post to r/ClaudeAI: same angle but emphasize Claude Code integration.
- [ ] **Day 5** — Tweet thread (see drafts below). Pin to profile.
- [ ] **Day 7** — Submit to [awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers) and [awesome-claude-mcp](https://github.com/sugyan/awesome-claude-mcp).

### Week 2 — Community (Days 8–14)

- [ ] **Day 8** — Post to Cursor Discord `#show-and-tell` channel with demo GIF.
- [ ] **Day 9** — Post to Claude Discord / Anthropic community forums.
- [ ] **Day 10** — Publish dev.to article: "Why MCP Tool Schemas Are Eating Your Agent's Context Window".
- [ ] **Day 11** — Post to Hacker News: "Show HN: Facet — task-aware MCP tool router". Target 9am PST.
- [ ] **Day 12** — Follow up HN with a comment: link to eval results + routing algorithm in SPEC.md.
- [ ] **Day 14** — Respond to every GitHub issue and PR within 24 hours. Momentum window.

### Week 3 — Content (Days 15–21)

- [ ] **Day 15** — Publish "How Facet routes tools" deep dive on dev.to (link to SPEC.md).
- [ ] **Day 16** — Create a short screen recording: `npx facet demo` → `facet cursor` → Cursor restart → live token savings. Post to Twitter/X.
- [ ] **Day 17** — Submit to [MCP.run](https://mcp.run/) and any emerging MCP registries.
- [ ] **Day 18** — Post to Product Hunt as a Weekend Warrior launch.
- [ ] **Day 21** — Write "Facet + Aperture: full context control for coding agents" (separate tool, complementary positioning).

### Week 4 — Scale (Days 22–30)

- [ ] **Day 22** — Reach out to AI-focused newsletters: TLDR AI, The Rundown, AI Tool Report.
- [ ] **Day 24** — Post usage stats / star milestone update on Twitter.
- [ ] **Day 25** — Publish "Evaluating MCP tool routers" benchmark post — Facet's eval methodology.
- [ ] **Day 28** — Release v0.2 with a notable new feature. Changelog post.
- [ ] **Day 30** — Retrospective post: "30 days of Facet" with growth numbers.

---

## Tweet / Thread Drafts

### Thread 1 — The audit thread

```
1/ Every MCP server you add to Cursor or Claude Code makes your agent slightly dumber.

Here's why, and what I built to fix it 🧵

2/ When your agent starts a session, it loads ALL your MCP tool schemas into context.

Filesystem (4 tools): 634 tokens
GitHub (2 tools): 349 tokens
Notion (3 tools): 382 tokens
Slack, Linear, Stripe, Figma...

Total: 3,210 tokens. Before your agent reads a single line of your code.

3/ These tokens aren't wasted on bad tools. The tools are great. But a bugfix agent doesn't
need Figma and Stripe schemas loaded when it's trying to find a null pointer exception.

That overhead is pure tax.

4/ I built Facet to route tools by task.

Before each subtask, the agent calls facet_plan_surface("fix the login bug").
Facet returns 10 tools. 64% fewer tokens. Same capabilities — just focused.

5/ It's one config line:
  { "mcpServers": { "facet": { "command": "npx", "args": ["-y", "facet", "mcp"] } } }

Then run `npx facet demo` to see the savings on your own manifest.

MIT, TypeScript, eval suite included.

→ github.com/kioie/facet
```

### Thread 2 — The insight thread

```
1/ Most "context optimization" tools work on the output side — compressing messages, 
summarizing history, truncating long responses.

Facet works on the input side: tool schemas.

2/ The schema for github.create_pull_request is 208 tokens.
The schema for stripe.create_payment_intent is 136 tokens.

Load 23 MCP tools and you've spent 3,200 tokens before writing "fix this bug."

3/ The fix isn't to remove tools — it's to route them.

For a bugfix: surface git + filesystem tools. Defer Stripe, Figma, Slack.
For a Notion search: surface Notion + filesystem. Defer GitHub, Datadog.

Same tools. Task-aware selection.

4/ Facet does this routing as an MCP server your agent calls itself:

  facet_plan_surface({ task: "fix login bug", budget: 6000 })
  → { selected: [10 tools], savingsPercent: 64 }

Eval suite included. 100% on 6 routing cases.

→ npx facet demo
→ github.com/kioie/facet
```

### Thread 3 — The "Show HN" angle

```
1/ I added 6 MCP servers to Cursor last month. My agent got slower, not faster.

Not because the servers were bad — because 3,200 tokens of tool schemas loaded before
the agent could think.

I spent a weekend measuring it and building a fix.

2/ Run this: npx facet demo

You'll see exactly which MCP tools cost which tokens, and how routing cuts the overhead 
by 57–68% depending on the task.

3/ It works as a standard MCP server — one JSON line in your config. The agent calls
facet_plan_surface itself before each subtask and gets back a focused tool list.

No code changes. No prompt engineering. Just fewer schemas in context.

→ github.com/kioie/facet
```

---

## Platform-specific playbook

### Hacker News

- Post in "Show HN" format: "Show HN: Facet — task-aware MCP tool surface router (64% token savings)"
- Lead with the concrete number and the one-command demo
- Include the eval methodology (devs trust reproducible benchmarks)
- Best time: Monday–Wednesday, 9–11am PST
- Expected: 50–200 points if the demo is clean and the numbers hold up

### Reddit

**r/cursor:**
- Title: "I measured how much context your MCP tools are using — and built a router"
- Lead with the before/after table
- Show the `facet audit` output on a realistic manifest

**r/ClaudeAI:**
- Title: "Facet: one-line MCP config that saves 64% of tool schema tokens in Claude Code"
- Lead with the Claude Code setup command
- Show `facet_plan_surface` output from an agent session

**r/LocalLLaMA, r/MachineLearning:**
- Focus on the routing algorithm (SPEC.md) and eval methodology
- More technical angle: "here's how we score and cluster tools by capability"

### dev.to

Three articles:
1. "Why MCP Tool Schemas Are Eating Your Agent's Context Window" (problem + data)
2. "Routing MCP Tools by Task: How Facet Works Under the Hood" (algorithm)
3. "Setting Up Facet with Cursor and Claude Code" (tutorial)

### Product Hunt

- Launch on a Tuesday
- Tagline: "Task-aware tool routing for coding agents — 64% schema overhead reduction"
- Demo GIF: `npx facet demo` terminal output
- Categories: Developer Tools, Artificial Intelligence

---

## Metrics to track

| Metric | Tool | Target (30 days) |
|---|---|---|
| GitHub stars | GitHub Insights | 200+ |
| npm weekly downloads | npmjs.com | 500+ |
| npm total installs | npmjs.com | 2,000+ |
| HN points | HN | 50+ |
| Reddit upvotes (total) | Reddit | 500+ |
| Unique visitors (README) | GitHub Traffic | 5,000+ |
| Open issues / PRs | GitHub | 20+ (engagement) |

---

## Awesome-list submissions

Submit Facet to these lists when ready:

- https://github.com/punkpeye/awesome-mcp-servers
- https://github.com/wong2/awesome-mcp-servers
- https://github.com/f/awesome-chatgpt-prompts (adjacent)
- https://github.com/ai-boost/awesome-prompts (adjacent)
- MCP.run registry (if accepting submissions)
- Smithery.ai (MCP discovery platform)

**Submission format for awesome-mcp-servers:**
```markdown
- [Facet](https://github.com/kioie/facet) — Task-aware MCP tool surface router.
  Routes a token-budgeted tool subset per subtask. 50–65% schema savings. TypeScript.
```

---

## Community building

- GitHub Discussions: enable and seed with "Share your token savings" thread
- Discord: consider a small `#facet` channel in relevant servers (Cursor, Anthropic dev)
- Newsletter: document token savings case studies from real users (with permission)
