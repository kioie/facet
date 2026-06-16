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

describe("distillTool", () => {
  it("shortens long descriptions", () => {
    const tool: ToolDefinition = {
      name: "X",
      description: "A".repeat(200),
    };
    const out = distillTool(tool, { maxDescriptionLength: 50 });
    expect(out.description!.length).toBeLessThanOrEqual(50);
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
});

describe("auditToolSurface", () => {
  it("clusters tools", () => {
    const report = auditToolSurface(sampleTools);
    expect(report.totalTools).toBe(4);
    expect(report.clusters.length).toBeGreaterThan(0);
  });
});
