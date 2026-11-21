// @scenario specs/apps/organiclever/app-web/behaviours/health/system-status-be.feature: BE status page shows UP when backend healthy
// @scenario specs/apps/organiclever/app-web/behaviours/health/system-status-be.feature: BE status page shows DOWN with the failure reason when backend unreachable
// @scenario specs/apps/organiclever/app-web/behaviours/health/system-status-be.feature: BE status page shows DOWN with the HTTP status when the backend answers with an error status
// @scenario specs/apps/organiclever/app-web/behaviours/health/system-status-be.feature: BE status page shows DOWN when backend times out

/**
 * Integration tests for the BE status page. The page's real `fetch` call goes to
 * loopback HTTP servers this file starts, so the backend answers UP, answers 503,
 * refuses the connection, or never answers (the page's 3 s timeout fires).
 * The rendered markup is checked with react-dom/server, so no DOM is needed.
 */
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, describe, expect, it, vi } from "vitest";

const testEnv = vi.hoisted(() => ({
  ORGANICLEVER_BE_URL: undefined as string | undefined,
}));

vi.mock("@/env", () => ({
  env: testEnv,
}));

import BeStatusPage from "@/app/system/status/be/page";

const servers: Server[] = [];

async function startServer(handler: (request: IncomingMessage, response: ServerResponse) => void): Promise<string> {
  const server = createServer(handler);
  servers.push(server);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  return `http://127.0.0.1:${port}`;
}

async function refusedUrl(): Promise<string> {
  // Listen on a free loopback port, then close it, so the next connection is refused.
  const probe = createServer();
  await new Promise<void>((resolve) => probe.listen(0, "127.0.0.1", resolve));
  const { port } = probe.address() as AddressInfo;
  await new Promise<void>((resolve, reject) => probe.close((error) => (error ? reject(error) : resolve())));
  return `http://127.0.0.1:${port}`;
}

async function renderStatusPage(backendUrl: string): Promise<string> {
  testEnv.ORGANICLEVER_BE_URL = backendUrl;
  return renderToStaticMarkup(await BeStatusPage());
}

afterAll(async () => {
  testEnv.ORGANICLEVER_BE_URL = undefined;

  for (const server of servers) {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

describe("BE status page against a real HTTP backend", () => {
  it("BE status page shows UP when backend healthy", async () => {
    const backendUrl = await startServer((_request, response) => {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ status: "UP" }));
    });

    const html = await renderStatusPage(backendUrl);

    expect(html).toContain("UP —");
    expect(html).toContain(backendUrl);
    expect(html).not.toContain("DOWN");
  });

  it("BE status page shows DOWN with the failure reason when backend unreachable", async () => {
    const html = await renderStatusPage(await refusedUrl());

    expect(html).toContain("DOWN —");
    expect(html).toContain("Reason: fetch failed");
  });

  it("BE status page shows DOWN with the HTTP status when the backend answers with an error status", async () => {
    const backendUrl = await startServer((_request, response) => {
      response.writeHead(503);
      response.end();
    });

    const html = await renderStatusPage(backendUrl);

    expect(html).toContain("DOWN —");
    expect(html).toContain("Reason: HTTP 503");
  });

  it("BE status page shows DOWN when backend times out", { timeout: 15_000 }, async () => {
    // The server accepts the connection and never answers, so the page's 3 s timeout ends the probe.
    const backendUrl = await startServer(() => {});

    const html = await renderStatusPage(backendUrl);

    expect(html).toContain("DOWN —");
    expect(html).toContain("timeout");
  });
});
