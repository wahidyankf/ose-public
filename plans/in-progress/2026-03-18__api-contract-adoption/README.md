# API Contract Adoption

**Status**: In Progress

**Created**: 2026-03-18

**Delivery Type**: Multi-phase rollout

**Git Workflow**: Trunk Based Development (work on `main` branch)

## Overview

Wire the generated contract types from `specs/apps/demo/contracts/` into all 14 demo apps that
currently generate but do not import them. The previous plan
(`plans/done/2026-03-17__demo-api-contract-enforcement/`) established the infrastructure:
OpenAPI 3.1 spec, Spectral linting, Redocly bundling, `codegen` Nx targets for all 16 apps, and
custom codegen libs for Elixir and Clojure. However, an audit revealed that only 2 of the 16 apps
with codegen targets (`demo-fe-ts-nextjs` and `demo-fe-ts-tanstack-start`) actually import and use
the generated types. The other 14 generate types that sit unused.

This plan completes the enforcement model: apps must import generated types so that contract
changes cause compile or test failures — which is the original goal.

### Critical Finding: Response Types Are the Primary Gap

Deeper analysis reveals that most backends don't even have typed response objects — they build
responses as **untyped maps** (`gin.H{}`, `JsonObject`, `mapOf()`, inline objects). This means
wiring generated types requires two distinct efforts:

1. **Request types**: Replace locally-defined DTOs with generated imports (straightforward where
   local types exist)
2. **Response types**: Convert untyped map-based responses to use generated response types (more
   invasive — requires creating typed response construction)

Both request AND response types must be enforced for the contract to be meaningful.

### Current State

**Already wired (2 apps)**:

- `demo-fe-ts-nextjs` — imports via `src/lib/api/types.ts` re-export layer
- `demo-fe-ts-tanstack-start` — same pattern

**Generated but unused (14 apps)**:

| App                       | Language          | Request Types                                 | Response Types                                |
| ------------------------- | ----------------- | --------------------------------------------- | --------------------------------------------- |
| demo-be-ts-effect         | TypeScript/Effect | Inline `Record<string, unknown>` in routes    | Inline objects in routes                      |
| demo-be-golang-gin        | Go                | 4 local structs in `internal/handler/`        | Zero — all `gin.H{}` untyped maps             |
| demo-be-java-springboot   | Java/Spring Boot  | 7 DTOs in `*.dto` packages                    | 11 DTOs in `*.dto` packages (name mismatches) |
| demo-be-java-vertx        | Java/Vert.x       | Zero — all raw `JsonObject`                   | Zero — all raw `JsonObject`                   |
| demo-be-kotlin-ktor       | Kotlin/Ktor       | 9 data classes in route files                 | Zero — all `mapOf()` / inline JSON            |
| demo-be-python-fastapi    | Python/FastAPI    | 8 request models (some differ from generated) | 14 response models (many name mismatches)     |
| demo-be-rust-axum         | Rust/Axum         | 7 structs in `handlers/`                      | 5 structs in `handlers/` (name mismatches)    |
| demo-be-fsharp-giraffe    | F#                | 8 `[<CLIMutable>]` records inline             | Inline responses                              |
| demo-be-csharp-aspnetcore | C#                | 6 sealed records in `Endpoints/`              | Inline responses                              |
| demo-be-elixir-phoenix    | Elixir            | Maps in controllers                           | Maps in controllers                           |
| demo-be-clojure-pedestal  | Clojure           | 6 Malli schemas in `domain/schemas.clj`       | 1 schema (`TokenResponse`) + untyped maps     |
| demo-fe-dart-flutterweb   | Dart              | 8 model classes in `lib/models/`              | 12 model classes in `lib/models/`             |
| demo-be-e2e               | TypeScript        | N/A                                           | Validator exists but never called             |
| demo-fe-e2e               | TypeScript        | N/A                                           | Validator exists but never called             |

### Type Name Mismatches (Local vs Generated)

Many apps define types with different names than what the OpenAPI spec generates. These must be
mapped during adoption:

