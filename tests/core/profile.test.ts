import { describe, expect, it } from "vitest";
import { mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { defaultConfig, loadConfig, parseConfig, resolveProfile } from "../../src/core/profile.js";
import { rankTools } from "../../src/core/tool-ranker.js";
import type { ToolDefinition } from "../../src/core/types.js";

describe("loadConfig", () => {
  it("returns defaults when facet.json is missing", () => {
    const dir = mkdtempSync(join(tmpdir(), "facet-config-"));
    const config = loadConfig(join(dir, "facet.json"));
    expect(config.version).toBe(1);
    expect(config.profiles.length).toBeGreaterThan(0);
  });

  it("reads profiles from facet.json", () => {
    const dir = mkdtempSync(join(tmpdir(), "facet-config-"));
    const path = join(dir, "facet.json");
    writeFileSync(
      path,
      JSON.stringify({
        version: 1,
        defaultBudget: 5000,
        profiles: [{ name: "custom", budget: 3000, pin: ["PinnedTool"] }],
      }),
    );
    const config = loadConfig(path);
    expect(config.defaultBudget).toBe(5000);
    expect(resolveProfile(config, "custom")?.pin).toEqual(["PinnedTool"]);
  });
});

describe("parseConfig", () => {
  it("applies defaults for missing fields", () => {
    const config = parseConfig({ version: 1 });
    expect(config.defaultBudget).toBe(8000);
    expect(config.profiles).toEqual([]);
  });
});

describe("profile pin", () => {
  const tools: ToolDefinition[] = [
    { name: "PinnedTool", description: "Always included", namespace: "general" },
    { name: "OtherTool", description: "Generic helper", namespace: "general" },
  ];

  it("boosts pinned tools in ranking", () => {
    const profile = defaultConfig().profiles[0];
    const pinned = { ...profile!, pin: ["PinnedTool"] };
    const ranked = rankTools("unrelated task string", tools, pinned);
    expect(ranked[0]?.tool.name).toBe("PinnedTool");
  });
});
