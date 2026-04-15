# Technical Documentation

## Integration Approach by Language Family

### TypeScript — a-demo-be-ts-effect

**Current state**: `generated-contracts/types.gen.ts` exists with all API types (97+ object types;
23 primary domain types are re-exported by the re-export layer). Route handlers in `src/routes/*.ts`
parse request bodies as `Record<string, unknown>` and build response objects
inline without type annotations. `src/domain/types.ts` defines branded types (Currency, Role,
UserStatus) that are internal domain concerns, not API types.

**Target state**: Route handlers import API types from a re-export layer. Request body parsing
casts to the generated type. Response building uses generated type shapes.

**Request types to wire**: `LoginRequest`, `RegisterRequest`, `RefreshRequest`,
`ChangePasswordRequest`, `UpdateProfileRequest`, `CreateExpenseRequest`, `UpdateExpenseRequest`,
`DisableRequest`

**Response types to wire**: `AuthTokens`, `User`, `Expense`, `ExpenseListResponse`,
`ExpenseSummary`, `CategoryBreakdown`, `PLReport`, `Attachment`, `TokenClaims`, `JwkKey`,
`JwksResponse`, `PasswordResetResponse`, `UserListResponse`, `ErrorResponse`, `HealthResponse`

**Integration approach**:

- Create `src/lib/api/types.ts` re-export layer (mirrors frontend pattern)
- In each route file, import types and annotate request body variables and response objects
- TypeScript structural typing means annotating the variable is sufficient — no explicit
  `implements` needed
- Keep `src/domain/types.ts` — branded types (Currency, Role, UserStatus) are internal

**Files to modify**: `src/routes/auth.ts`, `src/routes/expense.ts`, `src/routes/user.ts`,
`src/routes/attachment.ts`, `src/routes/report.ts`, `src/routes/admin.ts`, `src/routes/token.ts`,
`src/routes/health.ts`

### Go — a-demo-be-golang-gin

**Current state**: `generated-contracts/types.gen.go` (package `contracts`) exists with 23 types
plus enum types and query param types. Handler files define 4 local request structs
(`RegisterRequest`, `LoginRequest`, `ChangePasswordRequest`, `ExpenseRequest`). ALL responses use
`gin.H{}` (untyped `map[string]any`).

**Target state**: Handlers import `contracts` package. Local request structs removed. Responses use
generated types instead of `gin.H{}`.

**Request types to wire** (replace local structs):

| Local Struct                        | Generated Replacement             | File                          |
| ----------------------------------- | --------------------------------- | ----------------------------- |
| `handler.RegisterRequest`           | `contracts.RegisterRequest`       | `internal/handler/auth.go`    |
| `handler.LoginRequest`              | `contracts.LoginRequest`          | `internal/handler/auth.go`    |
| `handler.ChangePasswordRequest`     | `contracts.ChangePasswordRequest` | `internal/handler/user.go`    |
| `handler.ExpenseRequest`            | `contracts.CreateExpenseRequest`  | `internal/handler/expense.go` |
| _(none — uses `map[string]string`)_ | `contracts.RefreshRequest`        | `internal/handler/auth.go`    |
| _(none — uses `map[string]string`)_ | `contracts.UpdateProfileRequest`  | `internal/handler/user.go`    |
| _(none — uses raw body)_            | `contracts.DisableRequest`        | `internal/handler/admin.go`   |

**Response types to wire** (replace `gin.H{}`):

