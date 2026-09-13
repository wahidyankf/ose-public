# Delivery Checklist — ose-app-be Rust Migration

## Worktree

Worktree path: `worktrees/ose-app-be-rust-migration/`

Provision before execution (run from repo root):

```bash
claude --worktree ose-app-be-rust-migration
```

See [Worktree Path Convention](../../../repo-governance/conventions/structure/worktree-path.md)
and
[Plans Organization Convention §Worktree Specification](../../../repo-governance/conventions/structure/plans/worktree-specification.md#worktree-specification).

---

## Git Workflow

Direct push to `main`. No PR. Trunk Based Development.

Commit each phase separately with Conventional Commits format:

- `chore(ose-app-be): delete F# artifacts and reset project scaffold`
- `feat(ose-app-be): implement health context in Rust`
- `feat(ose-app-be): add stub bounded contexts`
- `test(ose-app-be): add cucumber integration test harness`
- `chore(ose-app-be): update project.json and Nx targets for Rust`
- `docs(ose-app-be): update README and bounded-contexts.yaml for Rust`

---

## Phase 0: Environment Setup and Baseline

> _Executor: repo-setup-manager_

- [ ] Install dependencies in the root worktree: run `npm install` from
      `~/ose-projects/ose-public/` (worktree root).
      — Acceptance: exits 0, `node_modules/` synchronized.

- [ ] Converge the full polyglot toolchain: run
      `npm run doctor -- --fix` from the worktree root.
      — Acceptance: exits 0 with no unresolved drift.

- [ ] Confirm Rust toolchain is available: run
      `rustup toolchain list | grep 1.95` from the worktree root.
      — Acceptance: `1.95.0` appears in the output.

- [ ] Confirm `cargo-llvm-cov` is installed: run
      `cargo llvm-cov --version` from the worktree root.
      — Acceptance: exits 0 and prints a version string.

- [ ] Confirm `cargo-deny` is installed: run
      `cargo deny --version` from the worktree root.
      — Acceptance: exits 0 and prints a version string.

- [ ] Record the current F# baseline by running
      `npx nx run ose-app-be:test:quick` from the worktree root.
      — Acceptance: record whether this exits 0 or non-zero; document the pass/fail
      count so preexisting failures are known before changes begin.

- [ ] Resolve all preexisting failures before proceeding.
      — Acceptance: no unresolved preexisting failures remain.

---

## Phase 1: Delete F# Artifacts and Scaffold Rust Project

### Step 1.1 — Delete F#/.NET source tree

- [ ] Delete the F# source and test trees from `apps/ose-app-be/`:

  ```bash
  rm -rf ~/ose-projects/ose-public/apps/ose-app-be/src/OseAppBe
  rm -rf ~/ose-projects/ose-public/apps/ose-app-be/tests/OseAppBe.Tests
  rm -rf ~/ose-projects/ose-public/apps/ose-app-be/dist
  rm -rf ~/ose-projects/ose-public/apps/ose-app-be/coverage
  rm -rf ~/ose-projects/ose-public/apps/ose-app-be/generated-contracts/OpenAPI
  rm -f  ~/ose-projects/ose-public/apps/ose-app-be/global.json
  rm -f  ~/ose-projects/ose-public/apps/ose-app-be/dotnet-tools.json
  rm -f  ~/ose-projects/ose-public/apps/ose-app-be/fsharplint.json
  rm -f  ~/ose-projects/ose-public/apps/ose-app-be/.editorconfig
  ```

  — Acceptance: none of the deleted paths exist; `ls apps/ose-app-be/` shows only
  `.env.example`, `.gitignore`, `docker-compose.integration.yml`, `Dockerfile.integration`,
  `LICENSE`, `project.json`, `README.md`.

### Step 1.2 — Create Cargo.toml (RED)

- [ ] **RED**: Create
      `apps/ose-app-be/Cargo.toml` (_New file_) with the following content — adapted from
      `apps/organiclever-be/Cargo.toml` [Repo-grounded]:

  ```toml
  [package]
  name = "ose-app-be"
  version = "0.1.0"
  edition = "2024"
  rust-version = "1.88"
  description = "OSE Application backend REST API — Rust/Axum"
  license = "MIT"
  publish = false

  [[bin]]
  name = "ose-app-be"
  path = "src/main.rs"

  [lib]
  name = "ose_app_be"
  path = "src/lib.rs"

  [[test]]
  name = "unit"
  path = "tests/unit/main.rs"

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
  tokio = { version = "1", features = ["full"] }
  axum = { version = "0.8.9", features = ["macros"] }
  cucumber = "0.23.0"
  reqwest = { version = "0.13.3", features = ["json"] }

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
  case_sensitive_file_extension_comparisons = "allow"
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

  Verify: `cargo check --manifest-path apps/ose-app-be/Cargo.toml` fails because source
  files do not exist yet.
  — Acceptance: exits non-zero (expected RED state).

### Step 1.3 — Copy toolchain and policy files

- [ ] Create `apps/ose-app-be/rust-toolchain.toml` (_New file_) — verbatim copy of
      `apps/organiclever-be/rust-toolchain.toml` [Repo-grounded]:

  ```toml
  [toolchain]
  channel = "1.95.0"
  components = ["clippy", "rustfmt", "llvm-tools"]
  profile = "minimal"
  ```

  — Acceptance: file exists at `apps/ose-app-be/rust-toolchain.toml`.

- [ ] Create `apps/ose-app-be/deny.toml` (_New file_) — verbatim copy of
      `apps/organiclever-be/deny.toml` [Repo-grounded] with the doc comment updated to
      reference `ose-app-be`:

  ```toml
  # cargo-deny configuration for ose-app-be.
  # Run: cargo deny --manifest-path apps/ose-app-be/Cargo.toml check
  ```

  (remainder of file identical to `organiclever-be/deny.toml`)
  — Acceptance: file exists at `apps/ose-app-be/deny.toml`.

- [ ] Create `apps/ose-app-be/.dockerignore` (_New file_) — verbatim copy of
      `apps/organiclever-be/.dockerignore` [Repo-grounded].
      — Acceptance: file exists at `apps/ose-app-be/.dockerignore`.

- [ ] Overwrite `apps/ose-app-be/.env.example` with Rust env vars:

  ```bash
  DATABASE_URL=postgres://ose_app:ose_app@localhost:5432/ose_app
  PORT=8302
  CORS_ORIGINS=*
  OPENROUTER_API_KEY=
  OPENROUTER_MODEL=openrouter/auto
  OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
  ```

  — Acceptance: `cat apps/ose-app-be/.env.example` shows the six vars above.

- [ ] Create `apps/ose-app-be/migrations/.gitkeep` (_New file_) — empty file to
      establish the migrations directory.
      — Acceptance: `test -d apps/ose-app-be/migrations` exits 0.

### Step 1.4 — Commit Phase 1 scaffold deletion

- [ ] Stage deletions and new scaffold files:

  ```bash
  git add apps/ose-app-be/
  ```

  — Acceptance: `git status` shows only `apps/ose-app-be/` changes staged.

- [ ] Commit:

  ```bash
  git commit -m "chore(ose-app-be): delete F# artifacts and scaffold Rust project"
  ```

  — Acceptance: commit exists on `main` with the correct message.

---

## Phase 2: Health Context Implementation

### Step 2.1a — Create core source files (RED)

- [ ] **RED**: Create `apps/ose-app-be/src/lib.rs` (_New file_):

  ```rust
  //! `ose-app-be` library crate — OSE Application backend REST API.
  //!
  //! Exposes the [`app`], [`config`], [`contexts`], and [`errors`] modules.

  #![forbid(unsafe_code)]

  pub mod app;
  pub mod config;
  pub mod contexts;
  pub mod errors;
  ```

  Create `apps/ose-app-be/src/main.rs` (_New file_):

  ```rust
  //! OSE Application backend — Axum entry point.

  #![forbid(unsafe_code)]

  use ose_app_be::{app, config::Config};
  use tracing_subscriber::EnvFilter;

  /// Start the OSE Application backend HTTP server.
  ///
  /// Reads configuration from environment variables and binds to the configured
  /// port. Panics on listener bind failure or server error — both are fatal
  /// startup conditions with no meaningful recovery path.
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
          .expect("failed to bind port");

      tracing::info!("listening on {addr}");
      axum::serve(listener, router).await.expect("server error");
  }
  ```

  Create `apps/ose-app-be/src/errors.rs` (_New file_) — verbatim copy of
  `apps/organiclever-be/src/errors.rs` [Repo-grounded].

  Create stub `apps/ose-app-be/src/app.rs` (_New file_):

  ```rust
  //! Axum router and middleware configuration.

  use axum::Router;
  use tower_http::cors::CorsLayer;

  use crate::contexts::health::api::http as health_http;

  /// Build and return the application router with CORS middleware.
  pub fn router() -> Router {
      Router::new()
          .nest("/api/v1", api_router())
          .layer(CorsLayer::permissive())
  }

  /// Build the versioned API sub-router.
  fn api_router() -> Router {
      health_http::routes()
  }
  ```

  — Acceptance: all four files exist at their paths; `cargo check --manifest-path
