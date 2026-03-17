# Delivery Plan

## Critical Context

Most backends build responses as **untyped maps** (`gin.H{}`, `JsonObject`, `mapOf()`, inline
objects). Wiring generated types requires replacing these with typed generated structs for BOTH
request parsing AND response construction.

## Implementation Phases

### Phase 0: Evaluate Missing Spec Types

**Goal**: Determine if types that exist locally but not in the OpenAPI spec need to be added before
adoption can proceed.

- [x] **Audit types not in spec**
  - [x] `RegisterResponse` (used by Java-SB, Rust) — **Decision: NO spec change**. Spec already
        returns `User` on 201. Backends returning partial fields should be fixed to return full
        `User`. Local `RegisterResponse` types replaced with generated `User`.
  - [x] `AttachmentListResponse` (used by Java-SB, Python) — **Decision: NO spec change**. Spec
        returns bare array. Backends wrapping in `{attachments:[]}` should match spec. Local
        `AttachmentListResponse` types removed; use generated `Attachment[]`.
  - [x] `LogoutRequest` (used by Kotlin) — **Decision: NO spec change**. Spec is correct: logout
        uses Authorization header, not request body. Kotlin's local `LogoutRequest` is vestigial
        and stays local (test-only).
  - [x] `PromoteAdminRequest` (used by Kotlin, Python) — **Decision: keep local**. This is a
        test-only endpoint (`x-test-only: true`). Test-only types don't need contract enforcement.
- [x] **Decision**: Spec is the source of truth. No spec changes needed. Backends that disagree
      with the spec are fixed to match during their respective phases.
- [x] **No spec changes needed** — skip lint/bundle

**Validation**: All missing type decisions are documented. Spec changes (if any) pass lint.

---

### Phase 1: Verify Codegen for Elixir, Clojure, and Dart

**Goal**: Confirm that `codegen` Nx targets actually produce usable output for the three apps where
generation was planned but never confirmed.

- [x] **demo-be-elixir-phoenix codegen verification**
  - [x] Run `nx run demo-be-elixir-phoenix:codegen` — exits 0
  - [x] 23 `.ex` files in `generated-contracts/generated_schemas/`
  - [x] Each struct has `defstruct`, `@enforce_keys`, and `@type` typespecs
  - [x] Module namespace confirmed: `GeneratedSchemas.User` etc.
  - [x] `elixir-openapi-codegen:test:quick` passes (92.2% coverage)
- [x] **demo-be-clojure-pedestal codegen verification**
  - [x] Run `nx run demo-be-clojure-pedestal:codegen` — exits 0 (required `mkdir -p classes/`)
  - [x] 23 `.clj` files in `generated_contracts/`
  - [x] Each schema is a valid Malli `[:map ...]` definition
  - [x] Namespace confirmed: `openapi-codegen.schemas.user` etc.
  - [x] `clojure-openapi-codegen:test:quick` passes
- [x] **demo-fe-dart-flutterweb codegen verification**
  - [x] `codegen` target exists in project.json
  - [x] Run `nx run demo-fe-dart-flutterweb:codegen` — exits 0
  - [x] 23 Dart model files in `generated-contracts/lib/model/`
  - [x] Generated classes have `fromJson`/`toJson` methods
  - [x] No codegen fixes needed

**Validation**:

- All three codegen targets exit 0
- Generated files exist and contain valid code
- No empty or malformed output files

---

### Phase 2: Wire demo-be-ts-effect (TypeScript/Effect)

**Goal**: Wire the TypeScript backend — request body type annotations + response type annotations.

- [x] **Create re-export layer**
  - [x] Create `src/lib/api/types.ts` (create `src/lib/api/` directories first) mirroring
        `demo-fe-ts-nextjs` pattern
  - [x] Re-export all primary domain types from `../../generated-contracts/types.gen`
  - [x] Note: `types.gen.ts` has 97+ exports; the re-export layer selects the 23 primary domain
        types used by route handlers
  - [x] Use `PlReport as PLReport` alias (the generated name is `PlReport`, conventional usage
        is `PLReport`; see `demo-fe-ts-nextjs/src/lib/api/types.ts` for the exact alias)
- [x] **Wire `src/routes/auth.ts`** (request + response)
  - [x] Import `LoginRequest`, `RegisterRequest`, `RefreshRequest` (request types)
  - [x] Import `AuthTokens`, `User` (response types)
  - [x] Type-annotate login request body as `LoginRequest`
  - [x] Type-annotate register request body as `RegisterRequest`
  - [x] Type-annotate refresh request body as `RefreshRequest`
  - [x] Type-annotate login response as `AuthTokens`
  - [x] Type-annotate register response as `User`
  - [x] Type-annotate refresh response as `AuthTokens`
- [x] **Wire `src/routes/expense.ts`** (request + response)
  - [x] Import `CreateExpenseRequest`, `UpdateExpenseRequest` (request types)
  - [x] Import `Expense`, `ExpenseListResponse` (response types)
  - [x] Type-annotate create expense body as `CreateExpenseRequest`
  - [x] Type-annotate update expense body as `UpdateExpenseRequest`
  - [x] Type-annotate expense responses as `Expense`
  - [x] Type-annotate list response as `ExpenseListResponse`
- [x] **Wire `src/routes/user.ts`** (request + response)
  - [x] Import `UpdateProfileRequest`, `ChangePasswordRequest` (request types)
  - [x] Import `User` (response type)
  - [x] Type-annotate request bodies
  - [x] Type-annotate user profile responses as `User`
- [x] **Wire `src/routes/attachment.ts`** (response only — upload is multipart)
  - [x] Import `Attachment` (response type)
  - [x] Type-annotate attachment responses as `Attachment`
- [x] **Wire `src/routes/report.ts`** (response only — query params)
  - [x] Import `PLReport` (response type)
  - [x] Type-annotate P&L report response as `PLReport`
- [x] **Wire `src/routes/admin.ts`** (request + response)
  - [x] Import `DisableRequest` (request type)
  - [x] Import `User`, `UserListResponse`, `PasswordResetResponse` (response types)
  - [x] Type-annotate disable request body as `DisableRequest`
  - [x] Type-annotate admin responses with generated types
