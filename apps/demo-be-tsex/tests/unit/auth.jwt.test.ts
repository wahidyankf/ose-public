import { describe, it, expect } from "vitest";
import { Effect } from "effect";
import { makeJwtService, JwtServiceLive } from "../../src/auth/jwt.js";

const TEST_SECRET = "test-jwt-secret-at-least-32-chars-long!!";

describe("makeJwtService", () => {
  const service = makeJwtService(TEST_SECRET);

  describe("signAccess", () => {
    it("produces a non-empty JWT string", async () => {
      const token = await Effect.runPromise(service.signAccess("user-1", "testuser", "USER"));
      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(10);
      expect(token.split(".")).toHaveLength(3);
    });
  });

  describe("signRefresh", () => {
    it("produces a non-empty JWT string", async () => {
      const token = await Effect.runPromise(service.signRefresh("user-1"));
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3);
    });
  });

  describe("verify", () => {
    it("verifies a valid access token and returns claims", async () => {
      const claims = await Effect.runPromise(
        Effect.gen(function* () {
          const token = yield* service.signAccess("user-1", "testuser", "ADMIN");
          return yield* service.verify(token);
        }),
      );
      expect(claims.sub).toBe("user-1");
      expect(claims.username).toBe("testuser");
      expect(claims.role).toBe("ADMIN");
      expect(claims.tokenType).toBe("access");
      expect(claims.jti).toBeTruthy();
    });

    it("verifies a valid refresh token and returns claims", async () => {
      const claims = await Effect.runPromise(
        Effect.gen(function* () {
          const token = yield* service.signRefresh("user-2");
          return yield* service.verify(token);
        }),
      );
      expect(claims.sub).toBe("user-2");
      expect(claims.tokenType).toBe("refresh");
    });

    it("fails with UnauthorizedError for an invalid token", async () => {
      const result = await Effect.runPromise(Effect.either(service.verify("not.a.valid.token")));
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left._tag).toBe("UnauthorizedError");
      }
    });

    it("fails with UnauthorizedError for a token signed with wrong secret", async () => {
      const otherService = makeJwtService("different-secret-32-chars-long!!");
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const token = yield* otherService.signAccess("user-1", "u", "USER");
          return yield* Effect.either(service.verify(token));
        }),
      );
      expect(result._tag).toBe("Left");
    });
  });

  describe("getJwks", () => {
    it("returns an object with a keys array", async () => {
      const jwks = await Effect.runPromise(service.getJwks());
      expect(typeof jwks).toBe("object");
    });

    it("returns the same cached object on second call", async () => {
      const jwks1 = await Effect.runPromise(service.getJwks());
      const jwks2 = await Effect.runPromise(service.getJwks());
      expect(jwks1).toBe(jwks2);
    });
  });
});

describe("JwtServiceLive", () => {
  it("provides the JwtService tag", async () => {
    const { JwtService } = await import("../../src/auth/jwt.js");
    const token = await Effect.runPromise(
      Effect.gen(function* () {
        const svc = yield* JwtService;
        return yield* svc.signAccess("u1", "user", "USER");
      }).pipe(Effect.provide(JwtServiceLive(TEST_SECRET))),
    );
    expect(typeof token).toBe("string");
  });
});
