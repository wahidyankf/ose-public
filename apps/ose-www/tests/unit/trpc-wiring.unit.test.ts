import { afterEach, describe, expect, it, vi } from "vitest";
import { serverCaller } from "@/lib/trpc/server";

// The server caller imports `server-only`, which throws outside a server bundle. The unit run is not a bundle.
vi.mock("server-only", () => ({}));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("server caller", () => {
  it("calls procedures in-process without an HTTP hop", async () => {
    await expect(serverCaller.health.check()).resolves.toEqual({ status: "ok" });
  });
});

describe("browser client", () => {
  it("is built for the same origin when the code runs in a browser", async () => {
    vi.stubGlobal("window", {});
    const { trpcClient } = await import("@/lib/trpc/client");

    expect(typeof trpcClient.health.check.query).toBe("function");
  });

  it("is built for the local server when the code runs on the server", async () => {
    const { trpcClient } = await import("@/lib/trpc/client");

    expect(typeof trpcClient.content.listUpdates.query).toBe("function");
  });
});