- [x] **Wire `src/routes/token.ts`** (response only)
  - [x] Import `TokenClaims`, `JwksResponse` (response types)
  - [x] Type-annotate token endpoint responses
- [x] **Wire `src/routes/health.ts`** (response only)
  - [x] Import `HealthResponse` (response type)
  - [x] Type-annotate health endpoint response
- [x] **Verify** `nx run demo-be-ts-effect:typecheck` passes
- [x] **Verify** `nx run demo-be-ts-effect:test:quick` passes with >=90% coverage

---

### Phase 3: Wire demo-be-golang-gin (Go/Gin)

**Goal**: Replace local request structs with `contracts.*` imports and replace all `gin.H{}`
response maps with typed generated structs.

- [x] **Wire `internal/handler/auth.go`** (request + response)
  - [x] Add import for `contracts` package
  - [x] Remove local `RegisterRequest` struct definition
  - [x] Remove local `LoginRequest` struct definition
  - [x] Use `contracts.RegisterRequest` for register body binding
  - [x] Use `contracts.LoginRequest` for login body binding
  - [x] Use `contracts.RefreshRequest` for refresh body (replaces `map[string]string`)
  - [x] Replace `gin.H{}` login response with `contracts.AuthTokens{...}`
  - [x] Replace `gin.H{}` register response with `contracts.User{...}`
  - [x] Replace `gin.H{}` refresh response with `contracts.AuthTokens{...}`
- [x] **Wire `internal/handler/user.go`** (request + response)
  - [x] Remove local `ChangePasswordRequest` struct definition
  - [x] Use `contracts.ChangePasswordRequest` for password change body
  - [x] Use `contracts.UpdateProfileRequest` for profile update (replaces `map[string]string`)
  - [x] Replace `gin.H{}` user profile response with `contracts.User{...}`
  - [x] Replace `gin.H{}` password change response (message only — verify)
- [x] **Wire `internal/handler/expense.go`** (request + response)
  - [x] Remove local `ExpenseRequest` struct definition
  - [x] Use `contracts.CreateExpenseRequest` for create expense body
  - [x] Use `contracts.UpdateExpenseRequest` for update expense body
  - [x] Replace `gin.H{}` expense responses with `contracts.Expense{...}`
  - [x] Replace `gin.H{}` expense list response with `contracts.ExpenseListResponse{...}`
- [x] **Wire `internal/handler/report.go`** (response only)
  - [x] Replace `gin.H{}` P&L report response with `contracts.PLReport{...}`
- [x] **Wire `internal/handler/attachment.go`** (response only)
  - [x] Replace `gin.H{}` attachment responses with `contracts.Attachment{...}`
- [x] **Wire `internal/handler/admin.go`** (request + response)
  - [x] Use `contracts.DisableRequest` for disable body (replaces raw body parsing)
  - [x] Replace `gin.H{}` user list response with `contracts.UserListResponse{...}`
  - [x] Replace `gin.H{}` password reset response with `contracts.PasswordResetResponse{...}`
- [x] **Wire `internal/handler/token.go`** (response only)
  - [x] Replace `gin.H{}` token claims response with `contracts.TokenClaims{...}`
  - [x] Replace `gin.H{}` JWKS response with `contracts.JwksResponse{...}`
- [x] **Wire `internal/handler/health.go`** (response only)
  - [x] Replace `gin.H{}` health response with `contracts.HealthResponse{...}`
- [x] **Verify** `nx run demo-be-golang-gin:build` passes (`go build ./...`)
- [x] **Verify** `nx run demo-be-golang-gin:test:quick` passes with >=90% coverage
- [x] **Verify** no local request/response structs remain (grep for `type.*struct` in handlers)

---

### Phase 4: Wire demo-be-java-springboot (Java/Spring Boot)

**Goal**: Replace 18 local DTO classes with generated `contracts.*` imports. Resolve name
mismatches.

- [ ] **Add** `generated-contracts/src/main/java` as Maven source root to `pom.xml` (use
      `build-helper-maven-plugin` `add-source` execution — this configuration does not exist yet;
      see tech-docs.md Java section for the required XML snippet)
- [ ] **Wire auth DTOs** (7 request + 2 response)
  - [ ] Delete `auth/dto/LoginRequest.java` — replace with `contracts.LoginRequest`
  - [ ] Delete `auth/dto/RegisterRequest.java` — replace with `contracts.RegisterRequest`
  - [ ] Delete `auth/dto/RefreshRequest.java` — replace with `contracts.RefreshRequest`
  - [ ] Delete `auth/dto/AuthResponse.java` — replace with `contracts.AuthTokens`
  - [ ] Delete `auth/dto/RegisterResponse.java` — replace with `contracts.User`
  - [ ] Update `AuthController` imports to use `com.demobejasb.contracts.*`
  - [ ] Update all service and test files referencing deleted DTOs
- [ ] **Wire user DTOs** (2 request + 1 response)
  - [ ] Delete `user/dto/ChangePasswordRequest.java` — replace with `contracts.ChangePasswordRequest`
  - [ ] Delete `user/dto/UpdateProfileRequest.java` — replace with `contracts.UpdateProfileRequest`
  - [ ] Delete `user/dto/UserProfileResponse.java` — replace with `contracts.User`
  - [ ] Update `UserController` and related files
- [ ] **Wire expense DTOs** (1 request + 2 response)
  - [ ] Delete `expense/dto/ExpenseRequest.java` — replace with `contracts.CreateExpenseRequest`
        (and `contracts.UpdateExpenseRequest` for updates)
  - [ ] Delete `expense/dto/ExpenseResponse.java` — replace with `contracts.Expense`
  - [ ] Delete `expense/dto/ExpenseListResponse.java` — replace with `contracts.ExpenseListResponse`
  - [ ] Update `ExpenseController` and related files
- [ ] **Wire admin DTOs** (1 request + 3 response)
  - [ ] Delete `admin/dto/DisableUserRequest.java` — replace with `contracts.DisableRequest`
  - [ ] Delete `admin/dto/AdminUserResponse.java` — replace with `contracts.User`
  - [ ] Delete `admin/dto/AdminUserListResponse.java` — replace with `contracts.UserListResponse`
  - [ ] Delete `admin/dto/AdminPasswordResetResponse.java` — replace with
        `contracts.PasswordResetResponse`
  - [ ] Update `AdminController` and related files
