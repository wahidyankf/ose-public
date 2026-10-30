// Owned-server helpers for the Playwright E2E adapter. The suite never
// touches a developer's listeners: the Go binary under test is started by the
// Playwright webServer on 3191, and anything else the suite needs (the old
// origin stub on 3101, launcher binaries on free ports) is started here and
// closed by the lifecycle hook.
import { createServer, type Server } from "node:http";
import { spawn, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { expect } from "@playwright/test";

// appBinaryPath resolves the built Go server from either the project
// directory (the `test:e2e` working directory) or the workspace root.
export function appBinaryPath(): string {
  const candidates = [
    path.resolve(process.cwd(), "..", "ayokoding-web", "dist", "ayokoding-web"),
    path.resolve(process.cwd(), "apps", "ayokoding-web", "dist", "ayokoding-web"),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return candidates[0] as string;
}

// freePort returns an available loopback port for launcher scenarios.
export async function freePort(): Promise<number> {
  const probe = net.createServer();
  await new Promise<void>((resolve) => probe.listen(0, "127.0.0.1", resolve));
  const address = probe.address();
  const port = typeof address === "object" && address !== null ? address.port : 0;
  await new Promise<void>((resolve, reject) => probe.close((error) => (error ? reject(error) : resolve())));
  expect(port, "no free loopback port").toBeGreaterThan(0);
  return port;
}

export type SpawnedBinary = {
  port: number;
  url: string;
  stderr: () => string;
  close: () => Promise<void>;
};

// spawnExpectExit runs the built binary once and captures its exit, for the
// invalid-configuration scenarios that must fail before accepting requests.
export async function spawnExpectExit(
  args: string[],
  env: Record<string, string>,
): Promise<{ code: number; stderr: string }> {
  const child: ChildProcess = spawn(appBinaryPath(), args, {
    env: { ...process.env, ...env },
  });
  let errors = "";
  child.stderr?.on("data", (chunk: Buffer) => {
    errors += chunk.toString();
  });
  const code: number = await new Promise((resolve) => {
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      resolve(124);
    }, 15000);
    child.on("exit", (exitCode) => {
      clearTimeout(timer);
      resolve(exitCode ?? 0);
    });
  });
  return { code, stderr: errors };
}

// spawnBinary starts the built Go server and waits until it answers. The
// server resolves its listener exactly like production: an explicit --port
// flag wins, then AYOKODING_WEB_PORT, then 3102. A busy listener fails
// clearly; the suite never kills or reuses another process. The caller owns
// cleanup through the returned handle.
export async function spawnBinary(env: Record<string, string>, args: string[] = []): Promise<SpawnedBinary> {
  const child: ChildProcess = spawn(appBinaryPath(), args, {
    env: { ...process.env, ...env },
  });
  let errors = "";
  child.stderr?.on("data", (chunk: Buffer) => {
    errors += chunk.toString();
  });
  let port = 3102;
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === "--port" && index + 1 < args.length) {
      port = Number(args[index + 1]);
    } else if (args[index]?.startsWith("--port=") === true) {
      port = Number(args[index]?.slice("--port=".length));
    }
  }
  if (!args.some((argument) => argument.startsWith("--port")) && env["AYOKODING_WEB_PORT"] !== undefined) {
    port = Number(env["AYOKODING_WEB_PORT"]);
  }
  const url = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + 15000;
  for (;;) {
    try {
      const response = await fetch(`${url}/en`);
      await response.text().catch(() => undefined);
      if (response.status === 200) break;
    } catch {
      // Not listening yet.
    }
    if (Date.now() > deadline || child.exitCode !== null) {
      child.kill("SIGKILL");
      throw new Error(`Go server on ${port} never became ready: ${errors}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  return {
    port,
    url,
    stderr: () => errors,
    close: async () => {
      child.kill("SIGTERM");
    },
  };
}

export type StubServer = {
  port: number;
  close: () => Promise<void>;
};

// startExternalStub binds the old-origin stub responder the godog
// integration driver also stubs: a static external page, owned by the
// scenario and closed by the lifecycle hook.
export async function startExternalStub(port: number): Promise<StubServer> {
  const server: Server = createServer((_request, response) => {
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    response.end("<html><body>external</body></html>");
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolve);
  });
  return {
    port,
    close: () =>
      new Promise<void>((resolve) => {
        server.close(() => resolve());
      }),
  };
}

// portAnswers reports whether a loopback listener answers on the port.
export async function portAnswers(port: number): Promise<boolean> {
  try {
    const response = await fetch(`http://127.0.0.1:${port}/en`);
    await response.text().catch(() => undefined);
    return response.status < 500;
  } catch {
    return false;
  }
}
