/** Rough token estimate (~4 chars per token for English JSON). */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / 4));
}

export function estimateToolTokens(tool: {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}): number {
  const payload = JSON.stringify({
    name: tool.name,
    description: tool.description ?? "",
    inputSchema: tool.inputSchema ?? {},
  });
  return estimateTokens(payload);
}

export function estimateToolsTokens(
  tools: Array<{ name: string; description?: string; inputSchema?: Record<string, unknown> }>,
): number {
  return tools.reduce((sum, t) => sum + estimateToolTokens(t), 0);
}
