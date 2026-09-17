/**
 * E2E bindings for specs/apps/ose/id-web/behaviours/foundation/runtime-mode.feature.
 *
 * This adapter owns the real process boundary: it starts an actual `ose-id-web` server process
 * with the mode under test and observes the exit status, the diagnostic stream, the absence of a
 * listener, and whether anything reached the identity service. Nothing below the process is
 * stubbed — the "identity service" the rejected start is pointed at is a real HTTP server this
 * step owns, which records every request it receives.
 *
 * The process spawned here is the shell's real, shipped entrypoint —
 * `apps/ose-id-web/scripts/guard-runtime-mode.mjs`, the same wrapper `npm run dev`/`start` resolve
 * to — and not a bare `next dev`. Next's own dev server can accept a TCP connection before
 * `next.config.ts`'s in-process guard call finishes running, so a scenario that spawned `next`
 * directly would be probing a path the app never actually serves through. Driving the real
 * entrypoint is what makes "no configured listener is bound" a true black-box claim.
 */
import { spawn } from "node:child_process";
import { createServer, type Server } from "node:http";
import { connect } from "node:net";
import path from "node:path";
import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";

const { Given, When, Then } = createBdd();

const WEB_APP_DIR = new URL("../../ose-id-web", import.meta.url).pathname;
const GUARD_SCRIPT_PATH = path.join(WEB_APP_DIR, "scripts", "guard-runtime-mode.mjs");

/** A port no OSE service claims, so a rejected start cannot collide with the running shell. */
const GUARD_PROBE_PORT = 3599;
const STARTUP_TIMEOUT_MS = 120_000;

/** How often the configured port is asked whether anything is listening on it. */
const LISTENER_PROBE_INTERVAL_MS = 5;

/** The repository root, so the diagnostic can be proven not to have named a machine path. */
const REPOSITORY_ROOT = new URL("../../..", import.meta.url).pathname.replace(/\/$/u, "");

interface StartupObservation {
  readonly exitCode: number | null;
  readonly diagnostics: string;
  readonly backendRequests: number;
  readonly backendOrigin: string;
  /** Whether the configured port ever accepted a connection between spawn and exit. */
  readonly everAcceptedConnections: boolean;
}

let requestedMode = "";
let observation: StartupObservation | undefined;

function environmentForMode(mode: string, backendOrigin: string): NodeJS.ProcessEnv {
  const environment: NodeJS.ProcessEnv = { ...process.env, APP_ENV: "test", OSE_ID_BE_URL: backendOrigin };
  delete environment["OSE_RUNTIME_MODE"];
  if (mode !== "missing") {
    environment["OSE_RUNTIME_MODE"] = mode;
  }
  return environment;
}

/**
 * A real loopback HTTP server standing in for `ose-id-be`. The rejected web process is pointed at
 * it, so "no request reaches the identity service" is read off a server that would have recorded
 * one, rather than inferred from the shell having no database of its own.
 */
async function startRecordingBackend(): Promise<{ server: Server; origin: string; received: () => number }> {
  let requests = 0;
  const server = createServer((_request, response) => {
    requests += 1;
    response.statusCode = 200;
    response.end("{}");
  });
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (address === null || typeof address === "string") {
    throw new Error("the recording backend did not bind a loopback port");
  }
  return { server, origin: `http://127.0.0.1:${String(address.port)}`, received: () => requests };
}

