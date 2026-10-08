// Run the actual plugin with controlled spawn and timer host boundaries; write observations only to a private file.
import childProcess from "node:child_process";
import { EventEmitter } from "node:events";
import { readFileSync, writeFileSync } from "node:fs";
import { stripTypeScriptTypes, syncBuiltinESMExports } from "node:module";

const [, , pluginPath] = process.argv;
const { directory, call, report, completion, lateDelivery } = JSON.parse(readFileSync(0, "utf8"));
let now = 0;
let nextId = 0;
const pending = new Map();
const requests = [];
const signals = [];
const cleared = [];
const snapshots = [];
let child;
let argumentsReceived;
let forwarded;
let spawnedCount = 0;
let notifySpawn;
let childReady = new Promise((resolve) => {
  notifySpawn = resolve;
});
globalThis.setTimeout = (callback, milliseconds) => {
  const id = ++nextId;
  requests.push(milliseconds);
  pending.set(id, { callback, due: now + milliseconds });
  return id;
};
globalThis.clearTimeout = (id) => {
  cleared.push(id);
  pending.delete(id);
};
childProcess.spawn = (binary, args, options) => {
  spawnedCount += 1;
  argumentsReceived = { binary, args, options };
  child = new EventEmitter();
  child.stdin = new EventEmitter();
  child.stdin.end = (text) => {
    forwarded = text;
  };
  child.kill = (signal) => {
    signals.push({ signal, at: now });
    if (signal === "SIGKILL") child.emit("exit", null, signal);
    return true;
  };
  notifySpawn();
  return child;
};
syncBuiltinESMExports();

const flush = async () => {
  await Promise.resolve();
};
const advance = async (instant) => {
  now = instant;
  // Due-time and insertion order reproduce the host's ordered delivery of these two armed timers.
  for (const [id, timer] of [...pending].sort((a, b) => a[1].due - b[1].due || a[0] - b[0])) {
    if (timer.due <= now && pending.has(id)) {
      pending.delete(id);
      timer.callback();
      await flush();
    }
  }
  snapshots.push({ at: now, signals: signals.map(({ signal }) => signal), pending: pending.size });
};
const source = stripTypeScriptTypes(readFileSync(pluginPath, "utf8"));
const exported = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
const hooks = await exported.FerretPlugin({ directory, worktree: directory, project: { id: "example" }, client: {} });
await hooks[call.hook](...call.args);
await childReady;
if (!child) throw new Error("actual plugin never spawned its capture child");
if (completion) {
  child.emit(completion === "error" ? "error" : "exit", completion === "error" ? new Error("owned fake failure") : 0);
  await flush();
  await advance(1000);
} else if (lateDelivery) {
  await advance(1250);
} else {
  for (const instant of [899, 900, 999, 1000]) await advance(instant);
}
const first = {
  requests: [...requests],
  signals: [...signals],
  cleared: [...cleared],
  snapshots,
  argumentsReceived,
  forwarded,
  pending: pending.size,
};
// A second capture can spawn only after the actual plugin's first forward promise resolved and its queue retired.
childReady = new Promise((resolve) => {
  notifySpawn = resolve;
});
await hooks[call.hook](...call.args);
await childReady;
child.emit("exit", 0);
await flush();
writeFileSync(report, JSON.stringify({ ...first, queueRetired: spawnedCount === 2, finalPending: pending.size }));
