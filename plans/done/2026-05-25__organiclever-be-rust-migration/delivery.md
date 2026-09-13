# Delivery Checklist — organiclever-be Rust Migration

## Worktree

Worktree path: `worktrees/organiclever-be-rust-migration/`

Provision before execution (run from repo root):

```bash
claude --worktree organiclever-be-rust-migration
```

See [Worktree Path Convention](../../../repo-governance/conventions/structure/worktree-path.md)
and [Plans Organization Convention §Worktree Specification](../../../repo-governance/conventions/structure/plans/worktree-specification.md#worktree-specification).

---

## Phase 0: Environment Setup

- [x] Provision worktree: run `claude --worktree organiclever-be-rust-migration` from the repo
      root — creates `worktrees/organiclever-be-rust-migration/`. Verify:
      `test -d worktrees/organiclever-be-rust-migration/` exits 0.
      See [Worktree Path Convention](../../../repo-governance/conventions/structure/worktree-path.md).

- [x] Install Node.js dependencies and converge the full polyglot toolchain in the worktree
      root (not the worktree subdirectory): run `npm install` then
      `npm run doctor -- --fix` from the repo root (the `postinstall` hook
      runs `doctor || true` and silently tolerates drift; the explicit `--fix` call is required to
      converge all tools including Rust, cargo-llvm-cov, cargo-deny). Verify by confirming
      `npm run doctor` exits 0 with no `[MISSING]` entries.

- [x] Verify existing Java build passes as baseline before any changes: run
      `npx nx run organiclever-be:build` from the repo root. Note the result (pass or known-failing
      state) so any pre-existing failures are not attributed to this migration.

- [x] Verify `cargo-deny` is installed: run `cargo deny --version` from the repo root. If
      missing, run `cargo install cargo-deny --locked` and confirm `cargo deny --version` reports
      a version string.

- [x] Verify `cargo-llvm-cov` is installed: run `cargo llvm-cov --version` from the repo root.
      If missing, run `cargo install cargo-llvm-cov --locked` and confirm `cargo llvm-cov --version`
      reports a version string.

---

## Phase 1: Delete Java and Stale F# Artifacts

_Suggested executor: `swe-rust-dev`_

> **Goal**: Remove all Java-specific and stale F# files from `apps/organiclever-be/`,
> add Rust-specific `.gitignore` entries, so the directory contains only non-Java files
> (`.gitignore`, `project.json`, `docker-compose.integration.yml`, `LICENSE`, `README.md`)
> before the Rust skeleton is added.

- [x] Delete Java build descriptor: run
      `git rm apps/organiclever-be/pom.xml`.
      Verify: `git status` shows `apps/organiclever-be/pom.xml` as deleted.

- [x] Delete Java lint configs: run
      `git rm apps/organiclever-be/checkstyle.xml` and
      `git rm apps/organiclever-be/pmd-ruleset.xml`.
      Verify: both files absent from `git ls-files apps/organiclever-be/`.

- [x] Delete Java EditorConfig (Java-specific formatting rules): run
      `git rm apps/organiclever-be/.editorconfig`.
      Verify: absent from `git ls-files apps/organiclever-be/`.

- [x] Delete Java source tree: run
      `git rm -r apps/organiclever-be/src/main/java/`.
      Verify: `git ls-files apps/organiclever-be/src/main/java/` returns empty.

- [x] Delete Java test tree: run
      `git rm -r apps/organiclever-be/src/test/java/`.
      Verify: `git ls-files apps/organiclever-be/src/test/java/` returns empty. If the path does
      not exist, skip and note.

- [x] Delete Spring Boot resource trees: run
      `git rm -r apps/organiclever-be/src/main/resources/` and
      `git rm -r apps/organiclever-be/src/test/resources/`.
      For each, if the path does not exist, skip and note. Verify: both paths absent from
      `git ls-files apps/organiclever-be/src/`.

- [x] Delete stale F# build artifacts: run
      `rm -rf apps/organiclever-be/src/OrganicLeverBe/`.
      These are untracked build artifacts (bin/obj directories); they are not tracked by git, so
      `rm -rf` is appropriate. Verify: path no longer exists via
      `test ! -d apps/organiclever-be/src/OrganicLeverBe/`.

- [x] Delete Java integration Dockerfile: run
      `git rm apps/organiclever-be/Dockerfile.integration`.
      Verify: absent from `git ls-files apps/organiclever-be/`.

- [x] Update `apps/organiclever-be/.gitignore` [Repo-grounded: file exists at
      `apps/organiclever-be/.gitignore`]: read the existing
      file, remove Java/Maven patterns (`target/`, `coverage/`, `*.class`), add Rust patterns
      (`target/`, `generated-contracts/`). After edit, verify
      `grep -q 'target/' apps/organiclever-be/.gitignore` exits 0.

  _Suggested executor: `swe-rust-dev`_

- [x] Commit Phase 1 cleanup:

  ```bash
  git add -A
  git commit -m "chore(organiclever-be): remove Java/Maven/F# artifacts before Rust migration"
  ```

  Verify: `git show --stat HEAD` lists the deleted files and no Rust files yet.

### Commit Guidelines

- [x] Follow Conventional Commits format: `<type>(<scope>): <description>`
- [x] Keep Java cleanup in its own commit, separate from Rust skeleton additions

---

## Phase 2: Rust Skeleton

_Suggested executor: `swe-rust-dev`_

> **Goal**: Create the minimal Rust project files. After this phase, `cargo build` succeeds
> in `apps/organiclever-be/` and the server starts on port 8202.

### 2.1 Project Config Files

- [x] Create `apps/organiclever-be/rust-toolchain.toml` _[New file]_ with content matching
      `apps/rhino-cli/rust-toolchain.toml` [Repo-grounded]: channel = "1.95.0", components =
      `["clippy", "rustfmt", "llvm-tools"]`, profile = "minimal".
      Verify: `cat apps/organiclever-be/rust-toolchain.toml`
      shows `channel = "1.95.0"`.

  _Suggested executor: `swe-rust-dev`_

- [x] Create `apps/organiclever-be/deny.toml` _[New file]_ with content identical to
      `apps/rhino-cli/deny.toml` [Repo-grounded] (copy verbatim, update the comment header to
      reference `organiclever-be`). Verify:
      `grep 'MIT' apps/organiclever-be/deny.toml` exits 0.

  _Suggested executor: `swe-rust-dev`_

- [x] Create `apps/organiclever-be/.env.example` _[New file]_ with:

  ```
  DATABASE_URL=postgres://postgres:postgres@localhost:5432/organiclever
  PORT=8202
  CORS_ORIGINS=*
  ```

  Verify: `test -f apps/organiclever-be/.env.example`
  exits 0.

  _Suggested executor: `swe-rust-dev`_

### 2.2 Cargo.toml (RED → GREEN → REFACTOR)

**RED**: Before writing `Cargo.toml`, write a placeholder `src/main.rs` that just `fn main() {}`
so `cargo build` can attempt to compile and fail with "unresolved dependency" or similar.
Actually: `Cargo.toml` must exist first for cargo to run — skip the red step for the manifest
itself; the RED step applies to the handler tests in 2.3+.

- [x] Create `apps/organiclever-be/Cargo.toml` _[New file]_:

  ```toml
  [package]
  name = "organiclever-be"
  version = "0.1.0"
  edition = "2024"
  rust-version = "1.88"
  description = "OrganicLever backend REST API — Rust/Axum port"
  license = "MIT"
  publish = false

  [[bin]]
  name = "organiclever-be"
  path = "src/main.rs"

  [lib]
  name = "organiclever_be"
  path = "src/lib.rs"

  [[test]]
  name = "unit"
  path = "tests/unit/main.rs"
  harness = false

  [[test]]
  name = "integration"
  path = "tests/integration/main.rs"
  harness = false

  [dependencies]
  axum = { version = "0.8.9", features = ["macros"] }
  tokio = { version = "1", features = ["full"] }
  serde = { version = "1.0.228", features = ["derive"] }
  serde_json = "1.0.150"
  sqlx = { version = "0.8", features = ["runtime-tokio", "postgres", "uuid", "chrono", "migrate"] }
  tower-http = { version = "0.6.11", features = ["cors", "trace"] }
  tracing = "0.1"
  tracing-subscriber = { version = "0.3", features = ["env-filter"] }
  anyhow = "1.0.102"
  thiserror = "2"

  [dev-dependencies]
  cucumber = "0.23.0"
  tokio = { version = "1", features = ["full"] }
  reqwest = { version = "0.12", features = ["json"] }

  [lints.rust]
  unsafe_code = "forbid"
  missing_docs = "deny"

  [lints.rustdoc]
  private_intra_doc_links = "deny"

  [lints.clippy]
  pedantic = { level = "warn", priority = -1 }
  struct_excessive_bools = "allow"
  cast_precision_loss = "allow"
  cast_possible_wrap = "allow"
  must_use_candidate = "allow"
  unnecessary_wraps = "allow"
  missing_errors_doc = "deny"
  missing_panics_doc = "deny"
  doc_markdown = "deny"
  missing_docs_in_private_items = "deny"
  unwrap_used = "deny"
  panic = "deny"
  undocumented_unsafe_blocks = "deny"
  indexing_slicing = "allow"
  arithmetic_side_effects = "allow"

  [profile.release]
  opt-level = 3
  lto = "thin"
  codegen-units = 1
  panic = "abort"
  strip = "symbols"
  ```

  Verify: `cargo metadata --manifest-path apps/organiclever-be/Cargo.toml --no-deps 2>&1 | grep organiclever-be` exits 0.

  _Suggested executor: `swe-rust-dev`_

### 2.3 Source Files (TDD — RED → GREEN → REFACTOR)

#### config.rs

- [x] **RED**: Create `apps/organiclever-be/tests/unit/main.rs` _[New file]_ with a failing
      test for `Config::from_env()`:

  ```rust
  // tests/unit/main.rs
  mod config_tests {
      use organiclever_be::config::Config;
      #[test]
      fn test_default_port() {
          std::env::remove_var("PORT");
          let cfg = Config::from_env();
          assert_eq!(cfg.port, 8202);
      }
  }
  fn main() { /* libtest harness replacement */ }
  ```

  Also create stub `apps/organiclever-be/src/lib.rs` _[New file]_ declaring `pub mod config;`
  and a stub `apps/organiclever-be/src/config.rs` _[New file]_ with an empty `Config` struct.
  Run `cargo test --manifest-path apps/organiclever-be/Cargo.toml --test unit 2>&1`.
  Verify: test fails with "field `port` not found" or similar compile error (RED confirmed).

  _Suggested executor: `swe-rust-dev`_

- [x] **GREEN**: Implement `apps/organiclever-be/src/config.rs` _[New file]_:

  ```rust
  //! Application configuration loaded from environment variables.
  use std::env;

  /// Runtime configuration for the organiclever-be server.
  pub struct Config {
      /// PostgreSQL connection URL.
      pub database_url: String,
      /// TCP port to listen on.
      pub port: u16,
      /// Allowed CORS origins (comma-separated or "*").
      pub cors_origins: String,
  }

  impl Config {
      /// Load configuration from environment variables with defaults.
      #[must_use]
      pub fn from_env() -> Self {
          let database_url = env::var("DATABASE_URL")
              .unwrap_or_else(|_| "postgres://postgres:postgres@localhost:5432/organiclever".to_string());
          let port = env::var("PORT")
              .ok()
              .and_then(|p| p.parse().ok())
              .unwrap_or(8202u16);
          let cors_origins = env::var("CORS_ORIGINS").unwrap_or_else(|_| "*".to_string());
          Self { database_url, port, cors_origins }
      }
  }
  ```

  Run `cargo test --manifest-path apps/organiclever-be/Cargo.toml --test unit 2>&1`.
  Verify: `test config_tests::test_default_port ... ok` appears (GREEN confirmed).

  _Suggested executor: `swe-rust-dev`_

- [x] **REFACTOR**: Review `config.rs` for doc completeness (all public items have `///` docs,
      `missing_docs` lint satisfied). Run `cargo clippy --manifest-path apps/organiclever-be/Cargo.toml 2>&1 | grep -i error`.
      Verify: zero errors.

  _Suggested executor: `swe-rust-dev`_

#### errors.rs

- [x] **RED**: Add a failing test to `tests/unit/main.rs` for `AppError`:

  ```rust
  mod error_tests {
      use organiclever_be::errors::AppError;
      use axum::response::IntoResponse;
      #[test]
      fn test_internal_error_status() {
          let err = AppError::Internal("test error".to_string());
          let resp = err.into_response();
          assert_eq!(resp.status(), axum::http::StatusCode::INTERNAL_SERVER_ERROR);
      }
  }
  ```

  Verify: compile fails because `AppError` does not exist (RED confirmed).

  _Suggested executor: `swe-rust-dev`_

- [x] **GREEN**: Create `apps/organiclever-be/src/errors.rs` _[New file]_:

  ```rust
  //! Global error types and HTTP error response conversion.
  use axum::{
      http::StatusCode,
      response::{IntoResponse, Response},
      Json,
  };
  use serde_json::json;
  use thiserror::Error;

  /// Application-level errors that convert to HTTP responses.
  #[derive(Debug, Error)]
  pub enum AppError {
      /// An unhandled internal server error.
      #[error("internal error: {0}")]
      Internal(String),
  }

  impl IntoResponse for AppError {
      fn into_response(self) -> Response {
          let (status, message) = match self {
              AppError::Internal(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg),
          };
          (status, Json(json!({"error": message}))).into_response()
      }
  }
  ```

  Add `pub mod errors;` to `src/lib.rs`. Run
  `cargo test --manifest-path apps/organiclever-be/Cargo.toml --test unit 2>&1`.
  Verify: `test error_tests::test_internal_error_status ... ok` (GREEN confirmed).

  _Suggested executor: `swe-rust-dev`_

- [x] **REFACTOR**: Ensure all public types and fields have `///` doc comments. Run
      `cargo clippy --manifest-path apps/organiclever-be/Cargo.toml 2>&1 | grep -i error`.
      Verify: zero errors.

  _Suggested executor: `swe-rust-dev`_

#### health/mod.rs

- [x] **RED**: Add a failing test to `tests/unit/main.rs` for the health handler:

  ```rust
  mod health_tests {
      use organiclever_be::health;
      use axum::http::StatusCode;
      #[tokio::test]
      async fn test_health_returns_ok() {
          let resp = health::get_health().await;
          // health::get_health returns (StatusCode, Json<Value>)
          assert_eq!(resp.0, StatusCode::OK);
      }
  }
  ```

  Verify: compile fails because `health` module does not exist (RED confirmed).

  _Suggested executor: `swe-rust-dev`_

- [x] **GREEN**: Create `apps/organiclever-be/src/health/mod.rs` _[New file]_:

  ```rust
  //! Health check endpoint handler.
  use axum::{http::StatusCode, Json};
  use serde_json::{json, Value};

  /// Returns `{"status": "ok"}` with HTTP 200.
  ///
  /// # Errors
  ///
  /// This handler never returns an error; the return type satisfies the Axum handler trait.
  pub async fn get_health() -> (StatusCode, Json<Value>) {
      (StatusCode::OK, Json(json!({"status": "ok"})))
  }
  ```

  Add `pub mod health;` to `src/lib.rs`. Run
  `cargo test --manifest-path apps/organiclever-be/Cargo.toml --test unit 2>&1`.
  Verify: `test health_tests::test_health_returns_ok ... ok` (GREEN confirmed).

  _Suggested executor: `swe-rust-dev`_

- [x] **REFACTOR**: Run `cargo clippy --manifest-path apps/organiclever-be/Cargo.toml 2>&1 | grep -i error`.
      Verify: zero errors.

  _Suggested executor: `swe-rust-dev`_

#### app.rs

- [x] **RED**: Add a failing test to `tests/unit/main.rs` _[New test]_ for the router export:

  ```rust
  mod router_tests {
      use organiclever_be::app;
      #[tokio::test]
      async fn test_app_router_compiles() {
          let _ = app::router();
      }
  }
  ```

  Run `cargo test --manifest-path apps/organiclever-be/Cargo.toml --test unit 2>&1`.
  Verify: compile fails with "unresolved import" or "could not find `app` in `organiclever_be`"
  (RED confirmed — `app` module does not yet exist).

  _Suggested executor: `swe-rust-dev`_

- [x] **GREEN**: Create `apps/organiclever-be/src/app.rs` _[New file]_:

  ```rust
  //! Axum router and middleware configuration.
  use axum::{routing::get, Router};
  use tower_http::cors::CorsLayer;

  use crate::health;

  /// Build and return the application router with CORS middleware.
  ///
  /// # Panics
  ///
  /// Does not panic; the router is constructed with compile-time-known routes.
  pub fn router() -> Router {
      Router::new()
          .nest("/api/v1", api_router())
          .layer(CorsLayer::permissive())
  }

  fn api_router() -> Router {
      Router::new().route("/health", get(health::get_health))
  }
  ```

  Add `pub mod app;` to `src/lib.rs`. Run
  `cargo build --manifest-path apps/organiclever-be/Cargo.toml 2>&1 | grep -i error`.
  Verify: zero build errors (GREEN confirmed).

  _Suggested executor: `swe-rust-dev`_

- [x] **REFACTOR**: Run `cargo clippy --manifest-path apps/organiclever-be/Cargo.toml 2>&1 | grep -i error`.
      Verify: zero errors.

  _Suggested executor: `swe-rust-dev`_

#### main.rs

- [x] **RED**: Verify that `cargo check` fails before `main.rs` is created. Since `Cargo.toml`
      declares `[[bin]] path = "src/main.rs"`, the binary target cannot compile without the file.
      Run `cargo check --manifest-path apps/organiclever-be/Cargo.toml 2>&1`.
      Verify: exits non-zero with "couldn't read `apps/organiclever-be/src/main.rs`" or similar
      missing-file error (RED confirmed).

  _Suggested executor: `swe-rust-dev`_

- [x] **GREEN**: Create `apps/organiclever-be/src/main.rs` _[New file]_:

  ```rust
  //! OrganicLever backend — Axum entry point.
  use organiclever_be::{app, config::Config};
  use tracing_subscriber::EnvFilter;

  #[tokio::main]
  async fn main() {
      tracing_subscriber::fmt()
          .with_env_filter(EnvFilter::from_default_env())
          .init();

      let config = Config::from_env();
      let router = app::router();

      let addr = format!("0.0.0.0:{}", config.port);
      let listener = tokio::net::TcpListener::bind(&addr)
          .await
          .expect("Failed to bind port");

      tracing::info!("Listening on {addr}");
      axum::serve(listener, router)
          .await
          .expect("Server error");
  }
  ```

  Run `cargo build --manifest-path apps/organiclever-be/Cargo.toml 2>&1 | grep -i error`.
  Verify: zero build errors. Then run
  `cargo run --manifest-path apps/organiclever-be/Cargo.toml &`
  and `curl -s http://localhost:8202/api/v1/health` returns `{"status":"ok"}`. Stop the server.

  _Suggested executor: `swe-rust-dev`_

- [x] Commit Phase 2 Rust skeleton:

  ```bash
  git add apps/organiclever-be/Cargo.toml apps/organiclever-be/rust-toolchain.toml \
    apps/organiclever-be/deny.toml apps/organiclever-be/.env.example \
    apps/organiclever-be/src/ apps/organiclever-be/tests/unit/
  git commit -m "feat(organiclever-be): add Rust/Axum skeleton with health endpoint"
  ```

  Verify: `git show --stat HEAD` shows new Rust files.

---

## Phase 3: Tests — BDD Integration + Docker

_Suggested executor: `swe-rust-dev`_

> **Goal**: cucumber-rs step implementations cover both scenarios from
> `specs/apps/organiclever/behavior/be/gherkin/health/health-check.feature`;
> `nx run organiclever-be:spec-coverage` passes.

### 3.1 Update Gherkin Feature File

- [x] Edit `specs/apps/organiclever/behavior/be/gherkin/health/health-check.feature`
      [Repo-grounded: exists at
      `specs/apps/organiclever/behavior/be/gherkin/health/health-check.feature`]:
      change `And the health status should be "UP"` to `And the health status should be "ok"` in
      both scenarios. Verify:
      `grep '"ok"' specs/apps/organiclever/behavior/be/gherkin/health/health-check.feature`
      returns two matches.

  _Suggested executor: `swe-rust-dev`_

### 3.2 Cucumber-rs Integration Tests (RED → GREEN → REFACTOR)

- [x] **RED**: Create `apps/organiclever-be/tests/integration/main.rs` _[New file]_ with a
      minimal cucumber-rs harness that imports the feature file but has no step implementations:

  ```rust
  use cucumber::World;

  #[derive(Debug, Default, World)]
  pub struct ApiWorld {
      pub base_url: String,
      pub last_status: u16,
      pub last_body: String,
  }

  fn main() {
      let runtime = tokio::runtime::Runtime::new().expect("tokio runtime");
      runtime.block_on(
          ApiWorld::cucumber()
              .run("../../specs/apps/organiclever/behavior/be/gherkin/health/health-check.feature"),
      );
  }
  ```

  Run `cargo test --manifest-path apps/organiclever-be/Cargo.toml --test integration 2>&1`.
  Verify: test run reports unimplemented steps (RED confirmed — cucumber reports "pending" or panics).

  _Suggested executor: `swe-rust-dev`_

- [x] **GREEN**: Add step definitions to `tests/integration/main.rs` covering:
  - `Given the API is running` — spawn `axum::serve` in a `tokio::spawn` task on an ephemeral
    port; store `base_url` in `ApiWorld`
  - `When an operations engineer sends GET /health` — `reqwest::get(base_url + "/api/v1/health")`
    and store status + body in `ApiWorld`
  - `When an unauthenticated engineer sends GET /health` — same as above
  - `Then the response status code should be 200` — assert `ApiWorld.last_status == 200`
  - `And the health status should be "ok"` — parse JSON body, assert `status == "ok"`
  - `And the response should not include detailed component health information` — assert body
    does not contain the string `"components"`

  Run `cargo test --manifest-path apps/organiclever-be/Cargo.toml --test integration 2>&1`.
  Verify: both scenarios pass with exit 0 (GREEN confirmed).

  _Suggested executor: `swe-rust-dev`_

- [x] **REFACTOR**: Review integration test for duplicate step code; extract shared helpers if
      any step function body exceeds ~10 lines. Run
      `cargo clippy --manifest-path apps/organiclever-be/Cargo.toml --tests 2>&1 | grep -i error`.
      Verify: zero errors.

  _Suggested executor: `swe-rust-dev`_

### 3.3 Docker Integration Setup

- [x] Rewrite `apps/organiclever-be/Dockerfile.integration` _[replacing deleted Java Dockerfile]_
      with a Rust multi-stage build:

  ```dockerfile
  # Stage 1: build the Rust binary
  FROM rust:1.95-slim AS builder
  WORKDIR /build
  COPY apps/organiclever-be/Cargo.toml apps/organiclever-be/Cargo.lock* ./
  COPY apps/organiclever-be/src ./src
  RUN cargo build --release --bin organiclever-be

  # Stage 2: minimal runtime image
  FROM debian:bookworm-slim
  RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
  COPY --from=builder /build/target/release/organiclever-be /usr/local/bin/organiclever-be
  ENV PORT=8202
  EXPOSE 8202
  CMD ["/usr/local/bin/organiclever-be"]
  ```

  Note: the build context in `docker-compose.integration.yml` is `../..` (monorepo root);
  adjust `COPY` paths accordingly if needed after testing.

  _Suggested executor: `swe-rust-dev`_

- [x] Rewrite `apps/organiclever-be/docker-compose.integration.yml` _[adapting existing file]_
      to remove the Java test-runner service, add a PostgreSQL service, and add the Rust app service:

  ```yaml
  services:
    postgres:
      image: postgres:17-alpine
      environment:
        POSTGRES_USER: postgres
        POSTGRES_PASSWORD: postgres
        POSTGRES_DB: organiclever
      ports:
        - "5432:5432"
      healthcheck:
        test: ["CMD-SHELL", "pg_isready -U postgres"]
        interval: 5s
        timeout: 5s
        retries: 5

    app:
      build:
        context: ../..
        dockerfile: apps/organiclever-be/Dockerfile.integration
      environment:
        DATABASE_URL: postgres://postgres:${POSTGRES_PASSWORD:-postgres}@postgres:5432/organiclever
        PORT: "8202"
        CORS_ORIGINS: "*"
      ports:
        - "8202:8202"
      depends_on:
        postgres:
          condition: service_healthy

    test-runner:
      build:
        context: ../..
        dockerfile: apps/organiclever-be/Dockerfile.integration
      volumes:
        - ../../specs:/specs:ro
      environment:
        DATABASE_URL: postgres://postgres:${POSTGRES_PASSWORD:-postgres}@postgres:5432/organiclever
        API_BASE_URL: http://app:8202
      depends_on:
        - app
      command: ["cargo", "test", "--test", "integration"]
  ```

  Verify: `docker compose -f apps/organiclever-be/docker-compose.integration.yml config 2>&1 | grep -i error` exits 0 (no YAML errors).

  _Suggested executor: `swe-rust-dev`_

- [x] Commit Phase 3 tests and Docker:

  ```bash
  git add apps/organiclever-be/tests/ apps/organiclever-be/Dockerfile.integration \
    apps/organiclever-be/docker-compose.integration.yml \
    specs/apps/organiclever/behavior/be/gherkin/health/health-check.feature
  git commit -m "test(organiclever-be): add cucumber-rs BDD integration tests and adapt Docker setup"
  ```

  Verify: `git show --stat HEAD` shows test and Docker files.

---

## Phase 4: Update Nx Targets and Codegen

_Suggested executor: `swe-rust-dev`_

> **Goal**: `apps/organiclever-be/project.json` uses cargo targets; tags updated to Rust;
> codegen target updated (or stubbed). After this phase, `nx run organiclever-be:build` runs
> `cargo build --release`.

### 4.1 Rewrite project.json

- [x] Edit `apps/organiclever-be/project.json` [Repo-grounded: exists at
      `apps/organiclever-be/project.json`]: replace ALL
      existing `targets` with the following cargo-based targets:

  ```json
  {
    "name": "organiclever-be",
    "$schema": "../../node_modules/nx/schemas/project-schema.json",
    "sourceRoot": "apps/organiclever-be/src",
    "projectType": "application",
    "targets": {
      "codegen": {
        "executor": "nx:run-commands",
        "options": {
          "command": "echo 'TODO: update openapi-generator-cli to -g rust once generator is validated' && exit 0"
        },
        "cache": true,
        "inputs": ["{workspaceRoot}/specs/apps/organiclever/containers/contracts/generated/openapi-bundled.yaml"],
        "outputs": ["{projectRoot}/generated-contracts"]
      },
      "install": {
        "executor": "nx:run-commands",
        "options": {
          "command": "cargo fetch --manifest-path apps/organiclever-be/Cargo.toml"
        },
        "cache": true,
        "inputs": ["{projectRoot}/Cargo.toml", "{projectRoot}/Cargo.lock"]
      },
      "build": {
        "executor": "nx:run-commands",
        "options": {
          "command": "cargo build --release --manifest-path apps/organiclever-be/Cargo.toml"
        },
        "outputs": ["{projectRoot}/target"],
        "cache": true,
        "inputs": ["{projectRoot}/src/**", "{projectRoot}/Cargo.toml"]
      },
      "fmt": {
        "executor": "nx:run-commands",
        "options": {
          "command": "cargo fmt --manifest-path apps/organiclever-be/Cargo.toml"
        }
      },
      "fmt:check": {
        "executor": "nx:run-commands",
        "options": {
          "command": "cargo fmt --check --manifest-path apps/organiclever-be/Cargo.toml"
        },
        "cache": true,
        "inputs": ["{projectRoot}/src/**", "{projectRoot}/Cargo.toml"]
      },
      "lint": {
        "executor": "nx:run-commands",
        "options": {
          "command": "cargo clippy --manifest-path apps/organiclever-be/Cargo.toml --all-targets -- -D warnings"
        },
        "cache": true,
        "inputs": ["{projectRoot}/src/**", "{projectRoot}/Cargo.toml"]
      },
      "deny:check": {
        "executor": "nx:run-commands",
        "options": {
          "command": "cargo deny --manifest-path apps/organiclever-be/Cargo.toml check"
        },
        "cache": true,
        "inputs": ["{projectRoot}/Cargo.toml", "{projectRoot}/deny.toml"]
      },
      "check:msrv": {
        "executor": "nx:run-commands",
        "options": {
          "command": "cargo +1.88 check --manifest-path apps/organiclever-be/Cargo.toml"
        }
      },
      "run": {
        "executor": "nx:run-commands",
        "options": {
          "command": "cargo run --release --manifest-path apps/organiclever-be/Cargo.toml"
        }
      },
      "dev": {
        "executor": "nx:run-commands",
        "options": {
          "command": "cargo run --manifest-path apps/organiclever-be/Cargo.toml"
        }
      },
      "typecheck": {
        "executor": "nx:run-commands",
        "options": {
          "command": "cargo check --manifest-path apps/organiclever-be/Cargo.toml --all-targets"
        },
        "cache": true,
        "inputs": ["{projectRoot}/src/**", "{projectRoot}/tests/**", "{projectRoot}/Cargo.toml"]
      },
      "test:unit": {
        "executor": "nx:run-commands",
        "options": {
          "command": "cargo test --manifest-path apps/organiclever-be/Cargo.toml --test unit"
        },
        "cache": true,
        "inputs": ["{projectRoot}/src/**", "{projectRoot}/tests/unit/**", "{projectRoot}/Cargo.toml"]
      },
      "test:quick": {
        "executor": "nx:run-commands",
        "options": {
          "commands": [
            "cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- ddd bc organiclever",
            "cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- ddd ul organiclever",
            "cargo llvm-cov --manifest-path apps/organiclever-be/Cargo.toml --test unit --fail-under-lines 90"
          ],
          "parallel": false
        },
        "cache": true,
        "inputs": [
          "{projectRoot}/src/**",
          "{projectRoot}/tests/unit/**",
          "{projectRoot}/Cargo.toml",
          "{workspaceRoot}/specs/apps/organiclever/behavior/be/gherkin/**/*.feature",
          "{workspaceRoot}/specs/apps/organiclever/ddd/bounded-contexts.yaml",
          "{workspaceRoot}/specs/apps/organiclever/ddd/ubiquitous-language/**/*.md"
        ]
      },
      "test:integration": {
        "executor": "nx:run-commands",
        "options": {
          "command": "docker compose -f apps/organiclever-be/docker-compose.integration.yml down -v && docker compose -f apps/organiclever-be/docker-compose.integration.yml up --abort-on-container-exit --build"
        },
        "cache": false
      },
      "spec-coverage": {
        "executor": "nx:run-commands",
        "options": {
          "command": "cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- spec-coverage validate --shared-steps specs/apps/organiclever/behavior/be/gherkin apps/organiclever-be"
        },
        "cache": true,
        "inputs": ["{workspaceRoot}/specs/apps/organiclever/behavior/be/gherkin/**/*.feature", "{projectRoot}/**/*.rs"]
      }
    },
    "tags": ["type:app", "platform:axum", "lang:rust", "domain:organiclever"],
    "implicitDependencies": ["organiclever-contracts"]
  }
  ```

  Verify: `npx nx show project organiclever-be --json 2>&1 | grep '"platform:axum"'` exits 0.

  _Suggested executor: `swe-rust-dev`_

- [x] Commit Phase 4 project.json update:

  ```bash
  git add apps/organiclever-be/project.json
  git commit -m "chore(organiclever-be): replace Java Nx targets with cargo targets, update tags to lang:rust"
  ```

  Verify: `git show --stat HEAD` shows only `project.json` changed.

---

## Phase 5: Local Quality Gates

> **Important**: Fix ALL failures found during quality gates, not just those caused by your
> changes. This follows the root cause orientation principle — proactively fix preexisting
> errors encountered during work. Do not defer or skip existing issues. Commit preexisting
> fixes separately with appropriate conventional commit messages.

- [x] Run format check:
      `npx nx run organiclever-be:fmt:check`
      Verify: exits 0. If it fails, run `npx nx run organiclever-be:fmt` and re-check.

- [x] Run affected typecheck:
      `npx nx affected -t typecheck`
      Verify: exits 0 with no type errors reported.

- [x] Run lint (clippy):
      `npx nx run organiclever-be:lint`
      Verify: exits 0 — zero clippy warnings treated as errors.

- [x] Run deny check:
      `npx nx run organiclever-be:deny:check`
      Verify: exits 0 — no license violations or known security advisories.

- [x] Run MSRV check:
      `npx nx run organiclever-be:check:msrv`
      Verify: exits 0 — project compiles on Rust 1.88 (requires Rust 1.88 toolchain installed).
      If toolchain not installed, run `rustup install 1.88` first.

- [x] Run unit tests:
      `npx nx run organiclever-be:test:unit`
      Verify: all unit tests pass, exit 0.

- [x] Run test:quick (includes DDD checks + llvm-cov 90% gate):
      `npx nx run organiclever-be:test:quick`
      Verify: exits 0. Coverage is ≥ 90 lines.

- [x] Run spec-coverage:
      `npx nx run organiclever-be:spec-coverage`
      Verify: exits 0 — rhino-cli spec-coverage tool finds matching step implementations for all
      Gherkin scenarios.

- [x] Run full affected suite:
      `npx nx affected -t typecheck lint test:quick spec-coverage`
      Verify: all four targets exit 0.

### Commit Guidelines

- [x] Commit quality-gate fixes thematically — each concern in its own commit
- [x] Follow Conventional Commits: `fix(organiclever-be): <description>`
- [x] Preexisting failures fixed in this phase get separate commits from plan work

---

## Phase 6: Manual API Verification (curl)

> **Goal**: The running server responds correctly to the health endpoint before pushing.

- [x] Start the dev server:

  ```bash
  cargo run --manifest-path apps/organiclever-be/Cargo.toml
  ```

  (Run in a background shell or separate terminal.)
  Verify: terminal prints `Listening on 0.0.0.0:8202`.

- [x] Verify health endpoint happy path:

  ```bash
  curl -s http://localhost:8202/api/v1/health | jq .
  ```

  Verify: response is `{"status":"ok"}` and `curl` exit code is 0.

- [x] Verify HTTP status code is 200:

  ```bash
  curl -s -o /dev/null -w "%{http_code}" http://localhost:8202/api/v1/health
  ```

  Verify: output is `200`.

- [x] Verify CORS preflight:

  ```bash
  curl -s -X OPTIONS http://localhost:8202/api/v1/health \
    -H "Origin: https://example.com" \
    -H "Access-Control-Request-Method: GET" \
    -I | grep -i "access-control"
  ```

  Verify: response includes `access-control-allow-origin: *` (or specific origin).

- [x] Verify unknown route returns 404 (Axum default):

  ```bash
  curl -s -o /dev/null -w "%{http_code}" http://localhost:8202/api/v1/unknown
  ```

  Verify: output is `404`.

- [x] Stop the dev server.

---

## Phase 7: Post-Push CI Verification

- [x] Stage and commit any remaining uncommitted changes (format fixes, README updates, etc.):

  ```bash
  git add -A
  git status
  ```

  Verify: no unintended files staged.

- [x] Push to `main`:

  ```bash
  git push origin main
  ```

  Verify: push completes without error; pre-push hook (typecheck, lint, test:quick,
  spec-coverage for affected projects) passes.

- [x] List triggered GitHub Actions workflows and identify which ran for the push commit:

  ```bash
  gh run list --limit 10
  ```

  Note: for direct pushes to `main` from this plan, the relevant workflow is
  **`pr-quality-gate.yml`** (runs on PRs only — not triggered by this push). There is currently
  no dedicated push-to-main workflow for `organiclever-be`. The primary quality gate for this
  plan is the **pre-push hook** (typecheck, lint, test:quick, spec-coverage for affected
  projects). If any other push-triggered workflow appears in the list (e.g., markdown linting
  or a future Rust CI workflow), verify it shows `conclusion: success`.

  Verify: any runs triggered by this commit show `status: completed` before proceeding.

- [x] Monitor any triggered CI runs (poll every 3 minutes — do NOT use `gh run watch`):

  ```bash
  gh run view <run-id> --json status,conclusion
  ```

  Verify: all triggered jobs show `conclusion: success` before proceeding.

- [x] If any CI job fails: investigate root cause, fix, commit, and push. Do NOT proceed to
      archival until ALL triggered GitHub Actions passes with zero failures.

---

## Phase 8: Plan Archival

- [x] Verify ALL delivery checklist items above are ticked.
- [x] Verify ALL quality gates pass (local + CI).
- [x] Verify ALL manual API assertions pass.

- [x] Rename and move the plan folder:

  ```bash
  git mv plans/in-progress/organiclever-be-rust-migration/ \
    plans/done/2026-MM-DD__organiclever-be-rust-migration/
  ```

  Replace `2026-MM-DD` with today's actual completion date.
  Verify: `ls plans/done/` shows the renamed folder.

- [x] Update `plans/in-progress/README.md`
      [Repo-grounded: `plans/in-progress/README.md`]: remove
      the `organiclever-be-rust-migration` entry from the Active Plans list.
      Verify: the entry is absent from the file.

- [x] Update `plans/done/README.md`
      [Repo-grounded: verify path with `test -f plans/done/README.md`]:
      add an entry for `YYYY-MM-DD__organiclever-be-rust-migration` with the completion date.

- [x] Commit the archival:

  ```bash
  git add plans/
  git commit -m "chore(plans): move organiclever-be-rust-migration to done"
  ```

  Verify: `git show --stat HEAD` shows only plan directory movement.

- [x] Push archival commit to `main`:

  ```bash
  git push origin main
  ```

  Verify: push completes and CI passes.
