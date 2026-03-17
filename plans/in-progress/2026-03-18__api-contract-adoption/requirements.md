# Requirements

## Objectives

1. **Import generated types** — all 14 remaining apps must reference types from their
   `generated-contracts/` folder rather than locally-defined duplicates
2. **Real contract enforcement** — a field rename in `specs/apps/demo/contracts/` must cause a
   compile error (statically typed apps) or a test failure (dynamically typed apps) before push
3. **Request AND response types** — both incoming request body parsing and outgoing response
   construction must use generated types; untyped maps (`gin.H{}`, `JsonObject`, `mapOf()`) are
   replaced with typed generated structs/classes
4. **All tests pass** — `test:quick` passes for all 14 apps after contract wiring; no regressions
5. **All E2E workflows pass** — the 14 app-specific E2E CI workflows continue to pass
6. **E2E contract validation** — `demo-be-e2e` and `demo-fe-e2e` step definitions call
   `validateResponseAgainstContract` on every HTTP response body, not just define the function

## User Stories

### Story 1: Contract change breaks apps that diverge

```gherkin
Scenario: Renaming a contract field propagates to all apps
  Given the OpenAPI spec defines LoginRequest with field "username"
  And all apps import request AND response types from generated-contracts/
  When a developer renames "username" to "email" in the spec
  And runs nx affected -t typecheck
  Then all statically typed apps (Go, Java, Kotlin, Rust, F#, C#, TypeScript) fail compilation
  And all dynamically typed apps (Python, Elixir, Clojure) fail test:unit
  And the developer is informed before the change can be pushed
```

### Story 2: Local duplicate request types are eliminated

```gherkin
Scenario: Handler no longer defines its own request type
  Given demo-be-golang-gin defines RegisterRequest struct locally in handler/auth.go
  When contract adoption is complete for demo-be-golang-gin
  Then handler/auth.go imports contracts.RegisterRequest from generated-contracts/
  And the local RegisterRequest struct definition is removed from handler/auth.go
  And the app builds and all tests pass
```

### Story 3: Response types are enforced (not just request types)

```gherkin
Scenario: Handler builds response using generated type instead of untyped map
  Given demo-be-golang-gin builds user responses via gin.H{} untyped maps
  When contract adoption is complete for demo-be-golang-gin
  Then auth handler returns contracts.User{} or contracts.AuthTokens{} typed responses
  And a field name mismatch causes go build to fail
  And the app builds and all tests pass
```

### Story 4: Dynamic languages validate at test time

```gherkin
Scenario: Python FastAPI uses generated Pydantic model for request AND response
  Given demo-be-python-fastapi defines ExpenseRequest inline in routers/expenses.py
  And defines ExpenseResponse inline as the response model
  When contract adoption is complete for demo-be-python-fastapi
  Then routers/expenses.py imports CreateExpenseRequest from generated_contracts
  And the response_model uses Expense from generated_contracts
  And the local ExpenseRequest and ExpenseResponse classes are removed
  And nx run demo-be-python-fastapi:test:unit passes
```

### Story 5: E2E tests validate response shapes against the contract

```gherkin
Scenario: E2E step definitions call contract validator
  Given demo-be-e2e has validateResponseAgainstContract defined in utils/contract-validator.ts
  But step definitions never call validateResponseAgainstContract
  When contract adoption is complete for demo-be-e2e
  Then every step that receives an HTTP response body calls validateResponseAgainstContract
  And nx run demo-be-e2e:test:e2e passes with contract validation active
```

### Story 6: Dart frontend replaces hand-written models with generated ones

```gherkin
Scenario: Flutter app uses generated Dart models
  Given demo-fe-dart-flutterweb defines User, Expense, etc. in lib/models/*.dart manually
  When contract adoption is complete for demo-fe-dart-flutterweb
  Then lib/models/*.dart imports or re-exports generated model classes
  And dart analyze passes with no errors
```

### Story 7: Java Vert.x replaces raw JsonObject with typed contracts

```gherkin
Scenario: Vert.x handler uses generated types instead of raw JsonObject
  Given demo-be-java-vertx builds all request parsing via body.getString("field")
  And builds all responses via new JsonObject().put(...)
  When contract adoption is complete for demo-be-java-vertx
  Then handlers deserialize request bodies into generated contract types
  And handlers serialize generated contract types into responses
  And a field name mismatch causes `nx run demo-be-java-vertx:build` to fail
```

## Functional Requirements

### FR-1: Import wiring (all 14 apps)

Each of the 14 apps must have at least one source file that imports a type from its
`generated-contracts/` folder. The import must be a real usage, not a dead import (i.e., the type
is used in a function signature, struct field, or variable declaration).

### FR-2: Removal of local duplicates

Where a local type is a direct duplicate of a generated type (same fields, same semantics), the
local type must be removed and all usages must reference the generated type. Where a local type has
framework-specific annotations or domain extensions that the generated type lacks, a bridging
approach is acceptable (see tech-docs.md).

### FR-3: Compile-time enforcement for statically typed apps

For `demo-be-ts-effect`, `demo-be-golang-gin`, `demo-be-java-springboot`, `demo-be-java-vertx`,
`demo-be-kotlin-ktor`, `demo-be-rust-axum`, `demo-be-fsharp-giraffe`, `demo-be-csharp-aspnetcore`,
and `demo-fe-dart-flutterweb`: a field name mismatch between the app's handler type and the
generated type must cause a build or typecheck failure.

