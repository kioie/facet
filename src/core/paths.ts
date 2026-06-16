import { isAbsolute, relative, resolve } from "node:path";

/** Resolve a user path relative to cwd; rejects traversal outside cwd. */
export function resolvePathWithinCwd(path: string, cwd = process.cwd()): string {
  const base = resolve(cwd);
  const abs = isAbsolute(path) ? resolve(path) : resolve(base, path);
  const rel = relative(base, abs);
  if (rel.startsWith("..") || isAbsolute(rel)) {
    throw new Error(`Path must stay within the working directory: ${path}`);
  }
  return abs;
}
