import { mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { resolvePathWithinCwd } from "../../src/core/paths.js";

describe("resolvePathWithinCwd", () => {
  it("allows paths inside cwd", () => {
    const dir = mkdtempSync(join(tmpdir(), "facet-in-"));
    const file = join(dir, "tools.json");
    writeFileSync(file, "[]", "utf8");
    expect(resolvePathWithinCwd("tools.json", dir)).toBe(file);
  });

  it("blocks path traversal", () => {
    const dir = mkdtempSync(join(tmpdir(), "facet-out-"));
    expect(() => resolvePathWithinCwd("../../../etc/passwd", dir)).toThrow(/working directory/);
  });
});
