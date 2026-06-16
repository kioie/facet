import type { FacetProfile, RankOptions, ToolDefinition } from "./types.js";

const STOP = new Set([
  "a", "an", "the", "and", "or", "to", "for", "of", "in", "on", "with", "is", "it",
  "this", "that", "from", "by", "at", "as", "be", "are", "was", "were", "your", "my",
]);

const PHRASE_ALIASES: Array<[RegExp, string]> = [
  [/\bpull\s+requests?\b/gi, "pull_request"],
  [/\berror\s+rates?\b/gi, "error_rate"],
  [/\bunit\s+tests?\b/gi, "unit_test"],
  [/\bcode\s+review\b/gi, "code_review"],
  [/\bworking\s+tree\b/gi, "working_tree"],
  [/\bwebhook\s+signature\b/gi, "webhook_signature"],
  [/\bdatabase\s+migrations?\b/gi, "database_migration"],
  [/\bconfluence\s+runbook\b/gi, "confluence_runbook"],
];

const SERVICE_ALIASES: Record<string, string[]> = {
  gcp: ["gcp", "gcloud", "google_cloud"],
  gcloud: ["gcp", "gcloud", "google_cloud"],
  jira: ["jira", "atlassian"],
  atlassian: ["jira", "atlassian", "confluence"],
};

const ACTION_VERBS = [
  "list", "create", "post", "query", "read", "write", "search", "get", "update",
  "delete", "run", "deploy", "review", "merge", "execute", "debug", "fix",
  "investigate", "check",
];

const KNOWN_SERVICES = [
  "datadog", "notion", "slack", "github", "stripe", "linear", "figma", "sentry",
  "postgres", "kubernetes", "jira", "atlassian", "gcp", "gcloud", "cloudflare",
  "supabase", "vercel", "redis", "mongodb", "docker",
];

const MONOREPO_RUNTIMES = ["turbo", "nx", "pnpm", "lerna"];

function normalizeTaskText(text: string): string {
  let normalized = text.toLowerCase();
  for (const [pattern, alias] of PHRASE_ALIASES) {
    normalized = normalized.replace(pattern, alias);
  }
  return normalized;
}

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
  if (/datadog|sentry|metrics|observability/.test(name) || tool.namespace === "datadog") return "observability";
  if (/test|lint|build|run|exec|shell|bash/.test(name)) return "runtime";
  return "general";
}

export function scoreTool(task: string, tool: ToolDefinition): number {
  const taskNormalized = normalizeTaskText(task);
  const taskTokens = tokenize(taskNormalized);
  if (taskTokens.length === 0) return 0.01;
  const docTokens = new Set(tokenize(toolDocument(tool)));
  let hits = 0;
  for (const t of taskTokens) {
    if (docTokens.has(t)) hits += 1;
    else if ([...docTokens].some((d) => d.includes(t) || t.includes(d))) hits += 0.5;
  }
  const idfBoost = tool.name.length < 24 ? 0.05 : 0;
  let score = hits / taskTokens.length + idfBoost;
  const taskLower = taskNormalized;
  const toolDocLower = toolDocument(tool).toLowerCase();
  const ns = tool.namespace?.toLowerCase();

  if (ns && taskLower.includes(ns)) score += 0.5;
  else if (taskLower.includes("datadog") && /datadog|metrics/.test(tool.name.toLowerCase())) score += 0.5;

  for (const verb of ACTION_VERBS) {
    const verbPattern = new RegExp(`\\b${verb}\\b`);
    if (
      verbPattern.test(taskLower) &&
      (toolDocLower.includes(verb) || tool.name.toLowerCase().includes(verb))
    ) {
      score += 0.3;
      break;
    }
  }

  const serviceMatches = [
    ...taskLower.matchAll(new RegExp(`\\b(${KNOWN_SERVICES.join("|")})\\b`, "g")),
  ].map((match) => match[1]!);
  if (serviceMatches.length > 0) {
    const toolNs = ns ?? tool.name.toLowerCase().split("__")[1];
    const toolName = tool.name.toLowerCase();
    const matchesService = serviceMatches.some((service) => {
      const aliases = SERVICE_ALIASES[service] ?? [service];
      return aliases.some(
        (alias) => toolNs === alias || toolName.includes(alias),
      );
    });
    if (!matchesService) {
      score = Math.min(score * 0.05, 0.04);
    } else {
      score += 0.35;
    }
  }

  const toolNs = ns ?? tool.name.toLowerCase().split("__")[1];
  const wantsMonorepoRuntime =
    /\b(test|tests|build|lint|install|deps|dependencies)\b/.test(taskLower) ||
    /\b(run|execute)\b/.test(taskLower);
  const isMonorepoContext = /\b(monorepo|workspace|packages\/|apps\/)\b/.test(taskLower);
  const isInstallDepsTask =
    /\binstall\b/.test(taskLower) && /\b(deps|dependencies)\b/.test(taskLower);
  const runtimeMatch = taskLower.match(/\b(nx|turbo|pnpm|lerna)\b/);

  if (/\bgrep\b/.test(taskLower) && /grep|search/.test(toolDocLower)) score += 0.45;
  if (/\b(fix|read|edit|update)\b/.test(taskLower) && toolNs === "filesystem") score += 0.35;
  if (/\binstall\b/.test(taskLower) && /\b(deps|dependencies|workspace)\b/.test(taskLower) && toolNs === "pnpm") {
    score += 0.55;
  }

  if (/\bgrep\b/.test(taskLower) && toolNs && MONOREPO_RUNTIMES.includes(toolNs)) score *= 0.04;
  if (/\b(fix|read|edit|debug)\b/.test(taskLower) && toolNs === "notion") score *= 0.04;
  if (runtimeMatch && toolNs && MONOREPO_RUNTIMES.includes(toolNs) && toolNs !== runtimeMatch[1]) {
    score *= 0.06;
  }
  if (
    (/\binstall\b/.test(taskLower) && /\b(deps|dependencies)\b/.test(taskLower)) ||
    /\bpnpm\b/.test(taskLower)
  ) {
    if (toolNs && MONOREPO_RUNTIMES.includes(toolNs) && toolNs !== "pnpm") score *= 0.06;
  }

  if (runtimeMatch && toolNs === runtimeMatch[1]) {
    score += 0.65;
  } else if (
    isMonorepoContext &&
    wantsMonorepoRuntime &&
    !isInstallDepsTask &&
    toolNs &&
    MONOREPO_RUNTIMES.includes(toolNs)
  ) {
    score += 0.4;
    if (/\b(test|tests)\b/.test(taskLower) && !runtimeMatch && toolNs === "turbo") score += 0.25;
  } else if (toolNs && MONOREPO_RUNTIMES.includes(toolNs) && !wantsMonorepoRuntime && !runtimeMatch) {
    score *= 0.04;
  }

  if (/\b(migration|migrate|sql|postgres|database)\b/.test(taskLower)) {
    if (toolNs === "postgres" || /postgres|sql|database/.test(toolDocLower)) score += 0.35;
  }

  return score;
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
