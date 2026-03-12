import { describe, it, expect } from "vitest";
import { Effect, Layer } from "effect";
import { HttpServerRequest } from "@effect/platform";
import { extractBearer, requireAuth, requireAdmin } from "../../src/auth/middleware.js";
import { JwtService } from "../../src/auth/jwt.js";
import { RevokedTokenRepository } from "../../src/infrastructure/db/token-repo.js";
import { UnauthorizedError, ForbiddenError } from "../../src/domain/errors.js";
import type { JwtClaims } from "../../src/auth/jwt.js";

// Helper to make a mock HttpServerRequest with given headers
function mockRequest(headers: Record<string, string>): HttpServerRequest.HttpServerRequest {
  return {
    headers,
  } as unknown as HttpServerRequest.HttpServerRequest;
}

// Mock JwtService layer
function makeJwtLayer(claims: JwtClaims | null): Layer.Layer<JwtService> {
  return Layer.succeed(JwtService, {
    signAccess: () => Effect.succeed("token"),
    signRefresh: () => Effect.succeed("token"),
    verify: (_token: string) =>
      claims ? Effect.succeed(claims) : Effect.fail(new UnauthorizedError({ reason: "Invalid token" })),
    getJwks: () => Effect.succeed({}),
  });
}

// Mock RevokedTokenRepository layer
function makeTokenRepoLayer(isRevoked: boolean): Layer.Layer<RevokedTokenRepository> {
  return Layer.succeed(RevokedTokenRepository, {
    revoke: () => Effect.succeed(undefined),
    isRevoked: () => Effect.succeed(isRevoked),
    revokeAllForUser: () => Effect.succeed(undefined),
  });
}

const validAccessClaims: JwtClaims = {
  sub: "user-1",
  username: "testuser",
  role: "USER",
  jti: "test-jti",
  tokenType: "access",
};

const adminClaims: JwtClaims = {
  ...validAccessClaims,
  role: "ADMIN",
};

const refreshClaims: JwtClaims = {
  ...validAccessClaims,
  tokenType: "refresh",
};

describe("extractBearer", () => {
  it("extracts token from valid Authorization header", () => {
    const req = mockRequest({ authorization: "Bearer mytoken123" });
    expect(extractBearer(req)).toBe("mytoken123");
  });

  it("returns null when no Authorization header", () => {
    const req = mockRequest({});
    expect(extractBearer(req)).toBeNull();
  });

  it("returns null when Authorization is not Bearer", () => {
    const req = mockRequest({ authorization: "Basic abc123" });
    expect(extractBearer(req)).toBeNull();
  });

  it("returns null when Authorization header is not a string", () => {
    const req = mockRequest({ authorization: "Bearer " });
    expect(extractBearer(req)).toBe("");
  });
});

describe("requireAuth", () => {
  it("returns claims for a valid non-revoked access token", async () => {
    const req = mockRequest({ authorization: "Bearer valid-token" });
    const claims = await Effect.runPromise(
      requireAuth(req).pipe(Effect.provide(makeJwtLayer(validAccessClaims)), Effect.provide(makeTokenRepoLayer(false))),
    );
    expect(claims.sub).toBe("user-1");
  });

  it("fails with UnauthorizedError when no token provided", async () => {
    const req = mockRequest({});
    const result = await Effect.runPromise(
      Effect.either(requireAuth(req)).pipe(
        Effect.provide(makeJwtLayer(validAccessClaims)),
        Effect.provide(makeTokenRepoLayer(false)),
      ),
    );
    expect(result._tag).toBe("Left");
    if (result._tag === "Left" && result.left._tag === "UnauthorizedError") {
      expect((result.left as UnauthorizedError).reason).toContain("Missing Authorization header");
    }
  });

  it("fails with UnauthorizedError when token is revoked", async () => {
    const req = mockRequest({ authorization: "Bearer revoked-token" });
    const result = await Effect.runPromise(
      Effect.either(requireAuth(req)).pipe(
        Effect.provide(makeJwtLayer(validAccessClaims)),
        Effect.provide(makeTokenRepoLayer(true)),
      ),
    );
    expect(result._tag).toBe("Left");
    if (result._tag === "Left" && result.left._tag === "UnauthorizedError") {
      expect((result.left as UnauthorizedError).reason).toContain("revoked");
    }
  });

  it("fails with UnauthorizedError when token is a refresh token", async () => {
    const req = mockRequest({ authorization: "Bearer refresh-token" });
    const result = await Effect.runPromise(
      Effect.either(requireAuth(req)).pipe(
        Effect.provide(makeJwtLayer(refreshClaims)),
        Effect.provide(makeTokenRepoLayer(false)),
      ),
    );
    expect(result._tag).toBe("Left");
    if (result._tag === "Left" && result.left._tag === "UnauthorizedError") {
      expect((result.left as UnauthorizedError).reason).toContain("Not an access token");
    }
  });

  it("fails with UnauthorizedError when JWT verification fails", async () => {
    const req = mockRequest({ authorization: "Bearer bad-token" });
    const result = await Effect.runPromise(
      Effect.either(requireAuth(req)).pipe(
        Effect.provide(makeJwtLayer(null)),
        Effect.provide(makeTokenRepoLayer(false)),
      ),
    );
    expect(result._tag).toBe("Left");
  });
});

describe("requireAdmin", () => {
  it("returns claims for a valid admin token", async () => {
    const req = mockRequest({ authorization: "Bearer admin-token" });
    const claims = await Effect.runPromise(
      requireAdmin(req).pipe(Effect.provide(makeJwtLayer(adminClaims)), Effect.provide(makeTokenRepoLayer(false))),
    );
    expect(claims.role).toBe("ADMIN");
  });

  it("fails with ForbiddenError when user is not admin", async () => {
    const req = mockRequest({ authorization: "Bearer user-token" });
    const result = await Effect.runPromise(
      Effect.either(requireAdmin(req)).pipe(
        Effect.provide(makeJwtLayer(validAccessClaims)),
        Effect.provide(makeTokenRepoLayer(false)),
      ),
    );
    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      const err = result.left as ForbiddenError | UnauthorizedError;
      expect(err._tag).toBe("ForbiddenError");
    }
  });

  it("fails with UnauthorizedError when no token provided", async () => {
    const req = mockRequest({});
    const result = await Effect.runPromise(
      Effect.either(requireAdmin(req)).pipe(
        Effect.provide(makeJwtLayer(adminClaims)),
        Effect.provide(makeTokenRepoLayer(false)),
      ),
    );
    expect(result._tag).toBe("Left");
  });
});
