import { describe, expect, it } from "vitest";
import { distillTool } from "../../src/core/schema-distill.js";
import type { ToolDefinition } from "../../src/core/types.js";

describe("distillTool", () => {
  it("shortens long descriptions", () => {
    const tool: ToolDefinition = {
      name: "X",
      description: "A".repeat(200),
    };
    const out = distillTool(tool, { maxDescriptionLength: 50 });
    expect(out.description!.length).toBeLessThanOrEqual(50);
  });

  it("collapses enum variants when enabled", () => {
    const tool: ToolDefinition = {
      name: "StateTool",
      inputSchema: {
        type: "object",
        properties: {
          state: {
            type: "string",
            enum: ["a", "b", "c", "d", "e", "f", "g", "h"],
          },
        },
      },
    };
    const out = distillTool(tool, { collapseEnums: true });
    const state = (out.inputSchema as { properties: { state: { enum?: string[] } } }).properties.state;
    expect(state.enum?.length).toBe(5);
  });

  it("strips examples from descriptions when stripExamples is set", () => {
    const tool: ToolDefinition = {
      name: "ExampleTool",
      description: "Read a file. Example: /tmp/foo",
    };
    const out = distillTool(tool, { stripExamples: true });
    expect(out.description).not.toContain("Example:");
  });
});