| Local Name                                      | Generated Name        | Apps                        |
| ----------------------------------------------- | --------------------- | --------------------------- |
| AuthResponse / TokenResponse / LoginResponse    | AuthTokens            | Java-SB, Python, Rust       |
| RegisterResponse                                | _(not in spec)_       | Java-SB, Rust               |
| UserProfileResponse / UserProfile / UserSummary | User                  | Java-SB, Python, Rust       |
| AdminUserResponse                               | User                  | Java-SB                     |
| AdminUserListResponse                           | UserListResponse      | Java-SB                     |
| AdminPasswordResetResponse                      | PasswordResetResponse | Java-SB                     |
| ExpenseRequest / CreateExpenseDto               | CreateExpenseRequest  | Java-SB, Python, Kotlin, C# |
| ExpenseResponse                                 | Expense               | Java-SB, Python             |
| AttachmentResponse                              | Attachment            | Java-SB, Python             |
| AttachmentListResponse                          | _(not in spec)_       | Java-SB, Python             |
| PlReportResponse / PLResponse                   | PLReport              | Java-SB, Python             |
| BreakdownItem                                   | CategoryBreakdown     | Python                      |
| ClaimsResponse                                  | TokenClaims           | Python                      |
| UpdateDisplayNameRequest / PatchMeRequest       | UpdateProfileRequest  | Kotlin, C#                  |
| DisableUserRequest                              | DisableRequest        | Java-SB, Kotlin             |
| ListUsersResponse                               | UserListResponse      | Rust                        |
| LogoutRequest                                   | _(not in spec)_       | Kotlin                      |
| PromoteAdminRequest                             | _(not in spec)_       | Kotlin, Python              |

Types marked _(not in spec)_ are either test-only endpoints or responses that need to be added to
the OpenAPI spec, or handled via local types that remain alongside generated ones.

### Enforcement Model (Target State)

After this plan:

```
specs/apps/demo/contracts/openapi.yaml
          |
 codegen (all 16 apps)
          |
    generated-contracts/
          |
    App imports generated types          <-- NEW: request AND response types
    Request body parsed as generated type
    Response built as generated type
    mismatch = compile/test error        <-- enforcement is now real
          |
    pre-push hook & PR quality gate      <-- already in place
```

### Integration Strategy by Language Family

**TypeScript** (`demo-be-ts-effect`): Create re-export layer (`src/lib/api/types.ts`) mirroring
frontends. Type-annotate request bodies and response objects in route handlers. Domain types
(branded Currency, Role, UserStatus) stay — they are internal concerns.

**Go** (`demo-be-golang-gin`): Import `contracts` package. Replace local request structs. For
responses, replace `gin.H{}` maps with generated response types (e.g.,
`c.JSON(200, contracts.User{...})` instead of `c.JSON(200, gin.H{...})`).

**Java** (`demo-be-java-springboot`): Replace 18 local DTO classes with generated `contracts.*`
imports. Many names differ (see mapping table). For `demo-be-java-vertx`: refactor handlers from
raw `JsonObject` to accept/return generated types via Jackson serialization.

**Kotlin** (`demo-be-kotlin-ktor`): Replace 9 inline data classes in route files with generated
`contracts.*` imports. Convert `mapOf()` response construction to generated data class instances.

**Rust** (`demo-be-rust-axum`): Replace 12 local structs with generated model imports. Add
generated-contracts crate as path dependency.

**F#** (`demo-be-fsharp-giraffe`): Add source inclusion of generated `.fs` files (no `.fsproj`
exists in `generated-contracts/`). Replace 8 inline records with generated types. Note: generated
F# records do NOT carry `[<CLIMutable>]` — thin wrapper records are required for request binding
via Giraffe. Response construction uses generated types directly.

**C#** (`demo-be-csharp-aspnetcore`): Add source inclusion of generated `.cs` files (no `.csproj`
exists in `generated-contracts/`). Replace 6 inline records with generated types. Type response
construction using generated classes. Namespace is `Org.OpenAPITools.DemoBeCsas.Contracts`.

**Python** (`demo-be-python-fastapi`): Replace 22 local Pydantic models (8 request + 14 response)
with generated imports. Update `response_model=` in FastAPI decorators to use generated types.
Name mappings needed.

**Elixir** (`demo-be-elixir-phoenix`): Run codegen first (never verified). Construct generated
structs for responses (`%User{...}`). `@enforce_keys` catches missing fields at runtime.

**Clojure** (`demo-be-clojure-pedestal`): Run codegen first (never verified). Validate response
maps against generated Malli schemas via `m/validate`.

**Dart** (`demo-fe-dart-flutterweb`): Run codegen first (never verified). Replace 20 hand-written
model classes with generated Dart classes.

**E2E** (`demo-be-e2e`, `demo-fe-e2e`): Wire `validateResponseAgainstContract` into every step
that receives a 2xx HTTP response body.

## Plan Structure

- **[requirements.md](./requirements.md)** — Problem statement, user stories, acceptance criteria
- **[tech-docs.md](./tech-docs.md)** — Integration approach per language, type mappings, design
  decisions, framework-specific constraints, testing strategy
- **[delivery.md](./delivery.md)** — Phased implementation with per-app, per-file granular
  checklists covering every request and response type
