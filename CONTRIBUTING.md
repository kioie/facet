# Contributing to Facet

Thanks for your interest! Facet is a small, focused tool — contributions that keep it sharp and accurate are most welcome.

---

## What we're looking for

### High value
- **Cluster coverage** — new namespace → cluster mappings for tools not auto-detected (Zed, Windsurf, Codeium, Continue.dev, etc.)
- **Eval fixtures** — more realistic tool manifests covering monorepos, enterprise MCP stacks, mixed-namespace setups
- **MCP integrations** — tested configs for editors and clients beyond Cursor and Claude Code
- **Ranking improvements** — better task → tool scoring for edge cases (task strings that surface wrong tools)
- **Bug reports** — especially wrong-routing cases; include the task string and actual vs. expected tools

### Medium value
- CLI UX improvements (richer tree output, color themes for `facet demo`)
- Additional output formats (`--format yaml`, `--format markdown` for agent pipelines)
- `facet watch` for incremental re-planning as the session progresses

### Lower priority
- Full semantic embedding-based ranking (planned for v0.2+)
- Remote manifest caching
- Automatic profile generation from usage logs (out of scope)

---

## Development setup

```bash
git clone https://github.com/kioie/facet
cd facet
npm install
npm test          # unit tests
npm run eval      # evaluation suite (10/10 cases)
npm run build     # TypeScript compile
```

## Project structure

```
src/
  cli/bin.ts              — CLI commands (plan, audit, init, demo, cursor, mcp)
  core/
    router.ts             — routeTools() and auditToolSurface() — main entry points
    tool-ranker.ts        — task scoring and capability cluster inference
    schema-distill.ts     — JSON schema compaction
    tokenizer.ts          — token counting
    types.ts              — shared types
  mcp/server.ts           — MCP server (facet_plan_surface, facet_audit_tools, facet_register_manifest)
  index.ts                — public library API
tests/
  core/router.test.ts     — router unit tests
eval/
  fixtures/
    agent-tools.json      — agent-style tool manifest + eval cases
    mcp-heavy.json        — realistic MCP-heavy manifest + eval cases
    github-tools.json     — GitHub/Slack/git routing eval cases
  runner.ts               — evaluation runner
  results.md              — latest eval results
```

## Adding a new cluster mapping

1. Open `src/core/tool-ranker.ts`
2. Add namespace patterns and keyword heuristics for the new cluster
3. Add fixture tools in `eval/fixtures/` that use the new namespace
4. Add eval cases that expect the new cluster's tools to be selected
5. Run `npm run eval` — score should stay at 6/6 or improve

## Adding eval cases

1. Add tools to `eval/fixtures/agent-tools.json` or `eval/fixtures/mcp-heavy.json`
2. Add a case with `task`, `expectIncludes`, and optionally `expectExcludes`
3. Run `npm run eval` and confirm it passes
4. Commit the updated `eval/results.md`

## Submitting a PR

- `npm test` must pass
- `npm run eval` must pass (score >= current 10/10)
- Keep PRs focused — one feature or fix per PR
- No AI-generated comments explaining what the code does

## Code style

- TypeScript strict mode
- No classes where functions suffice
- Exported types in `src/core/types.ts`
- Keep the core routing algorithm (ranker + distill + route) pure and testable

---

## Reporting wrong routing

Facet's quality depends on its eval coverage. If you see a task where the wrong tools come back:

1. Run `facet plan "<task>" --manifest ./tools.json --json` and save the output
2. Note which tools you expected and which were actually selected
3. Open an issue with: task string, manifest (or relevant subset), expected tools, actual tools

This is the most impactful contribution you can make.