apps/ose-app-be/Cargo.toml` exits non-zero because `contexts/mod.rs` and `config.rs`
  are not yet created (expected — these files will be created in the next steps).
  - _Suggested executor: `swe-rust-dev`_

### Step 2.1b — Create contexts/mod.rs entry point (RED continued)

- [ ] **RED**: Create `apps/ose-app-be/src/contexts/mod.rs` (_New file_) — stub declaring
      `health` only at this point:

  ```rust
  //! Bounded contexts for the `ose-app-be` application.

  pub mod health;
  ```

  — Acceptance: file exists at `apps/ose-app-be/src/contexts/mod.rs`; `cargo check`
  still exits non-zero because `config.rs` and health module files are absent.
  - _Suggested executor: `swe-rust-dev`_

### Step 2.1c — Create config.rs and health context skeleton (RED)

- [ ] **RED**: Create `apps/ose-app-be/src/config.rs` (_New file_) — adapted from
      `apps/organiclever-be/src/config.rs` [Repo-grounded]. The struct adds three
      OpenRouter fields mirroring the `.env.example`; `from_env_with()` keeps the same
      three-param signature as `organiclever-be` (OpenRouter vars are read only from env,
      not from the test helper):

  ```rust
  //! Application configuration loaded from environment variables.

  use std::env;

  /// Runtime configuration for the ose-app-be server.
  pub struct Config {
      /// `PostgreSQL` connection URL.
      pub database_url: String,
      /// TCP port to listen on.
      pub port: u16,
      /// Allowed CORS origins (comma-separated or `"*"`).
      pub cors_origins: String,
      /// OpenRouter API key (used by ai-orchestration context).
      pub openrouter_api_key: String,
      /// OpenRouter model identifier (e.g. `"openrouter/auto"`).
      pub openrouter_model: String,
      /// OpenRouter API base URL.
      pub openrouter_base_url: String,
  }

  impl Config {
      /// Load configuration from environment variables with defaults.
      ///
      /// All environment variables have fallback defaults so this function
      /// always succeeds.
      #[must_use]
      pub fn from_env() -> Self {
          let database_url = env::var("DATABASE_URL").unwrap_or_else(|_| {
              "postgres://ose_app:ose_app@localhost:5432/ose_app".to_owned()
          });
          let port = env::var("PORT")
              .ok()
              .and_then(|p| p.parse().ok())
              .unwrap_or(8302_u16);
          let cors_origins =
              env::var("CORS_ORIGINS").unwrap_or_else(|_| "*".to_owned());
          let openrouter_api_key =
              env::var("OPENROUTER_API_KEY").unwrap_or_default();
          let openrouter_model = env::var("OPENROUTER_MODEL")
              .unwrap_or_else(|_| "openrouter/auto".to_owned());
          let openrouter_base_url = env::var("OPENROUTER_BASE_URL")
              .unwrap_or_else(|_| "https://openrouter.ai/api/v1".to_owned());
          Self {
              database_url,
              port,
              cors_origins,
              openrouter_api_key,
              openrouter_model,
              openrouter_base_url,
          }
      }

      /// Build a `Config` from explicit string values, falling back to defaults
      /// when an argument is empty.
      ///
      /// This constructor is intended for unit testing where mutating the process
      /// environment via `std::env::set_var`/`remove_var` (which are `unsafe` in
      /// Rust edition 2024) should be avoided. OpenRouter vars default to env or
      /// built-in defaults — they are not overridable via this helper.
      ///
      /// # Arguments
      ///
      /// * `database_url` — pass `""` to use the default.
      /// * `port` — pass `""` to use the default (`8302`).
      /// * `cors_origins` — pass `""` to use the default (`"*"`).
      #[must_use]
      pub fn from_env_with(database_url: &str, port: &str, cors_origins: &str) -> Self {
          let database_url = if database_url.is_empty() {
              "postgres://ose_app:ose_app@localhost:5432/ose_app".to_owned()
          } else {
              database_url.to_owned()
          };
          let port: u16 = port.parse().unwrap_or(8302_u16);
          let cors_origins = if cors_origins.is_empty() {
              "*".to_owned()
          } else {
              cors_origins.to_owned()
          };
          let openrouter_api_key =
              env::var("OPENROUTER_API_KEY").unwrap_or_default();
          let openrouter_model = env::var("OPENROUTER_MODEL")
              .unwrap_or_else(|_| "openrouter/auto".to_owned());
          let openrouter_base_url = env::var("OPENROUTER_BASE_URL")
              .unwrap_or_else(|_| "https://openrouter.ai/api/v1".to_owned());
          Self {
              database_url,
              port,
              cors_origins,
              openrouter_api_key,
              openrouter_model,
              openrouter_base_url,
          }
      }
  }
  ```

  Create health context skeleton files (7 new files):
  - `apps/ose-app-be/src/contexts/health/mod.rs` (_New file_) — declares `api`,
    `application`, `domain`, `infrastructure`
  - `apps/ose-app-be/src/contexts/health/api/mod.rs` (_New file_) — declares `http`
  - `apps/ose-app-be/src/contexts/health/api/http/mod.rs` (_New file_) — placeholder
    handler returning HTTP 501
  - `apps/ose-app-be/src/contexts/health/api/http/contracts.rs` (_New file_) —
    `HealthResponse { status: String }`
  - `apps/ose-app-be/src/contexts/health/application/mod.rs` (_New file_) — placeholder
    returning `"todo"`
  - `apps/ose-app-be/src/contexts/health/domain/mod.rs` (_New file_) — `HealthStatus`
    struct stub
  - `apps/ose-app-be/src/contexts/health/infrastructure/mod.rs` (_New file_) — empty
    with doc comment

  Create minimal unit test file `apps/ose-app-be/tests/unit/main.rs` (_New file_) with one
  failing assertion:

  ```rust
  mod health_tests {
      use axum::http::StatusCode;
      use ose_app_be::contexts::health::api::http;

      #[tokio::test]
      async fn test_health_returns_healthy() {
          let resp = http::get_health_handler().await;
          assert_eq!(resp.0, StatusCode::OK);
          // Will fail until application returns "healthy"
          let body = resp.1 .0;
          assert_eq!(body.status, "healthy");
      }
  }
  ```

  Verify RED state:

  ```bash
  cargo test --manifest-path apps/ose-app-be/Cargo.toml --test unit -- health_tests
  ```

  — Acceptance: test exists and either fails to compile (placeholder handler returns 501 not 200) or fails at runtime asserting status or body. RED is confirmed when the test binary
  compiles but `test_health_returns_healthy` fails.
  - _Suggested executor: `swe-rust-dev`_

### Step 2.2 — Implement health context (GREEN)

- [ ] **GREEN**: Fill in the health context to make `test_health_returns_healthy` pass.

  Edit `apps/ose-app-be/src/contexts/health/domain/mod.rs`:

  ```rust
  //! Domain types for the health bounded context.

  use serde::Serialize;

  /// Represents the health status of the application.
  #[derive(Debug, Serialize)]
  pub struct HealthStatus {
      /// The current health status string (e.g., `"healthy"`).
      pub status: String,
  }
  ```

  Edit `apps/ose-app-be/src/contexts/health/application/mod.rs`:

  ```rust
  //! Application use cases for the health bounded context.

  use super::domain::HealthStatus;

  /// Returns the current health status of the application.
  ///
  /// This is a pure function — no I/O, no `axum` dependency.
  #[must_use]
  pub fn get_health() -> HealthStatus {
      HealthStatus {
          status: "healthy".to_owned(),
      }
  }
  ```

  Edit `apps/ose-app-be/src/contexts/health/api/http/contracts.rs`:

  ```rust
  // Hand-written from OpenAPI spec (openapi-generator rust output not yet validated)
  use serde::{Deserialize, Serialize};

  /// HTTP response body for the health endpoint, mirroring the `OpenAPI` `HealthResponse` schema.
  #[derive(Debug, Clone, Serialize, Deserialize)]
  pub struct HealthResponse {
      /// Service health status string (e.g. `"healthy"`).
      pub status: String,
  }
  ```

  Edit `apps/ose-app-be/src/contexts/health/api/http/mod.rs`:

  ```rust
  /// Wire-format contract types for the health HTTP API (hand-written from `OpenAPI` spec).
  pub mod contracts;

  use axum::{Json, Router, http::StatusCode, routing::get};
  use contracts::HealthResponse;

  use crate::contexts::health::application;

  /// Axum handler for `GET /health`.
  pub async fn get_health_handler() -> (StatusCode, Json<HealthResponse>) {
      let status = application::get_health();
      (
          StatusCode::OK,
          Json(HealthResponse {
              status: status.status,
          }),
      )
  }

  /// Returns the Axum sub-router for the health context.
  pub fn routes() -> Router {
      Router::new().route("/health", get(get_health_handler))
  }
  ```

  Run unit test to verify GREEN:

  ```bash
  cargo test --manifest-path apps/ose-app-be/Cargo.toml --test unit -- health_tests
  ```

  — Acceptance: `test_health_returns_healthy` passes (GREEN confirmed).
  - _Suggested executor: `swe-rust-dev`_

### Step 2.3 — Expand unit test suite (GREEN continued)

- [ ] **GREEN**: Expand `apps/ose-app-be/tests/unit/main.rs` to include the full
      test suite mirroring `apps/organiclever-be/tests/unit/main.rs` [Repo-grounded]:

  Add modules: `config_tests`, `error_tests`, `router_tests`.

  Key assertions that differ from organiclever-be:
  - `test_default_port`: asserts `cfg.port == 8302`
  - `test_default_database_url`: asserts
    `cfg.database_url == "postgres://ose_app:ose_app@localhost:5432/ose_app"`
  - `test_from_env_with_invalid_port_defaults_to_8302`: asserts fallback is 8302

  Run:

  ```bash
  cargo test --manifest-path apps/ose-app-be/Cargo.toml --test unit
  ```

  — Acceptance: all tests pass (GREEN).
  - _Suggested executor: `swe-rust-dev`_

### Step 2.4 — Refactor and enforce strict lints (REFACTOR)

- [ ] **REFACTOR**: Run clippy with `-D warnings` and fix all diagnostics:

  ```bash
  cargo clippy --manifest-path apps/ose-app-be/Cargo.toml --all-targets -- -D warnings
  ```

  — Acceptance: exits 0, zero warnings or errors.

- [ ] Run `cargo fmt --manifest-path apps/ose-app-be/Cargo.toml`.
      — Acceptance: exits 0; `cargo fmt --check` also exits 0 afterward.

- [ ] Run llvm-cov to check coverage threshold:

  ```bash
  cargo llvm-cov --manifest-path apps/ose-app-be/Cargo.toml \
    --test unit --ignore-filename-regex 'main\.rs' --fail-under-lines 90
  ```

  — Acceptance: exits 0 with ≥90% line coverage reported.

- [ ] Run `cargo deny --manifest-path apps/ose-app-be/Cargo.toml check`.
      — Acceptance: exits 0.
  - _Suggested executor: `swe-rust-dev`_

### Step 2.5 — Commit Phase 2

- [ ] Stage and commit:

  ```bash
  git add apps/ose-app-be/
  git commit -m "feat(ose-app-be): implement health context in Rust"
  ```

  — Acceptance: commit on `main` with correct message; `cargo build --release
