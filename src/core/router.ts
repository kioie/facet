import { distillTools } from "./schema-distill.js";
import { estimateToolTokens, estimateToolsTokens } from "./tokenizer.js";
import { inferCluster, rankTools } from "./tool-ranker.js";
import type { AuditReport, FacetProfile, RoutePlan, ToolDefinition } from "./types.js";

export interface RouteOptions {
  budget: number;
  profile?: FacetProfile;
  distill?: boolean;
  /** Minimum tools to keep even if over budget (pinned + top seed). */
  floor?: number;
  /** Hard cap on selected tool count. */
  maxTools?: number;
}

export function routeTools(
  task: string,
  tools: ToolDefinition[],
  options: RouteOptions,
): RoutePlan {
  const { budget, profile, distill = true, floor = 3, maxTools } = options;
  const tokensBefore = estimateToolsTokens(tools);

  const ranked = rankTools(task, tools, profile);
  const reasons: Record<string, string> = {};

  const selected: ToolDefinition[] = [];
  const deferred: ToolDefinition[] = [];
  let used = 0;

  for (const { tool, score, cluster } of ranked) {
    const candidate = distill ? distillTools([tool]).tools[0]! : tool;
    const cost = estimateToolTokens(candidate);
    if (maxTools !== undefined && selected.length >= maxTools) {
      deferred.push(tool);
      reasons[tool.name] = "deferred: maxTools cap";
      continue;
    }
    if (selected.length < floor || used + cost <= budget) {
      selected.push(candidate);
      used += cost;
      reasons[tool.name] = `score=${score.toFixed(2)} cluster=${cluster}`;
    } else {
      deferred.push(tool);
      reasons[tool.name] = `deferred: budget (${cost} tok)`;
    }
  }

  if (selected.length === 0 && ranked.length > 0) {
    const fallback = distill ? distillTools([ranked[0]!.tool]).tools[0]! : ranked[0]!.tool;
    selected.push(fallback);
    reasons[fallback.name] = "fallback: top-ranked";
  }

  const tokensAfter = estimateToolsTokens(selected);
  const savingsPercent =
    tokensBefore > 0 ? ((tokensBefore - tokensAfter) / tokensBefore) * 100 : 0;

  return {
    task,
    budget,
    selected,
    deferred,
    tokensBefore,
    tokensAfter,
    savingsPercent,
    reasons,
  };
}

export function auditToolSurface(tools: ToolDefinition[]): AuditReport {
  const entries = tools.map((tool) => ({
    tool,
    tokens: estimateToolTokens(tool),
    cluster: inferCluster(tool),
  }));
  const clusterMap = new Map<string, { toolCount: number; tokens: number }>();
  for (const e of entries) {
    const cur = clusterMap.get(e.cluster) ?? { toolCount: 0, tokens: 0 };
    cur.toolCount += 1;
    cur.tokens += e.tokens;
    clusterMap.set(e.cluster, cur);
  }
  return {
    totalTools: tools.length,
    totalTokens: entries.reduce((s, e) => s + e.tokens, 0),
    entries,
    clusters: [...clusterMap.entries()].map(([id, v]) => ({
      id,
      label: id,
      toolCount: v.toolCount,
      tokens: v.tokens,
    })),
  };
}
