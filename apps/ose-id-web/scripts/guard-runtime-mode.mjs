#!/usr/bin/env node
/**
 * Runs the OSE ID web shell's runtime-mode invariant before anything downstream can bind a
 * listener, then execs the command given on the rest of the command line.
 *
 * Why this exists: `next.config.ts` already calls `enforceRuntimeMode` for the development and
 * production serving phases, but that call happens *inside* Next's own process, after Next's dev
 * server (and, under Turbopack, its production server) has already opened the TCP socket for the
 * configured port. A socket that accepts a connection for even a short window before the process
 * exits is still a socket "Reject an unsupported service runtime before listener binding" forbids.
 * Deciding here — in the parent process, before the `next` binary is even spawned — closes that
 * window completely: on a rejected mode, nothing that could bind a listener ever starts.
 * `next.config.ts`'s own guard stays in place as a second, in-process layer; this script is the
 * one that actually keeps the invariant true end to end.
 *
 * Usage: node scripts/guard-runtime-mode.mjs <command> [...args]
 *   e.g. node scripts/guard-runtime-mode.mjs next dev --port 3500
 */
import { spawn } from "node:child_process";

import { decideRuntimeMode, runtimeModeDiagnostic } from "../src/shared/runtime/runtime-mode.ts";

const decision = decideRuntimeMode(process.env.OSE_RUNTIME_MODE);
if (!decision.allowed) {
  process.stderr.write(`${runtimeModeDiagnostic()}\n`);
  process.exit(1);
}

const [command, ...args] = process.argv.slice(2);
if (command === undefined) {
  process.stderr.write("guard-runtime-mode: missing command to run after the runtime-mode guard\n");
  process.exit(1);
}

const child = spawn(command, args, { stdio: "inherit", env: process.env });

child.on("error", (error) => {
  process.stderr.write(`guard-runtime-mode: failed to start "${command}": ${error.message}\n`);
  process.exit(1);
});

// Forward the signals a developer (Ctrl-C) or a container runtime (docker stop) actually sends, so
// the wrapped server shuts down instead of being orphaned when this process exits.
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}

child.on("exit", (code, signal) => {
  if (signal !== null) {
    // Re-raise the same signal against this process rather than exiting 1, so the wrapper reports
    // the conventional 128+N status instead of making a normal shutdown look like a crash.
    process.removeAllListeners(signal);
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