| Endpoint            | Generated Response Type         | File                             |
| ------------------- | ------------------------------- | -------------------------------- |
| POST /auth/login    | `contracts.AuthTokens`          | `internal/handler/auth.go`       |
| POST /auth/register | `contracts.User`                | `internal/handler/auth.go`       |
| POST /auth/refresh  | `contracts.AuthTokens`          | `internal/handler/auth.go`       |
| GET /users/me       | `contracts.User`                | `internal/handler/user.go`       |
| PATCH /users/me     | `contracts.User`                | `internal/handler/user.go`       |
| GET /expenses       | `contracts.ExpenseListResponse` | `internal/handler/expense.go`    |
| POST /expenses      | `contracts.Expense`             | `internal/handler/expense.go`    |
| GET /expenses/:id   | `contracts.Expense`             | `internal/handler/expense.go`    |
| PATCH /expenses/:id | `contracts.Expense`             | `internal/handler/expense.go`    |
| GET /reports/pl     | `contracts.PLReport`            | `internal/handler/report.go`     |
| GET /attachments/\* | `contracts.Attachment`          | `internal/handler/attachment.go` |
| GET /admin/users    | `contracts.UserListResponse`    | `internal/handler/admin.go`      |
| GET /tokens/claims  | `contracts.TokenClaims`         | `internal/handler/token.go`      |
| GET /tokens/jwks    | `contracts.JwksResponse`        | `internal/handler/token.go`      |
| GET /health         | `contracts.HealthResponse`      | `internal/handler/health.go`     |

Note: `ExpenseSummary` exists in the Go generated types. Verify whether any Go endpoint returns it
directly or only as a nested field in `ExpenseListResponse`/`PLReport`. Add to the table above if
returned directly.

**Import path**: `"github.com/wahidyankf/ose-public/apps/a-demo-be-golang-gin/generated-contracts"`
aliased as `contracts`.

**Caveat**: Generated Go types may use `openapi_types.Date` instead of `string` for date fields,
and `*float32` instead of `*float64` for amounts. Verify field type compatibility before replacing.

### Java — a-demo-be-java-springboot

**Current state**: 18 local DTO classes across `auth/dto/`, `user/dto/`, `expense/dto/`,
`admin/dto/`, `attachment/dto/`, `report/dto/` packages. Many names differ from generated types.

**Request type mapping** (local -> generated):

| Local DTO               | Generated Class                   | Package     |
| ----------------------- | --------------------------------- | ----------- |
| `LoginRequest`          | `contracts.LoginRequest`          | auth/dto    |
| `RegisterRequest`       | `contracts.RegisterRequest`       | auth/dto    |
| `RefreshRequest`        | `contracts.RefreshRequest`        | auth/dto    |
| `ChangePasswordRequest` | `contracts.ChangePasswordRequest` | user/dto    |
| `UpdateProfileRequest`  | `contracts.UpdateProfileRequest`  | user/dto    |
| `ExpenseRequest`        | `contracts.CreateExpenseRequest`  | expense/dto |
| `DisableUserRequest`    | `contracts.DisableRequest`        | admin/dto   |

**Response type mapping** (local -> generated):

| Local DTO                    | Generated Class                     | Notes                     |
| ---------------------------- | ----------------------------------- | ------------------------- |
| `AuthResponse`               | `contracts.AuthTokens`              | Name differs              |
| `RegisterResponse`           | `contracts.User`                    | Use User for registration |
| `UserProfileResponse`        | `contracts.User`                    | Use full User type        |
| `AdminUserResponse`          | `contracts.User`                    | Use full User type        |
| `AdminUserListResponse`      | `contracts.UserListResponse`        | Name differs              |
| `AdminPasswordResetResponse` | `contracts.PasswordResetResponse`   | Name differs              |
| `ExpenseResponse`            | `contracts.Expense`                 | Name differs              |
| `ExpenseListResponse`        | `contracts.ExpenseListResponse`     | Exact match               |
| `AttachmentResponse`         | `contracts.Attachment`              | Name differs              |
| `AttachmentListResponse`     | _(not in spec — keep local or add)_ | Evaluate                  |
| `PlReportResponse`           | `contracts.PLReport`                | Name differs              |

**Domain models to PRESERVE** (JPA entities, NOT API types):
`User`, `Expense`, `Attachment`, `RefreshToken`, `RevokedToken`

### Java — a-demo-be-java-vertx

**Current state**: ZERO DTO classes. All handlers use raw `JsonObject`:

```java
JsonObject body = ctx.body().asJsonObject();
String username = body.getString("username", "");
// Response:
JsonObject resp = new JsonObject()
    .put("accessToken", tokens.accessToken())
    .put("refreshToken", tokens.refreshToken());
```

**Target state**: Handlers deserialize request bodies into generated contract types via Jackson,
and serialize generated contract types into responses.

**Integration approach**: This is the most invasive change. Each handler must:

