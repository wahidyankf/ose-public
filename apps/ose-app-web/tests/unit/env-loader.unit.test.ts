import { beforeEach, describe, expect, it, vi } from "vitest";

const loaderSpies = vi.hoisted(() => ({
  loadTierEnv: vi.fn<(...args: unknown[]) => unknown>(),
  resolveTier: vi.fn<(...args: unknown[]) => unknown>(),
  tierEnvFilePath: vi.fn<(...args: unknown[]) => unknown>(),
}));

vi.mock("@open-sharia-enterprise/ts-env-loader", () => loaderSpies);

describe("env-loader wrapper", () => {
  beforeEach(() => {
    vi.resetModules();
    loaderSpies.loadTierEnv.mockClear();
  });

  it("invokes the injected shared loader at composition-root import and re-exports its API", async () => {
    const mod = await import("../../src/env-loader");

    expect(loaderSpies.loadTierEnv).toHaveBeenCalledOnce();
    expect(mod.loadTierEnv).toBeTypeOf("function");
    expect(mod.resolveTier).toBeTypeOf("function");
    expect(mod.tierEnvFilePath).toBeTypeOf("function");
  });
});
