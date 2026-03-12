# Technical Design: demo-be-ts-effect

## BDD Integration Tests: Cucumber.js

Integration tests parse the canonical `.feature` files in `specs/apps/demo-be/gherkin/` using
**Cucumber.js**, the official JavaScript/TypeScript Gherkin BDD runner. Cucumber.js discovers
step definitions from the configured `require` (or `import`) glob patterns in `.cucumber.js`.

HTTP calls use the Effect TS HTTP client against an in-process Node.js HTTP server started
before the test suite and stopped after — no live external server needed. The database layer
uses `@effect/sql-sqlite-node` with an in-memory SQLite database for full isolation and
determinism. This matches the pattern established by `demo-be-rust-axum` (cucumber + Tower
TestClient + in-memory stores) and `demo-be-kotlin-ktor` (Cucumber JVM + Ktor testApplication +
SQLite in-memory).

Step definitions use Cucumber.js `Given`, `When`, and `Then` functions with shared world
state passed via the Cucumber World object:

```typescript
// tests/integration/steps/health.steps.ts
import { Given, When, Then } from "@cucumber/cucumber";
import { CustomWorld } from "../world.js";

Given("the API is running", async function (this: CustomWorld) {
  // server started in BeforeAll hook
});

When("an operations engineer sends GET /health", async function (this: CustomWorld) {
  this.response = await this.client.get("/health");
});

Then("the response status code should be {int}", async function (this: CustomWorld, status: number) {
  expect(this.response.status).toBe(status);
});
```

### Feature File Path Resolution

Feature files are referenced from the `specs/apps/demo-be/gherkin/` workspace root. The
Cucumber.js configuration in `.cucumber.js` (or `cucumber.js`) at the project root specifies
the feature file paths relative to the workspace root:

```javascript
// apps/demo-be-ts-effect/.cucumber.js
const path = require("path");
const gherkinRoot = path.resolve(__dirname, "../../specs/apps/demo-be/gherkin");

module.exports = {
  default: {
    paths: [`${gherkinRoot}/**/*.feature`],
    require: ["tests/integration/steps/**/*.ts"],
    requireModule: ["ts-node/register"],
    format: ["progress", "json:coverage/cucumber-report.json"],
  },
};
```

---

## Application Architecture

### Project Structure

```
apps/demo-be-ts-effect/
├── src/
│   ├── main.ts                         # Entry point: start server on port 8201
│   ├── app.ts                          # Effect app layer composition
│   ├── config.ts                       # Config layer (DATABASE_URL, JWT_SECRET)
│   ├── domain/
│   │   ├── types.ts                    # Branded types: Currency, Role, UserStatus
│   │   ├── errors.ts                   # Tagged union errors: DomainError variants
│   │   ├── user.ts                     # User entity + validation functions
│   │   ├── expense.ts                  # Expense entity + currency precision
│   │   └── attachment.ts               # Attachment entity
│   ├── infrastructure/
│   │   ├── db/
│   │   │   ├── schema.ts               # @effect/sql table definitions
│   │   │   ├── user-repo.ts            # UserRepository Effect service
│   │   │   ├── expense-repo.ts         # ExpenseRepository Effect service
│   │   │   ├── attachment-repo.ts      # AttachmentRepository Effect service
│   │   │   └── token-repo.ts           # RevokedTokenRepository Effect service
│   │   └── password.ts                 # bcrypt wrapper as Effect service
│   ├── auth/
│   │   ├── jwt.ts                      # jose-based JWT service (Effect layer)
│   │   └── middleware.ts               # Auth middleware: requireAuth, requireAdmin
│   └── routes/
│       ├── health.ts                   # GET /health
│       ├── auth.ts                     # register, login, refresh, logout
│       ├── users.ts                    # profile, password, deactivate
│       ├── admin.ts                    # user management
│       ├── expenses.ts                 # CRUD + summary
│       ├── reports.ts                  # P&L
│       ├── attachments.ts              # file upload/list/delete
│       └── tokens.ts                   # claims, JWKS
├── tests/
│   ├── unit/
│   │   ├── domain.user.test.ts         # Password, email, username validation
│   │   ├── domain.expense.test.ts      # Decimal precision validation
│   │   └── domain.password.test.ts     # bcrypt wrapper tests
│   └── integration/
│       ├── world.ts                    # CustomWorld: client, db, shared state
│       ├── hooks.ts                    # BeforeAll/AfterAll: start/stop server
│       └── steps/
│           ├── common.steps.ts         # Shared: status code, API running
│           ├── health.steps.ts
│           ├── auth.steps.ts           # Register, login
│           ├── token-lifecycle.steps.ts
│           ├── user-account.steps.ts
│           ├── security.steps.ts
│           ├── token-management.steps.ts
│           ├── admin.steps.ts
│           ├── expense.steps.ts
│           ├── currency.steps.ts
│           ├── unit-handling.steps.ts
│           ├── reporting.steps.ts
│           └── attachment.steps.ts
├── vitest.config.ts                    # Vitest config with v8 coverage
├── tsconfig.json                       # Strict TypeScript config
├── .cucumber.js                        # Cucumber.js config
├── oxlint.json                         # oxlint config
├── vite.config.ts                      # Vite build config (library mode)
├── project.json                        # Nx targets
└── README.md
```

