// Vinext beta's standalone copier flattens runtime packages and excludes each
// package's nested node_modules. Preserve nested dependency versions required
// by ExcelJS/archiver (notably readable-stream v2 alongside v3).
import { existsSync, readdirSync, cpSync } from "node:fs";
import path from "node:path";
const root = process.cwd(),
  output = path.join(root, "dist/standalone/node_modules");
if (process.env.SDC_RUNTIME !== "sites" && existsSync(output)) {
  let count = 0;
  for (const entry of readdirSync(output, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === ".bin") continue;
    const names = entry.name.startsWith("@")
      ? readdirSync(path.join(output, entry.name)).map(
          (name) => entry.name + "/" + name,
        )
      : [entry.name];
    for (const name of names) {
      const source = path.join(root, "node_modules", name, "node_modules");
      if (!existsSync(source)) continue;
      cpSync(source, path.join(output, name, "node_modules"), {
        recursive: true,
        dereference: true,
      });
      count++;
    }
  }
  console.log(
    `Standalone runtime: preserved nested dependencies for ${count} packages.`,
  );
}
