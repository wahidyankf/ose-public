// Native adapters transport decisions; destination repositories own their policy.
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

export type PolicyPayload = { readonly cwd: string; readonly tool_name: string; readonly tool_input: unknown };
export type PolicyDecision = {
  readonly hookSpecificOutput: {
    readonly permissionDecision: string;
    readonly permissionDecisionReason: string;
  };
};
export type Evaluator = (payload: PolicyPayload) => Promise<PolicyDecision | undefined>;
export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
export function isSerenaTool(name: string): boolean {
  // Native server keys preserve double separators; installed Serena names have single-underscore words.
  return /^mcp__serena__[A-Za-z0-9]+(?:_[A-Za-z0-9]+)*$/.test(name);
}
export function invokePolicy(
  payload: PolicyPayload,
  harness: string,
  scope: string,
): Promise<PolicyDecision | undefined> {
  const refused = (): PolicyDecision => ({
    hookSpecificOutput: {
      permissionDecision: "deny",
      permissionDecisionReason: "Native policy transport failed; tool refused.",
    },
  });
  return new Promise((resolve) => {
    const router = fileURLToPath(new URL("./agent-policy-router.sh", import.meta.url));
    const child = spawn("/bin/bash", [router, "--scope", scope, "--harness", harness, "--session-cwd", payload.cwd], {
      cwd: payload.cwd,
      stdio: ["pipe", "pipe", "ignore"],
    });
    let output = "";
    let failed = false;
    const timer = setTimeout(() => {
      failed = true;
      child.kill("SIGKILL");
      resolve(refused());
    }, 15000);
    child.stdout.on("data", (chunk: Buffer) => {
      output += chunk.toString();
      if (output.length > 1024 * 1024) {
        failed = true;
        child.kill("SIGKILL");
      }
    });
    child.once("error", () => {
      clearTimeout(timer);
      resolve(refused());
    });
    child.stdin.on("error", () => {
      failed = true;
    });
    child.once("close", (code: number | null) => {
      clearTimeout(timer);
      if (failed || code !== 0) {
        resolve(refused());
        return;
      }
      if (!output.trim()) {
        resolve(undefined);
        return;
      }
      try {
        const result: unknown = JSON.parse(output);
        const details = isRecord(result) ? result.hookSpecificOutput : undefined;
        if (
          !isRecord(details) ||
          typeof details.permissionDecision !== "string" ||
          typeof details.permissionDecisionReason !== "string"
        ) {
          resolve(refused());
          return;
        }
        resolve({
          hookSpecificOutput: {
            permissionDecision: details.permissionDecision,
            permissionDecisionReason: details.permissionDecisionReason,
          },
        });
      } catch {
        resolve(refused());
      }
    });
    child.stdin.end(JSON.stringify(payload));
  });
}
