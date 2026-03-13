# Technical Design: demo-be-rust-axum

## BDD Integration Test: cucumber-rs

Integration tests parse the canonical `.feature` files in `specs/apps/demo/be/gherkin/` using
**cucumber-rs**, the Rust Gherkin runner. cucumber-rs discovers step definitions via Rust async
functions annotated with `#[given]`, `#[when]`, and `#[then]` macros, and executes scenarios
concurrently by default (can be made sequential per feature with `@serial`).

HTTP calls use Axum's `tower::ServiceExt` for in-process HTTP testing — no live server needed,
matching `demo-be-java-springboot`'s MockMvc approach and `demo-be-fsharp-giraffe`'s TestServer approach. The
database layer uses SQLx with an in-memory SQLite database for full isolation and determinism.

Step definitions follow cucumber-rs async patterns:

```rust
// tests/integration/steps/health_steps.rs
use cucumber::{given, when, then};
use crate::world::AppWorld;

#[given("the API is running")]
async fn api_is_running(world: &mut AppWorld) {
    // Router is initialized in AppWorld::new()
    // No action needed — world already holds the test service
}

#[when("an operations engineer sends GET /health")]
async fn get_health(world: &mut AppWorld) {
    let response = world
        .service
        .call(
            Request::builder()
                .uri("/health")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    world.last_response = Some(response);
}

#[then(expr = "the response status code should be {int}")]
async fn check_status(world: &mut AppWorld, code: u16) {
    let status = world.last_response.as_ref().unwrap().status().as_u16();
    assert_eq!(code, status);
}
```

### World Pattern

cucumber-rs requires a `World` struct that carries test state between steps. The `AppWorld`
owns the in-process Axum router (built with the same `AppState` as production but with an
SQLite in-memory database), the last HTTP response, and accumulated test context:

```rust
// tests/integration/world.rs
use std::sync::Arc;
use tokio::sync::RwLock;
use axum::body::Body;
use http::Response;

pub struct AppWorld {
    pub service: RouterService,       // tower::ServiceExt-compatible Axum router
    pub last_response: Option<Response<Body>>,
    pub auth_token: Option<String>,   // JWT from most recent login/register
    pub refresh_token: Option<String>,
    pub user_id: Option<uuid::Uuid>,
    pub last_expense_id: Option<uuid::Uuid>,
    pub last_attachment_id: Option<uuid::Uuid>,
}

impl cucumber::World for AppWorld {
    type Error = anyhow::Error;

    async fn new() -> Result<Self, Self::Error> {
        let state = AppState::new_for_test().await?;
        let service = crate::app::router(Arc::new(state)).into_service();
        Ok(Self { service, ..Default::default() })
    }
}
```

### Feature File Path Resolution

Feature files are located in `specs/apps/demo/be/gherkin/`. The cucumber-rs runner is
configured to discover them relative to the workspace root:

```rust
// tests/integration/main.rs
#[tokio::main]
async fn main() {
    AppWorld::run("../../specs/apps/demo/be/gherkin").await;
}
```

The `Cargo.toml` `[[test]]` entry for integration tests points the runner binary at the
correct path relative to the crate root (`apps/demo-be-rust-axum/`).

---

## Application Architecture

### Project Structure

