import { access, chmod, constants, mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const initCwd = process.env.INIT_CWD;

/** When developing from the package root, npm/npx does not link the package bin. */
async function main() {
  if (!initCwd || initCwd !== root) return;

  const binJs = join(root, "bin", "facet.js");
  try {
    await access(binJs, constants.F_OK);
  } catch {
    return;
  }

  await chmod(binJs, 0o755).catch(() => {});

  const binDir = join(root, "node_modules", ".bin");
  const shim = join(binDir, "facet");
  const content =
    "#!/bin/sh\n" +
    "basedir=$(dirname \"$(echo \"$0\" | sed -e 's,\\\\,/,g')\")\n" +
    "exec node \"$basedir/../../bin/facet.js\" \"$@\"\n";

  await mkdir(binDir, { recursive: true });
  await writeFile(shim, content);
  await chmod(shim, 0o755);
}

main().catch(() => {});