--manifest-path apps/ose-app-be/Cargo.toml` exits 0.

---

## Phase 3: Stub Bounded Contexts

### Step 3.1 — Scaffold four stub contexts (RED)

- [ ] **RED**: Add the four stub context module trees under
      `apps/ose-app-be/src/contexts/`. Each stub context needs five `mod.rs` files:
      `mod.rs`, `domain/mod.rs`, `application/mod.rs`, `infrastructure/mod.rs`,
      `api/mod.rs`.

  For each of: `regulatory-source`, `internal-policy`, `gap-analysis`,
  `ai-orchestration`:

  Create `apps/ose-app-be/src/contexts/<context-name>/mod.rs` (_New file_):

  ```rust
  //! <Context name> bounded context — stub (not yet implemented).

  pub mod api;
  pub mod application;
  pub mod domain;
  pub mod infrastructure;
  ```

  For `ai-orchestration/mod.rs`, add a note:

  ```rust
  //! AI Orchestration bounded context — stub.
  //! External dependency: OpenRouter (OPENROUTER_API_KEY, OPENROUTER_MODEL,
  //! OPENROUTER_BASE_URL). No implementation yet.
  ```

  Create `apps/ose-app-be/src/contexts/<context-name>/domain/mod.rs` (_New file_):

  ```rust
  //! Domain layer for the <context-name> bounded context (stub).
  ```

  Same pattern for `application/mod.rs`, `infrastructure/mod.rs`, `api/mod.rs`.

  Update `apps/ose-app-be/src/contexts/mod.rs` to declare all five modules:

  ```rust
  //! Bounded contexts for the `ose-app-be` application.

  pub mod health;
  #[path = "regulatory-source/mod.rs"]
  pub mod regulatory_source;
  #[path = "internal-policy/mod.rs"]
  pub mod internal_policy;
  #[path = "gap-analysis/mod.rs"]
  pub mod gap_analysis;
  #[path = "ai-orchestration/mod.rs"]
  pub mod ai_orchestration;
  ```

  Verify RED (stubs created but not yet wired into `contexts/mod.rs`):

  ```bash
  cargo check --manifest-path apps/ose-app-be/Cargo.toml
  ```

  — Acceptance (RED): `cargo check` exits non-zero because `contexts/mod.rs` does not yet
  declare the four stub modules — missing module declarations are the expected compile error.
  After adding all stub files AND updating `contexts/mod.rs` (the last action in this step),
  re-run `cargo check` — it should exit 0, confirming all stubs compile. The RED state is
  that all stub modules compile but no tests reference them yet; running
  `cargo llvm-cov --test unit --fail-under-lines 90` at this point would report 0% for stub
  files (coverage gate fails — that is the intentional RED).
  - _Suggested executor: `swe-rust-dev`_

### Step 3.2 — Wire all stubs to compile (GREEN)

- [ ] **GREEN**: Ensure all stub `mod.rs` files have correct doc comments and compile
      without warnings. Run:

  ```bash
  cargo clippy --manifest-path apps/ose-app-be/Cargo.toml --all-targets -- -D warnings
  ```

  — Acceptance: exits 0.

- [ ] Run full unit test suite:

  ```bash
  cargo test --manifest-path apps/ose-app-be/Cargo.toml --test unit
  ```

  — Acceptance: all tests pass (GREEN).
  - _Suggested executor: `swe-rust-dev`_

### Step 3.3 — Refactor stubs (REFACTOR)

- [ ] **REFACTOR**: Run `cargo fmt --manifest-path apps/ose-app-be/Cargo.toml`.
      — Acceptance: `cargo fmt --check` exits 0.

- [ ] Re-run llvm-cov to confirm coverage still ≥90%:

  ```bash
  cargo llvm-cov --manifest-path apps/ose-app-be/Cargo.toml \
    --test unit --ignore-filename-regex 'main\.rs' --fail-under-lines 90
  ```

  — Acceptance: exits 0.
  - _Suggested executor: `swe-rust-dev`_

### Step 3.4 — Commit Phase 3

- [ ] Stage and commit:

  ```bash
  git add apps/ose-app-be/
  git commit -m "feat(ose-app-be): add stub bounded contexts"
  ```

  — Acceptance: commit on `main`; `cargo check --manifest-path apps/ose-app-be/Cargo.toml`
  exits 0.

---

## Phase 4: Integration Test Harness

### Step 4.1 — Create Docker files

- [ ] Overwrite `apps/ose-app-be/Dockerfile.integration` — adapted from
      `apps/organiclever-be/Dockerfile.integration` [Repo-grounded]:

  ```dockerfile
  # Stage 1: build the Rust binary
  FROM rust:1.95-slim AS builder
  WORKDIR /build
  COPY apps/ose-app-be/Cargo.toml apps/ose-app-be/Cargo.lock ./
  COPY apps/ose-app-be/src ./src
  COPY apps/ose-app-be/tests ./tests
  RUN cargo build --release --bin ose-app-be

  # Stage 2: minimal runtime image
  FROM debian:bookworm-slim
  RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*
  COPY --from=builder /build/target/release/ose-app-be /usr/local/bin/ose-app-be
  ENV PORT=8302
  EXPOSE 8302
  CMD ["/usr/local/bin/ose-app-be"]
  ```

  — Acceptance: file exists at `apps/ose-app-be/Dockerfile.integration`.

- [ ] Overwrite `apps/ose-app-be/docker-compose.integration.yml` — adapted from
      `apps/organiclever-be/docker-compose.integration.yml` [Repo-grounded]:

  ```yaml
  services:
    postgres:
      image: postgres:17-alpine
      environment:
        POSTGRES_USER: ose_app
        POSTGRES_PASSWORD: ose_app
        POSTGRES_DB: ose_app
      ports:
        - "5432:5432"
      healthcheck:
        test: ["CMD-SHELL", "pg_isready -U ose_app"]
        interval: 5s
        timeout: 5s
        retries: 5

    app:
      build:
        context: ../..
        dockerfile: apps/ose-app-be/Dockerfile.integration
      environment:
        DATABASE_URL: postgres://ose_app:${POSTGRES_PASSWORD:-ose_app}@postgres:5432/ose_app
        PORT: "8302"
        CORS_ORIGINS: "*"
      ports:
        - "8302:8302"
      depends_on:
        postgres:
          condition: service_healthy

    test-runner:
      build:
        context: ../..
        dockerfile: apps/ose-app-be/Dockerfile.integration
        target: builder
      volumes:
        - ../../specs:/specs:ro
      environment:
        DATABASE_URL: postgres://ose_app:${POSTGRES_PASSWORD:-ose_app}@postgres:5432/ose_app
        API_BASE_URL: http://app:8302
      depends_on:
        - app
      command: ["cargo", "test", "--test", "integration"]
  ```

  — Acceptance: file exists at `apps/ose-app-be/docker-compose.integration.yml`.

### Step 4.2 — Write cucumber integration test (RED)

- [ ] **RED**: Create `apps/ose-app-be/tests/integration/main.rs` (_New file_) — adapted
      from `apps/organiclever-be/tests/integration/main.rs` [Repo-grounded]:

  Substitutions:
  - Crate import: `use ose_app_be::app;`
  - Feature file path: `"../../specs/apps/ose-app/behavior/be/gherkin/health/health.feature"`
  - Step `"the ose-app-be service is running"` binds the server
  - Step `"I send GET /api/v1/health"` sends the request
  - Step `"the response status is 200"` asserts status 200
  - Step `r#"the response body has a "status" field equal to "healthy""#` asserts JSON field

  Verify RED by running locally (without Docker — cucumber will try to load the feature file):

  ```bash
  cargo test --manifest-path apps/ose-app-be/Cargo.toml --test integration 2>&1 | head -30
  ```

  — Acceptance: test binary compiles; steps may be unmatched or feature file assertions
  fail — either is valid RED state before the harness is wired.
  - _Suggested executor: `swe-rust-dev`_