```
apps/demo-be-rust-axum/
├── src/
│   ├── main.rs                         # Entry point — binds port, creates AppState
│   ├── lib.rs                          # Public lib surface for integration test reuse
│   ├── app.rs                          # Axum router construction
│   ├── config.rs                       # Environment-based config (DATABASE_URL, JWT_SECRET)
│   ├── domain/
│   │   ├── mod.rs
│   │   ├── types.rs                    # Enums: Currency, Role, UserStatus, EntryType, Unit
│   │   ├── errors.rs                   # AppError enum + IntoResponse impl
│   │   ├── user.rs                     # User struct + validation functions
│   │   ├── expense.rs                  # Expense struct + currency/unit validation
│   │   └── attachment.rs               # Attachment struct
│   ├── db/
│   │   ├── mod.rs
│   │   ├── pool.rs                     # SQLx pool creation (Postgres + SQLite)
│   │   ├── migrations/                 # SQL migration files (embedded via sqlx::migrate!)
│   │   │   ├── 001_users.sql
│   │   │   ├── 002_token_revocations.sql
│   │   │   ├── 003_expenses.sql
│   │   │   └── 004_attachments.sql
│   │   ├── user_repo.rs                # User CRUD queries
│   │   ├── token_repo.rs               # Token revocation CRUD queries
│   │   ├── expense_repo.rs             # Expense + summary queries
│   │   └── attachment_repo.rs          # Attachment CRUD queries
│   ├── auth/
│   │   ├── mod.rs
│   │   ├── jwt.rs                      # JWT encode/decode with jsonwebtoken crate
│   │   ├── password.rs                 # bcrypt hash/verify wrappers
│   │   └── middleware.rs               # Axum extractor: AuthUser (JWT validation)
│   ├── handlers/
│   │   ├── mod.rs
│   │   ├── health.rs                   # GET /health
│   │   ├── auth.rs                     # register, login, refresh, logout, logout-all
│   │   ├── user.rs                     # profile, update, change-password, deactivate
│   │   ├── admin.rs                    # list-users, disable, enable, unlock, force-reset
│   │   ├── expense.rs                  # CRUD + summary
│   │   ├── attachment.rs               # upload, list, delete
│   │   ├── report.rs                   # P&L report
│   │   └── token.rs                    # claims, JWKS
│   └── state.rs                        # AppState: pool + jwt config (Arc-wrapped)
├── tests/
│   └── integration/
│       ├── main.rs                     # cucumber-rs entry point
│       ├── world.rs                    # AppWorld struct (World impl)
│       └── steps/
│           ├── common_steps.rs         # Shared: status code, API running
│           ├── auth_steps.rs           # Register, login steps
│           ├── token_lifecycle_steps.rs
│           ├── user_account_steps.rs
│           ├── security_steps.rs
│           ├── token_management_steps.rs
│           ├── admin_steps.rs
│           ├── expense_steps.rs
│           ├── currency_steps.rs
│           ├── unit_handling_steps.rs
│           ├── reporting_steps.rs
│           └── attachment_steps.rs
├── Cargo.toml                          # Single-crate workspace
├── rust-toolchain.toml                 # Pin stable Rust channel
├── .rustfmt.toml                       # rustfmt config
├── .clippy.toml                        # Clippy config (pedantic deny list)
├── project.json                        # Nx targets
└── README.md
```

### Ownership and Lifetime Strategy

Rust's ownership model requires deliberate design for shared mutable state:

- **`AppState`** is wrapped in `Arc<AppState>` and cloned into each handler via Axum's
  `State<Arc<AppState>>` extractor. No `Mutex` or `RwLock` needed on `AppState` itself because
  the database pool (`sqlx::PgPool` / `sqlx::SqlitePool`) is internally arc-wrapped and
  clone-safe.
- **In-memory test repositories** for integration tests use `Arc<RwLock<HashMap<Uuid, T>>>`.
  The `RwLock` allows concurrent read access (multiple step readers) while serialising writes.
  Use `tokio::sync::RwLock` (not `std::sync::RwLock`) to avoid blocking the async executor.
- **Request-scoped data** (authenticated user, extracted path params) lives in the handler
  function frame — no heap allocation needed.
- **Lifetimes** are avoided on public API boundaries; prefer owned types (`String`, `Vec<u8>`)
  over borrowed slices (`&str`, `&[u8]`) in handler inputs/outputs to prevent lifetime
  propagation into Axum's `Handler` trait bounds.

---

## Key Design Decisions

### Axum Router Composition

All routes use Axum's `Router` with method routing macros and nested sub-routers:

