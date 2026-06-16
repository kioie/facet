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

# Eval: github-tools.json

- [x] `list open issues on the payments repo` → mcp__github__list_issues, mcp__filesystem__read, mcp__filesystem__write, mcp__git__diff
- [x] `review pull request diff for security issues` → mcp__github__create_pull_request, mcp__github__get_pull_request, mcp__git__diff, mcp__github__list_issues
- [x] `post deployment update to slack channel` → mcp__slack__post_message

**Score:** 3/3 (100%)

Aggregate: 10/10