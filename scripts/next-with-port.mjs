#!/usr/bin/env node
/**
 * Single entrypoint that gives every Next.js app in this repo the same runtime port contract as
 * the F# backends: an explicit `--port` flag wins, then the app's own prefixed environment
 * variable, then its compiled-in default.
 *
 * Why a wrapper exists at all: Next's CLI resolves its port from `--port` or a bare `PORT`, and an
 * explicit `--port` on the command line always outranks `PORT`. Every app's `project.json` used to
 * pass `--port <literal>`, which meant no environment variable could ever move the listener. Worse,
 * four of the six container images run Next's STANDALONE `server.js`, which reads `process.env.PORT`
 * and parses no flags at all. One wrapper that resolves first and then hands the answer to whichever
 * server shape follows is what makes local development and the image behave identically.
 *
 * Usage:
 *   node scripts/next-with-port.mjs dev   --env OSE_WWW_PORT --default 3100 [--port 4000]
 *   node scripts/next-with-port.mjs start --env OSE_WWW_PORT --default 3100 [--port 4000]
 *   node scripts/next-with-port.mjs --env OSE_WWW_PORT --default 3100 --server apps/ose-www/server.js
 *
 * The `--server` form is the standalone-image path: it sets `process.env.PORT` and then imports the
 * generated server, which is the only knob that server exposes.
 *
 * PROCESS SHAPE: the `--server` form stays single-process — it imports the standalone server into
 * this very process. The `dev`/`start` form must spawn, because Next's CLI is a separate binary and
 * Node has no `execve`, so the wrapper stays resident as the child's parent for the process's whole
 * life. Only `organiclever-www` takes that path in a container image (it is the one app without
 * `output: "standalone"`), so only that image carries a second resident Node process. Signals are forwarded and re-raised so an orchestrator still sees the conventional
 * 128+N status rather than a synthesised exit code.
 *
 * CONTAINER REQUIREMENT: the resolver is imported by a path relative to THIS file, so any image
 * using this wrapper must COPY both `scripts/next-with-port.mjs` and
 * `libs/ts-env-loader/src/port-resolver.ts`, preserving their relative layout. `port-resolver.ts`
 * is deliberately dependency-free (no `dotenv`, no `node:fs`) so it needs no `node_modules` — see
 * its own header. Node strips the TypeScript types natively, so there is no build step.
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { resolvePort } from "../libs/ts-env-loader/src/port-resolver.ts";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));

/**
 * Reads `--name value` out of argv. Deliberately minimal: this wrapper takes a fixed, known set of
 * options from project.json and Dockerfiles, not arbitrary user input, so a full parser would be
 * more machinery than the job needs.
 */
function option(argv, name) {
  const index = argv.indexOf(`--${name}`);
  if (index !== -1 && index + 1 < argv.length) {
    return argv[index + 1];
  }
  const joined = argv.find((arg) => arg.startsWith(`--${name}=`));
  return joined === undefined ? undefined : joined.slice(`--${name}=`.length);
}

function fail(message) {
  process.stderr.write(`next-with-port: ${message}\n`);
  process.exit(1);
}

const argv = process.argv.slice(2);
const mode = argv[0] !== undefined && !argv[0].startsWith("--") ? argv[0] : undefined;
const envVar = option(argv, "env");
const fallbackRaw = option(argv, "default");
const serverPath = option(argv, "server");
const flag = option(argv, "port");

if (envVar === undefined) {
  fail("missing required --env <PREFIXED_PORT_VARIABLE>");
}
if (fallbackRaw === undefined) {
  fail("missing required --default <port>");
}

let port;
try {
  port = resolvePort({ flag, envVar, fallback: Number(fallbackRaw) });
} catch (error) {
  // resolvePort's message already names the offending knob and the legal range.
  fail(error instanceof Error ? error.message : String(error));
}

// Next's standalone server and `next start` both read PORT; setting it here means the resolved
// value reaches either shape without the caller caring which one it got.
process.env.PORT = String(port);

if (serverPath !== undefined) {
  // Standalone image path: no child process, no Next CLI — just boot the generated server with the
  // environment it expects.
  await import(path.resolve(process.cwd(), serverPath));
} else {
  if (mode === undefined) {
    fail("missing mode: expected `dev` or `start` (or --server <path> for a standalone image)");
  }

  // Prefer the workspace-local binary so the wrapper does not depend on PATH being set up the way
  // Nx happens to set it up, and falls back to PATH resolution when there is no local install.
  const localNext = path.join(process.cwd(), "node_modules", ".bin", "next");
  const workspaceNext = path.join(scriptDir, "..", "node_modules", ".bin", "next");
  const nextBin = existsSync(localNext) ? localNext : existsSync(workspaceNext) ? workspaceNext : "next";

  // Everything after the recognised options is forwarded to Next untouched, so app-specific flags
  // (--turbopack, --experimental-https, -H) keep working.
  const recognised = new Set(["--env", "--default", "--server", "--port"]);
  const passthrough = [];
  for (let index = mode === undefined ? 0 : 1; index < argv.length; index += 1) {
    const arg = argv[index];
    if (recognised.has(arg)) {
      index += 1;
      continue;
    }
    if ([...recognised].some((name) => arg.startsWith(`${name}=`))) {
      continue;
    }
    passthrough.push(arg);
  }

  // Spawn the resolved local/workspace binary through this process's own node (process.execPath)
  // rather than letting the OS resolve its `#!/usr/bin/env node` shebang. That resolution re-enters
  // PATH and, under Volta, lands on Volta's shim — a second node process whose PID differs from the
  // one actually running Next, so `child.kill(signal)` below signals the shim instead of Next and
  // the real server is orphaned. Running `node <resolved binary>` directly keeps the child's PID the
  // one that matters. Only the bare "next" PATH fallback (no local/workspace .bin found) still goes
  // through shell resolution, since there is no file path to hand to node directly.
  const child =
    nextBin === "next"
      ? spawn(nextBin, [mode, "--port", String(port), ...passthrough], {
          stdio: "inherit",
          env: process.env,
        })
      : spawn(process.execPath, [nextBin, mode, "--port", String(port), ...passthrough], {
          stdio: "inherit",
          env: process.env,
        });

  // Forward the signals a developer (Ctrl-C) or a container runtime (docker stop) actually sends,
  // so the Next server shuts down instead of being orphaned when this wrapper exits.
  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, () => child.kill(signal));
  }

  child.on("exit", (code, signal) => {
    if (signal !== null) {
      // Re-raise the same signal against this process rather than exiting 1, so the wrapper reports
      // the conventional 128+N status. Collapsing every signal to 1 would make a normal `docker
      // stop` (SIGTERM) look like a crash to any orchestrator reading the container's exit code.
      process.removeAllListeners(signal);
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 0);
  });
}