### Step 4.3 — Wire step definitions (GREEN)

- [ ] **GREEN**: Implement all four step definitions in
      `apps/ose-app-be/tests/integration/main.rs` following the exact pattern from
      `apps/organiclever-be/tests/integration/main.rs` [Repo-grounded]:
  - `#[given("the ose-app-be service is running")]` — spins up Axum on an ephemeral port
  - `#[when("I send GET /api/v1/health")]` — calls `send_get_health()`
  - `#[then("the response status is 200")]` — asserts status 200
  - `#[then(expr = r#"the response body has a {string} field equal to {string}"#)]` —
    parses JSON and asserts the field value

  Run locally:

  ```bash
  cargo test --manifest-path apps/ose-app-be/Cargo.toml --test integration
  ```

  — Acceptance: all cucumber scenarios pass against a locally-spun Axum server (GREEN).
  The Docker-based full integration run is validated in Phase 5.
  - _Suggested executor: `swe-rust-dev`_

### Step 4.4 — Refactor integration test (REFACTOR)

- [ ] **REFACTOR**: Run clippy over the integration test:

  ```bash
  cargo clippy --manifest-path apps/ose-app-be/Cargo.toml --all-targets -- -D warnings
  ```

  — Acceptance: exits 0.

### Step 4.5 — Commit Phase 4

