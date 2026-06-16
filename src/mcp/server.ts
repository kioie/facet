import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { auditToolSurface, routeTools } from "../index.js";
import type { ToolDefinition } from "../core/types.js";

let lastManifest: ToolDefinition[] = [];

export async function startFacetMcpServer(): Promise<void> {
  const server = new Server(
    { name: "facet", version: "0.1.0" },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "facet_audit_tools",
        description:
          "Measure token cost of MCP tool definitions. Pass tools JSON array as the manifest argument.",
        inputSchema: {
          type: "object",
          properties: {
            tools: {
              type: "array",
              description: "Array of { name, description?, inputSchema? }",
            },
          },
          required: ["tools"],
        },
      },
      {
        name: "facet_plan_surface",
        description:
          "Select a task-aware subset of tools under a token budget. Returns selected tools, deferred tools, and savings.",
        inputSchema: {
          type: "object",
          properties: {
            task: { type: "string", description: "Current agent task or user message" },
            tools: { type: "array", description: "Full tool manifest" },
            budget: { type: "number", description: "Max tool-schema tokens", default: 6000 },
            profile: { type: "string", description: "Optional profile: coding | review" },
          },
          required: ["task", "tools"],
        },
      },
      {
        name: "facet_register_manifest",
        description:
          "Cache a tool manifest server-side for subsequent plan calls without resending full schemas.",
        inputSchema: {
          type: "object",
          properties: {
            tools: { type: "array" },
          },
          required: ["tools"],
        },
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const payload = (args ?? {}) as Record<string, unknown>;

    if (name === "facet_register_manifest") {
      lastManifest = (payload.tools as ToolDefinition[]) ?? [];
      return textResult({ registered: lastManifest.length });
    }

    if (name === "facet_audit_tools") {
      const tools = (payload.tools as ToolDefinition[]) ?? lastManifest;
      return textResult(auditToolSurface(tools));
    }

    if (name === "facet_plan_surface") {
      const task = String(payload.task ?? "");
      const tools =
        (payload.tools as ToolDefinition[] | undefined) ?? lastManifest;
      const budget = Number(payload.budget ?? 6000);
      const plan = routeTools(task, tools, { budget });
      return textResult(plan);
    }

    throw new Error(`Unknown tool: ${name}`);
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

function textResult(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}
