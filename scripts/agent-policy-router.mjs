// Transport only: each physical destination owns the decision returned by its endpoint.
import { existsSync, realpathSync, statSync, readFileSync } from "node:fs";
import { dirname, basename, isAbsolute, resolve, join } from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

export function denial(reason) {
  return {
    hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: reason },
  };
}
export function isSerenaTool(name) {
  // Native server keys preserve double separators; installed Serena names have single-underscore words.
  return /^mcp__serena__[A-Za-z0-9]+(?:_[A-Za-z0-9]+)*$/.test(name);
}
export function physicalPath(path) {
  let parent = resolve(path);
  const suffix = [];
  while (!existsSync(parent)) {
    const next = dirname(parent);
    if (next === parent) throw new Error("Path cannot be resolved");
    suffix.unshift(parent.slice(next.length + (next.endsWith("/") ? 0 : 1)));
    parent = next;
  }
  return resolve(realpathSync(parent), ...suffix);
}
export function repositoryRoot(path) {
  let directory = physicalPath(path);
  while (!existsSync(directory)) directory = dirname(directory);
  if (!statSync(directory).isDirectory()) directory = dirname(directory);
  const result = spawnSync("git", ["-C", directory, "rev-parse", "--show-toplevel"], {
    encoding: "utf8",
    timeout: 5000,
    stdio: ["ignore", "pipe", "ignore"],
  });
  return result.status === 0 && result.stdout.trim() ? realpathSync(result.stdout.trim()) : undefined;
}
function record(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid object");
  return value;
}
function quote(arg) {
  if (typeof arg !== "string") throw new Error("Invalid argv");
  return /^[A-Za-z0-9_@%+=:,./-]+$/.test(arg) ? arg : `'${arg.replaceAll("'", "'\\''")}'`;
}
const names = {
  exec_command: "Bash",
  shell_command: "Bash",
  bash: "Bash",
  shell: "Bash",
  read_file: "Read",
  read_multiple_files: "Read",
  read_directory: "Read",
  read: "Read",
  write_file: "Write",
  write: "Write",
  edit_file: "Edit",
  edit: "Edit",
  grep: "Grep",
  glob: "Glob",
  multiedit: "MultiEdit",
  apply_patch: "Edit",
};
export function normalize(payload, startupCwd = process.cwd()) {
  const source = record(payload);
  const native = source.tool_name ?? source.toolName ?? source.tool;
  if (typeof native !== "string" || !native) throw new Error("Missing tool");
  const nativeName = native.split(".").at(-1);
  const rawInput = source.tool_input ?? source.input ?? source.arguments ?? {};
  const input = nativeName === "apply_patch" && typeof rawInput === "string" ? { patch: rawInput } : record(rawInput);
  const tool = names[nativeName] ?? native;
  const session = physicalPath(source.session_cwd ?? source.cwd ?? startupCwd);
  let cwd = input.cwd ?? input.workdir ?? (tool === "Bash" ? input.directory : undefined) ?? session;
  if (typeof cwd !== "string" || !cwd) throw new Error("Invalid working directory");
  cwd = physicalPath(resolve(session, cwd));
  let command = input.command ?? input.cmd;
  if (tool === "Bash") {
    if (typeof command !== "string" || !command) throw new Error("Missing command");
    if (input.args !== undefined) {
      if (!Array.isArray(input.args)) throw new Error("Invalid argv");
      const canonical =
        source.version === 1 && source.tool_name === "Bash" && typeof source.native_tool_name === "string";
      if (input.args.length && !canonical) command += ` ${input.args.map(quote).join(" ")}`;
    }
    // One literal absolute cd is supported; subsequent cd syntax is deliberately outside this contract.
    const cd = command.match(/^\s*cd\s+(?:"(\/[^"$`\\]+)"|'(\/[^']+)'|(\/[-/._\w]+))\s*&&/);
    if (/^\s*cd\s+/.test(command) && (!cd || /(^|[\s;|&()])cd\s+/.test(command.slice(cd[0].length)))) {
      throw new Error("Unsupported leading directory change");
    }
    if (cd) {
      cwd = physicalPath(cd[1] ?? cd[2] ?? cd[3]);
    }
    if (!existsSync(cwd) || !statSync(cwd).isDirectory()) throw new Error("Working directory unavailable");
  }
  let value =
    input.absolute_path ??
    input.absolutePath ??
    input.file_path ??
    input.filePath ??
    input.paths ??
    input.file_paths ??
    input.files ??
    input.path ??
    input.relative_path ??
    (tool === "Bash" ? undefined : input.directory);
  const multiRoot = input.target_directory ?? input.targetDirectory;
  const nativeRead =
    nativeName === "read_file" &&
    [input.file_path, input.path, input.paths, input.include].some((entry) => entry !== undefined);
  if (nativeRead) {
    // Installed Command Code combines both entry families, including JSON array strings.
    value = [input.file_path ?? input.path, input.paths ?? input.include]
      .flatMap((entry) => {
        if (Array.isArray(entry)) return entry;
        if (typeof entry === "string" && entry.trim().startsWith("[")) {
          try {
            const parsed = JSON.parse(entry);
            if (Array.isArray(parsed)) return parsed;
          } catch {
            // A non-array string remains a native path or glob entry.
          }
        }
        return [entry];
      })
      .filter((entry) => typeof entry === "string" && entry.trim().length > 0);
  }
  const nativeBatch = nativeRead && (value.length > 1 || /[*?[{]/.test(value[0] ?? ""));
  if ((nativeName === "read_multiple_files" || nativeBatch) && multiRoot !== undefined) {
    if (typeof multiRoot !== "string") throw new Error("Invalid multi-file directory");
    cwd = physicalPath(resolve(cwd, multiRoot));
  }
  if (nativeName === "read_multiple_files") value ??= input.include ?? (multiRoot === undefined ? undefined : cwd);
  if (nativeName === "apply_patch") {
    // Codex's native PreToolUse wire payload carries apply_patch text as command.
    const patch = input.patch ?? input.patchText ?? input.input ?? input.command;
    if (typeof patch !== "string") throw new Error("Missing patch");
    value = [...patch.matchAll(/^\*\*\* (?:(?:Update|Add|Delete) File|Move to): (.+)$/gm)].map((match) => match[1]);
    if (!value.length) throw new Error("Patch has no destinations");
  }
  const paths = value === undefined || value === "" ? [undefined] : Array.isArray(value) ? value : [value];
  if (!paths.length) throw new Error("Empty paths");
  return paths.map((path) => {
    if (path !== undefined && typeof path !== "string") throw new Error("Invalid path");
    const requested = path === undefined ? undefined : resolve(cwd, path);
    const target = requested === undefined ? cwd : physicalPath(requested);
    return {
      version: 1,
      tool_name: tool,
      native_tool_name: native,
      session_cwd: session,
      session_root: repositoryRoot(session),
      repo_root: repositoryRoot(target),
      requested_path: requested,
      target_path: requested === undefined ? undefined : target,
      tool_input: {
        ...input,
        ...(tool === "Bash" ? { command } : {}),
        workdir: cwd,
        ...(requested === undefined ? {} : { file_path: target }),
      },
    };
  });
}
const memoryNames = new Set([
  "read_memory",
  "write_memory",
  "edit_memory",
  "delete_memory",
  "rename_memory",
  "list_memories",
]);
export function normalizeMemoryTargets(project, tool, args, descriptors) {
  if (
    !isAbsolute(project) ||
    !memoryNames.has(tool) ||
    !Array.isArray(descriptors) ||
    !descriptors.length ||
    descriptors.length > 4096
  )
    throw new Error("Invalid memory transport");
  record(args);
  const session = physicalPath(project),
    sessionRoot = repositoryRoot(session);
  if (session !== sessionRoot) throw new Error("Invalid memory project");
  return descriptors.map((descriptor) => {
    record(descriptor);
    const { kind, path } = descriptor;
    if (
      Object.keys(descriptor).sort().join(",") !== "kind,path" ||
      typeof path !== "string" ||
      !isAbsolute(path) ||
      path.includes("\0") ||
      !["namespace", "dereference"].includes(kind) ||
      (kind === "namespace" && !["delete_memory", "rename_memory"].includes(tool)) ||
      (tool === "delete_memory" && kind !== "namespace")
    )
      throw new Error("Invalid memory effect");
    const directory = kind === "namespace" ? physicalPath(dirname(path)) : undefined;
    const target = kind === "namespace" ? join(directory, basename(path)) : physicalPath(path);
    return {
      version: 2,
      transport: "serena-memory",
      tool_name: tool,
      native_tool_name: tool,
      session_cwd: session,
      session_root: sessionRoot,
      repo_root: repositoryRoot(directory ?? target),
      target_kind: kind,
      source_path: path,
      requested_path: target,
      target_path: target,
      operation_arguments: args,
      tool_input: { ...args, workdir: session, file_path: target },
    };
  });
}
export function normalizeEndpointInvocation(payload) {
  record(payload);
  if (payload.version === 2 || payload.transport !== undefined) {
    if (
      payload.version !== 2 ||
      payload.transport !== "serena-memory" ||
      !Array.isArray(payload.invocations) ||
      !payload.invocations.length ||
      payload.invocations.length > 4096
    )
      throw new Error("Invalid memory envelope");
    return payload.invocations.map((invocation) => {
      record(invocation);
      if (
        invocation.version !== 2 ||
        invocation.transport !== "serena-memory" ||
        invocation.native_tool_name !== invocation.tool_name
      )
        throw new Error("Invalid memory invocation");
      const [canonical] = normalizeMemoryTargets(
        invocation.session_cwd,
        invocation.tool_name,
        invocation.operation_arguments,
        [{ kind: invocation.target_kind, path: invocation.source_path }],
      );
      for (const key of ["session_root", "repo_root", "requested_path", "target_path"])
        if (invocation[key] !== canonical[key]) throw new Error("Forged memory destination");
      return canonical;
    });
  }
  return payload.version === 1 && Array.isArray(payload.invocations)
    ? payload.invocations.flatMap((invocation) => normalize(invocation))
    : normalize(payload);
}
export function hasLocalBinding(root, harness, nativeTool) {
  if (!root || !existsSync(join(root, "scripts/agent-policy-hook.sh"))) return false;
  // Command Code's native shell/file families defer locally; MCP uses the global mod.
  if (
    harness === "commandcode" &&
    ![
      "shell_command",
      "read_file",
      "read_multiple_files",
      "read_directory",
      "write_file",
      "edit_file",
      "grep",
      "glob",
    ].includes(nativeTool)
  )
    return false;
  const bindings = {
    claude: [".claude/settings.json"],
    codex: [".codex/hooks.json"],
    opencode: [".opencode/plugins/agent-policy.ts"],
    commandcode: [".commandcode/settings.json"],
  };
  return (bindings[harness] ?? []).some((path) => {
    try {
      const text = readFileSync(join(root, path), "utf8");
      if (path.endsWith(".json")) JSON.parse(text);
      return (
        /agent-policy-(?:router|hook)|run-policy-hook\.sh[^\n]*agent-policy/.test(text) ||
        (harness === "opencode" && /agent-policy-client\.ts/.test(text))
      );
    } catch {
      return false;
    }
  });
}
export async function evaluateEndpoint(root, payload, { harness } = {}) {
  const endpoint = join(root, "scripts/agent-policy-hook.sh");
  if (!existsSync(endpoint)) {
    return existsSync(join(root, ".agents/agent-policy.json"))
      ? denial("Destination policy endpoint is unavailable; tool refused.")
      : undefined;
  }
  const result = spawnSync("bash", [endpoint, ...(harness === undefined ? [] : ["--harness", harness])], {
    cwd: root,
    input: JSON.stringify(payload),
    encoding: "utf8",
    timeout: 10000,
    maxBuffer: 1024 * 1024,
    env: { ...process.env, CLAUDE_PROJECT_DIR: root },
    stdio: ["pipe", "pipe", "ignore"],
  });
  if (result.error || result.status !== 0) return denial("Destination policy endpoint failed; tool refused.");
  if (!result.stdout.trim()) return undefined;
  try {
    const decision = record(JSON.parse(result.stdout));
    const output = record(decision.hookSpecificOutput);
    if (output.hookEventName !== "PreToolUse" || !["deny", "allow", "ask"].includes(output.permissionDecision)) {
      throw new Error("Invalid decision");
    }
    if (output.permissionDecision === "deny" || output.permissionDecision === "ask") return decision;
    return undefined;
  } catch {
    return denial("Destination policy returned an invalid decision; tool refused.");
  }
}
export async function route(payload, { scope = "global", harness, startupCwd = process.cwd() } = {}) {
  try {
    if (!["global", "external", "local"].includes(scope)) throw new Error("Invalid scope");
    if (harness !== undefined && !["claude", "codex", "opencode", "commandcode"].includes(harness))
      throw new Error("Invalid harness");
    const calls = normalize(payload, startupCwd);
    if (harness !== "opencode" && isSerenaTool(calls[0].native_tool_name)) return undefined;
    const owner = calls[0].session_root;
    const selected = calls.filter((call) => {
      if (!call.repo_root) return false;
      // A native local binding owns only its physical checkout; the global transport handles B.
      if (scope === "local" && call.repo_root !== owner) return false;
      if (scope === "external" && call.repo_root === owner && hasLocalBinding(owner, harness, call.native_tool_name))
        return false;
      return true;
    });
    return await evaluateDestinations(selected, { harness });
  } catch {
    return denial("Policy router could not normalize this invocation; tool refused.");
  }
}
export async function evaluateDestinations(calls, { harness } = {}) {
  const memory = calls.some((call) => call.version === 2);
  if (memory && calls.some((call) => call.version !== 2 || call.transport !== "serena-memory"))
    return denial("Invalid mixed memory invocation batch; tool refused.");
  const roots = new Map();
  const seen = new Set();
  for (const call of calls) {
    if (!call.repo_root) continue;
    const key = `${call.repo_root}\0${call.target_kind ?? ""}\0${call.target_path ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (!roots.has(call.repo_root)) roots.set(call.repo_root, []);
    roots.get(call.repo_root).push(call);
  }
  for (const [root, targets] of roots) {
    const payload = memory
      ? { version: 2, transport: "serena-memory", invocations: targets }
      : targets.length === 1
        ? targets[0]
        : { version: 1, invocations: targets };
    const result = await evaluateEndpoint(root, payload, { harness });
    if (result) return result;
  }
  return undefined;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  let result;
  try {
    const args = process.argv.slice(2);
    const options = {};
    for (let i = 0; i < args.length; i += 2) {
      if (!["--scope", "--harness", "--session-cwd"].includes(args[i]) || !args[i + 1])
        throw new Error("Invalid option");
      options[args[i] === "--session-cwd" ? "startupCwd" : args[i].slice(2)] = args[i + 1];
    }
    result = await route(JSON.parse(readFileSync(0, "utf8")), options);
  } catch {
    result = denial("Policy router received invalid input; tool refused.");
  }
  if (result) process.stdout.write(`${JSON.stringify(result)}\n`);
}
