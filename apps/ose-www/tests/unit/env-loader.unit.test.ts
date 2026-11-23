import { beforeEach, describe, expect, it, vi } from "vitest";

const loaderSpies = vi.hoisted(() => ({
  loadTierEnv: vi.fn<(...args: unknown[]) => unknown>(),
  resolveTier: vi.fn<(...args: unknown[]) => unknown>(),
  tierEnvFilePath: vi.fn<(...args: unknown[]) => unknown>(),
}));

vi.mock("@open-sharia-enterprise/ts-env-loader", () => loaderSpies);

describe("env-loader composition wrapper", () => {
  beforeEach(() => {
    vi.resetModules();
    loaderSpies.loadTierEnv.mockClear();
  });

  it("invokes the shared loader on import and re-exports its public API", async () => {
    const envLoader = await import("../../src/env-loader");

    expect(loaderSpies.loadTierEnv).toHaveBeenCalledOnce();
    expect(envLoader.loadTierEnv).toBeTypeOf("function");
    expect(envLoader.resolveTier).toBeTypeOf("function");
    expect(envLoader.tierEnvFilePath).toBeTypeOf("function");
  });
});
