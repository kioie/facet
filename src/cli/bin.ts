#!/usr/bin/env node
import { Command } from "commander";
import { readFileSync, writeFileSync } from "node:fs";
import { auditToolSurface, defaultConfig, routeTools } from "../index.js";
import type { ToolDefinition } from "../core/types.js";

const program = new Command();

program
  .name("facet")
  .description("Task-aware MCP tool surface for coding agents")
  .version("0.1.0");

program
  .command("audit")
  .description("Measure token cost of a tool manifest JSON file")
  .argument("<manifest>", "Path to JSON array of tools")
  .action((manifest: string) => {
    const tools = loadTools(manifest);
    const report = auditToolSurface(tools);
    console.log(JSON.stringify(report, null, 2));
  });

program
  .command("plan")
  .description("Route tools for a task under a token budget")
  .argument("<task>", "Task description")
  .option("-m, --manifest <path>", "Tool manifest JSON")
  .option("-b, --budget <n>", "Token budget", "6000")
  .option("-p, --profile <name>", "Named profile from facet.json")
  .option("--json", "JSON output")
  .action((task: string, opts: { manifest?: string; budget: string; profile?: string; json?: boolean }) => {
    const tools = opts.manifest ? loadTools(opts.manifest) : demoTools();
    const config = defaultConfig();
    const profile = opts.profile
      ? config.profiles.find((p: { name: string }) => p.name === opts.profile)
      : undefined;
    const plan = routeTools(task, tools, {
      budget: Number(opts.budget),
      profile,
    });
    if (opts.json) {
      console.log(JSON.stringify(plan, null, 2));
    } else {
      console.log(`Task: ${plan.task}`);
      console.log(`Tools: ${plan.selected.length}/${plan.selected.length + plan.deferred.length}`);
      console.log(`Tokens: ${plan.tokensBefore} → ${plan.tokensAfter} (${plan.savingsPercent.toFixed(1)}% saved)`);
      for (const t of plan.selected) {
        console.log(`  ✓ ${t.name} — ${plan.reasons[t.name] ?? ""}`);
      }
      if (plan.deferred.length) {
        console.log(`Deferred (${plan.deferred.length}):`);
        for (const t of plan.deferred.slice(0, 8)) {
          console.log(`  · ${t.name}`);
        }
      }
    }
  });

program
  .command("init")
  .description("Write default facet.json config")
  .option("-f, --force", "Overwrite existing file")
  .action((opts: { force?: boolean }) => {
    const path = "facet.json";
    try {
      readFileSync(path);
      if (!opts.force) {
        console.error(`${path} exists — use --force to overwrite`);
        process.exit(1);
      }
    } catch {
      /* missing */
    }
    writeFileSync(path, JSON.stringify(defaultConfig(), null, 2) + "\n");
    console.log(`Wrote ${path}`);
  });

program
  .command("doctor")
  .description("Environment self-check")
  .action(() => {
    const nodeOk = process.version.match(/^v(2[0-9]|[3-9][0-9])/);
    console.log(nodeOk ? "✓ Node.js >= 20" : "✗ Node.js 20+ required");
    console.log("✓ facet CLI");
    process.exit(nodeOk ? 0 : 1);
  });

program
  .command("mcp")
  .description("Run Facet MCP server (stdio)")
  .action(async () => {
    const { startFacetMcpServer } = await import("../mcp/server.js");
    await startFacetMcpServer();
  });

program
  .command("cursor")
  .description("Print Cursor MCP snippet for Facet")
  .action(() => {
    const snippet = {
      mcpServers: {
        facet: {
          command: "npx",
          args: ["-y", "@kioie/facet", "mcp"],
        },
      },
    };
    console.log(JSON.stringify(snippet, null, 2));
  });

