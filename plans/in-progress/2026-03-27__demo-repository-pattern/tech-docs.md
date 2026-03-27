# Technical Documentation: Repository Pattern Implementation

## Design Principles

1. **Idiomatic abstractions** — use each language's native abstraction mechanism (traits, Protocols,
   defprotocol, function records), not a forced OOP pattern
2. **Minimal diff** — extract interfaces from existing code; do not restructure the entire app
3. **Same function signatures** — repository interfaces mirror the existing function signatures so
   handlers require minimal changes (just type annotations / injection)
4. **Two implementations per interface** — one real (DB-backed) and one in-memory (for unit tests)

## Per-App Implementation

### 1. demo-be-fsharp-giraffe

**Abstraction mechanism**: F# function records — a record type whose fields are functions. This is
the idiomatic functional F# approach: no OOP interfaces, no classes, no DI container wiring.
Function records are first-class values that can be passed, composed, and partially overridden
with `{ repo with FindById = fun _ -> ... }`.

**New files to create**:

- `src/DemoBeFsgi/Infrastructure/Repositories/RepositoryTypes.fs` — function-record type
  definitions (`UserRepository`, `ExpenseRepository`, `AttachmentRepository`, `TokenRepository`,
  `RefreshTokenRepository`) where each field is a function (e.g.,
  `FindById: Guid -> Guid -> Task<ExpenseEntity option>`)
- `src/DemoBeFsgi/Infrastructure/Repositories/EfRepositories.fs` — constructor functions that
  return function records wired to `AppDbContext` (e.g., `EfRepositories.createUserRepo: AppDbContext -> UserRepository`)
- `tests/DemoBeFsgi.Tests/InMemory/InMemoryRepositories.fs` — constructor functions that return
  function records backed by `ConcurrentDictionary` (e.g., `InMemoryRepositories.createUserRepo: unit -> UserRepository`)

**Files to modify**:

- All 8 handler files (Admin, Attachment, Auth, Expense, Report, Test, Token, User) — replace
  `ctx.GetService<AppDbContext>()` with function-record repositories resolved from DI
  (e.g., `ctx.GetService<UserRepository>()`)
- `Program.fs` — register function records in DI container via factory lambdas
  (e.g., `services.AddSingleton<UserRepository>(fun sp -> EfRepositories.createUserRepo(sp.GetService<AppDbContext>()))`)
- `tests/DemoBeFsgi.Tests/DirectServices.fs` — replace `db: AppDbContext` parameter with
  individual function-record repositories (this is the actual business logic layer for unit tests)
- `tests/DemoBeFsgi.Tests/Unit/UnitFeatureRunner.fs` — update `UnitScenarioServiceProvider` to
  inject in-memory function records instead of constructing an `AppDbContext` via `createDb()`
- `tests/DemoBeFsgi.Tests/State.fs` — replace `Db: AppDbContext` field with function-record
  repository fields (e.g., `UserRepo: UserRepository`, `ExpenseRepo: ExpenseRepository`);
  update `empty` constructor accordingly (propagates to all Integration step files)
- `tests/DemoBeFsgi.Tests/Integration/Steps/*.fs` (all 13 step definition files: AuthSteps.fs,
  CommonSteps.fs, TokenLifecycleSteps.fs, TokenManagementSteps.fs, UserAccountSteps.fs,
  SecuritySteps.fs, AdminSteps.fs, ExpenseSteps.fs, CurrencySteps.fs, UnitHandlingSteps.fs,
  ReportingSteps.fs, AttachmentSteps.fs, HealthSteps.fs) — replace all `state.Db` call sites
  with the appropriate function-record repository from the updated `StepState`
- `DemoBeFsgi.fsproj` — add `RepositoryTypes.fs` and `EfRepositories.fs` in correct compilation
  order (types before constructors before handlers)
- `tests/DemoBeFsgi.Tests/DemoBeFsgi.Tests.fsproj` — add `InMemoryRepositories.fs` in correct
  compilation order

**Key pattern**:

