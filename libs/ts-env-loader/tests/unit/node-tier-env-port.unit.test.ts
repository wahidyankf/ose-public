/**
 * Unit tests for the production tier port's mapping onto Node and dotenv. The real `existsSync`
 * and `dotenv.config` are replaced by recording doubles, so the disk is never touched; the real
 * binding is exercised by the integration suite.
 */
import { describe, expect, it, vi } from "vitest";
import { createTierEnvPort, type DotenvDriver, type FileSystemDriver } from "../../src/node-tier-env-port";
import type { EnvRecord } from "../../src/index";

function recordingFileSystem(present: readonly string[]): FileSystemDriver & { existsSync: ReturnType<typeof vi.fn> } {
  return { existsSync: vi.fn((filePath: string) => present.includes(filePath)) };
}

function recordingDotenv(): DotenvDriver & { config: ReturnType<typeof vi.fn> } {
  return { config: vi.fn(() => ({})) };
}

describe("createTierEnvPort", () => {
  it("answers exists from the file-system driver for the exact path", () => {
    const fileSystem = recordingFileSystem(["/virtual/app/.env.stag"]);
    const port = createTierEnvPort(fileSystem, recordingDotenv());

    expect(port.exists("/virtual/app/.env.stag")).toBe(true);
    expect(port.exists("/virtual/app/.env.prod")).toBe(false);
    expect(fileSystem.existsSync).toHaveBeenNthCalledWith(1, "/virtual/app/.env.stag");
    expect(fileSystem.existsSync).toHaveBeenNthCalledWith(2, "/virtual/app/.env.prod");
  });

  it("loads a file through dotenv without overriding keys already present in the record", () => {
    const dotenv = recordingDotenv();
    const port = createTierEnvPort(recordingFileSystem([]), dotenv);
    const env: EnvRecord = { KEEP: "process-value" };

    port.load("/virtual/app/.env.stag", env);

    expect(dotenv.config).toHaveBeenCalledTimes(1);
    expect(dotenv.config).toHaveBeenCalledWith({
      path: "/virtual/app/.env.stag",
      override: false,
      processEnv: env,
    });
  });

  it("passes the target record itself, so dotenv writes into the caller's environment", () => {
    const dotenv = recordingDotenv();
    const port = createTierEnvPort(recordingFileSystem([]), dotenv);
    const env: EnvRecord = {};

    port.load("/virtual/app/.env.local", env);

    const options = dotenv.config.mock.calls[0]?.[0] as { processEnv: unknown };
    expect(options.processEnv).toBe(env);
  });
});
