import type { FacetProfile, RankOptions, ToolDefinition } from "./types.js";

const STOP = new Set([
  "a", "an", "the", "and", "or", "to", "for", "of", "in", "on", "with", "is", "it",
  "this", "that", "from", "by", "at", "as", "be", "are", "was", "were", "your", "my",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9_]+/)
    .filter((t) => t.length > 1 && !STOP.has(t));
}

function toolDocument(tool: ToolDefinition): string {
  const parts = [tool.name, tool.namespace ?? "", tool.server ?? "", tool.description ?? ""];
  const schema = tool.inputSchema;
  if (schema?.properties && typeof schema.properties === "object") {
    parts.push(...Object.keys(schema.properties as Record<string, unknown>));
  }
  return parts.join(" ");
}

export function inferCluster(tool: ToolDefinition): string {
  const name = tool.name.toLowerCase();
  if (/^(mcp__|mcp_)/.test(name) || tool.namespace) {
    const seg = name.split(/__|_|\//).filter(Boolean);
    return seg[1] ?? seg[0] ?? "mcp";
  }
  if (/git|commit|branch|pr|github/.test(name)) return "git";
  if (/read|write|file|fs|glob|search/.test(name)) return "filesystem";
  if (/browser|web|fetch|http|url/.test(name)) return "web";
  if (/db|sql|query|database/.test(name)) return "data";
  if (/test|lint|build|run|exec|shell|bash/.test(name)) return "runtime";
  return "general";
}

export function scoreTool(task: string, tool: ToolDefinition): number {
  const taskTokens = tokenize(task);
  if (taskTokens.length === 0) return 0.01;
  const docTokens = new Set(tokenize(toolDocument(tool)));
  let hits = 0;
  for (const t of taskTokens) {
    if (docTokens.has(t)) hits += 1;
    else if ([...docTokens].some((d) => d.includes(t) || t.includes(d))) hits += 0.5;
  }
  const idfBoost = tool.name.length < 24 ? 0.05 : 0;
  return hits / taskTokens.length + idfBoost;
}

export function rankTools(
  task: string,
  tools: ToolDefinition[],
  profile: FacetProfile | undefined,
  options: RankOptions = {},
): Array<{ tool: ToolDefinition; score: number; cluster: string }> {
  const pin = new Set(profile?.pin ?? []);
  const block = new Set(profile?.block ?? []);
  const prefer = new Set((profile?.prefer ?? []).map((p) => p.toLowerCase()));

  const ranked = tools
    .filter((t) => !block.has(t.name))
    .map((tool) => {
      let score = scoreTool(task, tool);
      const cluster = inferCluster(tool);
      if (pin.has(tool.name)) score += 10;
      if (prefer.has(cluster)) score += 0.25;
      return { tool, score, cluster };
    })
    .sort((a, b) => b.score - a.score);

  const minScore = options.minScore ?? 0.05;
  const filtered = ranked.filter((r) => r.score >= minScore || pin.has(r.tool.name));
  const topK = options.topK;
  if (topK !== undefined && topK > 0) {
    return filtered.slice(0, topK);
  }
  return filtered;
}
