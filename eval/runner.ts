import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { routeTools } from "../src/core/router.js";
import type { ToolDefinition } from "../src/core/types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

interface EvalCase {
  task: string;
  expectIncludes: string[];
  expectExcludes?: string[];
}

interface EvalFixture {
  tools: ToolDefinition[];
  cases: EvalCase[];
}

function loadFixture(name: string): EvalFixture {
  return JSON.parse(
    readFileSync(join(__dirname, "fixtures", name), "utf8"),
  ) as EvalFixture;
}

function runFixture(name: string, budgetTokens: number) {
  const fx = loadFixture(name);
  let hits = 0;
  let total = 0;
  const lines: string[] = [`# Eval: ${name}`, ""];

  for (const c of fx.cases) {
    total += 1;
    const plan = routeTools(c.task, fx.tools, { budget: budgetTokens, floor: 2, maxTools: 4 });
    const names = new Set(plan.selected.map((t) => t.name));
    const includesOk = c.expectIncludes.every((n) => names.has(n));
    const excludesOk = (c.expectExcludes ?? []).every((n) => !names.has(n));
    const ok = includesOk && excludesOk;
    if (ok) hits += 1;
    lines.push(
      `- [${ok ? "x" : " "}] \`${c.task}\` → ${[...names].join(", ")}`,
    );
  }

  lines.push("", `**Score:** ${hits}/${total} (${((hits / total) * 100).toFixed(0)}%)`);
  return { hits, total, report: lines.join("\n") };
}

const budget = Number(process.env.FACET_EVAL_BUDGET ?? 450);
const fixtures = [
  "agent-tools.json",
  "cursor-tools.json",
  "mcp-heavy.json",
  "github-tools.json",
  "edge-cases.json",
  "ops-tools.json",
  "monorepo.json",
] as const;
const results = fixtures.map((name) => ({ name, ...runFixture(name, budget) }));

const report = [
  "# Facet evaluation report",
  "",
  ...results.flatMap((r) => [r.report, ""]),
  `Aggregate: ${results.reduce((s, r) => s + r.hits, 0)}/${results.reduce((s, r) => s + r.total, 0)}`,
].join("\n");

writeFileSync(join(__dirname, "results.md"), report);
console.log(report);

const allPass = results.every((r) => r.hits === r.total);
process.exit(allPass ? 0 : 1);
