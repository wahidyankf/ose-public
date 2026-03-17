import { HttpRouter, HttpServerResponse, HttpServerRequest } from "@effect/platform";
import { Effect } from "effect";
import { UserRepository } from "../infrastructure/db/user-repo.js";
import { RevokedTokenRepository } from "../infrastructure/db/token-repo.js";
import { JwtService } from "../auth/jwt.js";
import { requireAdmin } from "../auth/middleware.js";
import { NotFoundError } from "../domain/errors.js";
import type { User, UserListResponse, PasswordResetResponse } from "../lib/api/types.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function userToResponse(user: any) {
  return {
    id: user.id as string,
    username: user.username as string,
    email: user.email as string,
    displayName: user.displayName as string,
    role: user.role as string,
    status: user.status as string,
  };
}

const listUsers = HttpServerRequest.HttpServerRequest.pipe(
  Effect.flatMap((req) =>
    Effect.gen(function* () {
      yield* requireAdmin(req);
      const url = new URL(req.url, "http://localhost");
      const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
      const size = Math.min(100, parseInt(url.searchParams.get("size") ?? "20", 10));
      const search = url.searchParams.get("search") ?? url.searchParams.get("email") ?? undefined;

      const userRepo = yield* UserRepository;
      const result = yield* userRepo.listUsers(page, size, search);

      const userListResponse = {
        content: result.items.map(userToResponse),
        totalElements: result.total,
        page,
        size,
      } as unknown as UserListResponse;
      return yield* HttpServerResponse.json(userListResponse);
    }),
  ),
);

const disableUser = HttpRouter.params.pipe(
  Effect.flatMap((params) =>
    HttpServerRequest.HttpServerRequest.pipe(
      Effect.flatMap((req) =>
        Effect.gen(function* () {
          yield* requireAdmin(req);
          const userId = params["userId"] ?? "";

          const userRepo = yield* UserRepository;
          const user = yield* userRepo.findById(userId);
          if (!user) {
            return yield* Effect.fail(new NotFoundError({ resource: "User" }));
          }

          yield* userRepo.updateStatus(userId, "DISABLED");

          // Revoke all tokens for the user
          const tokenRepo = yield* RevokedTokenRepository;
          yield* tokenRepo.revokeAllForUser(userId);

          const updated = yield* userRepo.findById(userId);
          if (!updated) {
            return yield* Effect.fail(new NotFoundError({ resource: "User" }));
          }

          return yield* HttpServerResponse.json(userToResponse(updated) as unknown as User);
        }),
      ),
    ),
  ),
);

const enableUser = HttpRouter.params.pipe(
  Effect.flatMap((params) =>
    HttpServerRequest.HttpServerRequest.pipe(
      Effect.flatMap((req) =>
        Effect.gen(function* () {
          yield* requireAdmin(req);
          const userId = params["userId"] ?? "";

          const userRepo = yield* UserRepository;
          const user = yield* userRepo.findById(userId);
          if (!user) {
            return yield* Effect.fail(new NotFoundError({ resource: "User" }));
          }

          yield* userRepo.updateStatus(userId, "ACTIVE");

          const updated = yield* userRepo.findById(userId);
          if (!updated) {
            return yield* Effect.fail(new NotFoundError({ resource: "User" }));
          }

          return yield* HttpServerResponse.json(userToResponse(updated) as unknown as User);
        }),
      ),
    ),
  ),
);

const unlockUser = HttpRouter.params.pipe(
  Effect.flatMap((params) =>
    HttpServerRequest.HttpServerRequest.pipe(
      Effect.flatMap((req) =>
        Effect.gen(function* () {
          yield* requireAdmin(req);
          const userId = params["userId"] ?? "";

          const userRepo = yield* UserRepository;
          const user = yield* userRepo.findById(userId);
          if (!user) {
            return yield* Effect.fail(new NotFoundError({ resource: "User" }));
          }

          yield* userRepo.updateStatus(userId, "ACTIVE");
          yield* userRepo.resetFailedAttempts(userId);

          const updated = yield* userRepo.findById(userId);
          if (!updated) {
            return yield* Effect.fail(new NotFoundError({ resource: "User" }));
          }

          return yield* HttpServerResponse.json(userToResponse(updated) as unknown as User);
        }),
      ),
    ),
  ),
);

const forcePasswordReset = HttpRouter.params.pipe(
  Effect.flatMap((params) =>
    HttpServerRequest.HttpServerRequest.pipe(
      Effect.flatMap((req) =>
        Effect.gen(function* () {
          yield* requireAdmin(req);
          const userId = params["userId"] ?? "";

          const userRepo = yield* UserRepository;
          const user = yield* userRepo.findById(userId);
          if (!user) {
            return yield* Effect.fail(new NotFoundError({ resource: "User" }));
          }

          // Generate a temporary reset token (short-lived access token)
          const jwt = yield* JwtService;
          const resetToken = yield* jwt.signAccess(user.id, user.username, user.role);

          const resetResponse = { token: resetToken } satisfies PasswordResetResponse;
          return yield* HttpServerResponse.json(resetResponse);
        }),
      ),
    ),
  ),
);

export const adminRouter = HttpRouter.empty.pipe(
  HttpRouter.get("/api/v1/admin/users", listUsers),
  HttpRouter.post("/api/v1/admin/users/:userId/disable", disableUser),
  HttpRouter.post("/api/v1/admin/users/:userId/enable", enableUser),
  HttpRouter.post("/api/v1/admin/users/:userId/unlock", unlockUser),
  HttpRouter.post("/api/v1/admin/users/:userId/force-password-reset", forcePasswordReset),
);
