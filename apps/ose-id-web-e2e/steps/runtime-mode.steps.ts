/**
 * E2E bindings for specs/apps/ose/id-web/behaviours/foundation/runtime-mode.feature.
 *
 * This adapter owns the real process boundary: it starts an actual `ose-id-web` server process
 * with the mode under test and observes the exit status, the diagnostic stream, and the absence of
 * a listener. Nothing below the process is stubbed.
 */
import { spawn } from "node:child_process";
import { connect } from "node:net";
import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";

const { Given, When, Then } = createBdd();

/** A port no OSE service claims, so a rejected start cannot collide with the running shell. */
const GUARD_PROBE_PORT = 3599;
const STARTUP_TIMEOUT_MS = 120_000;

interface StartupObservation {
  readonly exitCode: number | null;
  readonly diagnostics: string;
}

let requestedMode = "";
let observation: StartupObservation | undefined;

function environmentForMode(mode: string): NodeJS.ProcessEnv {
  const environment: NodeJS.ProcessEnv = { ...process.env, APP_ENV: "test" };
  delete environment["OSE_RUNTIME_MODE"];
  if (mode !== "missing") {
    environment["OSE_RUNTIME_MODE"] = mode;
  }
  return environment;
}

async function startWebProcess(mode: string): Promise<StartupObservation> {
  return new Promise<StartupObservation>((resolve, reject) => {
    const child = spawn("npx", ["next", "dev", "--port", String(GUARD_PROBE_PORT)], {
      cwd: new URL("../../ose-id-web", import.meta.url).pathname,
      env: environmentForMode(mode),
      stdio: ["ignore", "pipe", "pipe"],
    });

    let diagnostics = "";
    child.stdout.on("data", (chunk: Buffer) => {
      diagnostics += chunk.toString();
    });
    child.stderr.on("data", (chunk: Buffer) => {
      diagnostics += chunk.toString();
    });

    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("the web process was still running after the startup timeout"));
    }, STARTUP_TIMEOUT_MS);

    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("exit", (exitCode) => {
      clearTimeout(timer);
      resolve({ exitCode, diagnostics });
    });
  });
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
  expect(await portAcceptsConnections(GUARD_PROBE_PORT), "no listener may survive a rejected start").toBe(false);
});

Then("the diagnostic returns the stable runtime-mode-disabled code", async () => {
  const diagnostics = observation?.diagnostics ?? "";
  expect(diagnostics).toContain("runtime_mode_disabled");
  expect(diagnostics).not.toContain(requestedMode === "missing" ? "OSE_RUNTIME_MODE=" : `=${requestedMode}`);
});
