# Delivery Plan: Repository Pattern for Demo Backend Apps

## Overview

**Delivery Type**: Direct commits to `main` (one commit per app)

**Git Workflow**: Trunk Based Development — each phase is one commit

**Phase Independence**: All 4 phases are independent and can be delivered in any order.

**Agent Assignment**: Each phase should be executed by the corresponding language developer agent.

## Implementation Phases

### Phase 1: demo-be-python-fastapi (Python — smallest diff)

**Agent**: `swe-python-developer`

**Goal**: Add `Protocol` abstractions, extract `RefreshTokenRepository`, and wire in-memory mocks
for unit tests.

- [ ] Create `src/demo_be_python_fastapi/infrastructure/protocols.py` with Protocol classes:
      `UserRepositoryProtocol`, `ExpenseRepositoryProtocol`, `AttachmentRepositoryProtocol`,
      `RevokedTokenRepositoryProtocol`, `RefreshTokenRepositoryProtocol`
- [ ] Create `src/demo_be_python_fastapi/infrastructure/refresh_token_repository.py` — extract
      RefreshToken DB logic from `routers/auth.py` and `routers/tokens.py`
- [ ] Update `src/demo_be_python_fastapi/infrastructure/repositories.py` — ensure method signatures
      conform to Protocols
- [ ] Update `src/demo_be_python_fastapi/dependencies.py` — type-hint return values as Protocol
      types, add `get_refresh_token_repo` provider (target is `dependencies.py` in the package
      root, not `auth/dependencies.py`)
- [ ] Update `routers/auth.py` and `routers/tokens.py` — replace inline RefreshToken Session
      calls with `RefreshTokenRepository`
- [ ] Create `tests/unit/in_memory_repos.py` — dict-based in-memory implementations of all 5
      Protocols
- [ ] Update `tests/unit/conftest.py` — inject in-memory repos instead of SQLite engine/session
- [ ] Verify `nx run demo-be-python-fastapi:typecheck` passes
- [ ] Verify `nx run demo-be-python-fastapi:lint` passes
- [ ] Verify `nx run demo-be-python-fastapi:test:quick` passes (unit tests + coverage >= 90%)
- [ ] Verify `nx run demo-be-python-fastapi:test:integration` passes (real Postgres)
- [ ] Commit: `refactor(demo-be-python-fastapi): add Protocol abstractions for repository pattern`

### Phase 2: demo-be-clojure-pedestal (Clojure — moderate diff)

**Agent**: `swe-clojure-developer`

**Goal**: Add `defprotocol` definitions, wrap existing repo functions in `defrecord`, and wire
in-memory records for unit tests.

- [ ] Create `src/demo_be_cjpd/db/protocols.clj` with protocols: `UserRepo`, `ExpenseRepo`,
      `AttachmentRepo`, `TokenRepo`
- [ ] Create `src/demo_be_cjpd/db/jdbc_user_repo.clj` — `defrecord JdbcUserRepo [ds]`
      implementing `UserRepo` (wrap existing `user_repo.clj` functions)
- [ ] Create `src/demo_be_cjpd/db/jdbc_expense_repo.clj` — `defrecord JdbcExpenseRepo [ds]`
      implementing `ExpenseRepo`
- [ ] Create `src/demo_be_cjpd/db/jdbc_attachment_repo.clj` — `defrecord JdbcAttachmentRepo [ds]`
      implementing `AttachmentRepo`
- [ ] Create `src/demo_be_cjpd/db/jdbc_token_repo.clj` — `defrecord JdbcTokenRepo [ds]`
      implementing `TokenRepo`
