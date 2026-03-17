import { describe, it, expect } from "vitest";
import { Effect, Layer } from "effect";
import { HttpServerRequest, HttpServerResponse } from "@effect/platform";
import type { HttpServerRequest as HttpServerRequestType } from "@effect/platform/HttpServerRequest";
import { Stream } from "effect";
import { authRouter } from "../../src/routes/auth.js";
import { UserRepository } from "../../src/infrastructure/db/user-repo.js";
import { RevokedTokenRepository } from "../../src/infrastructure/db/token-repo.js";
import { PasswordService } from "../../src/infrastructure/password.js";
import { JwtService } from "../../src/auth/jwt.js";
import type { User } from "../../src/domain/user.js";
import type { UserRepositoryApi } from "../../src/infrastructure/db/user-repo.js";
import type { RevokedTokenRepositoryApi } from "../../src/infrastructure/db/token-repo.js";
import type { PasswordServiceApi } from "../../src/infrastructure/password.js";
import type { JwtServiceApi } from "../../src/auth/jwt.js";

// Mock helpers

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeRequest(options: {
  headers?: Record<string, string>;
  body?: any;
  url?: string;
  method?: string;
}): HttpServerRequestType {
  const headers = options.headers ?? {};
  return {
    headers,
    url: options.url ?? "/api/v1/auth/register",
    method: options.method ?? "POST",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    json: Effect.succeed(options.body ?? {}) as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    text: Effect.succeed(JSON.stringify(options.body ?? {})) as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    arrayBuffer: Effect.succeed(new ArrayBuffer(0)) as any,
    multipartStream: Stream.empty,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    multipart: Effect.succeed({}) as any,
  } as unknown as HttpServerRequestType;
}

