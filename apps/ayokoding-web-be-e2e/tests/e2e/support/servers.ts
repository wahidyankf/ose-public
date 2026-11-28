// Owned-server helpers for the HTTP boundary adapter. The Playwright webServer
// owns port 3191. The one scenario that needs a second server (draft viewing on)
// starts the built binary on a free loopback port here, and the lifecycle hook
// closes it. The start is a single attempt: a port collision fails the scenario.
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

// freePort returns an available loopback port.
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
  close: () => Promise<void>;
};

// startOwnedBinary starts the built binary once on a free port and waits, bounded by
// a deadline, until it answers /en with 200. It fails if the process exits first.
export async function startOwnedBinary(env: Record<string, string>): Promise<SpawnedBinary> {
  const port = await freePort();
  const url = `http://127.0.0.1:${port}`;
  const child: ChildProcess = spawn(appBinaryPath(), [], {
    env: { ...process.env, ...env, AYOKODING_WEB_PORT: String(port) },
  });
  let errors = "";
  child.stderr?.on("data", (chunk: Buffer) => {
    errors += chunk.toString();
  });
  const deadline = Date.now() + 15000;
  for (;;) {
    if (child.exitCode !== null) {
      throw new Error(`Go server on ${port} exited before it was ready: ${errors}`);
    }
    try {
      const response = await fetch(`${url}/en`);
      await response.text().catch(() => undefined);
      if (response.status === 200) {
        return {
          port,
          url,
          close: async () => {
            child.kill("SIGTERM");
          },
        };
      }
    } catch {
      // Not listening yet.
    }
    if (Date.now() > deadline) {
      child.kill("SIGKILL");
      throw new Error(`Go server on ${port} never became ready: ${errors}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
}
