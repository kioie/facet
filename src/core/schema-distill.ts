import type { DistillOptions, ToolDefinition } from "./types.js";
import { estimateToolTokens } from "./tokenizer.js";

const DEFAULT_MAX_DESC = 120;

export function distillTool(
  tool: ToolDefinition,
  options: DistillOptions = {},
): ToolDefinition {
  const maxDesc = options.maxDescriptionLength ?? DEFAULT_MAX_DESC;
  let description = (tool.description ?? "").trim();
  if (options.stripExamples) {
    description = description.replace(/\bExample:.*$/gim, "").trim();
  }
  if (description.length > maxDesc) {
    description = description.slice(0, maxDesc - 1).trimEnd() + "…";
  }

  const inputSchema = distillSchema(tool.inputSchema ?? {}, options);
  return { ...tool, description, inputSchema };
}

export function distillSchema(
  schema: Record<string, unknown>,
  options: DistillOptions,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (typeof schema.type === "string") out.type = schema.type;
  if (schema.description && typeof schema.description === "string") {
    const d = schema.description as string;
    out.description =
      d.length > 80 ? d.slice(0, 79).trimEnd() + "…" : d;
  }
  if (schema.required && Array.isArray(schema.required)) {
    out.required = schema.required;
  }
  if (schema.properties && typeof schema.properties === "object") {
    const props: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(
      schema.properties as Record<string, unknown>,
    )) {
      if (typeof v === "object" && v !== null) {
        const pv = v as Record<string, unknown>;
        const entry: Record<string, unknown> = { type: pv.type ?? "string" };
        if (pv.description && typeof pv.description === "string") {
          entry.description =
            pv.description.length > 60
              ? pv.description.slice(0, 59).trimEnd() + "…"
              : pv.description;
        }
        if (options.collapseEnums && Array.isArray(pv.enum)) {
          entry.enum = pv.enum.slice(0, 5);
        }
        props[k] = entry;
      }
    }
    out.properties = props;
  }
  return out;
}

export function distillTools(
  tools: ToolDefinition[],
  options?: DistillOptions,
): { tools: ToolDefinition[]; tokensBefore: number; tokensAfter: number } {
  const tokensBefore = tools.reduce((s, t) => s + estimateToolTokens(t), 0);
  const distilled = tools.map((t) => distillTool(t, options));
  const tokensAfter = distilled.reduce((s, t) => s + estimateToolTokens(t), 0);
  return { tools: distilled, tokensBefore, tokensAfter };
}