program
  .command("demo")
  .description("Run a built-in demo showing token savings on a realistic tool manifest")
  .option("--json", "JSON output")
  .action((opts: { json?: boolean }) => {
    const tools = demoTools();
    const tasks = [
      "fix the login validation bug in auth middleware",
      "search notion for onboarding documentation",
      "create a pull request for the bugfix branch",
    ];

    if (opts.json) {
      const results = tasks.map((t) => routeTools(t, tools, { budget: 4000 }));
      console.log(JSON.stringify(results, null, 2));
      return;
    }

    const audit = auditToolSurface(tools);
    const line = "─".repeat(60);
    console.log(`\nfacet demo — task-aware tool routing\n${line}`);
    console.log(
      `Manifest: ${audit.totalTools} tools  |  ${audit.totalTokens.toLocaleString()} tokens before routing`,
    );
    console.log(`Clusters: ${audit.clusters.map((c) => c.label).join(", ")}\n`);

    for (const task of tasks) {
      const plan = routeTools(task, tools, { budget: 4000 });
      const filtered = tools.length - plan.selected.length - plan.deferred.length;
      const arrow = "→";
      console.log(`Task: "${task}"`);
      console.log(
        `  ${plan.tokensBefore.toLocaleString()} tok ${arrow} ${plan.tokensAfter.toLocaleString()} tok  ` +
          `(${plan.savingsPercent.toFixed(0)}% saved)  ` +
          `${plan.selected.length} selected / ${plan.deferred.length} deferred` +
          (filtered > 0 ? ` / ${filtered} filtered` : ""),
      );
      for (const t of plan.selected.slice(0, 6)) {
        console.log(`    ✓ ${t.name}`);
      }
      if (plan.selected.length > 6) {
        console.log(`    + ${plan.selected.length - 6} more`);
      }
      if (plan.deferred.length) {
        console.log(
          `    · deferred: ${plan.deferred
            .slice(0, 4)
            .map((t) => t.name)
            .join(", ")}${plan.deferred.length > 4 ? ` +${plan.deferred.length - 4}` : ""}`,
        );
      }
      console.log();
    }

    console.log(`${line}`);
    console.log(`Add to Cursor / Claude Code in one command:`);
    console.log(`  npx @kioie/facet cursor  →  paste snippet into MCP settings`);
    console.log(`  claude mcp add facet -- npx -y @kioie/facet mcp\n`);
  });

program.parse();

function loadTools(path: string): ToolDefinition[] {
  const raw = JSON.parse(readFileSync(path, "utf8")) as unknown;
  if (!Array.isArray(raw)) throw new Error("Manifest must be a JSON array");
  return raw as ToolDefinition[];
}

