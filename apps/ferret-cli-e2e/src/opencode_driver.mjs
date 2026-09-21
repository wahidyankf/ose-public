// Replays OpenCode plugin hook calls against the repository's FERRET plugin the way OpenCode itself would.
//
// usage: node opencode_driver.mjs <plugin-path> '<{"directory": "...", "calls": [{"hook": "...", "args": [...]}]}>'
//
// The plugin is TypeScript in a package whose type is CommonJS, so its types are stripped and it is imported as a
// module from memory; it uses only Node built-ins. Each exported plugin is built with a minimal context, then the
// named hooks are called in order. The driver writes nothing to standard output or standard error, and it lets the
// event loop drain, so the process ends only when every child the plugin started has ended.
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";

const [, , pluginPath, request] = process.argv;
const { directory, calls } = JSON.parse(request);
const source = stripTypeScriptTypes(readFileSync(pluginPath, "utf8"));
const exported = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);

for (const plugin of Object.values(exported)) {
  const hooks = await plugin({ directory, worktree: directory, project: { id: "example" }, client: {} });
  for (const { hook, args } of calls) {
    const handler = hooks[hook];
    if (handler) {
      await handler(...args);
    }
  }
}