```rust
// src/app.rs
pub fn router(state: Arc<AppState>) -> Router {
    Router::new()
        .route("/health", get(health::get_health))
        .nest("/.well-known", Router::new()
            .route("/jwks.json", get(token::jwks)))
        .nest("/api/v1", api_router(state.clone()))
}

fn api_router(state: Arc<AppState>) -> Router {
    Router::new()
        .nest("/auth",   auth_router())
        .nest("/users",  user_router())
        .nest("/admin",  admin_router())
        .nest("/expenses", expense_router())
        .nest("/tokens", token_router())
        .with_state(state)
}

fn auth_router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/register",   post(auth::register))
        .route("/login",      post(auth::login))
        .route("/refresh",    post(auth::refresh))
        .route("/logout",     post(auth::logout))
        .route("/logout-all", post(auth::logout_all).layer(middleware::from_fn_with_state(
            // state injected at nest level
            |state, req, next| auth::require_auth(state, req, next)
        )))
}
```

### Error Handling with thiserror + IntoResponse

Domain errors use `thiserror`-derived types that implement Axum's `IntoResponse`:

```rust
// src/domain/errors.rs
use axum::response::{IntoResponse, Response};
use axum::http::StatusCode;
use axum::Json;
use serde_json::json;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Validation failed: {field} — {message}")]
    Validation { field: String, message: String },
    #[error("Not found: {entity}")]
    NotFound { entity: String },
    #[error("Forbidden: {message}")]
    Forbidden { message: String },
    #[error("Conflict: {message}")]
    Conflict { message: String },
    #[error("Unauthorized: {message}")]
    Unauthorized { message: String },
    #[error("File too large")]
    FileTooLarge,
    #[error("Unsupported media type")]
    UnsupportedMediaType,
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),
    #[error("JWT error: {0}")]
    Jwt(#[from] jsonwebtoken::errors::Error),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, body) = match &self {
            AppError::Validation { field, message } =>
                (StatusCode::BAD_REQUEST, json!({"message": format!("{field}: {message}")})),
            AppError::NotFound { .. } =>
                (StatusCode::NOT_FOUND, json!({"message": "Not found"})),
            AppError::Forbidden { message } =>
                (StatusCode::FORBIDDEN, json!({"message": message})),
            AppError::Conflict { message } =>
                (StatusCode::CONFLICT, json!({"message": message})),
            AppError::Unauthorized { message } =>
                (StatusCode::UNAUTHORIZED, json!({"message": message})),
            AppError::FileTooLarge =>
                (StatusCode::PAYLOAD_TOO_LARGE, json!({"message": "File size exceeds the maximum allowed limit"})),
            AppError::UnsupportedMediaType =>
                (StatusCode::UNSUPPORTED_MEDIA_TYPE, json!({"message": "Unsupported file type"})),
            AppError::Database(_) | AppError::Jwt(_) =>
                (StatusCode::INTERNAL_SERVER_ERROR, json!({"message": "Internal server error"})),
        };
        (status, Json(body)).into_response()
    }
}
```

Handler return types are `Result<impl IntoResponse, AppError>`, which Axum resolves automatically.

### JWT Authentication Middleware

Authentication uses a custom Axum extractor (`FromRequestParts`) that validates the Bearer token
and injects a typed `AuthUser` into handlers:

```rust
// src/auth/middleware.rs
use axum::extract::FromRequestParts;
use http::request::Parts;

#[derive(Clone, Debug)]
pub struct AuthUser {
    pub user_id: uuid::Uuid,
    pub username: String,
    pub role: Role,
}

impl<S: Send + Sync> FromRequestParts<S> for AuthUser {
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        // 1. Extract Authorization: Bearer <token>
        // 2. Decode and validate JWT signature + expiry
        // 3. Check token is not in revocation table (sqlx query)
        // 4. Check user is ACTIVE (not DISABLED or INACTIVE)
        // Returns AuthUser or AppError::Unauthorized
    }
}

// Admin-only guard (composes with AuthUser)
pub struct AdminUser(pub AuthUser);

impl<S: Send + Sync> FromRequestParts<S> for AdminUser {
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let user = AuthUser::from_request_parts(parts, state).await?;
        if user.role != Role::Admin {
            return Err(AppError::Forbidden { message: "Admin only".into() });
        }
        Ok(AdminUser(user))
    }
}
```

