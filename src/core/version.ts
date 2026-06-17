import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const pkgPath = join(dirname(fileURLToPath(import.meta.url)), "../../package.json");

/** Package version from package.json — single source of truth for CLI and MCP server. */
export const FACET_VERSION: string = JSON.parse(readFileSync(pkgPath, "utf8")).version as string;
