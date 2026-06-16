import { describe, expect, it } from "vitest";
import { distillTool } from "../../src/core/schema-distill.js";
import { routeTools, auditToolSurface } from "../../src/core/router.js";
import { rankTools, scoreTool } from "../../src/core/tool-ranker.js";
import type { ToolDefinition } from "../../src/core/types.js";

const sampleTools: ToolDefinition[] = [
  {
    name: "Read",
    description: "Read file contents from the workspace",
    namespace: "filesystem",
    inputSchema: { type: "object", properties: { path: { type: "string" } } },
  },
  {
    name: "Shell",
    description: "Execute shell commands",
    namespace: "runtime",
    inputSchema: { type: "object", properties: { command: { type: "string" } } },
  },
  {
    name: "GitDiff",
    description: "Show git diff for paths",
    namespace: "git",
    inputSchema: { type: "object", properties: { path: { type: "string" } } },
  },
  {
    name: "mcp__slack__post",
    description: "Post message to Slack",
    namespace: "slack",
    inputSchema: { type: "object", properties: { text: { type: "string" } } },
  },
];

describe("scoreTool", () => {
  it("ranks filesystem tools for file tasks", () => {
    const read = scoreTool("read the auth login file", sampleTools[0]!);
    const slack = scoreTool("read the auth login file", sampleTools[3]!);
    expect(read).toBeGreaterThan(slack);
  });
});

describe("rankTools", () => {
  it("orders by relevance", () => {
    const ranked = rankTools("fix git diff in auth module", sampleTools, undefined);
    expect(ranked[0]?.tool.name).toBe("GitDiff");
  });
});

describe("routeTools", () => {
  it("reduces token count under budget", () => {
    const plan = routeTools("read and edit typescript files", sampleTools, {
      budget: 500,
      floor: 2,
    });
    expect(plan.tokensAfter).toBeLessThanOrEqual(plan.tokensBefore);
    expect(plan.selected.length).toBeGreaterThan(0);
  });

  it("defers tools when budget forces selection", () => {
    const manyTools: ToolDefinition[] = Array.from({ length: 20 }, (_, i) => ({
      name: `Tool_${i}`,
      description: `Generic tool number ${i} for miscellaneous operations`,
      namespace: "general",
      inputSchema: {
        type: "object",
        properties: { a: { type: "string" }, b: { type: "string" }, c: { type: "string" } },
      },
    }));
    const plan = routeTools("read auth login file", manyTools, {
      budget: 150,
      floor: 2,
    });
    expect(plan.selected.length).toBeLessThan(manyTools.length);
  });

  it("respects maxTools cap", () => {
    const plan = routeTools("read auth login file", sampleTools, {
      budget: 5000,
      floor: 1,
      maxTools: 2,
    });
    expect(plan.selected.length).toBe(2);
    expect(plan.deferred.length).toBeGreaterThan(0);
  });

  it("falls back to top-ranked tool when budget is zero", () => {
    const plan = routeTools("read auth login file", sampleTools, {
      budget: 0,
      floor: 0,
    });
    expect(plan.selected.length).toBe(1);
  });
});

describe("scoreTool service routing", () => {
  it("penalizes wrong-service tools for service-specific tasks", () => {
    const slackScore = scoreTool("search notion for onboarding docs", sampleTools[3]!);
    const notionTool: ToolDefinition = {
      name: "mcp__notion__search",
      description: "Search Notion workspace",
      namespace: "notion",
    };
    const notionScore = scoreTool("search notion for onboarding docs", notionTool);
    expect(notionScore).toBeGreaterThan(slackScore);
  });

  it("boosts action verbs matching tool names", () => {
    const listTool: ToolDefinition = {
      name: "mcp__github__list_issues",
      description: "List GitHub issues",
      namespace: "github",
    };
    const createTool: ToolDefinition = {
      name: "mcp__github__create_pull_request",
      description: "Create pull request",
      namespace: "github",
    };
    const listScore = scoreTool("list open issues on payments repo", listTool);
    const createScore = scoreTool("list open issues on payments repo", createTool);
    expect(listScore).toBeGreaterThan(createScore);
  });

  it("normalizes pull request phrases", () => {
    const prTool: ToolDefinition = {
      name: "mcp__github__get_pull_request",
      description: "Get pull request details",
      namespace: "github",
    };
    const issueTool: ToolDefinition = {
      name: "mcp__github__list_issues",
      description: "List issues",
      namespace: "github",
    };
    const prScore = scoreTool("merge pull request after review", prTool);
    const issueScore = scoreTool("merge pull request after review", issueTool);
    expect(prScore).toBeGreaterThan(issueScore);
  });
});

describe("inferCluster", () => {
  it("maps mcp namespaces to cluster ids", () => {
    const ranked = rankTools("query datadog metrics", [
      {
        name: "mcp__datadog__query_metrics",
        namespace: "datadog",
        description: "Query metrics",
      },
    ], undefined);
    expect(ranked[0]?.cluster).toBe("datadog");
  });

  it("infers git cluster from tool names", () => {
    const ranked = rankTools("show commit history", [
      { name: "GitLog", description: "Git log" },
    ], undefined);
    expect(ranked[0]?.cluster).toBe("git");
  });

  it("infers filesystem cluster from read/write names", () => {
    const ranked = rankTools("read file", [
      { name: "ReadFile", description: "Read workspace file" },
    ], undefined);
    expect(ranked[0]?.cluster).toBe("filesystem");
  });

  it("infers runtime cluster from shell tools", () => {
    const ranked = rankTools("run build", [
      { name: "ShellExec", description: "Run shell command" },
    ], undefined);
    expect(ranked[0]?.cluster).toBe("runtime");
  });
});

describe("rankTools topK", () => {
  it("limits ranked results when topK is set", () => {
    const ranked = rankTools("read file", sampleTools, undefined, { topK: 2 });
    expect(ranked.length).toBe(2);
  });
});

describe("auditToolSurface", () => {
  it("clusters tools", () => {
    const report = auditToolSurface(sampleTools);
    expect(report.totalTools).toBe(4);
    expect(report.clusters.length).toBeGreaterThan(0);
  });
});
