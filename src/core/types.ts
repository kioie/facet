/** Canonical tool definition shape (MCP / OpenAI function tools). */
export interface ToolDefinition {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
  server?: string;
  namespace?: string;
}

export interface ToolAuditEntry {
  tool: ToolDefinition;
  tokens: number;
  cluster: string;
}

export interface AuditReport {
  totalTools: number;
  totalTokens: number;
  entries: ToolAuditEntry[];
  clusters: ClusterSummary[];
}

export interface ClusterSummary {
  id: string;
  label: string;
  toolCount: number;
  tokens: number;
}

export interface RoutePlan {
  task: string;
  budget: number;
  selected: ToolDefinition[];
  deferred: ToolDefinition[];
  tokensBefore: number;
  tokensAfter: number;
  savingsPercent: number;
  reasons: Record<string, string>;
}

export interface FacetProfile {
  name: string;
  description?: string;
  /** Always include these tool names. */
  pin?: string[];
  /** Never surface these tool names. */
  block?: string[];
  /** Max tool-schema tokens for this profile. */
  budget?: number;
  /** Capability clusters to prefer (e.g. git, fs, browser). */
  prefer?: string[];
}

export interface DistillOptions {
  maxDescriptionLength?: number;
  stripExamples?: boolean;
  collapseEnums?: boolean;
}

export interface RankOptions {
  topK?: number;
  minScore?: number;
}
