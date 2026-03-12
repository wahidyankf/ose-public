import { describe, it, expect } from "vitest";
import { Effect } from "effect";
import { loadConfig } from "../../src/config.js";

describe("loadConfig", () => {
  it("returns default config when env vars are not set", async () => {
    const config = await Effect.runPromise(loadConfig());
    expect(config.databaseUrl).toBe("sqlite::memory:");
    expect(config.jwtSecret).toBe("dev-jwt-secret-at-least-32-chars-long");
    expect(config.port).toBe(8201);
  });

  it("returns an object with required keys", async () => {
    const config = await Effect.runPromise(loadConfig());
    expect(config).toHaveProperty("databaseUrl");
    expect(config).toHaveProperty("jwtSecret");
    expect(config).toHaveProperty("port");
  });
});