Handlers receive `AuthUser` or `AdminUser` as function parameters — Axum calls the extractor
automatically.

### Database: SQLx with Multi-Backend Support

Production uses `sqlx::PgPool`; integration tests use `sqlx::SqlitePool`. A trait
(`DatabasePool`) is defined to abstract over both, or alternatively a `sqlx::Any` pool is used:

```rust
// src/db/pool.rs
use sqlx::{Pool, Postgres, Sqlite, Any};

pub enum DbPool {
    Postgres(Pool<Postgres>),
    Sqlite(Pool<Sqlite>),
}
```

Migrations are embedded using `sqlx::migrate!` pointing at the `db/migrations/` directory.
SQL is written in standard SQL with minimal Postgres-specific extensions to stay compatible
with SQLite for tests.

For integration tests, each `AppWorld::new()` call creates a fresh SQLite in-memory database
(`sqlite::memory:`), runs all migrations, and returns a clean state — preventing test
cross-contamination.

### Currency Precision

Amounts are stored as `i64` (integer, in the smallest currency unit) to avoid floating-point
precision issues. The domain layer enforces the currency rule:

```rust
// src/domain/expense.rs
pub enum Currency {
    Usd,
    Idr,
}

impl Currency {
    /// Returns the number of decimal places for display.
    pub fn decimal_places(&self) -> u32 {
        match self {
            Currency::Usd => 2,
            Currency::Idr => 0,
        }
    }

    /// Validates and converts a decimal string like "10.50" into integer storage units.
    pub fn parse_amount(&self, input: &str) -> Result<i64, AppError> {
        // Parses the string, validates decimal places match currency rule,
        // then converts to integer (e.g. "10.50" USD → 1050 cents).
        // Returns AppError::Validation if decimal places exceed the limit.
    }
}
```

### JWT Strategy

HMAC-SHA256 signing using the `jsonwebtoken` crate. Access tokens (15 minutes) and refresh
tokens (7 days) follow the same pattern as all demo-be implementations:

- Secret from `APP_JWT_SECRET` environment variable
- Claims: `sub` (user ID), `username`, `role`, `exp`, `iat`, `jti`
- Token revocation via a `token_revocations` database table keyed by `jti`

```rust
// src/auth/jwt.rs
use jsonwebtoken::{encode, decode, Header, Algorithm, Validation, EncodingKey, DecodingKey};
use serde::{Serialize, Deserialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,      // user UUID as string
    pub username: String,
    pub role: String,
    pub jti: String,      // unique token ID for revocation
    pub exp: usize,
    pub iat: usize,
}

pub fn encode_token(claims: &Claims, secret: &str) -> Result<String, AppError> {
    encode(
        &Header::new(Algorithm::HS256),
        claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    ).map_err(AppError::from)
}
```

### Async Runtime and Blocking Operations

All handlers are `async fn` and run on the Tokio multi-thread runtime. The `bcrypt` crate
performs CPU-intensive work — call it via `tokio::task::spawn_blocking` to avoid blocking
the executor thread pool:

```rust
// src/auth/password.rs
use tokio::task;

pub async fn hash_password(password: String) -> Result<String, AppError> {
    task::spawn_blocking(move || {
        bcrypt::hash(&password, bcrypt::DEFAULT_COST)
            .map_err(|_| AppError::Unauthorized { message: "Hashing failed".into() })
    })
    .await
    .map_err(|_| AppError::Unauthorized { message: "Task join failed".into() })?
}

pub async fn verify_password(password: String, hash: String) -> Result<bool, AppError> {
    task::spawn_blocking(move || {
        bcrypt::verify(&password, &hash)
            .map_err(|_| AppError::Unauthorized { message: "Verification failed".into() })
    })
    .await
    .map_err(|_| AppError::Unauthorized { message: "Task join failed".into() })?
}
```

---

## Nx Targets (`project.json`)