---

## Key Design Decisions

### Effect TS HTTP Server

The application uses `@effect/platform`'s Node.js HTTP server. Routes are defined as
`HttpRouter` handlers composed into a top-level router, then served via `NodeHttpServer`:

```typescript
// src/app.ts
import { HttpRouter, HttpServer, HttpMiddleware } from "@effect/platform";
import { NodeHttpServer } from "@effect/platform-node";
import { Layer, Effect } from "effect";
import { healthRouter } from "./routes/health.js";
import { authRouter } from "./routes/auth.js";

const AppRouter = HttpRouter.empty.pipe(
  HttpRouter.mount("/", healthRouter),
  HttpRouter.mount("/api/v1/auth", authRouter),
  // ... other routers
);

export const AppLive = HttpServer.serve(AppRouter).pipe(Layer.provide(NodeHttpServer.layer({ port: 8201 })));
```

Each route handler returns an `Effect` that may fail with typed domain errors, which a global
error handler maps to HTTP responses.

### Effect TS Error Model

Domain errors are tagged union types modeled as Effect `Data.TaggedError` classes. The HTTP
layer converts them to responses using `Effect.catchTag` or `HttpServer.middleware`:

```typescript
// src/domain/errors.ts
import { Data } from "effect";

export class ValidationError extends Data.TaggedError("ValidationError")<{
  readonly field: string;
  readonly message: string;
}> {}

export class NotFoundError extends Data.TaggedError("NotFoundError")<{
  readonly resource: string;
}> {}

export class UnauthorizedError extends Data.TaggedError("UnauthorizedError")<{
  readonly reason: string;
}> {}

export class ForbiddenError extends Data.TaggedError("ForbiddenError")<{
  readonly reason: string;
}> {}

export class ConflictError extends Data.TaggedError("ConflictError")<{
  readonly message: string;
}> {}

export class FileTooLargeError extends Data.TaggedError("FileTooLargeError")<Record<never, never>> {}

export class UnsupportedMediaTypeError extends Data.TaggedError("UnsupportedMediaTypeError")<Record<never, never>> {}
```

### Effect SQL Layer

Database access uses `@effect/sql` with tagged repository services. Tests substitute the
PostgreSQL layer with `@effect/sql-sqlite-node` in-memory:

