// FERRET capture plugin for OpenCode.
//
// It hands what OpenCode gives each lifecycle hook, as one JSON document, to `ferret capture-hook`, and can never
// disturb OpenCode: it does not allowlist, pseudonymize, canonicalize, hash, or open SQLite (the Python command is the
// one privacy boundary), it never makes a hook wait for the child, every failure is swallowed, and a child still
// running after 900 ms gets TERM and one still running after 1,000 ms gets KILL. `ferret` is FERRET_BIN when set, else
// the one on PATH, else the user-level launcher.
import { spawn } from "node:child_process";
import { accessSync, constants, statSync } from "node:fs";
import { join } from "node:path";

const TERM_MILLISECONDS = 900;
const KILL_MILLISECONDS = 1000;
// The Python command reads at most this much, so a larger document could only be refused; it is not sent.
const MAX_DOCUMENT_BYTES = 256 * 1024;
// Captures run one at a time so a burst of tool calls does not fight itself for the write lock; beyond this many
// waiting, further ones are dropped rather than queued without bound.
const MAX_PENDING = 64;

type Hooks = Record<string, (...args: unknown[]) => Promise<void>>;

function isExecutable(path: string): boolean {
  try {
    accessSync(path, constants.X_OK);
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

function resolveBinary(environment: NodeJS.ProcessEnv): string | undefined {
  if (environment.FERRET_BIN) {
    return environment.FERRET_BIN;
  }
  for (const directory of (environment.PATH ?? "").split(":")) {
    const candidate = join(directory, "ferret");
    if (directory && isExecutable(candidate)) {
      return candidate;
    }
  }
  const launcher = join(environment.HOME ?? "", ".local", "bin", "ferret");
  return environment.HOME && isExecutable(launcher) ? launcher : undefined;
}

function forward(binary: string, event: string, document: unknown): Promise<void> {
  return new Promise((resolve) => {
    try {
      const text = JSON.stringify(document);
      if (Buffer.byteLength(text) > MAX_DOCUMENT_BYTES) {
        resolve();
        return;
      }
      const child = spawn(binary, ["capture-hook", "--harness", "opencode", "--event", event], {
        stdio: ["pipe", "ignore", "ignore"],
      });
      const term = setTimeout(() => child.kill("SIGTERM"), TERM_MILLISECONDS);
      const kill = setTimeout(() => child.kill("SIGKILL"), KILL_MILLISECONDS);
      const finish = () => {
        clearTimeout(term);
        clearTimeout(kill);
        resolve();
      };
      child.once("error", finish);
      child.once("exit", finish);
      child.stdin.on("error", () => {});
      child.stdin.end(text);
    } catch {
      resolve();
    }
  });
}

export const FerretPlugin = async ({ directory }: { directory: string }): Promise<Hooks> => {
  let binary: string | undefined;
  let pending = 0;
  let tail: Promise<void> = Promise.resolve();

  const send = (event: string, hook: string, input: unknown, output?: unknown): void => {
    binary ??= resolveBinary(process.env);
    if (binary === undefined || pending >= MAX_PENDING) {
      return;
    }
    const target = binary;
    pending += 1;
    tail = tail
      .then(() => forward(target, event, { hook, directory, input, output }))
      .catch(() => {})
      .finally(() => {
        pending -= 1;
      });
  };

  return {
    event: async (input) => {
      try {
        if ((input as { event?: { type?: unknown } } | undefined)?.event?.type === "session.created") {
          send("session.started", "event", input);
        }
      } catch {}
    },
    "tool.execute.before": async (input, output) => {
      try {
        send("tool.started", "tool.execute.before", input, output);
        if ((input as { tool?: unknown } | undefined)?.tool === "skill") {
          send("skill.invoked", "tool.execute.before", input, output);
        }
      } catch {}
    },
    "tool.execute.after": async (input, output) => {
      try {
        send("tool.completed", "tool.execute.after", input, output);
      } catch {}
    },
  };
};