```json
{
  "name": "demo-be-rust-axum",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "apps/demo-be-rust-axum/src",
  "projectType": "application",
  "targets": {
    "build": {
      "executor": "nx:run-commands",
      "options": {
        "command": "cargo build --release",
        "cwd": "apps/demo-be-rust-axum"
      },
      "outputs": ["{workspaceRoot}/target/release/demo-be-rust-axum"]
    },
    "dev": {
      "executor": "nx:run-commands",
      "options": {
        "command": "cargo watch -x run",
        "cwd": "apps/demo-be-rust-axum"
      }
    },
    "start": {
      "executor": "nx:run-commands",
      "options": {
        "command": "cargo run --release",
        "cwd": "apps/demo-be-rust-axum"
      }
    },
    "test:quick": {
      "executor": "nx:run-commands",
      "options": {
        "commands": [
          "cargo llvm-cov --lcov --output-path coverage/lcov.info",
          "(cd ../../apps/rhino-cli && CGO_ENABLED=0 go run main.go test-coverage validate apps/demo-be-rust-axum/coverage/lcov.info 90)",
          "cargo fmt --check",
          "cargo clippy -- -D warnings"
        ],
        "parallel": false,
        "cwd": "apps/demo-be-rust-axum"
      }
    },
    "test:unit": {
      "executor": "nx:run-commands",
      "options": {
        "command": "cargo test --lib",
        "cwd": "apps/demo-be-rust-axum"
      }
    },
    "test:integration": {
      "executor": "nx:run-commands",
      "options": {
        "command": "cargo test --test integration",
        "cwd": "apps/demo-be-rust-axum"
      },
      "cache": true,
      "inputs": [
        "{projectRoot}/src/**/*.rs",
        "{projectRoot}/tests/**/*.rs",
        "{workspaceRoot}/specs/apps/demo/be/gherkin/**/*.feature"
      ]
    },
    "lint": {
      "executor": "nx:run-commands",
      "options": {
        "command": "cargo clippy -- -D warnings",
        "cwd": "apps/demo-be-rust-axum"
      }
    },
    "typecheck": {
      "executor": "nx:run-commands",
      "options": {
        "command": "cargo check",
        "cwd": "apps/demo-be-rust-axum"
      }
    }
  },
  "tags": ["type:app", "platform:axum", "lang:rust", "domain:demo-be"],
  "implicitDependencies": ["rhino-cli"]
}
```

> **Note on `test:quick`**: Sequential execution (`parallel: false`) is required because
> coverage collection must finish before `rhino-cli` validates the LCOV output. `cargo fmt
--check` and `cargo clippy` run after tests to avoid masking test failures.
>
> **Note on `typecheck`**: Rust's compiler performs type checking during `cargo check` and
> `cargo build`. There is no separate type-checking tool as with TypeScript or F#.
>
> **Note on `build` outputs**: The release binary lands in `target/release/demo-be-rust-axum` at
> the workspace root (not inside `apps/demo-be-rust-axum/`). This is a Cargo workspace convention.
>
> **Note on `test:integration` caching**: Integration tests use an in-process Axum router with
> SQLite in-memory — no external services. Fully deterministic and safe to cache.

---

## Infrastructure

### Port Assignment

| Service                 | Port                                               |
| ----------------------- | -------------------------------------------------- |
| demo-be-db              | 5432                                               |
| demo-be-java-springboot | 8201                                               |
| demo-be-elixir-phoenix  | 8201 (same port — mutually exclusive alternatives) |
| demo-be-fsharp-giraffe  | 8201 (same port — mutually exclusive alternatives) |
| demo-be-rust-axum       | 8201 (same port — mutually exclusive alternatives) |

### Docker Compile-Time Strategy

Rust compilation is significantly slower than other languages. Two strategies address this:

1. **Layer caching**: Copy `Cargo.toml` and `Cargo.lock` first, then `cargo build` to cache
   dependencies in a separate Docker layer. Only recompile when `Cargo.toml` changes.