function demoTools(): ToolDefinition[] {
  const schema = (props: Record<string, unknown>, required?: string[]) => ({
    type: "object" as const,
    properties: props,
    ...(required ? { required } : {}),
  });
  const str = (description: string) => ({ type: "string", description });
  const num = (description: string) => ({ type: "number", description });
  const bool = (description: string) => ({ type: "boolean", description });

  return [
    {
      name: "mcp__filesystem__read_file",
      namespace: "filesystem",
      description:
        "Read the complete contents of a file from the file system. Handles various text encodings and returns the full content as a string. Use for reading source code, configs, or data files.",
      inputSchema: schema(
        {
          path: str("Absolute path to the file to read"),
          encoding: { type: "string", description: "Character encoding (default utf-8)", enum: ["utf-8", "ascii", "binary"] },
          startLine: num("Optional 1-indexed line to start reading from"),
          endLine: num("Optional line number to stop reading at (inclusive)"),
        },
        ["path"],
      ),
    },
    {
      name: "mcp__filesystem__write_file",
      namespace: "filesystem",
      description:
        "Create or overwrite a file with the given string content. Automatically creates missing parent directories.",
      inputSchema: schema(
        {
          path: str("Absolute path of the file to write or create"),
          content: str("Full text content to write — will replace any existing content"),
          createDirs: bool("Create missing parent directories automatically (default true)"),
        },
        ["path", "content"],
      ),
    },
    {
      name: "mcp__filesystem__search_files",
      namespace: "filesystem",
      description: "Search for files matching a glob pattern recursively in a directory tree.",
      inputSchema: schema(
        {
          pattern: str("Glob pattern, e.g. src/**/*.ts"),
          cwd: str("Base directory to search from"),
          ignore: { type: "array", items: { type: "string" }, description: "Glob patterns to exclude" },
        },
        ["pattern"],
      ),
    },
    {
      name: "mcp__filesystem__grep",
      namespace: "filesystem",
      description:
        "Search file contents using regular expressions powered by ripgrep. Fast even on large codebases.",
      inputSchema: schema(
        {
          pattern: str("Regex pattern to search for in file contents"),
          path: str("File or directory to search"),
          filePattern: str("Glob to restrict which files are searched, e.g. *.ts"),
          caseSensitive: bool("Whether the search is case-sensitive (default false)"),
          maxResults: num("Maximum number of matches to return"),
        },
        ["pattern"],
      ),
    },
    {
      name: "mcp__shell__run",
      namespace: "runtime",
      description:
        "Execute an arbitrary shell command and return stdout and stderr. Commands run with a configurable timeout.",
      inputSchema: schema(
        {
          command: str("Shell command string, passed to /bin/sh -c"),
          cwd: str("Working directory. Defaults to project root."),
          timeout: num("Timeout in seconds. Defaults to 30. Max 300."),
          env: { type: "object", description: "Extra environment variables", additionalProperties: { type: "string" } },
        },
        ["command"],
      ),
    },
    {
      name: "mcp__git__status",
      namespace: "git",
      description: "Show working tree status — staged changes, unstaged modifications, and untracked files.",
      inputSchema: schema({ cwd: str("Git repository directory") }),
    },
    {
      name: "mcp__git__diff",
      namespace: "git",
      description: "Show changes between working tree and index or between commits. Returns unified diff output.",
      inputSchema: schema({
        path: str("File or directory to diff. Omit for full repo diff."),
        staged: bool("Show staged changes instead of unstaged"),
        base: str("Base commit ref to compare from"),
        target: str("Target ref. Defaults to HEAD."),
      }),
    },
    {
      name: "mcp__git__log",
      namespace: "git",
      description: "Show commit history with author, date, and message details.",
      inputSchema: schema({
        limit: num("Maximum commits to return. Defaults to 20."),
        path: str("Show commits that modified this path"),
        author: str("Filter commits by author"),
        since: str("Show commits after this date"),
      }),
    },
    {
      name: "mcp__browser__navigate",
      namespace: "web",
      description: "Navigate the headless Chromium browser to a URL and return the page HTML and title.",
      inputSchema: schema(
        {
          url: str("Fully qualified URL including protocol"),
          waitFor: str("CSS selector to wait for before returning"),
          timeout: num("Navigation timeout in milliseconds. Defaults to 30000."),
        },
        ["url"],
      ),
    },
    {
      name: "mcp__browser__screenshot",
      namespace: "web",
      description: "Capture a PNG screenshot of the current browser page or a specific element.",
      inputSchema: schema({
        outputPath: str("File path to save the PNG screenshot"),
        selector: str("CSS selector to crop to a specific element"),
        fullPage: bool("Capture the full scrollable page, not just viewport"),
      }),
    },
    {
      name: "mcp__notion__search",
      namespace: "notion",
      description:
        "Search across all pages, databases, and content in the Notion workspace. Returns matched titles, IDs, and snippets.",
      inputSchema: schema(
        {
          query: str("Search keywords or phrase to look for in Notion"),
          filter: {
            type: "object",
            description: "Filter results by object type",
            properties: { value: { type: "string", enum: ["page", "database"] } },
          },
          pageSize: num("Number of results. Maximum 100."),
        },
        ["query"],
      ),
    },
    {
      name: "mcp__notion__get_page",
      namespace: "notion",
      description: "Retrieve the full content and all properties of a specific Notion page by UUID.",
      inputSchema: schema(
        {
          pageId: str("UUID of the Notion page, found in the page URL"),
          includeChildren: bool("Include child block content in the response"),
        },
        ["pageId"],
      ),
    },
    {
      name: "mcp__notion__create_page",
      namespace: "notion",
      description: "Create a new Notion page in a database or as a child of another page.",
      inputSchema: schema(
        {
          parentId: str("ID of the parent database or page"),
          title: str("The page title"),
          properties: { type: "object", description: "Database property values", additionalProperties: true },
          content: { type: "array", description: "Notion block objects for page body", items: { type: "object" } },
        },
        ["parentId", "title"],
      ),
    },
    {
      name: "mcp__github__create_pull_request",
      namespace: "github",
      description:
        "Create a new GitHub pull request merging one branch into another, with title, description, reviewers, and labels.",
      inputSchema: schema(
        {
          owner: str("GitHub username or organization name"),
          repo: str("Repository name"),
          title: str("Pull request title"),
          body: str("PR description in Markdown. Include what changed and why."),
          head: str("Branch with your changes"),
          base: str("Target branch, typically main"),
          draft: bool("Open as draft — cannot be merged until converted to ready"),
          reviewers: { type: "array", items: { type: "string" }, description: "GitHub usernames to request review" },
          labels: { type: "array", items: { type: "string" }, description: "Label names to apply" },
        },
        ["owner", "repo", "title", "head", "base"],
      ),
    },
    {
      name: "mcp__github__list_issues",
      namespace: "github",
      description: "List open and closed issues for a GitHub repository with filtering by state, labels, and assignee.",
      inputSchema: schema(
        {
          owner: str("GitHub username or organization name"),
          repo: str("Repository name"),
          state: { type: "string", enum: ["open", "closed", "all"], description: "Filter by issue state" },
          labels: { type: "array", items: { type: "string" }, description: "Filter by label names" },
          assignee: str("Filter by assignee GitHub username"),
          since: str("Return issues updated after this ISO 8601 timestamp"),
          perPage: num("Results per page, max 100"),
        },
        ["owner", "repo"],
      ),
    },
    {
      name: "mcp__slack__post_message",
      namespace: "slack",
      description: "Post a formatted message to a Slack channel or DM. Supports Block Kit and threading.",
      inputSchema: schema(
        {
          channel: str("Channel name with # or user ID for DM"),
          text: str("Message text in mrkdwn format"),
          blocks: { type: "array", description: "Block Kit blocks for rich layout", items: { type: "object" } },
          threadTs: str("Parent message timestamp to reply in thread"),
        },
        ["channel", "text"],
      ),
    },
    {
      name: "mcp__linear__create_issue",
      namespace: "linear",
      description: "Create a new Linear issue with priority, assignee, labels, and cycle assignment.",
      inputSchema: schema(
        {
          teamId: str("UUID of the Linear team"),
          title: str("Issue title — concise and actionable"),
          description: str("Detailed description in Markdown"),
          priority: num("Priority: 0=none 1=urgent 2=high 3=medium 4=low"),
          assigneeId: str("UUID of the team member to assign to"),
          labelIds: { type: "array", items: { type: "string" }, description: "Label UUIDs to apply" },
          estimate: num("Story point estimate"),
        },
        ["teamId", "title"],
      ),
    },
    {
      name: "mcp__postgres__query",
      namespace: "data",
      description: "Execute a parameterized SQL query against PostgreSQL and return result rows as JSON.",
      inputSchema: schema(
        {
          sql: str("SQL statement. Use $1, $2 placeholders for parameters."),
          params: { type: "array", description: "Ordered parameter values", items: {} },
          timeout: num("Query timeout in seconds. Defaults to 30."),
        },
        ["sql"],
      ),
    },
    {
      name: "mcp__datadog__query_metrics",
      namespace: "observability",
      description: "Query Datadog metrics API for aggregated time series monitoring data.",
      inputSchema: schema(
        {
          query: str("Datadog query string, e.g. avg:system.cpu.user{host:web-01}"),
          from: num("Start time as Unix epoch seconds"),
          to: num("End time as Unix epoch seconds"),
        },
        ["query", "from", "to"],
      ),
    },
    {
      name: "mcp__sentry__list_issues",
      namespace: "observability",
      description: "List Sentry error and performance issues with environment and query filtering.",
      inputSchema: schema({
        organizationSlug: str("Sentry organization slug identifier"),
        projectSlug: str("Sentry project slug identifier"),
        query: str("Sentry search query, e.g. is:unresolved level:error"),
        environment: str("Filter to a specific environment"),
        limit: num("Maximum number of issues to return"),
      }),
    },
    {
      name: "mcp__figma__get_file",
      namespace: "figma",
      description: "Fetch a Figma design file including frame hierarchy, component definitions, and style tokens.",
      inputSchema: schema(
        {
          fileId: str("Figma file key from the file URL after /design/"),
          nodeIds: { type: "array", items: { type: "string" }, description: "Specific node IDs to fetch" },
          depth: num("Node tree traversal depth. Defaults to full."),
        },
        ["fileId"],
      ),
    },
    {
      name: "mcp__stripe__list_customers",
      namespace: "payments",
      description: "Retrieve Stripe customers with optional email and date-range filtering.",
      inputSchema: schema({
        limit: num("Max customers to return, between 1 and 100"),
        email: str("Filter by exact email address"),
        created: {
          type: "object",
          description: "Filter by creation date range",
          properties: { gte: { type: "number" }, lte: { type: "number" } },
        },
        startingAfter: str("Customer ID cursor for pagination"),
      }),
    },
    {
      name: "mcp__stripe__create_payment_intent",
      namespace: "payments",
      description: "Create a Stripe PaymentIntent to collect a one-time payment.",
      inputSchema: schema(
        {
          amount: num("Amount in smallest currency unit, e.g. cents for USD"),
          currency: str("Three-letter ISO currency code, e.g. usd"),
          customerId: str("Stripe customer ID to attach the payment to"),
          description: str("Internal description for the payment"),
          metadata: { type: "object", description: "Arbitrary key-value metadata", additionalProperties: { type: "string" } },
        },
        ["amount", "currency"],
      ),
    },
  ];
}
