// A standalone native endpoint normalizes raw input and enforces only its own physical checkout.
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { denial, normalizeEndpointInvocation, isSerenaTool } from "./agent-policy-router.mjs";
import { decide } from "./agent-secret-guard.mjs";

const root = realpathSync(resolve(dirname(process.argv[1]), ".."));
let result;
try {
  // Harness authority is an adapter/router CLI argument, never a caller's tool_input or payload field.
  const args = process.argv.slice(2);
  let harness;
  if (args.length) {
    if (
      args.length !== 2 ||
      args[0] !== "--harness" ||
      !["claude", "codex", "opencode", "commandcode"].includes(args[1])
    )
      throw new Error("Invalid harness");
    harness = args[1];
  }
  const payload = JSON.parse(readFileSync(0, "utf8"));
  const calls = normalizeEndpointInvocation(payload);
  if (!calls.length) throw new Error("Empty invocation batch");
  // The proxy already owns semantic preflight, including non-namespace tool names.
  if (harness === "opencode" || !isSerenaTool(calls[0].native_tool_name)) {
    const policy = JSON.parse(readFileSync(join(root, ".agents/agent-policy.json"), "utf8"));
    const seen = new Set();
    for (const call of calls) {
      if (call.repo_root !== root) continue;
      const key = `${call.target_kind ?? "dereference"}:${call.target_path ?? ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      // Namespace authority comes only from the strict internal decoder, never original tool_input flags.
      result = decide(call, policy, root, call.version === 2 ? call.target_kind : "dereference");
      if (result) break;
      if (call.tool_name !== "Bash" || !existsSync(join(root, "hippo.lock"))) continue;
      const native = join(root, ".claude/hooks/require-hippo-boundary.sh");
      const delegate = existsSync(native) ? native : join(root, "scripts/agent-hippo-guard.sh");
      if (!existsSync(delegate)) {
        result = denial("Repository compute guard is unavailable; tool refused.");
        break;
      }
      const child = spawnSync("/bin/bash", [delegate], {
        cwd: root,
        input: JSON.stringify(call),
        encoding: "utf8",
        timeout: 10000,
        maxBuffer: 1024 * 1024,
        env: { ...process.env, CLAUDE_PROJECT_DIR: root },
        stdio: ["pipe", "pipe", "ignore"],
      });
      if (child.error || child.status !== 0) result = denial("Repository compute guard failed; tool refused.");
      else if (child.stdout.trim()) result = JSON.parse(child.stdout);
      if (result) break;
    }
  }
} catch {
  result = denial("Repository policy could not normalize or evaluate this invocation; tool refused.");
}
if (result) process.stdout.write(`${JSON.stringify(result)}\n`);
