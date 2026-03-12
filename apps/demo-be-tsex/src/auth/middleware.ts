import { Effect } from "effect";
import type { HttpServerRequest } from "@effect/platform";
import { SqlError } from "@effect/sql/SqlError";
import { JwtService } from "./jwt.js";
import { RevokedTokenRepository } from "../infrastructure/db/token-repo.js";
import { UnauthorizedError, ForbiddenError } from "../domain/errors.js";
import type { JwtClaims } from "./jwt.js";

export const extractBearer = (request: HttpServerRequest.HttpServerRequest): string | null => {
  const authHeader = request.headers["authorization"];
  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return null;
};

export const requireAuth = (
  request: HttpServerRequest.HttpServerRequest,
): Effect.Effect<JwtClaims, UnauthorizedError | SqlError, JwtService | RevokedTokenRepository> =>
  Effect.gen(function* () {
    const token = extractBearer(request);
    if (!token) {
      return yield* Effect.fail(new UnauthorizedError({ reason: "Missing Authorization header" }));
    }
    const jwt = yield* JwtService;
    const claims = yield* jwt.verify(token);
    if (claims.tokenType !== "access") {
      return yield* Effect.fail(new UnauthorizedError({ reason: "Not an access token" }));
    }
    const tokenRepo = yield* RevokedTokenRepository;
    const isRevoked = yield* tokenRepo.isRevoked(claims.jti);
    if (isRevoked) {
      return yield* Effect.fail(new UnauthorizedError({ reason: "Token has been revoked" }));
    }
    return claims;
  });

export const requireAdmin = (
  request: HttpServerRequest.HttpServerRequest,
): Effect.Effect<JwtClaims, UnauthorizedError | ForbiddenError | SqlError, JwtService | RevokedTokenRepository> =>
  Effect.gen(function* () {
    const claims = yield* requireAuth(request);
    if (claims.role !== "ADMIN") {
      return yield* Effect.fail(new ForbiddenError({ reason: "Admin access required" }));
    }
    return claims;
  });
