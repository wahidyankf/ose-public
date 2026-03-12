import { BeforeAll, AfterAll } from "@cucumber/cucumber";
import { Effect, Layer, ManagedRuntime } from "effect";
import { SqliteClient } from "@effect/sql-sqlite-node";
import { NodeHttpServer } from "@effect/platform-node";
import { HttpRouter, HttpServer, HttpServerResponse, HttpMiddleware } from "@effect/platform";
import { createServer } from "node:http";
import {
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  FileTooLargeError,
  UnsupportedMediaTypeError,
} from "../../src/domain/errors.js";
import { UserRepositoryLive } from "../../src/infrastructure/db/user-repo.js";
import { ExpenseRepositoryLive } from "../../src/infrastructure/db/expense-repo.js";
import { AttachmentRepositoryLive } from "../../src/infrastructure/db/attachment-repo.js";
import { RevokedTokenRepositoryLive } from "../../src/infrastructure/db/token-repo.js";
import { PasswordServiceLive } from "../../src/infrastructure/password.js";
import { JwtServiceLive } from "../../src/auth/jwt.js";
import { healthRouter } from "../../src/routes/health.js";
import { SqlClient } from "@effect/sql";

export const TEST_PORT = 8299;
export const TEST_JWT_SECRET = "test-jwt-secret-at-least-32-chars-long!!";

const CREATE_TABLES_SQL = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'USER',
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT NOT NULL,
    description TEXT NOT NULL,
    quantity TEXT,
    unit TEXT,
    date TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS attachments (
    id TEXT PRIMARY KEY,
    expense_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    content_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    data BLOB NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS revoked_tokens (
    jti TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    revoked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`;

const SqliteLayer = SqliteClient.layer({ filename: ":memory:" });

const errorHandler = HttpMiddleware.make((app) =>
  Effect.catchAll(app, (error) => {
    if (error instanceof ValidationError) {
      return HttpServerResponse.json(
        {
          error: "Validation error",
          field: error.field,
          message: error.message,
        },
        { status: 400 },
      );
    }
    if (error instanceof UnauthorizedError) {
      return HttpServerResponse.json({ error: "Unauthorized", message: error.reason }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return HttpServerResponse.json({ error: "Forbidden", message: error.reason }, { status: 403 });
    }
    if (error instanceof NotFoundError) {
      return HttpServerResponse.json({ error: "Not found", message: `${error.resource} not found` }, { status: 404 });
    }
    if (error instanceof ConflictError) {
      return HttpServerResponse.json({ error: "Conflict", message: error.message }, { status: 409 });
    }
    if (error instanceof FileTooLargeError) {
      return HttpServerResponse.json(
        {
          error: "File too large",
          message: "File exceeds maximum allowed size",
        },
        { status: 413 },
      );
    }
    if (error instanceof UnsupportedMediaTypeError) {
      return HttpServerResponse.json(
        {
          error: "Unsupported media type",
          message: "File type not allowed",
        },
        { status: 415 },
      );
    }
    return HttpServerResponse.json({ error: "Internal server error" }, { status: 500 });
  }),
);

const AppRouter = HttpRouter.empty.pipe(HttpRouter.mountApp("/", healthRouter));

const AppLayer = HttpServer.serve(AppRouter, errorHandler).pipe(
  Layer.provide(NodeHttpServer.layer(() => createServer(), { port: TEST_PORT })),
  Layer.provide(UserRepositoryLive),
  Layer.provide(ExpenseRepositoryLive),
  Layer.provide(AttachmentRepositoryLive),
  Layer.provide(RevokedTokenRepositoryLive),
  Layer.provide(PasswordServiceLive),
  Layer.provide(JwtServiceLive(TEST_JWT_SECRET)),
  Layer.provide(SqliteLayer),
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let runtime: ManagedRuntime.ManagedRuntime<never, never>;

BeforeAll(async function () {
  // Initialize schema
  await Effect.runPromise(
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;
      yield* sql.unsafe(CREATE_TABLES_SQL);
    }).pipe(Effect.provide(SqliteLayer)),
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  runtime = ManagedRuntime.make(AppLayer) as unknown as ManagedRuntime.ManagedRuntime<never, never>;
  // Give the server time to start
  await new Promise((resolve) => setTimeout(resolve, 500));
});

AfterAll(async function () {
  if (runtime) {
    await runtime.dispose();
  }
});