```fsharp
// Function-record type definition (RepositoryTypes.fs)
type ExpenseRepository = {
    Create: ExpenseEntity -> Task<ExpenseEntity>
    FindById: Guid -> Guid -> Task<ExpenseEntity option>
    ListForUser: Guid -> Task<ExpenseEntity list>
    Update: ExpenseEntity -> Task<ExpenseEntity>
    Delete: Guid -> Guid -> Task<bool>
}

// EF Core constructor (EfRepositories.fs)
module EfRepositories =
    let createExpenseRepo (db: AppDbContext) : ExpenseRepository = {
        Create = fun expense -> task { ... db.Expenses.AddAsync ... }
        FindById = fun id userId -> task { ... db.Expenses.FirstOrDefaultAsync ... }
        ListForUser = fun userId -> task { ... db.Expenses.Where(...).ToListAsync ... }
        Update = fun expense -> task { ... db.SaveChangesAsync ... }
        Delete = fun id userId -> task { ... db.Expenses.Remove ... }
    }

// In-memory constructor (InMemoryRepositories.fs)
module InMemoryRepositories =
    let createExpenseRepo () : ExpenseRepository =
        let store = ConcurrentDictionary<Guid, ExpenseEntity>()
        {
            Create = fun expense -> task { store.[expense.Id] <- expense; return expense }
            FindById = fun id _ -> task {
                return match store.TryGetValue(id) with true, v -> Some v | _ -> None }
            ListForUser = fun userId -> task {
                return store.Values |> Seq.filter (fun e -> e.UserId = userId) |> Seq.toList }
            Update = fun expense -> task { store.[expense.Id] <- expense; return expense }
            Delete = fun id _ -> task { return store.TryRemove(id) |> fst }
        }

// Handler receives function record (no interface, no class)
let createExpense (repo: ExpenseRepository) : HttpHandler =
    fun _next ctx -> task {
        let userId = ctx.Items["UserId"] :?> Guid
        let! body = ctx.BindJsonAsync<CreateExpenseRequest>()
        let! result = repo.Create { ... }
        return! json result _next ctx
    }

// Partial override in tests (no mocking framework needed)
let repo = { InMemoryRepositories.createExpenseRepo() with
                Delete = fun _ _ -> task { return false } }
```

**Why function records over OOP interfaces**:

- **Idiomatic F#** — functions are first-class; no need for `type IFoo = abstract ...` + class
- **Trivial partial mocking** — `{ repo with Field = ... }` replaces one function without a mock
  framework
- **No DI complexity** — records are values, not types needing container registration by interface
- **Composable** — records compose, nest, and transform like any other data
- **Already consistent** — the domain layer (`Domain/Types.fs`, `Domain/User.fs`) is already
  functional; function records keep the repository layer in the same style

**Risks**:

- F# file ordering in `.fsproj` is sensitive — `RepositoryTypes.fs` must compile before
  `EfRepositories.fs`, which must compile before handlers
- Must preserve `task {}` computation expression usage in EF Core implementations
- ASP.NET DI registers function records as singletons via factory lambdas — the `AppDbContext`
  lifetime (scoped) must be resolved per-request inside the factory, not captured at registration

### 2. demo-be-rust-axum

**Abstraction mechanism**: Rust `async_trait` traits

**New files to create**:

- `src/repositories/mod.rs` — trait definitions for all 5 entities
- `src/repositories/sqlx_user_repo.rs` — sqlx implementation
- `src/repositories/sqlx_expense_repo.rs` — sqlx implementation
- `src/repositories/sqlx_attachment_repo.rs` — sqlx implementation
- `src/repositories/sqlx_token_repo.rs` — sqlx implementation
- `src/repositories/sqlx_refresh_token_repo.rs` — sqlx implementation
- `tests/unit/in_memory_repos.rs` — in-memory HashMap-based implementations

**Files to modify**:

- `src/main.rs` — add `mod repositories;` and update `AppState` to hold `Arc<dyn Trait>`
- `src/state.rs` (or wherever `AppState` is defined) — change fields from `AnyPool` to trait objects
- All handler files that access the DB (admin, attachment, auth, expense, report, test_api, user)
  — accept trait references instead of calling free functions with `&pool`. Handler files that
  don't access the DB directly (health, mod, token) need no changes. (`token.rs` has no direct
  pool/AnyPool access — verified by inspection.)
- `tests/unit/world.rs` — inject in-memory repos instead of `create_test_pool()`
- `tests/integration/world.rs` — inject sqlx repos with real Postgres pool
- Existing `src/db/*_repo.rs` files can be kept as the backing implementation or merged into the
  new `src/repositories/sqlx_*.rs` files

**Key pattern**:

```rust
#[async_trait]
pub trait ExpenseRepository: Send + Sync {
    async fn create(&self, expense: CreateExpense) -> Result<Expense, AppError>;
    async fn find_by_id(&self, id: Uuid, user_id: Uuid) -> Result<Option<Expense>, AppError>;
    async fn list_for_user(&self, user_id: Uuid) -> Result<Vec<Expense>, AppError>;
    // ... remaining operations
}

// sqlx implementation
pub struct SqlxExpenseRepository { pool: AnyPool }

#[async_trait]
impl ExpenseRepository for SqlxExpenseRepository { ... }

// AppState holds trait objects
pub struct AppState {
    pub expense_repo: Arc<dyn ExpenseRepository>,
    pub user_repo: Arc<dyn UserRepository>,
    // ...
}
```

**Risks**:

- The `async_trait` crate is required because Rust stable does not yet support dyn-compatible async
  traits (needed for `Arc<dyn Trait>`), regardless of edition. Edition 2021 is used — this is
  unrelated to the `async_trait` requirement.
- `AnyPool` raw SQL may have SQLite vs Postgres dialect differences that surface when the
  abstraction changes — preserve existing query logic as-is