```typescript
// src/infrastructure/db/user-repo.ts
import { Effect, Layer, Context } from "effect";
import { SqlClient } from "@effect/sql";

export class UserRepository extends Context.Tag("UserRepository")<
  UserRepository,
  {
    readonly create: (data: CreateUserData) => Effect.Effect<User, ConflictError>;
    readonly findByUsername: (username: string) => Effect.Effect<User | null, never>;
    readonly findById: (id: string) => Effect.Effect<User | null, never>;
  }
>() {}

export const UserRepositoryLive = Layer.effect(
  UserRepository,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    return {
      create: (data) =>
        Effect.gen(function* () {
          const result = yield* sql`
            INSERT INTO users (id, username, email, password_hash, display_name, role, status)
            VALUES (${crypto.randomUUID()}, ${data.username}, ${data.email},
                    ${data.passwordHash}, ${data.displayName}, 'USER', 'ACTIVE')
            RETURNING *
          `;
          return result[0] as User;
        }),
      // ...
    };
  }),
);
```

### Dependency Injection via Effect Layers

All services are composed as Effect `Layer`s and provided at the application entry point.
Integration tests substitute infrastructure layers with in-memory equivalents:

```typescript
// tests/integration/hooks.ts
import { BeforeAll, AfterAll } from "@cucumber/cucumber";
import { Effect, Layer, ManagedRuntime } from "effect";
import { SqliteClient } from "@effect/sql-sqlite-node";
import { AppRouter } from "../../src/app.js";

const TestLayer = Layer.mergeAll(
  SqliteClient.layer({ filename: ":memory:" }),
  // other test layers...
);

let runtime: ManagedRuntime.ManagedRuntime<never, never>;

BeforeAll(async function () {
  runtime = ManagedRuntime.make(TestLayer);
  // start in-process server
});

AfterAll(async function () {
  await ManagedRuntime.dispose(runtime);
});
```

### JWT Strategy

JWT tokens use the `jose` library with RS256 or HS256 signing. Access tokens (short-lived)
and refresh tokens (long-lived) follow the same scheme as all other demo-be implementations:

- Access token: 15 minutes
- Refresh token: 7 days
- Secret from `APP_JWT_SECRET` environment variable
- Claims: `sub` (user ID), `username`, `role`, `exp`, `iat`, `jti`

```typescript
// src/auth/jwt.ts
import { SignJWT, jwtVerify } from "jose";
import { Context, Effect, Layer } from "effect";

export class JwtService extends Context.Tag("JwtService")<
  JwtService,
  {
    readonly sign: (claims: JwtClaims) => Effect.Effect<string, never>;
    readonly verify: (token: string) => Effect.Effect<JwtClaims, UnauthorizedError>;
  }
>() {}
```

### Currency Precision

Amounts are stored as integers (minor units) or as `numeric` strings in PostgreSQL with
currency-specific precision enforced at the domain layer:

```typescript
// src/domain/expense.ts
const CURRENCY_DECIMALS: Record<string, number> = {
  USD: 2,
  IDR: 0,
};

export const validateAmount = (currency: string, amount: number): Effect.Effect<number, ValidationError> => {
  const decimals = CURRENCY_DECIMALS[currency.toUpperCase()];
  if (decimals === undefined) {
    return Effect.fail(new ValidationError({ field: "currency", message: `Unsupported currency: ${currency}` }));
  }
  if (amount < 0) {
    return Effect.fail(new ValidationError({ field: "amount", message: "Amount must not be negative" }));
  }
  const factor = Math.pow(10, decimals);
  if (Math.round(amount * factor) !== amount * factor) {
    return Effect.fail(
      new ValidationError({
        field: "amount",
        message: `${currency} requires ${decimals} decimal places`,
      }),
    );
  }
  return Effect.succeed(amount);
};
```

### Vite Build Configuration

Vite is used in library mode to bundle the TypeScript server into a single distributable
`dist/main.js` file suitable for Docker deployment:

```typescript
// vite.config.ts
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/main.ts",
      formats: ["es"],
      fileName: "main",
    },
    target: "node20",
    ssr: true,
    rollupOptions: {
      external: /^node:/,
    },
  },
});
```

---

## Nx Targets (`project.json`)

