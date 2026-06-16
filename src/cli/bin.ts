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
          args: ["-y", "facet", "mcp"],
        },
      },
    };
    console.log(JSON.stringify(snippet, null, 2));
  });

program.parse();

function loadTools(path: string): ToolDefinition[] {
  const raw = JSON.parse(readFileSync(path, "utf8")) as unknown;
  if (!Array.isArray(raw)) throw new Error("Manifest must be a JSON array");
  return raw as ToolDefinition[];
}

function demoTools(): ToolDefinition[] {
  return [
    { name: "Read", description: "Read a file from disk", server: "filesystem" },
    { name: "Write", description: "Write a file to disk", server: "filesystem" },
    { name: "Glob", description: "Find files by glob pattern", server: "filesystem" },
    { name: "Grep", description: "Search file contents with ripgrep", server: "filesystem" },
    { name: "Shell", description: "Run a shell command", server: "runtime" },
    { name: "GitStatus", description: "Show git working tree status", server: "git" },
    { name: "GitDiff", description: "Show git diff for paths", server: "git" },
    { name: "BrowserNavigate", description: "Open a URL in headless browser", server: "web" },
    { name: "BrowserScreenshot", description: "Capture page screenshot", server: "web" },
    { name: "DatabaseQuery", description: "Run SQL against configured database", server: "data" },
    { name: "mcp__slack__post_message", description: "Post to Slack channel", server: "slack" },
    { name: "mcp__notion__search", description: "Search Notion workspace", server: "notion" },
  ].map((t) => ({
    ...t,
    namespace: t.server,
    inputSchema: { type: "object", properties: { path: { type: "string" } } },
  }));
}
