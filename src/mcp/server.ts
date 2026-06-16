import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { auditToolSurface, routeTools } from "../index.js";
import { loadConfig, resolveProfile } from "../core/profile.js";
import type { ToolDefinition } from "../core/types.js";

const manifestCache = new Map<string, ToolDefinition[]>();
let lastManifestId: string | undefined;

function cacheManifest(tools: ToolDefinition[], id?: string): {
  manifestId: string;
  registered: number;
  totalTokens: number;
} {
  const manifestId = id ?? `m${manifestCache.size + 1}`;
  manifestCache.set(manifestId, tools);
  lastManifestId = manifestId;
  const audit = auditToolSurface(tools);
  return {
    manifestId,
    registered: tools.length,
    totalTokens: audit.totalTokens,
  };
}

function resolveManifest(manifestId?: string, tools?: ToolDefinition[]): ToolDefinition[] {
  if (tools && tools.length > 0) return tools;
  if (manifestId) {
    const cached = manifestCache.get(manifestId);
    if (!cached) {
      throw new Error(
        `Unknown manifestId "${manifestId}". Call facet_register_manifest first or pass tools inline.`,
      );
    }
    return cached;
  }
  if (lastManifestId) {
    const cached = manifestCache.get(lastManifestId);
    if (cached) return cached;
  }
  const defaultCached = manifestCache.get("default");
  if (defaultCached) return defaultCached;
  throw new Error(
    "No tool manifest available. Call facet_register_manifest({ tools }) or pass tools in facet_plan_surface.",
  );
}

export async function startFacetMcpServer(): Promise<void> {
  const server = new Server(
    { name: "facet", version: "0.1.4" },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "facet_audit_tools",
        description:
          "Measure token cost of MCP tool definitions. Pass tools JSON array or manifestId from facet_register_manifest.",
        inputSchema: {
          type: "object",
          properties: {
            tools: {
              type: "array",
              description: "Array of { name, description?, inputSchema? }",
            },
            manifestId: {
              type: "string",
              description: "Cached manifest id from facet_register_manifest",
            },
          },
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
            tools: { type: "array", description: "Full tool manifest (omit if manifestId set)" },
            manifestId: {
              type: "string",
              description: "Cached manifest from facet_register_manifest",
            },
            budget: { type: "number", description: "Max tool-schema tokens", default: 6000 },
            profile: {
              type: "string",
              description: "Profile name from facet.json (e.g. coding, review)",
            },
          },
          required: ["task"],
        },
      },
      {
        name: "facet_register_manifest",
        description:
          "Cache a tool manifest server-side for subsequent plan calls without resending full schemas.",
        inputSchema: {
          type: "object",
          properties: {
            tools: { type: "array", description: "Full tool manifest to cache" },
            id: {
              type: "string",
              description: "Optional manifest id (default: auto-generated)",
            },
          },
          required: ["tools"],
        },
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const payload = (args ?? {}) as Record<string, unknown>;

    try {
      if (name === "facet_register_manifest") {
        const tools = payload.tools as ToolDefinition[] | undefined;
        if (!tools || !Array.isArray(tools) || tools.length === 0) {
          throw new Error("facet_register_manifest requires a non-empty tools array.");
        }
        const id = payload.id ? String(payload.id) : undefined;
        return textResult(cacheManifest(tools, id));
      }

      if (name === "facet_audit_tools") {
        const tools = resolveManifest(
          payload.manifestId ? String(payload.manifestId) : undefined,
          payload.tools as ToolDefinition[] | undefined,
        );
        return textResult(auditToolSurface(tools));
      }

      if (name === "facet_plan_surface") {
        const task = String(payload.task ?? "").trim();
        if (!task) {
          throw new Error("facet_plan_surface requires a non-empty task string.");
        }

        const config = loadConfig();
        const profileName = payload.profile ? String(payload.profile) : undefined;
        const profile = resolveProfile(config, profileName);
        if (profileName && !profile) {
          throw new Error(
            `Unknown profile "${profileName}". Run facet init or add it to facet.json.`,
          );
        }

        const tools = resolveManifest(
          payload.manifestId ? String(payload.manifestId) : undefined,
          payload.tools as ToolDefinition[] | undefined,
        );

        const budget =
          payload.budget !== undefined
            ? Number(payload.budget)
            : profile?.budget ?? config.defaultBudget;

        const plan = routeTools(task, tools, { budget, profile });
        return textResult(plan);
      }

      throw new Error(`Unknown tool: ${name}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        content: [{ type: "text" as const, text: JSON.stringify({ error: message }) }],
        isError: true,
      };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

function textResult(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}