```json
{
  "name": "demo-be-ts-effect",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "apps/demo-be-ts-effect/src",
  "projectType": "application",
  "targets": {
    "build": {
      "executor": "nx:run-commands",
      "options": {
        "command": "npx vite build",
        "cwd": "apps/demo-be-ts-effect"
      },
      "outputs": ["{projectRoot}/dist"]
    },
    "dev": {
      "executor": "nx:run-commands",
      "options": {
        "command": "npx tsx watch src/main.ts",
        "cwd": "apps/demo-be-ts-effect"
      }
    },
    "start": {
      "executor": "nx:run-commands",
      "options": {
        "command": "node dist/main.js",
        "cwd": "apps/demo-be-ts-effect"
      }
    },
    "test:quick": {
      "executor": "nx:run-commands",
      "options": {
        "commands": [
          "npx vitest run --coverage",
          "apps/rhino-cli/rhino-cli test-coverage validate apps/demo-be-ts-effect/coverage/lcov.info 90",
          "npx tsc --noEmit",
          "npx oxlint ."
        ],
        "parallel": false,
        "cwd": "{workspaceRoot}"
      }
    },
    "test:unit": {
      "executor": "nx:run-commands",
      "options": {
        "command": "npx vitest run tests/unit",
        "cwd": "apps/demo-be-ts-effect"
      }
    },
    "test:integration": {
      "executor": "nx:run-commands",
      "options": {
        "command": "npx cucumber-js",
        "cwd": "apps/demo-be-ts-effect"
      },
      "cache": true,
      "inputs": [
        "{projectRoot}/src/**/*.ts",
        "{projectRoot}/tests/**/*.ts",
        "{workspaceRoot}/specs/apps/demo-be/gherkin/**/*.feature"
      ]
    },
    "lint": {
      "executor": "nx:run-commands",
      "options": {
        "command": "npx oxlint .",
        "cwd": "apps/demo-be-ts-effect"
      }
    },
    "typecheck": {
      "executor": "nx:run-commands",
      "options": {
        "command": "npx tsc --noEmit",
        "cwd": "apps/demo-be-ts-effect"
      }
    }
  },
  "tags": ["type:app", "platform:effect", "lang:typescript", "domain:demo-be"],
  "implicitDependencies": ["rhino-cli"]
}
```

> **Note on `test:quick`**: Sequential execution (`parallel: false`) is required because
> coverage collection must finish before `rhino-cli` validates the LCOV output. Type checking
> and linting run after tests to avoid masking test failures.
>
> **Note on `test:integration` caching**: Integration tests use an in-process Effect HTTP
> server with `@effect/sql-sqlite-node` in-memory — no external services. Fully deterministic
> and safe to cache.

---

## package.json Dependencies

### Runtime Dependencies

| Package                   | Purpose                                           |
| ------------------------- | ------------------------------------------------- |
| `effect`                  | Core Effect TS library (functional effect system) |
| `@effect/platform`        | Platform-agnostic HTTP server and client          |
| `@effect/platform-node`   | Node.js HTTP server implementation                |
| `@effect/sql`             | SQL client abstraction                            |
| `@effect/sql-pg`          | PostgreSQL driver for `@effect/sql` (production)  |
| `@effect/sql-sqlite-node` | SQLite driver for `@effect/sql` (dev/tests)       |
| `jose`                    | JWT signing and verification (RS256/HS256)        |
| `bcrypt`                  | Password hashing                                  |

### Dev Dependencies

| Package               | Purpose                                              |
| --------------------- | ---------------------------------------------------- |
| `@types/bcrypt`       | TypeScript types for bcrypt                          |
| `@types/node`         | TypeScript types for Node.js                         |
| `typescript`          | TypeScript compiler                                  |
| `tsx`                 | TypeScript execution for dev mode (replaces ts-node) |
| `vite`                | Build tool (library mode for server bundle)          |
| `vitest`              | Unit test runner with v8 coverage                    |
| `@vitest/coverage-v8` | v8 coverage provider for Vitest                      |
| `@cucumber/cucumber`  | Cucumber.js BDD test runner                          |
| `oxlint`              | Fast TypeScript/JavaScript linter                    |
| `prettier`            | Code formatter (shared with workspace)               |