const mockUser: User = {
  id: "user-1",
  username: "alice",
  email: "alice@example.com",
  passwordHash: "hashed",
  displayName: "alice",
  role: "USER",
  status: "ACTIVE",
  failedLoginAttempts: 0,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

function makeUserRepoLayer(overrides: Partial<UserRepositoryApi> = {}): Layer.Layer<UserRepository> {
  const base: UserRepositoryApi = {
    create: () => Effect.succeed(mockUser),
    findByUsername: () => Effect.succeed(mockUser),
    findByEmail: () => Effect.succeed(null),
    findById: () => Effect.succeed(mockUser),
    updateStatus: () => Effect.succeed(undefined),
    updateDisplayName: () => Effect.succeed(undefined),
    updatePassword: () => Effect.succeed(undefined),
    incrementFailedAttempts: () => Effect.succeed(undefined),
    resetFailedAttempts: () => Effect.succeed(undefined),
    listUsers: () => Effect.succeed({ items: [], total: 0 }),
  };
  return Layer.succeed(UserRepository, { ...base, ...overrides });
}

function makeTokenRepoLayer(isRevoked = false): Layer.Layer<RevokedTokenRepository> {
  const impl: RevokedTokenRepositoryApi = {
    revoke: () => Effect.succeed(undefined),
    isRevoked: () => Effect.succeed(isRevoked),
    revokeAllForUser: () => Effect.succeed(undefined),
  };
  return Layer.succeed(RevokedTokenRepository, impl);
}

function makePasswordLayer(valid = true): Layer.Layer<PasswordService> {
  const impl: PasswordServiceApi = {
    hash: (password: string) => Effect.succeed(`hashed:${password}`),
    verify: () => Effect.succeed(valid),
  };
  return Layer.succeed(PasswordService, impl);
}

function makeJwtLayer(): Layer.Layer<JwtService> {
  const impl: JwtServiceApi = {
    signAccess: () => Effect.succeed("access-token"),
    signRefresh: () => Effect.succeed("refresh-token"),
    verify: (token: string) => {
      if (token === "valid-refresh-token") {
        return Effect.succeed({
          sub: "user-1",
          username: "alice",
          role: "USER" as const,
          jti: "jti-1",
          tokenType: "refresh" as const,
        });
      }
      if (token === "valid-access-token") {
        return Effect.succeed({
          sub: "user-1",
          username: "alice",
          role: "USER" as const,
          jti: "jti-1",
          tokenType: "access" as const,
        });
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return Effect.fail({ _tag: "UnauthorizedError", reason: "Invalid token" }) as any;
    },
    getJwks: () => Effect.succeed({}),
  };
  return Layer.succeed(JwtService, impl);
}

function makeTestLayer(overrides: Partial<UserRepositoryApi> = {}, passwordValid = true, tokenRevoked = false) {
  return Layer.mergeAll(
    makeUserRepoLayer(overrides),
    makeTokenRepoLayer(tokenRevoked),
    makePasswordLayer(passwordValid),
    makeJwtLayer(),
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function runRouter(
  req: HttpServerRequestType,
  layers: Layer.Layer<any>,
): Promise<{ status: number; body: Record<string, unknown> }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const app = authRouter as unknown as Effect.Effect<HttpServerResponse.HttpServerResponse, any, any>;
  const result = await Effect.runPromise(
    Effect.either(
      app.pipe(
        Effect.provideService(HttpServerRequest.HttpServerRequest, req),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Effect.provide(layers as any),
      ),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) as any,
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((result as any)._tag === "Left") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = (result as any).left;
    if (err?._tag === "RouteNotFound") {
      return { status: 404, body: { error: "Route not found" } };
    }
    // For domain errors, check error type
    if (err?._tag === "UnauthorizedError") return { status: 401, body: { message: err.reason } };
    if (err?._tag === "ValidationError") return { status: 400, body: { field: err.field, message: err.message } };
    if (err?._tag === "ConflictError") return { status: 409, body: { message: err.message } };
    if (err?._tag === "NotFoundError") return { status: 404, body: { message: `${err.resource} not found` } };
    return { status: 500, body: { error: "Internal error" } };
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response = (result as any).right;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bodyObj = (response as unknown as { body: { body?: Uint8Array } }).body;
  let body: Record<string, unknown> = {};
  if (bodyObj?.body instanceof Uint8Array) {
    body = JSON.parse(Buffer.from(bodyObj.body).toString("utf-8")) as Record<string, unknown>;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { status: (response as any).status as number, body };
}

// ---------------------------------------------------------------------------
// Registration tests
// ---------------------------------------------------------------------------

describe("POST /api/v1/auth/register", () => {
  it("registers a new user and returns 201", async () => {
    const req = makeRequest({
      url: "/api/v1/auth/register",
      body: { username: "alice", email: "alice@example.com", password: "Str0ng#Pass1234" },
    });
    const { status, body } = await runRouter(req, makeTestLayer());
    expect(status).toBe(201);
    expect(body["username"]).toBe("alice");
    expect(body["password"]).toBeUndefined();
  });

  it("returns 400 for missing username", async () => {
    const req = makeRequest({
      url: "/api/v1/auth/register",
      body: { username: "", email: "alice@example.com", password: "Str0ng#Pass1234" },
    });
    const { status } = await runRouter(req, makeTestLayer());
    expect(status).toBe(400);
  });

  it("returns 400 for missing email", async () => {
    const req = makeRequest({
      url: "/api/v1/auth/register",
      body: { username: "alice", email: "", password: "Str0ng#Pass1234" },
    });
    const { status } = await runRouter(req, makeTestLayer());
    expect(status).toBe(400);
  });

  it("returns 400 for missing password", async () => {
    const req = makeRequest({
      url: "/api/v1/auth/register",
      body: { username: "alice", email: "alice@example.com", password: "" },
    });
    const { status } = await runRouter(req, makeTestLayer());
    expect(status).toBe(400);
  });

  it("returns 400 for weak password (too short)", async () => {
    const req = makeRequest({
      url: "/api/v1/auth/register",
      body: { username: "alice", email: "alice@example.com", password: "Short1!" },
    });
    const { status } = await runRouter(req, makeTestLayer());
    expect(status).toBe(400);
  });

  it("returns 400 for invalid email format", async () => {
    const req = makeRequest({
      url: "/api/v1/auth/register",
      body: { username: "alice", email: "notanemail", password: "Str0ng#Pass1234" },
    });
    const { status } = await runRouter(req, makeTestLayer());
    expect(status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// Login tests
// ---------------------------------------------------------------------------

describe("POST /api/v1/auth/login", () => {
  it("logs in with valid credentials and returns tokens", async () => {
    const req = makeRequest({
      url: "/api/v1/auth/login",
      body: { username: "alice", password: "Str0ng#Pass1" },
    });
    const { status, body } = await runRouter(req, makeTestLayer());
    expect(status).toBe(200);
    expect(body["accessToken"]).toBeDefined();
    expect(body["refreshToken"]).toBeDefined();
    expect(body["tokenType"]).toBe("Bearer");
  });

  it("returns 401 for wrong password", async () => {
    const req = makeRequest({
      url: "/api/v1/auth/login",
      body: { username: "alice", password: "WrongPass" },
    });
    const { status } = await runRouter(req, makeTestLayer({}, false));
    expect(status).toBe(401);
  });

  it("returns 401 for non-existent user", async () => {
    const req = makeRequest({
      url: "/api/v1/auth/login",
      body: { username: "ghost", password: "Str0ng#Pass1" },
    });
    const { status } = await runRouter(req, makeTestLayer({ findByUsername: () => Effect.succeed(null) }));
    expect(status).toBe(401);
  });

  it("returns 401 for disabled account", async () => {
    const req = makeRequest({
      url: "/api/v1/auth/login",
      body: { username: "alice", password: "Str0ng#Pass1" },
    });
    const disabledUser = { ...mockUser, status: "DISABLED" as const };
    const { status } = await runRouter(req, makeTestLayer({ findByUsername: () => Effect.succeed(disabledUser) }));
    expect(status).toBe(401);
  });

  it("returns 401 for inactive (deactivated) account", async () => {
    const req = makeRequest({
      url: "/api/v1/auth/login",
      body: { username: "alice", password: "Str0ng#Pass1" },
    });
    const inactiveUser = { ...mockUser, status: "INACTIVE" as const };
    const { status } = await runRouter(req, makeTestLayer({ findByUsername: () => Effect.succeed(inactiveUser) }));
    expect(status).toBe(401);
  });

  it("returns 401 for locked account", async () => {
    const req = makeRequest({
      url: "/api/v1/auth/login",
      body: { username: "alice", password: "Str0ng#Pass1" },
    });
    const lockedUser = { ...mockUser, status: "LOCKED" as const };
    const { status } = await runRouter(req, makeTestLayer({ findByUsername: () => Effect.succeed(lockedUser) }));
    expect(status).toBe(401);
  });

  it("locks account after max failed attempts", async () => {
    const userWithAttempts = { ...mockUser, failedLoginAttempts: 4 };
    const req = makeRequest({
      url: "/api/v1/auth/login",
      body: { username: "alice", password: "WrongPass" },
    });
    let lockedStatus: string | null = null;
    const { status } = await runRouter(
      req,
      makeTestLayer(
        {
          findByUsername: () => Effect.succeed(userWithAttempts),
          updateStatus: (_id: string, s: string) => {
            lockedStatus = s;
            return Effect.succeed(undefined);
          },
        },
        false,
      ),
    );
    expect(status).toBe(401);
    expect(lockedStatus).toBe("LOCKED");
  });
});

// ---------------------------------------------------------------------------
// Logout tests
// ---------------------------------------------------------------------------

describe("POST /api/v1/auth/logout", () => {
  it("returns 200 when logged out with valid token", async () => {
    const req = makeRequest({
      url: "/api/v1/auth/logout",
      headers: { authorization: "Bearer valid-access-token" },
    });
    const { status } = await runRouter(req, makeTestLayer());
    expect(status).toBe(200);
  });

  it("returns 401 without token", async () => {
    const req = makeRequest({ url: "/api/v1/auth/logout" });
    const { status } = await runRouter(req, makeTestLayer());
    expect(status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// Logout-all tests
// ---------------------------------------------------------------------------

describe("POST /api/v1/auth/logout-all", () => {
  it("returns 200 when logged out all with valid token", async () => {
    const req = makeRequest({
      url: "/api/v1/auth/logout-all",
      headers: { authorization: "Bearer valid-access-token" },
    });
    const { status } = await runRouter(req, makeTestLayer());
    expect(status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// Refresh tests
// ---------------------------------------------------------------------------

describe("POST /api/v1/auth/refresh", () => {
  it("returns new tokens with a valid refresh token", async () => {
    const req = makeRequest({
      url: "/api/v1/auth/refresh",
      body: { refreshToken: "valid-refresh-token" },
    });
    const { status, body } = await runRouter(req, makeTestLayer());
    expect(status).toBe(200);
    expect(body["accessToken"]).toBeDefined();
  });

  it("returns 401 with missing refresh token body", async () => {
    const req = makeRequest({ url: "/api/v1/auth/refresh", body: {} });
    const { status } = await runRouter(req, makeTestLayer());
    expect(status).toBe(401);
  });

  it("returns 401 with revoked refresh token", async () => {
    const req = makeRequest({
      url: "/api/v1/auth/refresh",
      body: { refreshToken: "valid-refresh-token" },
    });
    const { status } = await runRouter(req, makeTestLayer({}, true, true));
    expect(status).toBe(401);
  });

  it("returns 401 when user not found on refresh", async () => {
    const req = makeRequest({
      url: "/api/v1/auth/refresh",
      body: { refreshToken: "valid-refresh-token" },
    });
    const { status } = await runRouter(req, makeTestLayer({ findById: () => Effect.succeed(null) }));
    expect(status).toBe(401);
  });

  it("returns 401 when refreshed user is not active", async () => {
    const req = makeRequest({
      url: "/api/v1/auth/refresh",
      body: { refreshToken: "valid-refresh-token" },
    });
    const inactiveUser = { ...mockUser, status: "INACTIVE" as const };
    const { status } = await runRouter(req, makeTestLayer({ findById: () => Effect.succeed(inactiveUser) }));
    expect(status).toBe(401);
  });

  it("returns 401 when access token is used as refresh token", async () => {
    const req = makeRequest({
      url: "/api/v1/auth/refresh",
      body: { refreshToken: "valid-access-token" },
    });
    const { status } = await runRouter(req, makeTestLayer());
    expect(status).toBe(401);
  });
});
