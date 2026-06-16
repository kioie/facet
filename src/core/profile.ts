import { readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import type { FacetProfile } from "./types.js";

const ProfileSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  pin: z.array(z.string()).optional(),
  block: z.array(z.string()).optional(),
  budget: z.number().int().positive().optional(),
  prefer: z.array(z.string()).optional(),
});

const ConfigSchema = z.object({
  version: z.literal(1),
  defaultBudget: z.number().int().positive().default(8000),
  profiles: z.array(ProfileSchema).default([]),
});

export type FacetConfig = z.infer<typeof ConfigSchema>;

export function parseConfig(raw: unknown): FacetConfig {
  return ConfigSchema.parse(raw);
}

export function defaultConfig(): FacetConfig {
  return {
    version: 1,
    defaultBudget: 8000,
    profiles: [
      {
        name: "coding",
        description: "File, git, and runtime tools for implementation work",
        prefer: ["filesystem", "git", "runtime"],
        budget: 6000,
      },
      {
        name: "review",
        description: "Read-heavy profile for code review and exploration",
        prefer: ["filesystem", "git"],
        budget: 4000,
      },
    ],
  };
}

export function resolveProfile(
  config: FacetConfig,
  name?: string,
): FacetProfile | undefined {
  if (!name) return undefined;
  return config.profiles.find((p) => p.name === name);
}

/** Read facet.json from cwd (or path); fall back to built-in defaults. */
export function loadConfig(configPath?: string): FacetConfig {
  const path = configPath ?? join(process.cwd(), "facet.json");
  try {
    const raw = JSON.parse(readFileSync(path, "utf8")) as unknown;
    return parseConfig(raw);
  } catch {
    return defaultConfig();
  }
}