async function startWebProcess(mode: string): Promise<StartupObservation> {
  const backend = await startRecordingBackend();
  try {
    return await new Promise<StartupObservation>((resolve, reject) => {
      const child = spawn(
        process.execPath,
        [GUARD_SCRIPT_PATH, "npx", "next", "dev", "--port", String(GUARD_PROBE_PORT)],
        {
          cwd: WEB_APP_DIR,
          env: environmentForMode(mode, backend.origin),
          stdio: ["ignore", "pipe", "pipe"],
        },
      );

      let diagnostics = "";
      child.stdout.on("data", (chunk: Buffer) => {
        diagnostics += chunk.toString();
      });
      child.stderr.on("data", (chunk: Buffer) => {
        diagnostics += chunk.toString();
      });

      // "Before listener binding" is a claim about the socket, not about what the process
      // printed, so the port is probed continuously from spawn to exit. A listener that exists
      // only for a moment is still a listener an attacker or a health check could reach.
      let everAcceptedConnections = false;
      const probe = setInterval(() => {
        void portAcceptsConnections(GUARD_PROBE_PORT).then((accepted) => {
          everAcceptedConnections = everAcceptedConnections || accepted;
        });
      }, LISTENER_PROBE_INTERVAL_MS);

      const timer = setTimeout(() => {
        child.kill("SIGKILL");
        clearInterval(probe);
        reject(new Error("the web process was still running after the startup timeout"));
      }, STARTUP_TIMEOUT_MS);

      child.on("error", (error) => {
        clearTimeout(timer);
        clearInterval(probe);
        reject(error);
      });
      child.on("exit", (exitCode) => {
        clearTimeout(timer);
        clearInterval(probe);
        resolve({
          exitCode,
          diagnostics,
          backendRequests: backend.received(),
          backendOrigin: backend.origin,
          everAcceptedConnections,
        });
      });
    });
  } finally {
    await new Promise<void>((resolve) => {
      backend.server.close(() => {
        resolve();
      });
    });
  }
}

async function portAcceptsConnections(port: number): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const socket = connect({ port, host: "127.0.0.1" });
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => {
      socket.destroy();
      resolve(false);
    });
  });
}

/** Only the lines the guard itself emitted, so the assertion is about the diagnostic. */
function diagnosticLines(): readonly string[] {
  return (observation?.diagnostics ?? "").split("\n").filter((line) => line.includes("runtime_mode_disabled"));
}

// eslint-disable-next-line no-empty-pattern -- playwright-bdd requires an object destructuring
// pattern as the first parameter; this step uses no fixture.
Given("the web runtime mode is {word}", async ({}, mode: string) => {
  requestedMode = mode;
  expect(await portAcceptsConnections(GUARD_PROBE_PORT)).toBe(false);
});

When("the web process starts", async () => {
  observation = await startWebProcess(requestedMode);
});

Then("startup exits non-zero before serving the application", async () => {
  expect(observation?.exitCode, "the rejected web process must end with a non-zero status").not.toBe(0);
  expect(observation?.exitCode).not.toBeNull();
});

Then("the diagnostic returns the stable runtime-mode-disabled code", async () => {
  expect(observation?.diagnostics ?? "").toContain("runtime_mode_disabled");
});

Then("no configured listener is bound", async () => {
  expect(
    observation?.everAcceptedConnections,
    "the configured port must never accept a connection during a refused start",
  ).toBe(false);
  expect(await portAcceptsConnections(GUARD_PROBE_PORT), "no listener may survive a rejected start").toBe(false);
});

Then("no request reaches the identity service", async () => {
  // The rejected process was pointed at a real, listening backend that records every request.
  // Nothing arrived, so nothing it could have changed was reached.
  expect(observation?.backendRequests).toBe(0);
});

Then("the diagnostic discloses no secret, configuration value, stack trace, or absolute path", async () => {
  const lines = diagnosticLines();

  expect(lines.length).toBeGreaterThan(0);
  for (const line of lines) {
    expect(line).not.toContain(observation?.backendOrigin ?? "");
    expect(line).not.toContain("OSE_ID_BE_URL");
    expect(line).not.toContain("=");
    expect(line).not.toContain(REPOSITORY_ROOT);
    expect(line).not.toMatch(/\bat\s+\S+\s+\(/u);
    if (requestedMode !== "missing") {
      expect(line).not.toContain(requestedMode);
    }
  }
});