---

## Infrastructure

### Port Assignment

| Service                 | Port                                               |
| ----------------------- | -------------------------------------------------- |
| demo-be-db              | 5432                                               |
| demo-be-java-springboot | 8201                                               |
| demo-be-elixir-phoenix  | 8201 (same port — mutually exclusive alternatives) |
| demo-be-fsharp-giraffe  | 8201 (same port — mutually exclusive alternatives) |
| demo-be-golang-gin      | 8201 (same port — mutually exclusive alternatives) |
| demo-be-python-fastapi  | 8201 (same port — mutually exclusive alternatives) |
| demo-be-rust-axum       | 8201 (same port — mutually exclusive alternatives) |
| demo-be-kotlin-ktor     | 8201 (same port — mutually exclusive alternatives) |
| demo-be-java-vertx      | 8201 (same port — mutually exclusive alternatives) |
| demo-be-ts-effect       | 8201 (same port — mutually exclusive alternatives) |

### Docker Compose (`infra/dev/demo-be-ts-effect/docker-compose.yml`)

```yaml
services:
  demo-be-db:
    image: postgres:17-alpine
    container_name: demo-be-db
    environment:
      POSTGRES_DB: demo_be_ts_effect
      POSTGRES_USER: demo_be_ts_effect
      POSTGRES_PASSWORD: demo_be_ts_effect
    ports:
      - "5432:5432"
    volumes:
      - demo-be-ts-effect-db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U demo_be_ts_effect"]
      interval: 5s
      timeout: 3s
      retries: 5
    networks:
      - demo-be-ts-effect-network

  demo-be-ts-effect:
    build:
      context: .
      dockerfile: Dockerfile.be.dev
    container_name: demo-be-ts-effect
    ports:
      - "8201:8201"
    environment:
      - DATABASE_URL=postgresql://demo_be_ts_effect:demo_be_ts_effect@demo-be-db:5432/demo_be_ts_effect
      - APP_JWT_SECRET=dev-jwt-secret-at-least-32-chars-long
    volumes:
      - ../../../apps/demo-be-ts-effect:/workspace:rw
    depends_on:
      demo-be-db:
        condition: service_healthy
    networks:
      - demo-be-ts-effect-network

volumes:
  demo-be-ts-effect-db-data:

networks:
  demo-be-ts-effect-network:
```

### Dockerfile.be.dev

```dockerfile
FROM node:24-alpine

WORKDIR /workspace

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

CMD ["npx", "tsx", "src/main.ts"]
```

---

## GitHub Actions

### New Workflow: `e2e-demo-be-ts-effect.yml`

Mirrors `e2e-demo-be-python-fastapi.yml` with:

- Name: `E2E - Demo BE (TSEX)`
- Schedule: same crons as other demo-be variants
- Job: checkout → docker compose up → wait-healthy → Volta → npm ci →
  `nx run demo-be-e2e:test:e2e` with `BASE_URL=http://localhost:8201` →
  upload artifact `playwright-report-be-tsex` → docker down (always)

### Updated Workflow: `main-ci.yml`

Add a coverage upload step for demo-be-ts-effect after the existing upload steps:

```yaml
- name: Upload coverage — demo-be-ts-effect
  uses: codecov/codecov-action@v5
  with:
    token: ${{ secrets.CODECOV_TOKEN }}
    files: apps/demo-be-ts-effect/coverage/lcov.info
    flags: demo-be-ts-effect
    fail_ci_if_error: false
```

---

## Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      reportsDirectory: "coverage",
      include: ["src/**/*.ts"],
      exclude: ["src/main.ts"],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
    },
    include: ["tests/unit/**/*.test.ts"],
  },
});
```

---

## TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src", "tests"],
  "exclude": ["node_modules", "dist"]
}
```