1. Deserialize: `LoginRequest req = ctx.body().asPojo(LoginRequest.class);`
   (or use Jackson ObjectMapper directly)
2. Serialize response: `ctx.json(new AuthTokens(...));`
   (Vert.x's `json()` method uses Jackson internally)

**All request types to wire**: `LoginRequest`, `RegisterRequest`, `RefreshRequest`,
`ChangePasswordRequest`, `UpdateProfileRequest`, `CreateExpenseRequest`, `UpdateExpenseRequest`,
`DisableRequest`

**All response types to wire**: `AuthTokens`, `User`, `Expense`, `ExpenseListResponse`, `PLReport`,
`Attachment`, `TokenClaims`, `JwksResponse`, `HealthResponse`, `UserListResponse`,
`PasswordResetResponse`, `ErrorResponse`

**Domain models to PRESERVE**: `User`, `Expense`, `Attachment`, `TokenRevocation`

### Kotlin — a-demo-be-kotlin-ktor

**Current state**: 9 inline `@Serializable` data classes in route files for request parsing.
Responses use `mapOf()` or `buildJsonObject{}` — no typed response classes.

**Request type mapping** (local -> generated):

| Local Data Class           | Generated Class                   | File             |
| -------------------------- | --------------------------------- | ---------------- |
| `RegisterRequest`          | `contracts.RegisterRequest`       | AuthRoutes.kt    |
| `LoginRequest`             | `contracts.LoginRequest`          | AuthRoutes.kt    |
| `RefreshRequest`           | `contracts.RefreshRequest`        | AuthRoutes.kt    |
| `LogoutRequest`            | _(not in spec — keep local)_      | AuthRoutes.kt    |
| `ChangePasswordRequest`    | `contracts.ChangePasswordRequest` | UserRoutes.kt    |
| `UpdateDisplayNameRequest` | `contracts.UpdateProfileRequest`  | UserRoutes.kt    |
| `DisableUserRequest`       | `contracts.DisableRequest`        | AdminRoutes.kt   |
| `CreateExpenseDto`         | `contracts.CreateExpenseRequest`  | ExpenseRoutes.kt |
| `PromoteAdminRequest`      | _(not in spec — test only)_       | TestRoutes.kt    |

**Response types to wire** (replace `mapOf()` / `call.respond(mapOf(...))`):

Same set as other backends: `AuthTokens`, `User`, `Expense`, `ExpenseListResponse`, `PLReport`,
`Attachment`, `TokenClaims`, `JwksResponse`, `HealthResponse`, `UserListResponse`,
`PasswordResetResponse`

**Domain models to PRESERVE**: `User`, `Expense`, `Attachment`, `Page<T>`, `DomainError`, `Role`,
`UserStatus`, `EntryType`

### Rust — a-demo-be-rust-axum

**Current state**: 12 local structs across handler files with `#[derive(Serialize, Deserialize)]`.

**Request type mapping** (local -> generated):

| Local Struct            | Generated Struct                | File                |
| ----------------------- | ------------------------------- | ------------------- |
| `RegisterRequest`       | `models::RegisterRequest`       | handlers/auth.rs    |
| `LoginRequest`          | `models::LoginRequest`          | handlers/auth.rs    |
| `RefreshRequest`        | `models::RefreshRequest`        | handlers/auth.rs    |
| `UpdateProfileRequest`  | `models::UpdateProfileRequest`  | handlers/user.rs    |
| `ChangePasswordRequest` | `models::ChangePasswordRequest` | handlers/user.rs    |
| `CreateExpenseRequest`  | `models::CreateExpenseRequest`  | handlers/expense.rs |
| `DisableUserRequest`    | `models::DisableRequest`        | handlers/admin.rs   |

**Response type mapping** (local -> generated):

| Local Struct        | Generated Struct           | Notes        |
| ------------------- | -------------------------- | ------------ |
| `RegisterResponse`  | `models::User`             | Name differs |
| `LoginResponse`     | `models::AuthTokens`       | Name differs |
| `UserProfile`       | `models::User`             | Name differs |
| `UserSummary`       | `models::User`             | Name differs |
| `ListUsersResponse` | `models::UserListResponse` | Name differs |

**Additional response types** (currently untyped — need to add):
`Expense`, `ExpenseListResponse`, `PLReport`, `Attachment`, `TokenClaims`, `JwksResponse`,
`HealthResponse`, `PasswordResetResponse`

**Crate dependency**: The `generated-contracts/` directory contains only source files with no
`Cargo.toml`. Before adding the path dependency, the following files must be created:

1. `generated-contracts/Cargo.toml` with `[package] name = "a-demo-contracts"` and `edition = "2021"`
2. `generated-contracts/src/lib.rs` with `pub mod models;`
3. `generated-contracts/src/models/mod.rs` that re-exports all generated model files

Then add to main `Cargo.toml`:

```toml
[dependencies]
a-demo-contracts = { path = "generated-contracts" }
```

The codegen uses `packageName=a-demo-contracts` (verified in `project.json`), so the crate name
is `a-demo-contracts`, not `generated-contracts`. Import with:
`use a_demo_contracts::models::{RegisterRequest, ...};` (Rust converts hyphens to underscores).

### F# — a-demo-be-fsharp-giraffe

**Current state**: 8 inline `[<CLIMutable>]` records in handler files. Responses built inline.

**Request types to wire**: `RegisterRequest`, `LoginRequest`, `RefreshRequest`,
`UpdateProfileRequest`, `ChangePasswordRequest`, `CreateExpenseRequest`, `UpdateExpenseRequest`,
`DisableRequest`

**Response types to wire**: `AuthTokens`, `User`, `Expense`, `ExpenseListResponse`, `PLReport`,
`Attachment`, `TokenClaims`, `JwksResponse`, `HealthResponse`, `UserListResponse`,
`PasswordResetResponse`, `ErrorResponse`

**Integration**: The codegen produces `.fs` source files but no `.fsproj` project file, so
`<ProjectReference>` cannot be used. Instead, add generated `.fs` files directly to the main
app's `.fsproj` compile list:

```xml
<Compile Include="../generated-contracts/OpenAPI/src/ADemoBeFsgi.Contracts/*.fs" />
```

Note: F# compilation order matters — add the `<Compile>` entries before any files that reference
the generated types.

Open `OpenAPI.ADemoBeFsgi.Contracts` namespace in handler files.

**IMPORTANT**: Generated F# records do NOT carry `[<CLIMutable>]`. Giraffe's `bindJsonAsync<T>()`
and ASP.NET Core model binding require a default constructor, which immutable F# records lack
without this attribute. The mitigation is to create thin `[<CLIMutable>]` wrapper records that
map to/from generated types for request binding. Generated types can be used directly for
response construction (where `[<CLIMutable>]` is not needed).

### C# — a-demo-be-csharp-aspnetcore

**Current state**: 6 sealed records in `Endpoints/` files. Responses built inline.

**Request type mapping** (local -> generated):

| Local Record            | Generated Class                   | File                |
| ----------------------- | --------------------------------- | ------------------- |
| `RegisterRequest`       | `contracts.RegisterRequest`       | AuthEndpoints.cs    |
| `LoginRequest`          | `contracts.LoginRequest`          | AuthEndpoints.cs    |
| `RefreshRequest`        | `contracts.RefreshRequest`        | AuthEndpoints.cs    |
| `PatchMeRequest`        | `contracts.UpdateProfileRequest`  | UserEndpoints.cs    |
| `ChangePasswordRequest` | `contracts.ChangePasswordRequest` | UserEndpoints.cs    |
| `ExpenseRequest`        | `contracts.CreateExpenseRequest`  | ExpenseEndpoints.cs |

**Response types to wire**: Same set as F# above.

**Integration**: The codegen produces `.cs` source files but no `.csproj` project file, so
`<ProjectReference>` cannot be used. Instead, add generated `.cs` files directly to the main
app's `.csproj` compile list:

```xml
<Compile Include="../generated-contracts/src/Org.OpenAPITools/ADemoBeCsas.Contracts/*.cs" />
```

Add `using Org.OpenAPITools.ADemoBeCsas.Contracts;` to endpoint files. The actual namespace
(verified from generated files) is `Org.OpenAPITools.ADemoBeCsas.Contracts`, not
`ADemoBeCsas.Contracts`.

### Python — a-demo-be-python-fastapi

**Current state**: 22 local Pydantic models (8 request-type + 14 response-type) defined inline in
router files. Many name mismatches. Note: `PromoteAdminRequest` is test-only and may not need
replacement.

**Request type mapping** (local -> generated):

| Local Model             | Generated Model            | File        |
| ----------------------- | -------------------------- | ----------- |
| `RegisterRequest`       | `RegisterRequest`          | auth.py     |
| `LoginRequest`          | `LoginRequest`             | auth.py     |
| `RefreshRequest`        | `RefreshRequest`           | auth.py     |
| `ChangePasswordRequest` | `ChangePasswordRequest`    | users.py    |
| `UpdateProfileRequest`  | `UpdateProfileRequest`     | users.py    |
| `ExpenseRequest`        | `CreateExpenseRequest`     | expenses.py |
| `DisableRequest`        | `DisableRequest`           | admin.py    |
| `PromoteAdminRequest`   | _(test-only — keep local)_ | test_api.py |

**Response type mapping** (local -> generated):

| Local Model              | Generated Model       | Notes                     |
| ------------------------ | --------------------- | ------------------------- |
| `TokenResponse`          | `AuthTokens`          | Name differs              |
| `RegisterResponse`       | _(evaluate)_          | May need to add to spec   |
| `UserProfileResponse`    | `User`                | Name differs              |
| `UserSummary`            | `User`                | Name differs              |
| `UserListResponse`       | `UserListResponse`    | Exact match               |
| `ExpenseResponse`        | `Expense`             | Name differs              |
| `ExpenseListResponse`    | `ExpenseListResponse` | Exact match               |
| `HealthResponse`         | `HealthResponse`      | Exact match               |
| `BreakdownItem`          | `CategoryBreakdown`   | Name differs              |
| `PLResponse`             | `PLReport`            | Name differs              |
| `AttachmentResponse`     | `Attachment`          | Name differs              |
| `AttachmentListResponse` | _(not in spec)_       | Keep local or add to spec |
| `ClaimsResponse`         | `TokenClaims`         | Name differs              |

**Integration**: Replace inline Pydantic models with `from generated_contracts import ...`. Update
FastAPI `response_model=` parameters.

### Elixir — a-demo-be-elixir-phoenix

**Current state**: No local request/response types — controllers use raw maps. Codegen target
exists but has never been run.

**Target state**: `generated-contracts/*.ex` files with Elixir structs. Controllers construct
generated structs for responses. `@enforce_keys` catches missing fields at test time.

**IMPORTANT — Module namespace**: The Elixir codegen defaults to the `GeneratedSchemas` namespace
(set in `libs/elixir-openapi-codegen/lib/openapi_codegen.ex`). No `:namespace` option is passed in
the `codegen` target, so generated modules will be named `GeneratedSchemas.User`,
`GeneratedSchemas.AuthTokens`, etc. Verify the exact namespace by inspecting the Phase 1 codegen
output. If a different namespace is desired, update the codegen invocation in
`apps/a-demo-be-elixir-phoenix/project.json` to pass a `:namespace` option.

**Types to wire** (all via struct construction in controllers, using `GeneratedSchemas.*` prefix):
`GeneratedSchemas.User`, `GeneratedSchemas.AuthTokens`, `GeneratedSchemas.Expense`,
`GeneratedSchemas.ExpenseListResponse`, `GeneratedSchemas.PLReport`, `GeneratedSchemas.Attachment`,
`GeneratedSchemas.TokenClaims`, `GeneratedSchemas.JwksResponse`, `GeneratedSchemas.HealthResponse`,
`GeneratedSchemas.UserListResponse`, `GeneratedSchemas.PasswordResetResponse`,
`GeneratedSchemas.ErrorResponse`

**Request type enforcement**: Validate incoming params match generated struct fields using
pattern matching or `Map.take/2` with struct keys.

**Ecto schemas to PRESERVE**: `Accounts.User`, `Expense.Expense`, `Attachment.Attachment`,
`Token.RevokedToken`, `Token.RefreshToken`

### Clojure — a-demo-be-clojure-pedestal

**Current state**: 6 request schemas + 1 response schema (`TokenResponse`) + many domain schemas in
`domain/schemas.clj`. Codegen target exists but has never been run.

**Target state**: Generated Malli schemas in `generated_contracts/`. Handlers validate response maps
against generated schemas.

**IMPORTANT — Clojure namespace**: The codegen produces files with namespace
`openapi-codegen.schemas.<kebab-name>` (verified from
`libs/clojure-openapi-codegen/src/openapi_codegen/generator.clj`). For example,
`AuthTokens` → namespace `openapi-codegen.schemas.auth-tokens`. Require generated schemas as:

```clojure
(:require [openapi-codegen.schemas.auth-tokens :as auth-tokens-schema])
;; Usage: (m/validate auth-tokens-schema/auth-tokens response-map)
```

Confirm exact namespaces by inspecting the Phase 1 codegen output.

**Local schemas to replace or validate against**:

| Local Schema            | Generated Schema                                  | Type     |
| ----------------------- | ------------------------------------------------- | -------- |
| `RegisterRequest`       | `openapi-codegen.schemas.register-request`        | Request  |
| `LoginRequest`          | `openapi-codegen.schemas.login-request`           | Request  |
| `RefreshRequest`        | `openapi-codegen.schemas.refresh-request`         | Request  |
| `ChangePasswordRequest` | `openapi-codegen.schemas.change-password-request` | Request  |
| `UpdateProfileRequest`  | `openapi-codegen.schemas.update-profile-request`  | Request  |
| `CreateExpenseRequest`  | `openapi-codegen.schemas.create-expense-request`  | Request  |
| `TokenResponse`         | `openapi-codegen.schemas.auth-tokens`             | Response |

**Additional response schemas** (currently untyped): `User`, `Expense`, `ExpenseListResponse`,
`PLReport`, `Attachment`, `TokenClaims`, `JwksResponse`, `HealthResponse`, `UserListResponse`,
`PasswordResetResponse`

**Domain schemas to PRESERVE**: `User` (full entity with password-hash), `PublicUser`, `Identity`,
`AccessTokenClaims`, `RefreshTokenClaims`, `Expense`, `Attachment`, `PaginationParams`,
`PaginatedResponse`, `Config`

### Dart — a-demo-fe-dart-flutterweb

**Current state**: 20 hand-written model classes across `lib/models/*.dart` with `fromJson`/`toJson`.
Codegen target exists but may not have been verified.

**Type mapping** (local -> generated):

| Local Class             | Generated Class         | File            |
| ----------------------- | ----------------------- | --------------- |
| `LoginRequest`          | `LoginRequest`          | auth.dart       |
| `RegisterRequest`       | `RegisterRequest`       | auth.dart       |
| `AuthTokens`            | `AuthTokens`            | auth.dart       |
| `User`                  | `User`                  | user.dart       |
| `UserListResponse`      | `UserListResponse`      | user.dart       |
| `UpdateProfileRequest`  | `UpdateProfileRequest`  | user.dart       |
| `ChangePasswordRequest` | `ChangePasswordRequest` | user.dart       |
| `DisableRequest`        | `DisableRequest`        | user.dart       |
| `PasswordResetResponse` | `PasswordResetResponse` | user.dart       |
| `Expense`               | `Expense`               | expense.dart    |
| `ExpenseListResponse`   | `ExpenseListResponse`   | expense.dart    |
| `CreateExpenseRequest`  | `CreateExpenseRequest`  | expense.dart    |
| `UpdateExpenseRequest`  | `UpdateExpenseRequest`  | expense.dart    |
| `Attachment`            | `Attachment`            | attachment.dart |
| `TokenClaims`           | `TokenClaims`           | token.dart      |
| `JwkKey`                | `JwkKey`                | token.dart      |
| `JwksResponse`          | `JwksResponse`          | token.dart      |
| `CategoryBreakdown`     | `CategoryBreakdown`     | report.dart     |
| `ExpenseSummary`        | `ExpenseSummary`        | report.dart     |
| `PLReport`              | `PLReport`              | report.dart     |
| `HealthResponse`        | `HealthResponse`        | health.dart     |

**Integration**: Replace hand-written classes with imports from generated package, or create
re-export layer in `lib/models/` that imports generated types.

### E2E Tests — a-demo-be-e2e and a-demo-fe-e2e

**Current state**: `validateResponseAgainstContract(path, method, statusCode, body)` is defined in
`tests/utils/contract-validator.ts` but no step definition imports or calls it.

**Target state**: Every step that receives a 2xx HTTP response body calls
`validateResponseAgainstContract`. The function returns `null` on success or an error string on
schema violation.

**Integration approach**:

- In each step definition file, import `validateResponseAgainstContract`
- After every successful HTTP request (status 2xx), add contract validation call
- The validator already handles unknown paths gracefully (returns `null`)
- Wire into: auth steps, expense steps, user steps, admin steps, attachment steps, report steps,
  token steps, health steps

## Design Decisions

### Decision 1: Re-export Layer for TypeScript Apps

**Decision**: Use a re-export layer (`src/lib/api/types.ts`) for `a-demo-be-ts-effect`, mirroring
the existing pattern in `a-demo-fe-ts-nextjs` and `a-demo-fe-ts-tanstack-start`.

**Rationale**: Stable internal import path. If generated type names change, only the re-export
layer needs updating.

### Decision 2: Keep Domain Types Separate from API Types

**Decision**: Only replace API wire format types with generated ones. Internal domain types
(database entities, error hierarchies, branded types) stay in their current location.

**Rationale**: The contract enforces the API shape, not internal business logic.

### Decision 3: Framework Annotations in Generated Code

**Decision**: Use generated types directly where they carry the required framework annotations
(`@JsonProperty` for Java, `@Serializable` for Kotlin, `serde` derives for Rust). For F#,
generated records do NOT carry `[<CLIMutable>]` — create thin wrapper records with this attribute
for request types. Create thin wrappers in other languages only if annotations are missing.

**Rationale**: Eliminates duplication without bridging overhead. F# is the known exception because
`openapi-generator fsharp-giraffe-server` does not emit `[<CLIMutable>]`.

### Decision 4: F# and C# Use Source Inclusion

**Decision**: Add generated `.fs`/`.cs` source files directly to the main app's compile list via
`<Compile Include="...">` in the main `.fsproj`/`.csproj`.

**Rationale**: The codegen produces source files only — no `.fsproj`/`.csproj` project file is
generated. `<ProjectReference>` requires a valid project file at the referenced path. Source
inclusion is the correct approach when only source files are available.

### Decision 5: Verify Codegen Before Wiring

**Decision**: Phase 1 verifies Elixir, Clojure, and Dart codegen actually produces output.

**Rationale**: More efficient to verify generation works before writing code that depends on it.

### Decision 6: E2E Contract Validation on All 2xx Responses

**Decision**: Call `validateResponseAgainstContract` on all 2xx response bodies in every step.

**Rationale**: Selective validation defeats the purpose. The function returns `null` for unknown
paths, preventing false failures.

### Decision 7: Response Types Are Mandatory (Not Optional)

**Decision**: All backends must use generated types for BOTH request parsing AND response
construction. Untyped maps (`gin.H{}`, `JsonObject`, `mapOf()`) are NOT acceptable for API
responses.

**Rationale**: Request-only enforcement catches only half the contract. Response type enforcement
ensures the API actually returns what the spec promises. Without it, a backend could accept correct
requests but return malformed responses that the contract should catch.

## Testing Strategy

### Statically Typed Apps

The test is the compiler/type-checker:

1. After wiring, run `nx run <app>:typecheck` or `nx run <app>:build`
2. Enforcement smoke test: rename a field in the contract, regenerate, verify compilation fails
3. Revert the intentional change

### Dynamically Typed Apps (Python, Elixir, Clojure)

The test is `test:unit`:

1. After wiring, run `nx run <app>:test:unit`
2. For each app, verify that at least one test explicitly constructs a generated type or validates
   against a generated schema
3. Enforcement smoke test: omit a required field in test data and verify the test fails

### E2E Tests

1. Run `nx run a-demo-be-e2e:test:e2e` against a running backend
2. Verify `validateResponseAgainstContract` is called (grep for imports in step files)
3. Enforcement smoke test: introduce a contract violation and verify the E2E scenario fails with
   a contract error

## Framework-Specific Constraints

### Go: oapi-codegen package path

Import path: `"github.com/wahidyankf/ose-public/apps/a-demo-be-golang-gin/generated-contracts"`
(aliased as `contracts`). Generated types may use `openapi_types.Date` for dates.

### Java: Maven source directory

`pom.xml` must have `generated-contracts/src/main/java` added as a source root. This configuration
does not exist yet and must be added. Use the `build-helper-maven-plugin` `add-source` execution:

```xml
<plugin>
  <groupId>org.codehaus.mojo</groupId>
  <artifactId>build-helper-maven-plugin</artifactId>
  <executions>
    <execution>
      <phase>generate-sources</phase>
      <goals><goal>add-source</goal></goals>
      <configuration>
        <sources>
          <source>generated-contracts/src/main/java</source>
        </sources>
      </configuration>
    </execution>
  </executions>
</plugin>
```

This applies to both `a-demo-be-java-springboot` and `a-demo-be-java-vertx` (each has its own
`pom.xml`). The Vert.x model package is `com.aademobejavx.contracts` (verified from
`project.json`'s `--model-package` argument). Generated DTOs carry `@JsonProperty` annotations.

### Kotlin: Gradle source set

`build.gradle.kts` must include the following (Kotlin DSL syntax — not Groovy DSL):

```kotlin
sourceSets.main {
  kotlin.srcDirs("generated-contracts/src/main/kotlin")
}
```

This configuration does not exist yet and must be added. The `a-demo-be-kotlin-ktor` project uses
`build.gradle.kts` (Kotlin DSL), so the Groovy-style
`kotlin.sourceSets["main"].kotlin.srcDirs(...)` syntax will cause a compilation error.

### Rust: generated-contracts as crate dependency

The `generated-contracts/` directory contains only `.rs` source files — no `Cargo.toml` exists.
Before adding the path dependency, create the required crate scaffolding (see Rust section above).
Once created, add to main `Cargo.toml`:

```toml
[dependencies]
a-demo-contracts = { path = "generated-contracts" }
```

The crate name is `a-demo-contracts` (from `packageName=a-demo-contracts` in the codegen command),
not `generated-contracts`. Import with `use a_demo_contracts::models::{...};`.

### F#: Source inclusion (no .fsproj in generated-contracts)

The codegen generates `.fs` source files only — no `.fsproj` project file exists. Use `<Compile>`
source inclusion instead of `<ProjectReference>`:

```xml
<Compile Include="../generated-contracts/OpenAPI/src/ADemoBeFsgi.Contracts/*.fs" />
```

Add this to the main app's `.fsproj` before any files that reference the generated types.
Note: generated F# records do NOT carry `[<CLIMutable>]` — create thin wrapper records for
request binding (see F# section above).

### C#: Source inclusion (no .csproj in generated-contracts)

The codegen generates `.cs` source files only — no `.csproj` project file exists. Use `<Compile>`
source inclusion instead of `<ProjectReference>`:

```xml
<Compile Include="../generated-contracts/src/Org.OpenAPITools/ADemoBeCsas.Contracts/*.cs" />
```

Add `using Org.OpenAPITools.ADemoBeCsas.Contracts;` to endpoint files. The namespace is
`Org.OpenAPITools.ADemoBeCsas.Contracts` (verified from generated files).

### Python: generated_contracts package

Uses underscore (`generated_contracts`) for valid Python package name. Import:
`from generated_contracts import LoginRequest`

### Elixir: Mix source paths

Add `generated-contracts/` to `elixirc_paths` in `mix.exs`.

### Clojure: classpath

Generated `.clj` files must be on the classpath. Add `generated_contracts/` as a source path in
`deps.edn` (the `a-demo-be-clojure-pedestal` app uses `deps.edn`).

### Dart: pubspec.yaml path dependency

```yaml
dependencies:
  a_demo_contracts:
    path: ./generated-contracts
```

Verify the generated package name before adding the dependency.