### 3. demo-be-python-fastapi

**Abstraction mechanism**: Python `Protocol` (from `typing`)

**New files to create**:

- `src/demo_be_python_fastapi/infrastructure/protocols.py` — Protocol definitions for all 5
  entities
- `src/demo_be_python_fastapi/infrastructure/refresh_token_repository.py` — concrete
  `RefreshTokenRepository` class (extract from routers)
- `tests/unit/in_memory_repos.py` — in-memory dict-based implementations of all Protocols

> **Note**: The codebase already contains `src/demo_be_python_fastapi/infrastructure/in_memory/`
> (an empty package directory with only `__init__.py`). In-memory mock implementations are
> test-only concerns and belong in the test tree, not in production infrastructure. The existing
> empty `infrastructure/in_memory/` package is a prior scaffolding stub and is not extended here.

**Files to modify**:

- `src/demo_be_python_fastapi/infrastructure/repositories.py` — add Protocol conformance (type
  annotations, ensure method signatures match the Protocols)
- `src/demo_be_python_fastapi/dependencies.py` — type-hint return values as Protocol types, add
  `get_refresh_token_repo` provider (note: `auth/dependencies.py` is a separate file and is NOT
  the target here)
- `src/demo_be_python_fastapi/routers/auth.py` and `src/demo_be_python_fastapi/routers/tokens.py`
  — replace inline RefreshToken DB calls with `RefreshTokenRepository`
- `tests/unit/conftest.py` — inject in-memory repos instead of creating SQLite engine/session

**Key pattern**:

```python
from typing import Protocol

class ExpenseRepositoryProtocol(Protocol):
    def create(self, expense: ...) -> ...: ...
    def find_by_id(self, expense_id: UUID, user_id: UUID) -> ...: ...
    def list_by_user(self, user_id: UUID) -> ...: ...
    # ... remaining operations

# Existing class already conforms — just add type annotation
class ExpenseRepository:  # implicitly satisfies ExpenseRepositoryProtocol
    def __init__(self, session: Session): ...
    def create(self, expense: ...) -> ...: ...
    # ...
```

**Risks**:

- Extracting `RefreshTokenRepository` from router files requires careful inspection of inline
  Session usage
- `Depends()` wiring must remain compatible — Protocol is structural typing, so existing classes
  conform without inheritance

### 4. demo-be-clojure-pedestal

**Abstraction mechanism**: Clojure `defprotocol` + `defrecord`

**New files to create**:

- `src/demo_be_cjpd/db/protocols.clj` — protocol definitions for all 4 entities
- `src/demo_be_cjpd/db/jdbc_user_repo.clj` — `defrecord JdbcUserRepo` implementing protocol
- `src/demo_be_cjpd/db/jdbc_expense_repo.clj` — `defrecord JdbcExpenseRepo`
- `src/demo_be_cjpd/db/jdbc_attachment_repo.clj` — `defrecord JdbcAttachmentRepo`
- `src/demo_be_cjpd/db/jdbc_token_repo.clj` — `defrecord JdbcTokenRepo`
- `test/demo_be_cjpd/in_memory_repos.clj` — `defrecord` with atom-backed implementations

**Files to modify**:

- All handler namespaces that access the DB (admin, attachment, auth, expense, report, test_api,
  token, user) + `interceptors/auth.clj` — accept protocol instances from context map instead of
  calling namespace functions with datasource. Handler namespaces that don't access the DB (health,
  jwks) need no changes.
- `server.clj` — create records and inject into Pedestal context map
- `test/step_definitions/steps.clj` — inject in-memory records instead of real datasource
- `test/demo_be_cjpd/db/*_repo_test.clj` — can remain as-is (they test the jdbc implementation
  directly, which is valid for repo-level tests)

**Key pattern**:

```clojure
;; protocols.clj
(defprotocol ExpenseRepo
  (create-expense! [this expense])
  (find-by-id [this expense-id user-id])
  (list-by-user [this user-id])
  ;; ... remaining operations
  )

;; jdbc_expense_repo.clj
(defrecord JdbcExpenseRepo [ds]
  ExpenseRepo
  (create-expense! [_ expense]
    ;; existing code from expense_repo.clj, using ds
    ))

;; in_memory_repos.clj (test)
(defrecord InMemoryExpenseRepo [store]
  ExpenseRepo
  (create-expense! [_ expense]
    (let [id (random-uuid)
          record (assoc expense :id id)]
      (swap! store assoc id record)
      record)))
```

**Risks**:

- Handlers currently use `(expense-repo/create-expense! ds ...)` (namespace-qualified calls with
  ds as first arg). Switching to protocol means `(.create-expense! expense-repo ...)` or
  `(create-expense! expense-repo ...)` — different calling convention
- Existing repo namespace functions take `ds` as first arg; protocol methods take `this`
  implicitly — the body logic stays the same but the signature wrapper changes
