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
const agent = runFixture("agent-tools.json", budget);
const mcp = runFixture("mcp-heavy.json", budget);

const report = [
  "# Facet evaluation report",
  "",
  agent.report,
  "",
  mcp.report,
  "",
  `Aggregate: ${agent.hits + mcp.hits}/${agent.total + mcp.total}`,
].join("\n");

writeFileSync(join(__dirname, "results.md"), report);
console.log(report);

process.exit(agent.hits + mcp.hits === agent.total + mcp.total ? 0 : 1);
