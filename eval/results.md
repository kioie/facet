# Facet evaluation report

# Eval: agent-tools.json

- [x] `read the login validation source file` → Read, Write, Glob, Grep
- [x] `show git diff for auth module` → GitDiff, GitStatus, Read, Write
- [x] `run unit tests in terminal` → Shell, Read, Write, Glob

**Score:** 3/3 (100%)

# Eval: cursor-tools.json

- [x] `find where login validation is implemented in auth module` → SemanticSearch, Grep, Read, Write
- [x] `run npm test for the auth package` → Shell, Task, SemanticSearch, Grep
- [x] `create a pull request for the bugfix branch` → mcp__github__create_pull_request, SemanticSearch, Grep, Read
- [x] `search notion for onboarding documentation` → mcp__notion__search
- [x] `launch explore subagent to map tool routing across the repo` → Task, CallMcpTool, mcp__github__create_pull_request, SemanticSearch

**Score:** 5/5 (100%)

# Eval: mcp-heavy.json

- [x] `create a pull request for the bugfix branch` → mcp__github__create_pr, mcp__filesystem__read, mcp__filesystem__write, mcp__notion__search
- [x] `search notion docs for onboarding` → mcp__notion__search
- [x] `read config yaml from repo` → mcp__filesystem__read, mcp__filesystem__write, mcp__github__create_pr, mcp__postgres__query
- [x] `query datadog for error rate spike in payments` → mcp__datadog__query_metrics

**Score:** 4/4 (100%)

# Eval: github-tools.json

- [x] `list open issues on the payments repo` → mcp__github__list_issues, mcp__filesystem__read, mcp__filesystem__write, mcp__git__diff
- [x] `review pull request diff for security issues` → mcp__git__diff, mcp__github__list_issues, mcp__github__create_pull_request, mcp__github__get_pull_request
- [x] `post deployment update to slack channel` → mcp__slack__post_message, mcp__filesystem__read, mcp__filesystem__write

**Score:** 3/3 (100%)

# Eval: edge-cases.json

- [x] `fix stripe webhook signature validation` → mcp__stripe__list_customers, mcp__stripe__create_payment_intent, mcp__filesystem__read, mcp__filesystem__write
- [x] `investigate sentry checkout errors` → mcp__sentry__list_issues
- [x] `run database migration script in terminal` → mcp__shell__run, mcp__postgres__query, mcp__filesystem__read, mcp__filesystem__write
- [x] `create linear ticket for auth bug` → mcp__linear__create_issue
- [x] `merge pull request after code review` → mcp__github__get_pull_request, mcp__github__create_pull_request, mcp__filesystem__read, mcp__filesystem__write
- [x] `query postgres for duplicate user records` → mcp__postgres__query

**Score:** 6/6 (100%)

# Eval: ops-tools.json

- [x] `search jira tickets for payment outage` → mcp__jira__search_issues, mcp__atlassian__get_page
- [x] `query gcp logs for auth service errors` → mcp__gcp__query_logs, mcp__gcloud__list_resources
- [x] `list cloudflare workers in production` → mcp__cloudflare__list_workers
- [x] `check datadog latency for api gateway` → mcp__datadog__query_metrics
- [x] `read confluence runbook for incident response` → mcp__filesystem__read, mcp__filesystem__write, mcp__atlassian__get_page, mcp__gcp__query_logs

**Score:** 5/5 (100%)

# Eval: monorepo.json

- [x] `run unit tests for web package in monorepo` → mcp__turbo__run, mcp__nx__run, mcp__pnpm__filter, mcp__shell__run
- [x] `grep for AuthProvider usage across packages` → mcp__filesystem__grep, mcp__notion__search, mcp__typescript__find_references, mcp__filesystem__read
- [x] `fix login bug in packages/api src` → mcp__filesystem__read, mcp__filesystem__grep, mcp__shell__run
- [x] `install deps in apps/web workspace` → mcp__pnpm__filter, mcp__filesystem__read, mcp__notion__search, mcp__filesystem__grep
- [x] `run nx build for shared-ui library` → mcp__nx__run, mcp__shell__run, mcp__filesystem__read, mcp__filesystem__grep

**Score:** 5/5 (100%)

Aggregate: 31/31