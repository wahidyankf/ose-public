import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";

const [configPath, repositoryRoot, nodeModulesDirectory, snapshotRoot, outputPath] = process.argv.slice(2);

if (![configPath, repositoryRoot, nodeModulesDirectory, snapshotRoot, outputPath].every(isAbsolute)) {
  throw new Error("the snapshot formatter requires absolute context paths");
}

const contains = (root, candidate) => {
  const remainder = relative(root, candidate);
  return remainder === "" || (!remainder.startsWith(`..${sep}`) && remainder !== "..");
};

if (!contains(repositoryRoot, nodeModulesDirectory)) {
  throw new Error("the formatter dependency directory escapes its repository root");
}
if (!contains(snapshotRoot, configPath)) {
  throw new Error("the Prettier configuration escapes the snapshot");
}

const config = JSON.parse(readFileSync(configPath, "utf8"));
const resolver = createRequire(resolve(repositoryRoot, "package.json"));
const plugins = config.plugins ?? [];

if (!Array.isArray(plugins) || !plugins.every((plugin) => typeof plugin === "string")) {
  throw new Error("the Prettier plugin list must contain only package names");
}

config.plugins = plugins.map((plugin) => {
  if (isAbsolute(plugin) || plugin.includes("..")) {
    throw new Error("the Prettier plugin list must not contain path-shaped entries");
  }
  const resolved = resolver.resolve(plugin);
  if (!contains(nodeModulesDirectory, resolved)) {
    throw new Error(`the Prettier plugin resolves outside node_modules: ${plugin}`);
  }
  return resolved;
});

if (typeof config.tailwindStylesheet === "string") {
  if (isAbsolute(config.tailwindStylesheet)) {
    throw new Error("the Tailwind stylesheet must be repository-relative");
  }
  const stylesheet = resolve(repositoryRoot, config.tailwindStylesheet);
  if (!contains(repositoryRoot, stylesheet)) {
    throw new Error("the Tailwind stylesheet escapes the repository");
  }
  config.tailwindStylesheet = stylesheet;
}

writeFileSync(outputPath, `${JSON.stringify(config)}\n`, { mode: 0o600 });
