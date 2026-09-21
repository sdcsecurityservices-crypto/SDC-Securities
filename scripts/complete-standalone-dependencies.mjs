// Vinext beta flattens packages by name, dropping nested dependency versions
// and their distinct transitive dependencies. Restore the runtime dependency
// graph at the same relative locations as npm's installed tree.
import {
  existsSync,
  readdirSync,
  readFileSync,
  cpSync,
  realpathSync,
} from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
const root = process.cwd(),
  sourceModules = path.join(root, "node_modules"),
  output = path.join(root, "dist/standalone/node_modules");
if (process.env.SDC_RUNTIME !== "sites" && existsSync(output)) {
  const resolvePackage = (name, from) => {
    const require = createRequire(from);
    for (const folder of require.resolve.paths(name + "/package.json") || []) {
      const candidate = path.join(folder, name, "package.json");
      if (
        existsSync(candidate) &&
        JSON.parse(readFileSync(candidate, "utf8")).name === name
      )
        return realpathSync(candidate);
    }
    return null;
  };
  const queue = [],
    seen = new Set();
  for (const entry of readdirSync(output, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === ".bin") continue;
    const names = entry.name.startsWith("@")
      ? readdirSync(path.join(output, entry.name)).map(
          (n) => entry.name + "/" + n,
        )
      : [entry.name];
    for (const name of names) {
      const source = resolvePackage(name, path.join(root, "package.json"));
      if (source) queue.push(source);
    }
  }
  while (queue.length) {
    const packageFile = queue.shift();
    if (seen.has(packageFile)) continue;
    seen.add(packageFile);
    const source = path.dirname(packageFile),
      relative = path.relative(sourceModules, source);
    if (relative.startsWith("..") || path.isAbsolute(relative))
      throw Error("Runtime package resolves outside the npm workspace");
    const target = path.join(output, relative);
    cpSync(source, target, {
      recursive: true,
      dereference: true,
      filter: (file) =>
        !path.relative(source, file).split(path.sep).includes("node_modules"),
    });
    const pkg = JSON.parse(readFileSync(packageFile, "utf8")),
      required = Object.keys(pkg.dependencies || {}),
      optional = Object.keys(pkg.optionalDependencies || {}),
      peers = Object.keys(pkg.peerDependencies || {});
    for (const dep of new Set([...required, ...optional, ...peers])) {
      const resolved = resolvePackage(dep, packageFile);
      if (resolved) queue.push(resolved);
      else if (required.includes(dep) && !optional.includes(dep))
        throw Error(
          `Missing runtime dependency ${dep} required by ${pkg.name}`,
        );
    }
  }
  console.log(
    `Standalone runtime: preserved ${seen.size} package locations and their dependency versions.`,
  );
}
