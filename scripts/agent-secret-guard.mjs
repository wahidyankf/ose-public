// This repository endpoint owns secret classification. Global transports never import this module.
import { readFileSync, existsSync, realpathSync } from "node:fs";
import { resolve, relative, dirname, basename } from "node:path";
import { pathToFileURL } from "node:url";

function deny(reason) {
  return {
    hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: reason },
  };
}
function pattern(glob) {
  const directory = glob.endsWith("/**");
  if (directory) glob = glob.slice(0, -3);
  let result = "^";
  for (let i = 0; i < glob.length; i++) {
    if (glob.slice(i, i + 3) === "**/") {
      result += "(?:.*/)?";
      i += 2;
    } else if (glob.slice(i, i + 2) === "**") {
      result += ".*";
      i++;
    } else if (glob[i] === "*") result += "[^/]*";
    else if (glob[i] === "?") result += "[^/]";
    else result += glob[i].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`${result}${directory ? "(?:/.*)?" : ""}$`, "i");
}
function physical(path) {
  let parent = path;
  while (!existsSync(parent)) {
    const next = dirname(parent);
    if (next === parent) return path;
    parent = next;
  }
  return resolve(realpathSync(parent), relative(parent, path));
}
export function decide(payload, policy, root, effectKind = "dereference") {
  if (!["namespace", "dereference"].includes(effectKind)) return deny("Invalid repository effect kind; tool refused.");
  if (
    !payload ||
    typeof payload !== "object" ||
    Array.isArray(payload) ||
    !payload.tool_input ||
    typeof payload.tool_input !== "object" ||
    Array.isArray(payload.tool_input) ||
    typeof payload.tool_name !== "string"
  )
    return deny("Invalid repository policy invocation; tool refused.");
  if (
    !policy ||
    !["protected_paths", "allowed_paths"].every(
      (key) => Array.isArray(policy[key]) && policy[key].every((value) => typeof value === "string"),
    )
  ) {
    return deny("Repository secret policy is invalid; tool refused.");
  }
  const protectedPatterns = policy.protected_paths.map(pattern);
  const subtreePatterns = policy.protected_paths.filter((glob) => glob.endsWith("/**")).map(pattern);
  const filePatterns = policy.protected_paths.filter((glob) => !glob.endsWith("/**")).map(pattern);
  const allowedPatterns = policy.allowed_paths.map(pattern);
  const input = payload.tool_input;
  const blocked = (path) => {
    const absolute = resolve(input.workdir ?? root, path);
    // Only the endpoint may supply validated internal namespace effects. Raw native/CLI calls dereference.
    const effect =
      effectKind === "namespace" ? resolve(physical(dirname(absolute)), basename(absolute)) : physical(absolute);
    const candidates = [path, relative(root, absolute), relative(root, effect)];
    return candidates.some(
      (candidate) =>
        subtreePatterns.some((glob) => glob.test(candidate)) ||
        (filePatterns.some((glob) => glob.test(candidate)) && !allowedPatterns.some((glob) => glob.test(candidate))),
    );
  };
  if (input.include_ignored_files === true && protectedPatterns.length) {
    return deny("Repository secret policy refuses searches that include ignored files.");
  }
  for (const path of [payload.requested_path, payload.target_path, input.file_path, input.path, input.relative_path]) {
    if (typeof path === "string" && blocked(path)) return deny("Repository secret policy refuses this protected path.");
  }
  if (payload.tool_name === "Bash") {
    if (typeof input.command !== "string") return deny("Invalid shell invocation; tool refused.");
    // Metadata reveals filenames only. Chaining, redirection or substitution ends this carve-out.
    if (/^\s*(?:rtk\s+)?(?:\/[-\w/.]+\/)?git\s+(?:check-ignore|ls-files|status)\b[^\n;&|<>`$()]*$/.test(input.command))
      return undefined;
    // Bounded literal reference guard, including quoted snippets and assignments. It is not a shell AST.
    const text = input.command.replace(/["']/g, "");
    const tokens = text.split(/[\s;|&()=<>`,]+/).filter(Boolean);
    if (tokens.some(blocked)) return deny("Repository secret policy refuses shell references to protected paths.");
  }
  return undefined;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  let result;
  try {
    const root = realpathSync(resolve(dirname(process.argv[1]), ".."));
    result = decide(
      JSON.parse(readFileSync(0, "utf8")),
      JSON.parse(readFileSync(resolve(root, ".agents/agent-policy.json"), "utf8")),
      root,
    );
  } catch {
    result = deny("Repository secret policy could not be loaded; tool refused.");
  }
  if (result) process.stdout.write(`${JSON.stringify(result)}\n`);
}