2. **Cargo registry volume mount**: Mount `~/.cargo/registry` as a named Docker volume so
   the registry cache persists across container rebuilds.

### Docker Compose (`infra/dev/demo-be-rust-axum/docker-compose.yml`)

```yaml
services:
  demo-be-db:
    image: postgres:17-alpine
    container_name: demo-be-db
    environment:
      POSTGRES_DB: demo_be_rust_axum
      POSTGRES_USER: demo_be_rust_axum
      POSTGRES_PASSWORD: demo_be_rust_axum
    ports:
      - "5432:5432"
    volumes:
      - demo-be-rust-axum-db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U demo_be_rust_axum"]
      interval: 5s
      timeout: 3s
      retries: 5
    networks:
      - demo-be-rust-axum-network

  demo-be-rust-axum:
    build:
      context: ../../../
      dockerfile: infra/dev/demo-be-rust-axum/Dockerfile.be.dev
    container_name: demo-be-rust-axum
    ports:
      - "8201:8201"
    environment:
      - DATABASE_URL=postgres://demo_be_rust_axum:demo_be_rust_axum@demo-be-db:5432/demo_be_rust_axum
      - APP_JWT_SECRET=dev-jwt-secret-at-least-32-chars-long
      - APP_PORT=8201
    volumes:
      - ./apps/demo-be-rust-axum:/workspace/apps/demo-be-rust-axum:rw
      - cargo-registry:/usr/local/cargo/registry
      - cargo-target:/workspace/target
    depends_on:
      demo-be-db:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:8201/health || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 120s
    networks:
      - demo-be-rust-axum-network

volumes:
  demo-be-rust-axum-db-data:
  cargo-registry:
  cargo-target:

networks:
  demo-be-rust-axum-network:
```

> **Note on `start_period: 120s`**: Rust compilation inside Docker takes considerably longer
> than JVM warm-up or Elixir compilation. The healthcheck start period must be long enough
> to allow the initial `cargo build` to complete before health checks begin failing.

### Dockerfile.be.dev

```dockerfile
FROM rust:latest AS dev

# Install cargo-watch for hot-reload and sqlx-cli for migrations
RUN cargo install cargo-watch sqlx-cli --no-default-features --features postgres,sqlite

WORKDIR /workspace

# Pre-fetch and compile dependencies by copying manifests first.
# This layer is cached as long as Cargo.toml and Cargo.lock do not change.
COPY apps/demo-be-rust-axum/Cargo.toml apps/demo-be-rust-axum/Cargo.lock ./apps/demo-be-rust-axum/
RUN mkdir -p apps/demo-be-rust-axum/src && \
    echo 'fn main() {}' > apps/demo-be-rust-axum/src/main.rs && \
    cd apps/demo-be-rust-axum && cargo build && \
    rm -rf apps/demo-be-rust-axum/src

COPY apps/demo-be-rust-axum ./apps/demo-be-rust-axum/

WORKDIR /workspace/apps/demo-be-rust-axum

CMD ["sh", "-c", "sqlx migrate run && cargo watch -x run"]
```

### docker-compose.e2e.yml (E2E Override)

The E2E override builds a release binary for production-like testing:

```yaml
services:
  demo-be-rust-axum:
    build:
      context: ../../../
      dockerfile: infra/dev/demo-be-rust-axum/Dockerfile.be.e2e
    healthcheck:
      start_period: 300s
```

**Dockerfile.be.e2e** uses a multi-stage build to keep the runtime image small:

```dockerfile
FROM rust:latest AS builder
WORKDIR /workspace/apps/demo-be-rust-axum
COPY apps/demo-be-rust-axum/Cargo.toml apps/demo-be-rust-axum/Cargo.lock ./
RUN mkdir src && echo 'fn main() {}' > src/main.rs && cargo build --release && rm -rf src
COPY apps/demo-be-rust-axum/src ./src/
RUN cargo build --release

FROM debian:bookworm-slim AS runtime
RUN apt-get update && apt-get install -y ca-certificates libssl-dev && rm -rf /var/lib/apt/lists/*
COPY --from=builder /workspace/target/release/demo-be-rust-axum /usr/local/bin/
CMD ["/usr/local/bin/demo-be-rust-axum"]
```

