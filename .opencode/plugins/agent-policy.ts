import { invokePolicy, isRecord } from "../../scripts/agent-policy-client.ts";
import type { Evaluator } from "../../scripts/agent-policy-client.ts";
import { fileURLToPath } from "node:url";
import { realpathSync } from "node:fs";

function policyHooks(
  directory: string,
  evaluate: Evaluator,
): {
  readonly "tool.execute.before": (input: unknown, output: unknown) => Promise<void>;
} {
  return {
    "tool.execute.before": async (input, output): Promise<void> => {
      if (!isRecord(input) || typeof input.tool !== "string") throw new Error("Invalid native policy invocation.");
      const args = isRecord(output) ? output.args : undefined;
      const result = await evaluate({ cwd: directory, tool_name: input.tool, tool_input: args ?? {} });
      if (result && result.hookSpecificOutput.permissionDecision !== "allow") {
        throw new Error(result.hookSpecificOutput.permissionDecisionReason);
      }
    },
  };
}
export const AgentPolicyPlugin = async ({
  directory,
}: {
  readonly directory: string;
}): Promise<ReturnType<typeof policyHooks>> => {
  // An identical copy under a project's dot directory is the local binding; the global source stays external.
  const scope = fileURLToPath(import.meta.url).includes("/.opencode/plugins/") ? "local" : "external";
  const source = scope === "local" ? realpathSync(fileURLToPath(new URL("../..", import.meta.url))) : directory;
  return policyHooks(source, (payload) => invokePolicy(payload, "opencode", scope));
};
