import { describe, it, expect } from "vitest";
import { Effect } from "effect";
import { PasswordServiceLive, PasswordService } from "../../src/infrastructure/password.js";

describe("PasswordService", () => {
  it("hashes a password and verifies it correctly", async () => {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const svc = yield* PasswordService;
        const hash = yield* svc.hash("StrongPass123!");
        const valid = yield* svc.verify("StrongPass123!", hash);
        return valid;
      }).pipe(Effect.provide(PasswordServiceLive)),
    );
    expect(result).toBe(true);
  });

  it("returns false when verifying wrong password", async () => {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const svc = yield* PasswordService;
        const hash = yield* svc.hash("StrongPass123!");
        const valid = yield* svc.verify("WrongPassword!", hash);
        return valid;
      }).pipe(Effect.provide(PasswordServiceLive)),
    );
    expect(result).toBe(false);
  });

  it("produces different hashes for the same password (bcrypt salting)", async () => {
    const [hash1, hash2] = await Effect.runPromise(
      Effect.gen(function* () {
        const svc = yield* PasswordService;
        const h1 = yield* svc.hash("StrongPass123!");
        const h2 = yield* svc.hash("StrongPass123!");
        return [h1, h2] as const;
      }).pipe(Effect.provide(PasswordServiceLive)),
    );
    expect(hash1).not.toBe(hash2);
  });
});