### FR-4: Test-time enforcement for dynamically typed apps

For `demo-be-python-fastapi`, `demo-be-elixir-phoenix`, and `demo-be-clojure-pedestal`: the
generated schemas/models must be imported and used such that an incorrect field name causes
`test:unit` to fail. This failure must surface before `git push` via the pre-push hook.

### FR-5: Response type enforcement (all 14 apps)

Response construction must use generated types, not untyped maps. Specifically:

- Go: `contracts.User{...}` instead of `gin.H{...}`
- Java Vert.x: `Json.encode(new contracts.User(...))` instead of `new JsonObject().put(...)`
- Kotlin: `call.respond(contracts.User(...))` instead of `call.respond(mapOf(...))`
- TypeScript: response objects annotated with generated types
- Rust: handler return types use generated structs
- F#/C#: handler responses construct generated record/class instances
- Python: `response_model=` uses generated Pydantic models
- Elixir: responses construct generated structs with `@enforce_keys`
- Clojure: responses validated against generated Malli schemas

### FR-6: E2E contract validation active

For `demo-be-e2e` and `demo-fe-e2e`: `validateResponseAgainstContract` must be called in step
definitions that receive HTTP response bodies, not just defined. Validation must run for all success
(2xx) responses at a minimum.

### FR-7: No test regressions

All apps must pass `test:quick` after contract wiring. No existing test may be broken by the type
replacement.

### FR-8: Elixir and Clojure codegen verified

Before wiring, verify that `nx run demo-be-elixir-phoenix:codegen` and
`nx run demo-be-clojure-pedestal:codegen` actually produce files in their `generated-contracts/`
directories. Fix any issues found.

### FR-9: Dart codegen verified

Verify that `nx run demo-fe-dart-flutterweb:codegen` produces Dart model classes. If the codegen
target is not implemented, implement it using `openapi-generator` with the `dart` generator.

### FR-10: Name mapping resolved

Where local type names differ from generated names (see README.md mapping table), all references
are updated to use the generated name. If a local name is needed for backward compatibility, a
type alias or re-export is used (not a separate class definition).

## Non-Functional Requirements

### NFR-1: Test coverage maintained

All apps must maintain their existing test coverage thresholds (>=90% for backends, >=70% for
frontends) after contract wiring.

### NFR-2: Build times not significantly degraded

The added import does not introduce new compilation phases — `codegen` is already a dependency of
`typecheck`/`build`/`test:unit`. No new build steps are added.

### NFR-3: No new runtime dependencies

Contract wiring uses types that are already generated. No new runtime libraries are added. Codegen
tools are already dev dependencies.

### NFR-4: Framework annotations preserved

For apps that need framework-specific annotations (e.g., Spring `@Valid`, Ktor `@Serializable`),
generated types that already carry those annotations (generated Java DTOs have `@JsonProperty`,
generated Kotlin classes have `@Serializable`) must be used directly. If the generator does not
produce required annotations, a thin adapter/alias approach is acceptable.

## Acceptance Criteria

```gherkin
Scenario: All 14 apps import from generated-contracts for BOTH request AND response types
  Given contract adoption work is complete
  When you search for generated-contracts/ imports across the repo
  Then at least one source file per app imports a type from generated-contracts/
  And no app still defines a local duplicate of an API type that exists in generated-contracts/
  And request body parsing uses generated types
  And response construction uses generated types

Scenario: Contract enforcement verified end-to-end
  Given all 14 apps import from generated-contracts/
  When a developer renames the "accessToken" field to "token" in schemas/auth.yaml
  And runs nx affected -t typecheck && nx affected -t test:unit
  Then all statically typed apps fail with a type error referencing "accessToken"
  And all dynamically typed apps fail with a test error referencing "accessToken"
  And no app silently accepts the renamed field

Scenario: All tests pass after wiring
  Given all 14 apps import from generated-contracts/
  When nx run-many -t test:quick --projects=demo-* runs
  Then all 14 apps pass test:quick
  And coverage thresholds are not violated

Scenario: E2E suites pass with contract validation active
  Given demo-be-e2e and demo-fe-e2e call validateResponseAgainstContract in step definitions
  When nx run demo-be-e2e:test:e2e and nx run demo-fe-e2e:test:e2e run
  Then both E2E suites pass
  And contract validation was called for all 2xx response bodies
```

## Scope

### In Scope

- Wiring generated types into all 14 apps for BOTH request AND response types
- Fixing any codegen issues found for Elixir, Clojure, and Dart
- Calling `validateResponseAgainstContract` in E2E step definitions
- Removing local type duplicates replaced by generated types
- Resolving name mismatches between local and generated types
- Converting untyped response maps to use generated types
- Maintaining all existing test coverage thresholds

### Out of Scope

- Adding new endpoints to the contract
- Changing existing endpoint semantics
- Changing the codegen tools or generators (already set up)
- Adding new Gherkin scenarios (existing scenarios already cover the API)
- Changing the Nx dependency chain (already set up: codegen -> typecheck/build/test:unit)

### Conditionally In Scope (Evaluated in Phase 0)

- Adding missing response type schemas to the OpenAPI spec (`RegisterResponse`,
  `AttachmentListResponse`) if needed for complete contract coverage — covered in Phase 0.
  The spec modification is in scope only for filling gaps in existing API shapes, not for
  changing existing endpoint behavior.