- [ ] **Wire attachment DTOs** (1 response)
  - [ ] Delete `attachment/dto/AttachmentResponse.java` — replace with `contracts.Attachment`
  - [ ] Evaluate `AttachmentListResponse` — keep local or add to spec
  - [ ] Update `AttachmentController` and related files
- [ ] **Wire report DTOs** (1 response)
  - [ ] Delete `report/dto/PlReportResponse.java` — replace with `contracts.PLReport`
  - [ ] Update `ReportController` and related files
- [ ] **Update all tests** referencing deleted DTOs to use generated types
- [ ] **Verify** `nx run demo-be-java-springboot:build` passes
- [ ] **Verify** `nx run demo-be-java-springboot:test:quick` passes with >=90% coverage

---

### Phase 5: Wire demo-be-java-vertx (Java/Vert.x)

**Goal**: Refactor handlers from raw `JsonObject` to use generated contract types for BOTH request
parsing and response serialization. This is the most invasive backend change.

- [ ] **Add** `generated-contracts/src/main/java` as Maven source root to `pom.xml` (same as
      Phase 4 — use `build-helper-maven-plugin` `add-source`; Vert.x model package is
      `com.demobejavx.contracts`, verified from `project.json`'s `--model-package` argument)
- [ ] **Wire auth handlers** (`AuthHandler.java`)
  - [ ] Replace `body.getString("username")` pattern with deserialization into
        `contracts.LoginRequest` / `contracts.RegisterRequest` / `contracts.RefreshRequest`
  - [ ] Replace `new JsonObject().put("accessToken", ...)` with `contracts.AuthTokens` construction
  - [ ] Replace register response `JsonObject` with `contracts.User` serialization
  - [ ] Use `ctx.json()` or `Jackson.encode()` for typed response serialization
- [ ] **Wire user handlers** (`UserHandler.java`)
  - [ ] Replace request parsing with `contracts.UpdateProfileRequest` /
        `contracts.ChangePasswordRequest`
  - [ ] Replace response `JsonObject` with `contracts.User` serialization
- [ ] **Wire expense handlers** (`ExpenseHandler.java`)
  - [ ] Replace request parsing with `contracts.CreateExpenseRequest` /
        `contracts.UpdateExpenseRequest`
  - [ ] Replace response `JsonObject` with `contracts.Expense` / `contracts.ExpenseListResponse`
- [ ] **Wire admin handlers** (`AdminHandler.java`)
  - [ ] Replace request parsing with `contracts.DisableRequest`
  - [ ] Replace response `JsonObject` with `contracts.User` / `contracts.UserListResponse` /
        `contracts.PasswordResetResponse`
- [ ] **Wire attachment handlers** (`AttachmentHandler.java`)
  - [ ] Replace response `JsonObject` with `contracts.Attachment`
- [ ] **Wire report handlers** (`ReportHandler.java`)
  - [ ] Replace response `JsonObject` with `contracts.PLReport`
- [ ] **Wire token handlers** (`TokenHandler.java`)
  - [ ] Replace response `JsonObject` with `contracts.TokenClaims` / `contracts.JwksResponse`
- [ ] **Wire health handler** (`HealthHandler.java`)
  - [ ] Replace response `JsonObject` with `contracts.HealthResponse`
- [ ] **Update all tests** to use generated types instead of `JsonObject` assertions
- [ ] **Verify** `nx run demo-be-java-vertx:build` passes
- [ ] **Verify** `nx run demo-be-java-vertx:test:quick` passes with >=90% coverage

---

### Phase 6: Wire demo-be-kotlin-ktor (Kotlin/Ktor)

**Goal**: Replace 9 inline data classes with generated imports. Convert `mapOf()` responses to
generated type instances.

- [ ] **Add** `sourceSets.main { kotlin.srcDirs("generated-contracts/src/main/kotlin") }` to
      `build.gradle.kts` (Kotlin DSL syntax; this configuration does not exist yet — see
      tech-docs.md Kotlin section for the correct syntax)
- [ ] **Wire `AuthRoutes.kt`** (request + response)
  - [ ] Remove local `RegisterRequest` data class — import `contracts.RegisterRequest`
  - [ ] Remove local `LoginRequest` data class — import `contracts.LoginRequest`
  - [ ] Remove local `RefreshRequest` data class — import `contracts.RefreshRequest`
  - [ ] Keep local `LogoutRequest` (not in spec)
  - [ ] Replace `call.respond(mapOf(...))` login response with `call.respond(contracts.AuthTokens(...))`
  - [ ] Replace `call.respond(mapOf(...))` register response with `call.respond(contracts.User(...))`
  - [ ] Replace `call.respond(mapOf(...))` refresh response with `call.respond(contracts.AuthTokens(...))`
- [ ] **Wire `UserRoutes.kt`** (request + response)
  - [ ] Remove local `UpdateDisplayNameRequest` — import `contracts.UpdateProfileRequest`
  - [ ] Remove local `ChangePasswordRequest` — import `contracts.ChangePasswordRequest`
  - [ ] Replace `call.respond(mapOf(...))` user responses with `call.respond(contracts.User(...))`
- [ ] **Wire `ExpenseRoutes.kt`** (request + response)
  - [ ] Remove local `CreateExpenseDto` — import `contracts.CreateExpenseRequest`
  - [ ] Replace `call.respond(mapOf(...))` expense responses with `call.respond(contracts.Expense(...))`
  - [ ] Replace expense list response with `call.respond(contracts.ExpenseListResponse(...))`
- [ ] **Wire `AdminRoutes.kt`** (request + response)
  - [ ] Remove local `DisableUserRequest` — import `contracts.DisableRequest`
  - [ ] Replace admin responses with generated types (`User`, `UserListResponse`,
        `PasswordResetResponse`)
- [ ] **Wire `AttachmentRoutes.kt`** (response only)
  - [ ] Replace attachment responses with `contracts.Attachment(...)`
- [ ] **Wire `ReportRoutes.kt`** (response only)
  - [ ] Replace P&L report response with `contracts.PLReport(...)`
- [ ] **Wire `TokenRoutes.kt`** (response only)
  - [ ] Replace token responses with `contracts.TokenClaims(...)` / `contracts.JwksResponse(...)`
- [ ] **Wire `HealthRoutes.kt`** (response only)
  - [ ] Replace health response with `contracts.HealthResponse(...)`
- [ ] **Wire `TestRoutes.kt`**
  - [ ] Keep local `PromoteAdminRequest` (test-only, not in spec)
- [ ] **Update all tests** referencing removed data classes
- [ ] **Verify** `nx run demo-be-kotlin-ktor:build` passes
- [ ] **Verify** `nx run demo-be-kotlin-ktor:test:quick` passes with >=90% coverage

---

### Phase 7: Wire demo-be-rust-axum (Rust/Axum)

**Goal**: Replace 12 local structs with generated model imports. Add generated-contracts as crate
dependency.

- [ ] **Create crate scaffolding** (generated-contracts/ has no Cargo.toml — must be created)
  - [ ] Create `generated-contracts/Cargo.toml` with `[package] name = "demo-contracts"` and
        `edition = "2021"`
  - [ ] Create `generated-contracts/src/lib.rs` with `pub mod models;`
  - [ ] Create `generated-contracts/src/models/mod.rs` re-exporting all generated model files
  - [ ] Add `demo-contracts = { path = "generated-contracts" }` to main `Cargo.toml`
        (crate name is `demo-contracts`, not `generated-contracts`)
- [ ] **Wire `src/handlers/auth.rs`** (request + response)
  - [ ] Remove local `RegisterRequest`, `LoginRequest`, `RefreshRequest` structs
  - [ ] Remove local `RegisterResponse`, `LoginResponse` structs
  - [ ] Import generated types: `use demo_contracts::models::{RegisterRequest, LoginRequest, ...}`
  - [ ] Replace `RegisterResponse` with `demo_contracts::models::User`
  - [ ] Replace `LoginResponse` with `demo_contracts::models::AuthTokens`
- [ ] **Wire `src/handlers/user.rs`** (request + response)
  - [ ] Remove local `UpdateProfileRequest`, `ChangePasswordRequest` structs
  - [ ] Remove local `UserProfile` struct
  - [ ] Import generated types
  - [ ] Replace `UserProfile` with `models::User`
- [ ] **Wire `src/handlers/expense.rs`** (request + response)
  - [ ] Remove local `CreateExpenseRequest` struct
  - [ ] Import generated types including `Expense`, `ExpenseListResponse`
  - [ ] Type-annotate expense responses with generated types
- [ ] **Wire `src/handlers/admin.rs`** (request + response)
  - [ ] Remove local `DisableUserRequest`, `UserSummary`, `ListUsersResponse` structs
  - [ ] Import `models::DisableRequest`, `models::User`, `models::UserListResponse`
  - [ ] Replace `UserSummary` with `models::User`
  - [ ] Replace `ListUsersResponse` with `models::UserListResponse`
- [ ] **Wire `src/handlers/attachment.rs`** (response only)
  - [ ] Import `models::Attachment`
  - [ ] Type-annotate attachment responses
- [ ] **Wire `src/handlers/report.rs`** (response only)
  - [ ] Import `models::PLReport`
  - [ ] Type-annotate P&L report response
- [ ] **Wire `src/handlers/token.rs`** (response only)
  - [ ] Import `models::TokenClaims`, `models::JwksResponse`
  - [ ] Type-annotate token responses
- [ ] **Wire `src/handlers/health.rs`** (response only)
  - [ ] Import `models::HealthResponse`
  - [ ] Type-annotate health response
- [ ] **Update all tests** referencing removed structs
- [ ] **Verify** `nx run demo-be-rust-axum:build` passes
- [ ] **Verify** `nx run demo-be-rust-axum:test:quick` passes with >=90% coverage

---

### Phase 8: Wire demo-be-python-fastapi (Python/FastAPI)

**Goal**: Replace 22 local Pydantic models (8 request-type + 14 response-type) with generated
imports. Update `response_model=` parameters to use generated types.

- [ ] **Verify** `from generated_contracts import LoginRequest` works from app source root
- [ ] Note: All router files are under `src/demo_be_python_fastapi/routers/` (e.g.,
      `src/demo_be_python_fastapi/routers/auth.py`)
- [ ] **Wire `src/demo_be_python_fastapi/routers/auth.py`** (request + response)
  - [ ] Remove local `RegisterRequest` class — import from `generated_contracts`
  - [ ] Remove local `LoginRequest` class — import from `generated_contracts`
  - [ ] Remove local `RefreshRequest` class — import from `generated_contracts`
  - [ ] Remove local `TokenResponse` class — import `AuthTokens` from `generated_contracts`
  - [ ] Remove local `RegisterResponse` class — evaluate (use `User` or keep)
  - [ ] Update `response_model=` parameters to use generated types
- [ ] **Wire `src/demo_be_python_fastapi/routers/users.py`** (request + response)
  - [ ] Remove local `UpdateProfileRequest` — import from `generated_contracts`
  - [ ] Remove local `ChangePasswordRequest` — import from `generated_contracts`
  - [ ] Remove local `UserProfileResponse` — import `User` from `generated_contracts`
  - [ ] Update `response_model=` to use `User`
- [ ] **Wire `src/demo_be_python_fastapi/routers/expenses.py`** (request + response)
  - [ ] Remove local `ExpenseRequest` — import `CreateExpenseRequest` from `generated_contracts`
  - [ ] Add import for `UpdateExpenseRequest` (may not exist locally)
  - [ ] Remove local `ExpenseResponse` — import `Expense` from `generated_contracts`
  - [ ] Remove local `ExpenseListResponse` — import from `generated_contracts`
  - [ ] Update `response_model=` parameters
- [ ] **Wire `src/demo_be_python_fastapi/routers/admin.py`** (request + response)
  - [ ] Remove local `DisableRequest` — import from `generated_contracts`
  - [ ] Remove local `UserSummary` — import `User` from `generated_contracts`
  - [ ] Remove local `UserListResponse` — import from `generated_contracts`
  - [ ] Update `response_model=` parameters
- [ ] **Wire `src/demo_be_python_fastapi/routers/attachments.py`** (response only)
  - [ ] Remove local `AttachmentResponse` — import `Attachment` from `generated_contracts`
  - [ ] Evaluate `AttachmentListResponse` (not in spec — keep or add)
  - [ ] Update `response_model=`
- [ ] **Wire `src/demo_be_python_fastapi/routers/reports.py`** (response only)
  - [ ] Remove local `BreakdownItem` — import `CategoryBreakdown` from `generated_contracts`
  - [ ] Remove local `PLResponse` — import `PLReport` from `generated_contracts`
  - [ ] Update `response_model=`
- [ ] **Wire `src/demo_be_python_fastapi/routers/tokens.py`** (response only)
  - [ ] Remove local `ClaimsResponse` — import `TokenClaims` from `generated_contracts`
  - [ ] Update `response_model=`
- [ ] **Wire `src/demo_be_python_fastapi/routers/health.py`** (response only)
  - [ ] Remove local `HealthResponse` — import from `generated_contracts`
  - [ ] Update `response_model=`
- [ ] **Update all tests** referencing removed models
- [ ] **Verify** `nx run demo-be-python-fastapi:test:quick` passes with >=90% coverage

---

### Phase 9: Wire demo-be-fsharp-giraffe and demo-be-csharp-aspnetcore (.NET)

**Goal**: Add source inclusion of generated `.fs`/`.cs` files to app projects. Replace inline
records/classes with generated types for both request parsing and response construction.

**demo-be-fsharp-giraffe**:

- [ ] **Add source inclusion** in main app's `.fsproj` (no `.fsproj` in `generated-contracts/`)
  - [ ] Add `<Compile Include="../generated-contracts/OpenAPI/src/DemoBeFsgi.Contracts/*.fs" />`
        to main `.fsproj` before any files that reference generated types
- [ ] **Create `[<CLIMutable>]` wrapper records** for request binding
  - [ ] Generated F# records do NOT carry `[<CLIMutable>]`; Giraffe's `bindJsonAsync<T>()` fails
        without it
  - [ ] Create thin `[<CLIMutable>]` wrapper records that map to/from generated types for each
        request type: `RegisterRequest`, `LoginRequest`, `RefreshRequest`, `UpdateProfileRequest`,
        `ChangePasswordRequest`, `CreateExpenseRequest`, `UpdateExpenseRequest`, `DisableRequest`
  - [ ] Use generated types directly for response construction (no `[<CLIMutable>]` needed)
- [ ] **Wire `AuthHandler.fs`** (request + response)
  - [ ] Remove local `RegisterRequest`, `LoginRequest`, `RefreshRequest` records
  - [ ] Open `OpenAPI.DemoBeFsgi.Contracts` namespace
  - [ ] Use thin `[<CLIMutable>]` wrapper records for request deserialization
  - [ ] Map wrapper records to generated types for business logic
  - [ ] Use generated types for response construction (`AuthTokens`, `User`)
- [ ] **Wire `UserHandler.fs`** (request + response)
  - [ ] Remove local `UpdateProfileRequest`, `ChangePasswordRequest` records
  - [ ] Use generated types for request and response
- [ ] **Wire `ExpenseHandler.fs`** (request + response)
  - [ ] Remove local `CreateExpenseRequest`, `UpdateExpenseRequest` records
  - [ ] Use generated types for request and response (`Expense`, `ExpenseListResponse`)
- [ ] **Wire `AdminHandler.fs`** (request + response)
  - [ ] Remove local `DisableRequest` record
  - [ ] Use generated types for request and response (`User`, `UserListResponse`,
        `PasswordResetResponse`)
- [ ] **Wire `AttachmentHandler.fs`** (response only)
  - [ ] Use generated `Attachment` for response
- [ ] **Wire `ReportHandler.fs`** (response only)
  - [ ] Use generated `PLReport` for response
- [ ] **Wire `TokenHandler.fs`** (response only)
  - [ ] Use generated `TokenClaims`, `JwksResponse` for response
- [ ] **Wire `HealthHandler.fs`** (response only)
  - [ ] Use generated `HealthResponse` for response
- [ ] **Update all tests** referencing removed records
- [ ] **Verify** `nx run demo-be-fsharp-giraffe:build` passes
- [ ] **Verify** `nx run demo-be-fsharp-giraffe:test:quick` passes with >=90% coverage

**demo-be-csharp-aspnetcore**:

- [ ] **Add source inclusion** in main app's `.csproj` (no `.csproj` in `generated-contracts/`)
  - [ ] Add `<Compile Include="../generated-contracts/src/Org.OpenAPITools/DemoBeCsas.Contracts/*.cs" />`
        to main `.csproj`
- [ ] **Wire `AuthEndpoints.cs`** (request + response)
  - [ ] Remove local `RegisterRequest`, `LoginRequest`, `RefreshRequest` sealed records
  - [ ] Add `using Org.OpenAPITools.DemoBeCsas.Contracts;` (actual namespace — not `DemoBeCsas.Contracts`)
  - [ ] Use generated types for request binding and response (`AuthTokens`, `User`)
- [ ] **Wire `UserEndpoints.cs`** (request + response)
  - [ ] Remove local `PatchMeRequest` (replace with `UpdateProfileRequest`)
  - [ ] Remove local `ChangePasswordRequest`
  - [ ] Use generated types for request and response
- [ ] **Wire `ExpenseEndpoints.cs`** (request + response)
  - [ ] Remove local `ExpenseRequest` (replace with `CreateExpenseRequest` + `UpdateExpenseRequest`)
  - [ ] Use generated types for request and response
- [ ] **Wire `AdminEndpoints.cs`** (request + response)
  - [ ] Use generated types for disable request and responses
- [ ] **Wire `AttachmentEndpoints.cs`** (response only)
  - [ ] Use generated `Attachment` for response
- [ ] **Wire `ReportEndpoints.cs`** (response only)
  - [ ] Use generated `PLReport` for response
- [ ] **Wire `TokenEndpoints.cs`** (response only)
  - [ ] Use generated `TokenClaims`, `JwksResponse` for response
- [ ] **Wire `HealthEndpoints.cs`** (response only)
  - [ ] Use generated `HealthResponse` for response
- [ ] **Update all tests** referencing removed records
- [ ] **Verify** `nx run demo-be-csharp-aspnetcore:build` passes
- [ ] **Verify** `nx run demo-be-csharp-aspnetcore:test:quick` passes with >=90% coverage

---

### Phase 10: Wire demo-be-elixir-phoenix and demo-be-clojure-pedestal (Dynamic Languages)

**Goal**: Wire Elixir and Clojure backends. Enforcement is at test time via struct construction
(Elixir) and schema validation (Clojure).

**demo-be-elixir-phoenix**:

- [ ] **Add generated-contracts to Mix source paths** in `mix.exs`
- [ ] **Verify module namespace from Phase 1 output** — expected `GeneratedSchemas.*` (the codegen
      defaults to `@default_namespace "GeneratedSchemas"`; no namespace override is passed in
      `project.json`). All struct references below use `GeneratedSchemas.*` as the expected prefix.
      Update if Phase 1 reveals a different namespace.
- [ ] **Wire `AuthController`** (request validation + response struct construction)
  - [ ] Alias generated `GeneratedSchemas.LoginRequest`, `GeneratedSchemas.RegisterRequest`,
        `GeneratedSchemas.RefreshRequest` modules
  - [ ] Validate incoming params against generated struct fields
  - [ ] Construct `%GeneratedSchemas.AuthTokens{}` for login/refresh responses
  - [ ] Construct `%GeneratedSchemas.User{}` for register/profile responses
- [ ] **Wire `UserController`** (request + response)
  - [ ] Alias generated `GeneratedSchemas.UpdateProfileRequest`,
        `GeneratedSchemas.ChangePasswordRequest`
  - [ ] Validate incoming params
  - [ ] Construct `%GeneratedSchemas.User{}` for user profile response
- [ ] **Wire `ExpenseController`** (request + response)
  - [ ] Alias generated `GeneratedSchemas.CreateExpenseRequest`,
        `GeneratedSchemas.UpdateExpenseRequest`
  - [ ] Validate incoming params
  - [ ] Construct `%GeneratedSchemas.Expense{}` / `%GeneratedSchemas.ExpenseListResponse{}` for
        responses
- [ ] **Wire `AdminController`** (request + response)
  - [ ] Alias generated `GeneratedSchemas.DisableRequest`
  - [ ] Construct `%GeneratedSchemas.User{}` / `%GeneratedSchemas.UserListResponse{}` /
        `%GeneratedSchemas.PasswordResetResponse{}` for responses
- [ ] **Wire `AttachmentController`** (response only)
  - [ ] Construct `%GeneratedSchemas.Attachment{}` for responses
- [ ] **Wire `ReportController`** (response only)
  - [ ] Construct `%GeneratedSchemas.PLReport{}` for response
- [ ] **Wire `TokenController`** (response only)
  - [ ] Construct `%GeneratedSchemas.TokenClaims{}` / `%GeneratedSchemas.JwksResponse{}` for
        responses
- [ ] **Wire `HealthController`** (response only)
  - [ ] Construct `%GeneratedSchemas.HealthResponse{}` for response
- [ ] **Add struct construction tests** — at least one test per generated struct verifying
      `@enforce_keys` catches missing required fields
- [ ] **Verify** `nx run demo-be-elixir-phoenix:test:quick` passes

**demo-be-clojure-pedestal**:

- [ ] **Add generated schemas to classpath** in `deps.edn`
- [ ] **Verify namespace from Phase 1 output** — generated schemas use namespace
      `openapi-codegen.schemas.<kebab-name>` (e.g., `openapi-codegen.schemas.auth-tokens`).
      Confirm exact names by inspecting the Phase 1 codegen output.
- [ ] **Create contract validation helper**
  - [ ] Create `contracts.clj` namespace that requires all generated schemas, e.g.:
        `(:require [openapi-codegen.schemas.auth-tokens :as auth-tokens-schema] ...)`
  - [ ] Add `validate-response` function using `m/validate`
- [ ] **Wire auth handlers** (request + response validation)
  - [ ] Require `openapi-codegen.schemas.login-request`, `openapi-codegen.schemas.register-request`,
        `openapi-codegen.schemas.refresh-request` for request validation
  - [ ] Add `validate-response` calls on login/register/refresh responses against
        `openapi-codegen.schemas.auth-tokens` / `openapi-codegen.schemas.user` generated schemas
- [ ] **Wire user handlers** (request + response validation)
  - [ ] Validate user profile response against `openapi-codegen.schemas.user` schema
- [ ] **Wire expense handlers** (request + response validation)
  - [ ] Validate expense responses against `openapi-codegen.schemas.expense` /
        `openapi-codegen.schemas.expense-list-response` schemas
- [ ] **Wire admin handlers** (request + response validation)
  - [ ] Validate admin responses against `openapi-codegen.schemas.user` /
        `openapi-codegen.schemas.user-list-response` /
        `openapi-codegen.schemas.password-reset-response` schemas
- [ ] **Wire attachment handlers** (response validation)
  - [ ] Validate against `openapi-codegen.schemas.attachment` schema
- [ ] **Wire report handlers** (response validation)
  - [ ] Validate against `openapi-codegen.schemas.pl-report` schema
- [ ] **Wire token handlers** (response validation)
  - [ ] Validate against `openapi-codegen.schemas.token-claims` /
        `openapi-codegen.schemas.jwks-response` schemas
- [ ] **Wire health handler** (response validation)
  - [ ] Validate against `openapi-codegen.schemas.health-response` schema
- [ ] **Add schema validation tests** — at least one test per generated schema verifying
      validation catches missing required fields
- [ ] **Verify** `nx run demo-be-clojure-pedestal:test:quick` passes

---

### Phase 11: Wire demo-fe-dart-flutterweb (Dart/Flutter Web)

**Goal**: Replace 20+ hand-written model classes with generated Dart classes.

- [ ] **Add generated package as path dependency** in `pubspec.yaml`
- [ ] **Run `flutter pub get`** to install
- [ ] **Wire `lib/models/auth.dart`**
  - [ ] Replace local `LoginRequest`, `RegisterRequest`, `AuthTokens` with re-exports from
        generated package
- [ ] **Wire `lib/models/user.dart`**
  - [ ] Replace local `User`, `UserListResponse`, `UpdateProfileRequest`,
        `ChangePasswordRequest`, `DisableRequest`, `PasswordResetResponse` with generated types
- [ ] **Wire `lib/models/expense.dart`**
  - [ ] Replace local `Expense`, `ExpenseListResponse`, `CreateExpenseRequest`,
        `UpdateExpenseRequest` with generated types
- [ ] **Wire `lib/models/attachment.dart`**
  - [ ] Replace local `Attachment` with generated type
- [ ] **Wire `lib/models/token.dart`**
  - [ ] Replace local `TokenClaims`, `JwkKey`, `JwksResponse` with generated types
- [ ] **Wire `lib/models/report.dart`**
  - [ ] Replace local `CategoryBreakdown`, `ExpenseSummary`, `PLReport` with generated types
- [ ] **Wire `lib/models/health.dart`**
  - [ ] Replace local `HealthResponse` with generated type
- [ ] **Update `lib/services/*.dart`** to compile against updated model imports
- [ ] **Verify** `dart analyze` passes with no errors
- [ ] **Verify** `nx run demo-fe-dart-flutterweb:test:quick` passes with >=70% coverage

---

### Phase 12: Wire E2E Contract Validation (demo-be-e2e + demo-fe-e2e)

**Goal**: Activate the existing `validateResponseAgainstContract` function in all E2E step
definitions.

**demo-be-e2e** (15 step files):

- [ ] **Wire `tests/steps/auth/auth.steps.ts`**
  - [ ] Import `validateResponseAgainstContract`
  - [ ] Add contract validation after every 2xx response
- [ ] **Wire `tests/steps/auth/token-lifecycle.steps.ts`**
  - [ ] Add contract validation after every 2xx response
- [ ] **Wire `tests/steps/expenses/expenses.steps.ts`**
  - [ ] Add contract validation after every 2xx response
- [ ] **Wire `tests/steps/expenses/units.steps.ts`**
  - [ ] Add contract validation after every 2xx response
- [ ] **Wire `tests/steps/expenses/currency.steps.ts`**
  - [ ] Add contract validation after every 2xx response
- [ ] **Wire `tests/steps/expenses/attachments.steps.ts`**
  - [ ] Add contract validation after every 2xx response
- [ ] **Wire `tests/steps/expenses/reporting.steps.ts`**
  - [ ] Add contract validation after every 2xx response
- [ ] **Wire `tests/steps/user/user-lifecycle.steps.ts`**
  - [ ] Add contract validation after every 2xx response
- [ ] **Wire `tests/steps/admin/admin.steps.ts`**
  - [ ] Add contract validation after every 2xx response
- [ ] **Wire `tests/steps/token-management/tokens.steps.ts`**
  - [ ] Add contract validation after every 2xx response
- [ ] **Wire `tests/steps/health/health.steps.ts`**
  - [ ] Add contract validation after health check response
- [ ] **Wire `tests/steps/security/security.steps.ts`**
  - [ ] Add contract validation after every 2xx response
- [ ] **Wire `tests/steps/common.steps.ts`**
  - [ ] Add contract validation for any shared response handling
- [ ] **Wire `tests/steps/common-setup.steps.ts`**
  - [ ] Add contract validation if it handles responses
- [ ] **Wire `tests/steps/test-support/test-api.steps.ts`**
  - [ ] Add contract validation for test-support responses (if applicable)

**demo-fe-e2e** (16 step files):

- [ ] **Wire `tests/steps/authentication/login.steps.ts`**
  - [ ] Import `validateResponseAgainstContract`
  - [ ] Add contract validation after every 2xx response
- [ ] **Wire `tests/steps/authentication/session.steps.ts`**
  - [ ] Add contract validation after every 2xx response
- [ ] **Wire `tests/steps/user-lifecycle/user-profile.steps.ts`**
  - [ ] Add contract validation after every 2xx response
- [ ] **Wire `tests/steps/user-lifecycle/registration.steps.ts`**
  - [ ] Add contract validation after every 2xx response
- [ ] **Wire `tests/steps/expenses/expense-management.steps.ts`**
  - [ ] Add contract validation after every 2xx response
- [ ] **Wire `tests/steps/expenses/attachments.steps.ts`**
  - [ ] Add contract validation after every 2xx response
- [ ] **Wire `tests/steps/expenses/reporting.steps.ts`**
  - [ ] Add contract validation after every 2xx response
- [ ] **Wire `tests/steps/expenses/currency-handling.steps.ts`**
  - [ ] Add contract validation after every 2xx response
- [ ] **Wire `tests/steps/expenses/unit-handling.steps.ts`**
  - [ ] Add contract validation after every 2xx response
- [ ] **Wire `tests/steps/admin/admin-panel.steps.ts`**
  - [ ] Add contract validation after every 2xx response
- [ ] **Wire `tests/steps/token-management/tokens.steps.ts`**
  - [ ] Add contract validation after every 2xx response
- [ ] **Wire `tests/steps/health/health.steps.ts`**
  - [ ] Add contract validation after health check response
- [ ] **Wire `tests/steps/security/security.steps.ts`**
  - [ ] Add contract validation after every 2xx response
- [ ] **Wire `tests/steps/layout/responsive.steps.ts`**
  - [ ] Add contract validation if it handles API responses
- [ ] **Wire `tests/steps/layout/accessibility.steps.ts`**
  - [ ] Add contract validation if it handles API responses
- [ ] **Wire `tests/steps/common.steps.ts`**
  - [ ] Add contract validation for shared response handling
- [ ] **Verify** grep confirms `validateResponseAgainstContract` is imported in all step files

**Validation**:

- [ ] **Verify** `nx run demo-be-e2e:test:e2e` passes (against a running backend)
- [ ] **Verify** `nx run demo-fe-e2e:test:e2e` passes (against running frontend + backend)

---

### Phase 13: End-to-End Verification

**Goal**: Verify the full enforcement model works. All apps pass. Contract changes cause failures.

- [ ] **Run full test suite**
  - [ ] `nx run-many -t test:quick --projects=demo-*` — all 16 demo apps pass
        (14 newly wired + 2 previously wired by 2026-03-17 plan)
- [ ] **Run builds for compiled backends**
  - [ ] `nx run-many -t build --projects=demo-be-golang-gin,demo-be-java-springboot,demo-be-java-vertx,demo-be-kotlin-ktor,demo-be-rust-axum,demo-be-fsharp-giraffe,demo-be-csharp-aspnetcore`
- [ ] **Run typechecks for TypeScript and Dart**
  - [ ] `nx run-many -t typecheck --projects=demo-be-ts-effect,demo-fe-dart-flutterweb`
- [ ] **Enforcement smoke test** (do NOT commit)
  - [ ] Rename `accessToken` to `token` in `specs/apps/demo/contracts/schemas/auth.yaml`
  - [ ] Run `nx run demo-contracts:bundle`
  - [ ] Run `nx run demo-be-golang-gin:codegen && nx run demo-be-golang-gin:build` — expect failure
  - [ ] Run `nx run demo-be-ts-effect:codegen && nx run demo-be-ts-effect:typecheck` — expect
        failure
  - [ ] Run `nx run demo-be-python-fastapi:codegen && nx run demo-be-python-fastapi:test:unit` —
        expect failure
  - [ ] Revert the rename in `specs/apps/demo/contracts/schemas/auth.yaml`
  - [ ] Run `nx run demo-contracts:bundle`
  - [ ] Run `nx run demo-be-golang-gin:codegen && nx run demo-be-ts-effect:codegen && nx run demo-be-python-fastapi:codegen`
  - [ ] Verify builds/typechecks pass again (confirm clean revert)
- [ ] **Verify pre-push hook**: Stage and push a minor change; confirm hook runs `test:quick` for
      affected projects and passes
- [ ] **Update `CLAUDE.md`** — note that all 16 demo apps now import from generated-contracts/
      for both request and response types (14 wired in this plan, 2 wired in 2026-03-17 plan)
- [ ] **Update `specs/apps/demo/contracts/README.md`** — update adoption status to reflect all
      apps are wired
- [ ] **Trigger all E2E CI workflows manually** — verify all 14 newly-wired apps pass

**Validation**:

- `nx run-many -t test:quick --projects=demo-*` exits 0 (all 16 apps: 14 newly wired + 2
  previously wired by 2026-03-17 plan)
- Enforcement smoke test confirms contract change causes failures in at least one statically typed
  and one dynamically typed app before revert
- Pre-push hook passes on clean working tree
- All 14 newly-wired app E2E CI workflows pass
- Documentation updated

---

## Open Questions

1. ~~**RegisterResponse**~~: **RESOLVED** — Spec returns `User` on 201. Backends standardize on
   returning full `User`. Local `RegisterResponse` types replaced with generated `User`.

2. ~~**AttachmentListResponse**~~: **RESOLVED** — Spec returns bare array. Local wrapper types
   removed. Backends match spec.

3. **Java Vert.x refactoring scope**: The JsonObject-to-typed-object refactoring is invasive. Should
   we prioritize compile-time safety (full refactor) or take a lighter approach (type assertions in
   tests)?

4. **Generated type field compatibility**: Some generated types may use different field types than
   local ones (e.g., `openapi_types.Date` vs `string`, `Optional<>` vs nullable). Verify
   compatibility during implementation.

5. **Kotlin `@Serializable`**: Verify generated Kotlin data classes carry `@Serializable` annotation
   needed for Ktor's `ContentNegotiation`.

6. **F# `[<CLIMutable>]`**: Verified — generated F# records do NOT carry `[<CLIMutable>]`.
   Giraffe's `bindJsonAsync<T>()` and ASP.NET Core model binding require a default constructor,
   which immutable F# records lack without this attribute. Mitigation: create thin
   `[<CLIMutable>]` wrapper records for request binding (see Phase 9). Use generated types
   directly for response construction.

7. **Dart generator output format**: Verify generated Dart classes have `fromJson`/`toJson` methods
   compatible with existing service layer expectations.

---

## Risks and Mitigations

| Risk                                                                 | Impact | Mitigation                                                                        |
| -------------------------------------------------------------------- | ------ | --------------------------------------------------------------------------------- |
| Generated types have incompatible field types (Date vs string, etc.) | High   | Verify generated vs local field types in Phase 0; adjust codegen config if needed |
| Java Vert.x refactoring breaks many tests                            | High   | Phase 5 is isolated; can fall back to lighter approach if too invasive            |
| Elixir/Clojure codegen never ran; may have bugs                      | High   | Phase 1 catches issues early; fix before wiring                                   |
| Dart codegen produces incompatible output                            | Medium | Phase 1 verification; use re-export layer if names differ                         |
| Generated Java DTOs use Optional instead of nullable                 | Medium | Check generated field types before replacing; adjust if needed                    |
| Kotlin generated types lack @Serializable                            | Medium | Verify in Phase 6; add thin wrapper if missing                                    |
| F# generated records lack [<CLIMutable>]                             | Medium | Verify in Phase 9; add thin wrapper if missing                                    |
| Coverage drops after removing local types and their dedicated tests  | Low    | Tests must be updated to use generated types; coverage maintained                 |
| E2E tests fail due to contract gaps (endpoint not in spec)           | Low    | Validator returns null for unknown paths; existing behavior preserved             |
| Name mapping creates import confusion for future developers          | Low    | Document all mappings in tech-docs.md; re-export layers provide stable names      |

---

## Completion Status

- [x] Phase 0: Evaluate Missing Spec Types
- [x] Phase 1: Verify Codegen (Elixir, Clojure, Dart)
- [x] Phase 2: Wire demo-be-ts-effect
- [x] Phase 3: Wire demo-be-golang-gin
- [ ] Phase 4: Wire demo-be-java-springboot
- [ ] Phase 5: Wire demo-be-java-vertx
- [ ] Phase 6: Wire demo-be-kotlin-ktor
- [ ] Phase 7: Wire demo-be-rust-axum
- [ ] Phase 8: Wire demo-be-python-fastapi
- [ ] Phase 9: Wire demo-be-fsharp-giraffe + demo-be-csharp-aspnetcore
- [ ] Phase 10: Wire demo-be-elixir-phoenix + demo-be-clojure-pedestal
- [ ] Phase 11: Wire demo-fe-dart-flutterweb
- [ ] Phase 12: Wire E2E Contract Validation
- [ ] Phase 13: End-to-End Verification