- [ ] Stage and commit:

  ```bash
  git add apps/ose-app-be/
  git commit -m "test(ose-app-be): add cucumber integration test harness"
  ```

  — Acceptance: commit on `main`.

---

## Phase 5: project.json and Nx Targets

### Step 5.1 — Rewrite project.json (WRITE)

- [ ] **WRITE** (mechanical configuration rewrite — not a TDD RED; the rewrite is correct
      when `typecheck` exits 0): Overwrite `apps/ose-app-be/project.json` (_Existing file_)
      with the Rust target set modelled on `apps/organiclever-be/project.json`
      [Repo-grounded]:

  Key substitutions from organiclever-be:
  - All `--manifest-path apps/organiclever-be/Cargo.toml` → `apps/ose-app-be/Cargo.toml`
  - All `organiclever` references in rhino-cli commands → `ose-app`
  - `test:quick` commands:
    1. `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- ddd bc ose-app`
    2. `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- ddd ul ose-app`
    3. `cargo llvm-cov --manifest-path apps/ose-app-be/Cargo.toml --test unit --ignore-filename-regex 'main\.rs' --fail-under-lines 90`
  - `test:quick` inputs:
    - `"{workspaceRoot}/specs/apps/ose-app/behavior/be/gherkin/**/*.feature"`
    - `"{workspaceRoot}/specs/apps/ose-app/ddd/bounded-contexts.yaml"`
    - `"{workspaceRoot}/specs/apps/ose-app/ddd/ubiquitous-language/**/*.md"`
  - `spec-coverage` command:
    `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- spec-coverage validate --shared-steps --exclude-dir regulatory-source --exclude-dir internal-policy --exclude-dir gap-analysis --exclude-dir ai-orchestration specs/apps/ose-app/behavior/be/gherkin apps/ose-app-be`
  - `spec-coverage` inputs (explicit change from the F# baseline — change `**.fs` to
    `**.rs`):
    - `"{workspaceRoot}/specs/apps/ose-app/behavior/be/gherkin/**/*.feature"`
    - `"{projectRoot}/**/*.rs"` ← replaces the current `"{projectRoot}/**/*.fs"` in
      `apps/ose-app-be/project.json`; verify with
      `grep -n '\.fs' apps/ose-app-be/project.json` that no `.fs` globs remain after
      the rewrite
  - `codegen` input:
    `"{workspaceRoot}/specs/apps/ose-app/containers/contracts/generated/openapi-bundled.yaml"`
  - `codegen` command (same placeholder as organiclever-be):
    `echo 'TODO: update openapi-generator-cli to -g rust once generator is validated' && git diff --exit-code -- apps/ose-app-be/generated-contracts/`
  - `check:msrv` command: `cargo +1.88 check --manifest-path apps/ose-app-be/Cargo.toml`
  - `tags`: `["type:app", "platform:axum", "lang:rust", "domain:ose-app"]`
  - `implicitDependencies`: `["ose-app-contracts"]`

  Verify correctness:

  ```bash
  npx nx run ose-app-be:typecheck
  ```

  — Acceptance: exits 0 (typecheck uses `cargo check` which passes at this point).
  This verifies the new `project.json` target is parseable by Nx. Also verify no `.fs`
  globs remain: `grep -n '\.fs' apps/ose-app-be/project.json` must return no output.

