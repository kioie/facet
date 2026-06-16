import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const bin = join(process.cwd(), "bin/facet.js");

function run(args: string[]): string {
  return execFileSync("node", [bin, ...args], { encoding: "utf8" });
}

describe("facet CLI", () => {
  it("runs demo --json", () => {
    const data = JSON.parse(run(["demo", "--json"])) as Array<{ task: string; selected: unknown[] }>;
    expect(data.length).toBe(3);
    expect(data[0].task).toContain("login");
    expect(data[0].selected.length).toBeGreaterThan(0);
  });

  it("runs audit --json on built-in demo manifest via plan", () => {
    const out = run(["plan", "read source files", "--json"]);
    const plan = JSON.parse(out) as { selected: unknown[]; tokensAfter: number };
    expect(plan.selected.length).toBeGreaterThan(0);
    expect(plan.tokensAfter).toBeGreaterThan(0);
  });

  it("runs doctor", () => {
    const out = run(["doctor"]);
    expect(out).toContain("facet CLI");
  });
});
