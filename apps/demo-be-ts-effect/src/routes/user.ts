import { HttpRouter, HttpServerResponse, HttpServerRequest } from "@effect/platform";
import { Effect } from "effect";
import { UserRepository } from "../infrastructure/db/user-repo.js";
import { RevokedTokenRepository } from "../infrastructure/db/token-repo.js";
import { PasswordService } from "../infrastructure/password.js";
import { requireAuth } from "../auth/middleware.js";
import { NotFoundError, UnauthorizedError } from "../domain/errors.js";
import type { UpdateProfileRequest, ChangePasswordRequest, User } from "../lib/api/types.js";

const getMe = HttpServerRequest.HttpServerRequest.pipe(
  Effect.flatMap((req) =>
    Effect.gen(function* () {
      const claims = yield* requireAuth(req);
      const userRepo = yield* UserRepository;
      const user = yield* userRepo.findById(claims.sub);
      if (!user) {
        return yield* Effect.fail(new NotFoundError({ resource: "User" }));
      }
      if (user.status !== "ACTIVE") {
        return yield* Effect.fail(new UnauthorizedError({ reason: "Account is not active" }));
      }
      const userResponse = {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        status: user.status,
      } as unknown as User;
      return yield* HttpServerResponse.json(userResponse);
    }),
  ),
);

const updateMe = HttpServerRequest.HttpServerRequest.pipe(
  Effect.flatMap((req) =>
    Effect.gen(function* () {
      const claims = yield* requireAuth(req);
      const body = yield* req.json as Effect.Effect<UpdateProfileRequest, unknown>;
      const displayName = (body["displayName"] ?? (body as Record<string, unknown>)["display_name"]) as
        | string
        | undefined;

      const userRepo = yield* UserRepository;
      const user = yield* userRepo.findById(claims.sub);
      if (!user) {
        return yield* Effect.fail(new NotFoundError({ resource: "User" }));
      }

      if (displayName !== undefined) {
        yield* userRepo.updateDisplayName(user.id, displayName);
      }

      const updated = yield* userRepo.findById(claims.sub);
      if (!updated) {
        return yield* Effect.fail(new NotFoundError({ resource: "User" }));
      }

      const updatedResponse = {
        id: updated.id,
        username: updated.username,
        email: updated.email,
        displayName: updated.displayName,
        role: updated.role,
        status: updated.status,
      } as unknown as User;
      return yield* HttpServerResponse.json(updatedResponse);
    }),
  ),
);

const changePassword = HttpServerRequest.HttpServerRequest.pipe(
  Effect.flatMap((req) =>
    Effect.gen(function* () {
      const claims = yield* requireAuth(req);
      const body = yield* req.json as Effect.Effect<ChangePasswordRequest, unknown>;
      const oldPassword =
        ((body["oldPassword"] ?? (body as Record<string, unknown>)["old_password"]) as string | undefined) ?? "";
      const newPassword =
        ((body["newPassword"] ?? (body as Record<string, unknown>)["new_password"]) as string | undefined) ?? "";

      const userRepo = yield* UserRepository;
      const user = yield* userRepo.findById(claims.sub);
      if (!user) {
        return yield* Effect.fail(new NotFoundError({ resource: "User" }));
      }

      const passwordSvc = yield* PasswordService;
      const valid = yield* passwordSvc.verify(oldPassword, user.passwordHash);
      if (!valid) {
        return yield* Effect.fail(new UnauthorizedError({ reason: "Invalid credentials" }));
      }

      const newHash = yield* passwordSvc.hash(newPassword);
      yield* userRepo.updatePassword(user.id, newHash);

      return yield* HttpServerResponse.json({ message: "Password changed successfully" });
    }),
  ),
);

const deactivateMe = HttpServerRequest.HttpServerRequest.pipe(
  Effect.flatMap((req) =>
    Effect.gen(function* () {
      const claims = yield* requireAuth(req);
      const userRepo = yield* UserRepository;
      const user = yield* userRepo.findById(claims.sub);
      if (!user) {
        return yield* Effect.fail(new NotFoundError({ resource: "User" }));
      }

      yield* userRepo.updateStatus(user.id, "INACTIVE");

      // Revoke all tokens for the user
      const tokenRepo = yield* RevokedTokenRepository;
      yield* tokenRepo.revokeAllForUser(user.id);

      return yield* HttpServerResponse.json({ message: "Account deactivated successfully" });
    }),
  ),
);

export const userRouter = HttpRouter.empty.pipe(
  HttpRouter.get("/api/v1/users/me", getMe),
  HttpRouter.patch("/api/v1/users/me", updateMe),
  HttpRouter.post("/api/v1/users/me/password", changePassword),
  HttpRouter.post("/api/v1/users/me/deactivate", deactivateMe),
);
