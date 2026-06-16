import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: false,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/cli/bin.ts", "src/mcp/server.ts", "src/index.ts"],
      thresholds: {
        statements: 85,
        branches: 75,
        functions: 85,
        lines: 85,
      },
    },
  },
});
