// Replays OpenCode plugin hook calls against the repository's FERRET plugin the way OpenCode itself would.
//
// usage: node opencode_driver.mjs <plugin-path>, with {"directory": "...", "calls": [{"hook": "...", "args": [...]}]}
// on standard input, and optionally "spawnLog": "<path>"
//
// The request arrives on standard input rather than as an argument, because a call can carry a tool result of
// megabytes and an argument list has a host limit far below that.
//
// The plugin is TypeScript in a package whose type is CommonJS, so its types are stripped and it is imported as a
// module from memory; it uses only Node built-ins. Each exported plugin is built with a minimal context, then the
// named hooks are called in order. The driver writes nothing to standard output or standard error, and it lets the
// event loop drain, so the process ends only when every child the plugin started has ended.
//
// With "spawnLog", the driver also notes the instant each child was spawned, on the monotonic clock the tests read
// (nanoseconds, one per line, written when the process exits). The plugin arms its TERM and KILL timers only after
// spawn returns, so this instant is where they are timed from. Spawning itself is unchanged: the original function
// runs, and the note is only kept in memory until exit, so it adds no I/O to the path it measures.
import childProcess from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { stripTypeScriptTypes, syncBuiltinESMExports } from "node:module";

const [, , pluginPath] = process.argv;
const { directory, calls, spawnLog } = JSON.parse(readFileSync(0, "utf8"));

if (spawnLog) {
  const spawned = [];
  const original = childProcess.spawn;
  childProcess.spawn = (...args) => {
    const child = original(...args);
    spawned.push(process.hrtime.bigint());
    return child;
  };
  syncBuiltinESMExports();
  process.on("exit", () => writeFileSync(spawnLog, spawned.map((instant) => `${instant}\n`).join("")));
}
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