### Step 5.2 — Run all Nx targets (GREEN)

- [ ] **GREEN**: Verify each new Nx target passes:

  ```bash
  npx nx run ose-app-be:install
  npx nx run ose-app-be:typecheck
  npx nx run ose-app-be:lint
  npx nx run ose-app-be:fmt:check
  npx nx run ose-app-be:deny:check
  npx nx run ose-app-be:build
  npx nx run ose-app-be:test:unit
  npx nx run ose-app-be:test:quick
  npx nx run ose-app-be:spec-coverage
  npx nx run ose-app-be:codegen
  ```

  — Acceptance: each command exits 0.

- [ ] Run the Docker integration test to confirm the full harness works:

  ```bash
  npx nx run ose-app-be:test:integration
  ```

  — Acceptance: all containers start, test-runner exits 0, `docker compose down` runs.

### Step 5.3 — Commit Phase 5

- [ ] Stage and commit:

  ```bash
  git add apps/ose-app-be/project.json
  git commit -m "chore(ose-app-be): update project.json and Nx targets for Rust"
  ```

  — Acceptance: commit on `main`.

---

## Phase 6: Documentation and bounded-contexts.yaml

### Step 6.1 — Update bounded-contexts.yaml (RED)

- [ ] **RED**: Edit
      `specs/apps/ose-app/ddd/bounded-contexts.yaml` — this file currently contains exactly
      four contexts: `regulatory-source`, `internal-policy`, `gap-analysis`,
      `ai-orchestration`. The `health` context is NOT listed in this YAML file and is NOT
      added by this plan. Update only the four existing entries:

  First, confirm the four-context state:

  ```bash
  grep -n "code_lang" specs/apps/ose-app/ddd/bounded-contexts.yaml
  ```

  Expected: four `code_lang: [fs]` lines — one per context. If a `health` entry appears,
  stop and raise the discrepancy before proceeding.

  Change every occurrence of `code_lang: [fs]` to `code_lang: [rs]`.

  Change every `code` path from `apps/ose-app-be/src/OseAppBe/contexts/<name>` to
  `apps/ose-app-be/src/contexts/<name>`.

  Verify RED (rhino-cli ddd bc will fail if any path does not exist yet):

  ```bash
  cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- ddd bc ose-app
  ```

  — Acceptance: exits non-zero if source paths are not yet on disk (expected at this point);
  or exits 0 if all paths already exist — either is acceptable.
  - _Suggested executor: `swe-rust-dev`_

