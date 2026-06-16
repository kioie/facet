import { describe, expect, it } from "vitest";
import { estimateTokens, estimateToolTokens, estimateToolsTokens } from "../../src/core/tokenizer.js";

describe("estimateTokens", () => {
  it("returns 0 for empty string", () => {
    expect(estimateTokens("")).toBe(0);
  });

  it("returns at least 1 for non-empty text", () => {
    expect(estimateTokens("hi")).toBe(1);
  });
});

describe("estimateToolTokens", () => {
  it("sums name, description, and schema", () => {
    const tokens = estimateToolTokens({
      name: "Read",
      description: "Read a file",
      inputSchema: { type: "object" },
    });
    expect(tokens).toBeGreaterThan(0);
  });

  it("handles missing optional fields", () => {
    expect(estimateToolTokens({ name: "X" })).toBeGreaterThan(0);
  });
});

describe("estimateToolsTokens", () => {
  it("aggregates multiple tools", () => {
    const total = estimateToolsTokens([
      { name: "A" },
      { name: "B", description: "longer description here" },
    ]);
    expect(total).toBeGreaterThan(estimateToolTokens({ name: "A" }));
  });
});