> **Note on E2E `start_period: 300s`**: The multi-stage release build inside Docker for the
> E2E stack compiles all dependencies from scratch (no volume cache). Allow 5 minutes before
> the healthcheck begins evaluating.

---

## GitHub Actions

### New Workflow: `e2e-demo-be-rust-axum.yml`

Mirrors `e2e-demo-be-fsharp-giraffe.yml` with:

- Name: `E2E - Demo BE (RSAX)`
- Schedule: same crons as jasb/exph/fsgi
- Job: checkout → docker compose -f docker-compose.e2e.yml up --build -d →
  wait-healthy (extended timeout: `--timeout 600`) → Volta → npm ci →
  `nx run demo-be-e2e:test:e2e` with `BASE_URL=http://localhost:8201` →
  upload artifact `playwright-report-be-rsax` → docker compose down (always)

> **Note**: The E2E workflow uses an extended healthcheck timeout (`--timeout 600` on
> `docker compose up`) because the Rust release build takes longer than other implementations.

### Updated Workflow: `main-ci.yml`

Add after existing Elixir/F# setup:

```yaml
- name: Setup Rust toolchain
  uses: dtolnay/rust-toolchain@stable
  with:
    components: clippy, rustfmt, llvm-tools-preview

- name: Install cargo-llvm-cov
  uses: taiki-e/install-action@cargo-llvm-cov

- name: Upload coverage — demo-be-rust-axum
  uses: codecov/codecov-action@v5
  with:
    token: ${{ secrets.CODECOV_TOKEN }}
    files: apps/demo-be-rust-axum/coverage/lcov.info
    flags: demo-be-rust-axum
    fail_ci_if_error: false
```

---

## Dependencies Summary

### Cargo.toml (dependencies)

| Crate                                  | Purpose                                           |
| -------------------------------------- | ------------------------------------------------- |
| axum                                   | Web framework (Router, handlers, extractors)      |
| tokio (full features)                  | Async runtime                                     |
| serde + serde_json                     | JSON serialization/deserialization                |
| sqlx (postgres, sqlite, runtime-tokio) | Async SQL queries with compile-time checks        |
| jsonwebtoken                           | JWT encoding/decoding (HMAC-SHA256)               |
| bcrypt                                 | Password hashing                                  |
| uuid (v4, serde)                       | UUID generation and serialization                 |
| chrono (serde)                         | Date/time handling                                |
| thiserror                              | Ergonomic error type derivation                   |
| anyhow                                 | Error propagation in tests and setup code         |
| tower                                  | Middleware abstractions (used by Axum)            |
| tower-http                             | HTTP-level middleware (CORS, request ID, logging) |
| tracing + tracing-subscriber           | Structured logging                                |
| rust_decimal                           | Decimal arithmetic for currency amounts           |
| base64                                 | JWKS public key encoding                          |

### Cargo.toml (dev-dependencies)

| Crate              | Purpose                                |
| ------------------ | -------------------------------------- |
| cucumber           | Gherkin BDD runner (async support)     |
| tokio (test, full) | Async test runtime for cucumber-rs     |
| http-body-util     | Response body collection in tests      |
| tower (util)       | `ServiceExt` for in-process HTTP calls |
| cargo-llvm-cov     | LLVM-based code coverage (dev tool)    |

### External Tools Required

| Tool                                  | Purpose                                  |
| ------------------------------------- | ---------------------------------------- |
| cargo-watch                           | Hot-reload for `dev` target              |
| cargo-llvm-cov                        | Coverage measurement (LCOV output)       |
| sqlx-cli                              | Database migrations (`sqlx migrate run`) |
| rustfmt (rustup component)            | Code formatting                          |
| clippy (rustup component)             | Linting                                  |
| llvm-tools-preview (rustup component) | Required by cargo-llvm-cov               |