### Step 6.2 — Validate DDD commands pass (GREEN)

- [ ] **GREEN**: Run both DDD validation commands:

  ```bash
  cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- ddd bc ose-app
  cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- ddd ul ose-app
  ```

  — Acceptance: both exit 0. If `ddd bc` fails because a context `code` path does not
  exist, create the missing directory (e.g., `mkdir -p
apps/ose-app-be/src/contexts/health`) so the path resolves.

### Step 6.3 — Rewrite README.md

- [ ] Overwrite `apps/ose-app-be/README.md` — replace F# content with Rust content
      modelled on `apps/organiclever-be/README.md` [Repo-grounded]:

  Required sections:
  - H1: `ose-app-be`
  - Brief description: Rust/Axum REST API backend for the OSE Application platform
  - Quick Start (cargo + nx commands)
  - Commands table (all Nx targets)
  - Prerequisites (Rust 1.95, Docker, Volta + Node.js)
  - Environment Variables table (DATABASE_URL, PORT, CORS_ORIGINS,
    OPENROUTER_API_KEY, OPENROUTER_MODEL, OPENROUTER_BASE_URL)
  - Tech Stack section (Rust, Axum, sqlx, tokio, cucumber-rs, llvm-cov, cargo-deny)
  - Related section (Specs, Contracts, E2E tests)

  — Acceptance: `npm run lint:md` exits 0 for `apps/ose-app-be/README.md`.
  - _Suggested executor: `readme-maker`_

