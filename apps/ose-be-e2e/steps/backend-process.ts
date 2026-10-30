import { spawn, spawnSync, type ChildProcessWithoutNullStreams } from "node:child_process";
import { createConnection } from "node:net";
import { createBdd } from "playwright-bdd";

const { AfterAll } = createBdd();

const baseUrl = "http://127.0.0.1:8302";
const projectFile = "../ose-be/src/OseBe/OseBe.fsproj";
let backend: ChildProcessWithoutNullStreams | undefined;
let output = "";

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function endpointResponds(path = "/api/v1/health") {
  try {
    const response = await fetch(`${baseUrl}${path}`);
    return response.ok;
  } catch {
    return false;
  }
}

export async function stopBackend() {
  if (!backend) return;

  const processToStop = backend;
  backend = undefined;

  if (processToStop.exitCode === null) {
    processToStop.kill("SIGTERM");
    await Promise.race([
      new Promise<void>((resolve) => processToStop.once("exit", () => resolve())),
      wait(5_000).then(() => {
        if (processToStop.exitCode === null) processToStop.kill("SIGKILL");
      }),
    ]);
  }

  for (let attempt = 0; attempt < 20 && (await endpointResponds()); attempt += 1) {
    await wait(100);
  }
}

export async function startBackend() {
  await stopBackend();
  output = "";

  backend = spawn("dotnet", ["run", "--project", projectFile, "--no-build", "--configuration", "Release"], {
    cwd: process.cwd(),
    env: { ...process.env, OSE_BE_PORT: "8302" },
    stdio: "pipe",
  });
  backend.stdout.on("data", (chunk: Buffer) => (output += chunk.toString()));
  backend.stderr.on("data", (chunk: Buffer) => (output += chunk.toString()));

  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (await endpointResponds()) return;
    if (backend.exitCode !== null) throw new Error(`ose-be exited during startup:\n${output}`);
    await wait(500);
  }

  throw new Error(`ose-be did not become ready:\n${output}`);
}

export async function ensureBackendStarted() {
  if (!(await endpointResponds())) await startBackend();
}

export async function assertBackendStopped() {
  await stopBackend();
  if (await endpointResponds()) throw new Error("ose-be is still reachable after it was stopped");
}

export async function assertNatsReachable() {
  await new Promise<void>((resolve, reject) => {
    const socket = createConnection({ host: "127.0.0.1", port: 4225 });
    socket.setTimeout(5_000);
    socket.once("connect", () => {
      socket.end();
      resolve();
    });
    socket.once("timeout", () => {
      socket.destroy();
      reject(new Error("NATS did not accept a connection on port 4225"));
    });
    socket.once("error", reject);
  });
}

export function resetDatabaseToPending() {
  const sql =
    "DROP SCHEMA public CASCADE; CREATE SCHEMA public; " +
    "SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public';";
  const result = spawnSync(
    "podman",
    [
      "compose",
      "-p",
      "ose-be-e2e",
      "-f",
      "../ose-be/docker-compose.e2e.yml",
      "exec",
      "-T",
      "postgres",
      "psql",
      "-U",
      "postgres",
      "-d",
      "ose_app",
      "-v",
      "ON_ERROR_STOP=1",
      "-tAc",
      sql,
    ],
    { cwd: process.cwd(), encoding: "utf8", env: { ...process.env, PODMAN_COMPOSE_PROVIDER: "podman-compose" } },
  );

  if (result.status !== 0) {
    throw new Error(`failed to reset ose-be database:\n${result.stdout}\n${result.stderr}`);
  }
  if (result.stdout.trim().split("\n").at(-1) !== "0") {
    throw new Error(`ose-be database is not migration-pending:\n${result.stdout}`);
  }
}

export async function readJson(path: string) {
  const response = await fetch(`${baseUrl}${path}`);
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);
  return (await response.json()) as Record<string, unknown>;
}

export async function readStatus(path: string) {
  const response = await fetch(`${baseUrl}${path}`);
  return response.status;
}

AfterAll(async () => {
  await stopBackend();
});

process.once("exit", () => {
  if (backend?.exitCode === null) backend.kill("SIGKILL");
});
