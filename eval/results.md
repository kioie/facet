# Facet evaluation report

# Eval: agent-tools.json

- [x] `read the login validation source file` → Read, Write, Glob, Grep
- [x] `show git diff for auth module` → GitDiff, GitStatus, Read, Write
- [x] `run unit tests in terminal` → Shell, Read, Write, Glob

**Score:** 3/3 (100%)

# Eval: mcp-heavy.json

- [x] `create a pull request for the bugfix branch` → mcp__github__create_pr, mcp__filesystem__read, mcp__filesystem__write, mcp__notion__search
- [x] `search notion docs for onboarding` → mcp__notion__search
- [x] `read config yaml from repo` → mcp__filesystem__read, mcp__filesystem__write, mcp__github__create_pr, mcp__notion__search
- [x] `query datadog for error rate spike in payments` → mcp__datadog__query_metrics, mcp__postgres__query

**Score:** 4/4 (100%)

Aggregate: 7/7