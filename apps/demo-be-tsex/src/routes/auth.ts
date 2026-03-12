import { HttpRouter, HttpServerResponse, HttpServerRequest } from "@effect/platform";
import { Effect } from "effect";
import { UserRepository } from "../infrastructure/db/user-repo.js";
import { RevokedTokenRepository } from "../infrastructure/db/token-repo.js";
import { PasswordService } from "../infrastructure/password.js";
import { JwtService } from "../auth/jwt.js";
import { requireAuth } from "../auth/middleware.js";
import { validatePasswordStrength, validateEmailFormat, validateUsername } from "../domain/user.js";
import { ValidationError, UnauthorizedError } from "../domain/errors.js";

const MAX_FAILED_ATTEMPTS = 5;

const register = HttpServerRequest.HttpServerRequest.pipe(
  Effect.flatMap((req) =>
    Effect.gen(function* () {
      const body = yield* req.json as Effect.Effect<Record<string, unknown>, unknown>;
      const username = (body["username"] as string | undefined) ?? "";
      const email = (body["email"] as string | undefined) ?? "";
      const password = (body["password"] as string | undefined) ?? "";

      if (!username) {
        return yield* Effect.fail(new ValidationError({ field: "username", message: "Username is required" }));
      }
      if (!email) {
        return yield* Effect.fail(new ValidationError({ field: "email", message: "Email is required" }));
      }
      if (!password) {
        return yield* Effect.fail(new ValidationError({ field: "password", message: "Password is required" }));
      }

      yield* validateUsername(username);
      yield* validateEmailFormat(email);
      yield* validatePasswordStrength(password);

      const passwordSvc = yield* PasswordService;
      const passwordHash = yield* passwordSvc.hash(password);

      const userRepo = yield* UserRepository;
      const user = yield* userRepo.create({ username, email, passwordHash, displayName: username });

      return yield* HttpServerResponse.json(
        {
          id: user.id,
          username: user.username,
          email: user.email,
          display_name: user.displayName,
          role: user.role,
          status: user.status,
        },
        { status: 201 },
      );
    }),
  ),
);

const login = HttpServerRequest.HttpServerRequest.pipe(
  Effect.flatMap((req) =>
    Effect.gen(function* () {
      const body = yield* req.json as Effect.Effect<Record<string, unknown>, unknown>;
      const username = (body["username"] as string | undefined) ?? "";
      const password = (body["password"] as string | undefined) ?? "";

      const userRepo = yield* UserRepository;
      const user = yield* userRepo.findByUsername(username);

      if (!user) {
        return yield* Effect.fail(new UnauthorizedError({ reason: "Invalid credentials" }));
      }

      if (user.status === "DISABLED") {
        return yield* Effect.fail(new UnauthorizedError({ reason: "Account is disabled" }));
      }

      if (user.status === "INACTIVE") {
        return yield* Effect.fail(new UnauthorizedError({ reason: "Account is deactivated" }));
      }

      if (user.status === "LOCKED") {
        return yield* Effect.fail(
          new UnauthorizedError({ reason: "Account is locked due to too many failed attempts" }),
        );
      }

      const passwordSvc = yield* PasswordService;
      const valid = yield* passwordSvc.verify(password, user.passwordHash);

      if (!valid) {
        const newAttempts = user.failedLoginAttempts + 1;
        yield* userRepo.incrementFailedAttempts(user.id);
        if (newAttempts >= MAX_FAILED_ATTEMPTS) {
          yield* userRepo.updateStatus(user.id, "LOCKED");
        }
        return yield* Effect.fail(new UnauthorizedError({ reason: "Invalid credentials" }));
      }

      yield* userRepo.resetFailedAttempts(user.id);

      const jwt = yield* JwtService;
      const accessToken = yield* jwt.signAccess(user.id, user.username, user.role);
      const refreshToken = yield* jwt.signRefresh(user.id);

      return yield* HttpServerResponse.json({
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: "Bearer",
      });
    }),
  ),
);

const logout = HttpServerRequest.HttpServerRequest.pipe(
  Effect.flatMap((req) =>
    Effect.gen(function* () {
      // Extract and verify token without checking revocation — logout is idempotent
      const token = req.headers["authorization"];
      const tokenStr = typeof token === "string" && token.startsWith("Bearer ") ? token.slice(7) : "";
      if (!tokenStr) {
        return yield* Effect.fail(new UnauthorizedError({ reason: "Missing Authorization header" }));
      }
      const jwt = yield* JwtService;
      const claims = yield* jwt.verify(tokenStr);
      if (claims.tokenType !== "access") {
        return yield* Effect.fail(new UnauthorizedError({ reason: "Not an access token" }));
      }
      const tokenRepo = yield* RevokedTokenRepository;
      yield* tokenRepo.revoke(claims.jti, claims.sub);
      return yield* HttpServerResponse.json({ message: "Logged out successfully" });
    }),
  ),
);

const logoutAll = HttpServerRequest.HttpServerRequest.pipe(
  Effect.flatMap((req) =>
    Effect.gen(function* () {
      const claims = yield* requireAuth(req);
      const tokenRepo = yield* RevokedTokenRepository;
      yield* tokenRepo.revokeAllForUser(claims.sub);
      return yield* HttpServerResponse.json({ message: "All sessions logged out" });
    }),
  ),
);

const refresh = HttpServerRequest.HttpServerRequest.pipe(
  Effect.flatMap((req) =>
    Effect.gen(function* () {
      const body = yield* req.json as Effect.Effect<Record<string, unknown>, unknown>;
      const refreshToken = (body["refresh_token"] as string | undefined) ?? "";

      if (!refreshToken) {
        return yield* Effect.fail(new UnauthorizedError({ reason: "Missing refresh token" }));
      }

      const jwt = yield* JwtService;
      const claims = yield* jwt.verify(refreshToken);

      if (claims.tokenType !== "refresh") {
        return yield* Effect.fail(new UnauthorizedError({ reason: "Not a refresh token" }));
      }

      const tokenRepo = yield* RevokedTokenRepository;
      const isRevoked = yield* tokenRepo.isRevoked(claims.jti, claims.sub, claims.iat);

      // Check user status before reporting token revocation — deactivation
      // messages take priority over generic "revoked" errors
      const userRepo = yield* UserRepository;
      const user = yield* userRepo.findById(claims.sub);
      if (!user) {
        return yield* Effect.fail(new UnauthorizedError({ reason: "User not found" }));
      }

      if (user.status !== "ACTIVE") {
        return yield* Effect.fail(new UnauthorizedError({ reason: "Account is deactivated" }));
      }

      if (isRevoked) {
        return yield* Effect.fail(new UnauthorizedError({ reason: "Token has been revoked" }));
      }

      // Revoke old refresh token
      yield* tokenRepo.revoke(claims.jti, claims.sub);

      const newAccessToken = yield* jwt.signAccess(user.id, user.username, user.role);
      const newRefreshToken = yield* jwt.signRefresh(user.id);

      return yield* HttpServerResponse.json({
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
        token_type: "Bearer",
      });
    }),
  ),
);

export const authRouter = HttpRouter.empty.pipe(
  HttpRouter.post("/api/v1/auth/register", register),
  HttpRouter.post("/api/v1/auth/login", login),
  HttpRouter.post("/api/v1/auth/logout", logout),
  HttpRouter.post("/api/v1/auth/logout-all", logoutAll),
  HttpRouter.post("/api/v1/auth/refresh", refresh),
);