### Step 6.4 — Commit Phase 6

- [ ] Stage and commit:

  ```bash
  git add specs/apps/ose-app/ddd/bounded-contexts.yaml apps/ose-app-be/README.md
  git commit -m "docs(ose-app-be): update README and bounded-contexts.yaml for Rust"
  ```

  — Acceptance: commit on `main`.

---

## Phase 7: Final Quality Gate and Push

### Local Quality Gates (Before Push)

- [ ] Run affected typecheck:

  ```bash
  npx nx affected -t typecheck
  ```

  — Acceptance: exits 0.

- [ ] Run affected linting:

  ```bash
  npx nx affected -t lint
  ```

  — Acceptance: exits 0.

- [ ] Run affected quick tests:

  ```bash
  npx nx affected -t test:quick
  ```

  — Acceptance: exits 0; `ose-app-be` passes DDD validation + ≥90% coverage.

- [ ] Run affected spec-coverage:

  ```bash
  npx nx affected -t spec-coverage
  ```

  — Acceptance: exits 0.

- [ ] Run markdown lint:

  ```bash
  npm run lint:md
  ```

  — Acceptance: exits 0.

- [ ] Fix ALL failures found — including any preexisting issues not caused by this plan's
      changes. Commit preexisting fixes separately with appropriate conventional commit
      messages.

> **Important**: Fix ALL failures found during quality gates, not just those caused by
> your changes. This follows the root cause orientation principle — proactively fix
> preexisting errors encountered during work. Do not defer or skip existing issues.

### Manual API Verification (curl)

- [ ] Start the Rust dev server:

  ```bash
  npx nx dev ose-app-be
  ```

  — Acceptance: server starts and logs `listening on 0.0.0.0:8302`.

- [ ] In a separate terminal, verify the health endpoint:

  ```bash
  curl -s http://localhost:8302/api/v1/health | jq .
  ```

  — Acceptance: output is `{"status": "healthy"}` and exit code is 0.

- [ ] Verify status code:

  ```bash
  curl -s -o /dev/null -w "%{http_code}" http://localhost:8302/api/v1/health
  ```

  — Acceptance: prints `200`.

- [ ] Verify Content-Type header:

  ```bash
  curl -sI http://localhost:8302/api/v1/health | grep -i content-type
  ```

  — Acceptance: line contains `application/json`.

- [ ] Stop the dev server (Ctrl-C).

### Commit Guidelines

- [ ] Commit changes thematically — group related changes into logically cohesive commits.
- [ ] Follow Conventional Commits format: `<type>(<scope>): <description>`.
- [ ] Split different domains/concerns into separate commits.
- [ ] Preexisting fixes get their own commits, separate from plan work.
- [ ] Do NOT bundle unrelated changes into a single commit.

### Post-Push CI Verification

- [ ] Push changes to `main`:

  ```bash
  git push origin main
  ```

  — Acceptance: exits 0.

- [ ] Monitor ALL GitHub Actions workflows triggered by the push (poll every 3 minutes
      using `gh run list --branch main --limit 5` and
      `gh run view <run-id> --json status,conclusion`).
      — Acceptance: all workflows show `conclusion: success`.

- [ ] If any CI check fails, fix immediately and push a follow-up commit.
- [ ] Repeat until ALL GitHub Actions pass with zero failures.
- [ ] Do NOT proceed to plan archival until CI is fully green.

### Plan Archival

- [ ] Verify ALL delivery checklist items above are ticked.
- [ ] Verify ALL quality gates pass (local + CI).
- [ ] Verify ALL manual assertions pass (curl verification above).
- [ ] Rename and move the plan folder:

  ```bash
  git mv plans/in-progress/ose-app-be-rust-migration \
         plans/done/2026-05-27__ose-app-be-rust-migration
  ```

  Use today's date as the completion date (NOT the creation date).

- [ ] Update `plans/in-progress/README.md` — remove the `ose-app-be-rust-migration` entry.
- [ ] Update `plans/done/README.md` — add the entry with completion date.
- [ ] Update any other READMEs that reference this plan (e.g., `plans/README.md`).
- [ ] Commit the archival:

  ```bash
  git commit -m "chore(plans): move ose-app-be-rust-migration to done"
  ```

  — Acceptance: commit on `main`; plan folder exists only under `plans/done/`.