- [ ] Update handler namespaces that access the DB (`admin`, `attachment`, `auth`, `expense`,
      `report`, `test_api`, `token`, `user`) and `interceptors/auth.clj` — accept protocol
      instances from context map (skip `health.clj` and `jwks.clj` which don't access the DB)
- [ ] Update server/system setup — create `Jdbc*Repo` records and inject into Pedestal context
- [ ] Create `test/demo_be_cjpd/in_memory_repos.clj` — atom-backed `defrecord` implementations
- [ ] Update `test/step_definitions/steps.clj` — inject in-memory records for unit tests
- [ ] Verify `nx run demo-be-clojure-pedestal:typecheck` passes
- [ ] Verify `nx run demo-be-clojure-pedestal:lint` passes
- [ ] Verify `nx run demo-be-clojure-pedestal:test:quick` passes (unit tests + coverage >= 90%)
- [ ] Verify `nx run demo-be-clojure-pedestal:test:integration` passes (real Postgres)
- [ ] Commit: `refactor(demo-be-clojure-pedestal): add defprotocol abstractions for repository pattern`

### Phase 3: demo-be-rust-axum (Rust — larger diff)

**Agent**: `swe-rust-developer`

**Goal**: Add async traits, create struct implementations, update `AppState` to hold trait objects,
and wire in-memory implementations for unit tests.

- [ ] Add `async-trait = "0.1"` to `Cargo.toml` dependencies (`async_trait` is required because
      Rust stable does not yet support dyn-compatible async traits for `Arc<dyn Trait>`, regardless
      of edition)
- [ ] Create `src/repositories/mod.rs` with trait definitions: `UserRepository`,
      `ExpenseRepository`, `AttachmentRepository`, `TokenRepository`, `RefreshTokenRepository`
- [ ] Create `src/repositories/sqlx_user_repo.rs` — `struct SqlxUserRepo { pool: AnyPool }` +
      trait impl (move logic from `db/user_repo.rs`)
- [ ] Create `src/repositories/sqlx_expense_repo.rs` — same pattern
- [ ] Create `src/repositories/sqlx_attachment_repo.rs` — same pattern
- [ ] Create `src/repositories/sqlx_token_repo.rs` — same pattern
- [ ] Create `src/repositories/sqlx_refresh_token_repo.rs` — same pattern
- [ ] Update `AppState` — replace `AnyPool` with `Arc<dyn Trait>` for each repository
- [ ] Update handler files that access the DB (admin, attachment, auth, expense, report, test_api,
      user) — extract repos from `AppState` instead of calling free functions with `&pool`
      (skip health.rs, mod.rs, and token.rs which have no direct pool/AnyPool access)
- [ ] Create `tests/unit/in_memory_repos.rs` — HashMap-based implementations of all 5 traits
- [ ] Update `tests/unit/world.rs` — inject in-memory repos instead of `create_test_pool()`
- [ ] Update `tests/integration/world.rs` — inject sqlx repos with real Postgres pool
- [ ] Verify `nx run demo-be-rust-axum:typecheck` passes
- [ ] Verify `nx run demo-be-rust-axum:lint` passes
- [ ] Verify `nx run demo-be-rust-axum:test:quick` passes (unit tests + coverage >= 90%)
- [ ] Verify `nx run demo-be-rust-axum:test:integration` passes (real Postgres)
- [ ] Commit: `refactor(demo-be-rust-axum): add trait abstractions for repository pattern`

### Phase 4: demo-be-fsharp-giraffe (F# — largest diff)

**Agent**: `swe-fsharp-developer`

**Goal**: Add F# interfaces, create EF Core implementations, extract DB access from handlers, and
wire in-memory implementations for unit tests.

- [ ] Create `src/DemoBeFsgi/Infrastructure/Repositories/IUserRepository.fs` — interface
- [ ] Create `src/DemoBeFsgi/Infrastructure/Repositories/IExpenseRepository.fs` — interface
- [ ] Create `src/DemoBeFsgi/Infrastructure/Repositories/IAttachmentRepository.fs` — interface
- [ ] Create `src/DemoBeFsgi/Infrastructure/Repositories/ITokenRepository.fs` — interface
- [ ] Create `src/DemoBeFsgi/Infrastructure/Repositories/IRefreshTokenRepository.fs` — interface
- [ ] Create `src/DemoBeFsgi/Infrastructure/Repositories/EfUserRepository.fs` — EF Core impl
- [ ] Create `src/DemoBeFsgi/Infrastructure/Repositories/EfExpenseRepository.fs` — EF Core impl
- [ ] Create `src/DemoBeFsgi/Infrastructure/Repositories/EfAttachmentRepository.fs` — EF Core impl
- [ ] Create `src/DemoBeFsgi/Infrastructure/Repositories/EfTokenRepository.fs` — EF Core impl
- [ ] Create `src/DemoBeFsgi/Infrastructure/Repositories/EfRefreshTokenRepository.fs` — EF Core
      impl
- [ ] Update `DemoBeFsgi.fsproj` — add new files in correct compilation order (interfaces before
      implementations before handlers)
- [ ] Update all 8 handler files (Admin, Attachment, Auth, Expense, Report, Test, Token, User) —
      replace `ctx.GetService<AppDbContext>()` with injected repository interfaces
- [ ] Update `Program.fs` — register `I*Repository` → `Ef*Repository` in ASP.NET DI container
- [ ] Create `tests/DemoBeFsgi.Tests/InMemory/InMemoryUserRepository.fs` — test mock
- [ ] Create `tests/DemoBeFsgi.Tests/InMemory/InMemoryExpenseRepository.fs` — test mock
- [ ] Create `tests/DemoBeFsgi.Tests/InMemory/InMemoryAttachmentRepository.fs` — test mock
- [ ] Create `tests/DemoBeFsgi.Tests/InMemory/InMemoryTokenRepository.fs` — test mock
- [ ] Create `tests/DemoBeFsgi.Tests/InMemory/InMemoryRefreshTokenRepository.fs` — test mock
- [ ] Update `DemoBeFsgi.Tests.fsproj` — add new test files in correct compilation order
- [ ] Update `DirectServices.fs` and `Unit/UnitFeatureRunner.fs` — replace `AppDbContext` with
      injected repository interfaces: refactor `DirectServices.fs` to accept repository interfaces
      as parameters instead of calling `AppDbContext` inline; update `UnitScenarioServiceProvider`
      in `UnitFeatureRunner.fs` to inject in-memory repository implementations instead of
      constructing an `AppDbContext` via `createDb()`
- [ ] Update `tests/DemoBeFsgi.Tests/State.fs` — replace `Db: AppDbContext` field with repository
      interface fields; update `empty` constructor to accept in-memory repository instances
- [ ] Update all 13 `tests/DemoBeFsgi.Tests/Integration/Steps/*.fs` files (AuthSteps.fs,
      CommonSteps.fs, TokenLifecycleSteps.fs, TokenManagementSteps.fs, UserAccountSteps.fs,
      SecuritySteps.fs, AdminSteps.fs, ExpenseSteps.fs, CurrencySteps.fs, UnitHandlingSteps.fs,
      ReportingSteps.fs, AttachmentSteps.fs, HealthSteps.fs) — replace all `state.Db` call sites
      with the appropriate repository instances from the updated `StepState`
- [ ] Verify `nx run demo-be-fsharp-giraffe:typecheck` passes
- [ ] Verify `nx run demo-be-fsharp-giraffe:lint` passes
- [ ] Verify `nx run demo-be-fsharp-giraffe:test:quick` passes (unit tests + coverage >= 90%)
- [ ] Verify `nx run demo-be-fsharp-giraffe:test:integration` passes (real Postgres)
- [ ] Commit: `refactor(demo-be-fsharp-giraffe): add interface abstractions for repository pattern`

## Final Validation

- [ ] Run `nx run-many -t typecheck --projects=demo-be-python-fastapi,demo-be-clojure-pedestal,demo-be-rust-axum,demo-be-fsharp-giraffe` — all pass
- [ ] Run `nx run-many -t lint --projects=demo-be-python-fastapi,demo-be-clojure-pedestal,demo-be-rust-axum,demo-be-fsharp-giraffe` — all pass
- [ ] Run `nx run-many -t test:quick --projects=demo-be-python-fastapi,demo-be-clojure-pedestal,demo-be-rust-axum,demo-be-fsharp-giraffe` — all pass
- [ ] Verify all 4 apps have abstract repository interfaces for every entity
- [ ] Verify no handler/router/controller in the 4 apps imports DB libraries directly
- [ ] Verify unit tests in all 4 apps use in-memory mock repos (no DB connection)
- [ ] Verify integration tests in all 4 apps use real DB repos (PostgreSQL)
- [ ] Verify coverage thresholds: all 4 apps >= 90%
