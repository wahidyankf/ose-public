# Requirements

## Objectives

**Primary Objectives**:

1. Create a machine-readable OpenAPI 3.1 contract covering all demo application endpoints
2. Auto-generate type-safe code (types + encoders/decoders) into each app's `generated-contracts/`
   folder from the contract
3. Apps import generated types; mismatches fail at compile time (`typecheck`/`build`)
4. Generated folders are gitignored — code is regenerated via `nx run <app>:codegen`
5. Violations caught by existing PR quality gate (`nx affected -t typecheck`, `lint`, `test:quick`)
6. All JSON fields use **strict camelCase** — no snake_case, no kebab-case, zero exceptions
7. Generate browsable API documentation (Redoc) viewable by public/product/any team

**Secondary Objectives**:

1. Provide example request/response pairs as documentation and test fixtures
2. Enable future deployment of API docs to a public URL

## User Stories

**Story 1: Backend Developer Adding a New Field**

```gherkin
Feature: Contract prevents unnoticed API drift
  As a backend developer
  I want generated types to enforce the contract shape
  So that all implementations stay in sync

Scenario: Adding a field without updating the contract
  Given the OpenAPI contract defines the Expense response schema
  And the generated Go struct does not include a "tags" field
  When I try to set response.Tags in demo-be-golang-gin
  Then the Go compiler should fail because the field does not exist
  And I must update the contract and re-run codegen to add it

Scenario: Removing a required field
  Given the generated Python Pydantic model requires "currency"
  When I remove "currency" from demo-be-python-fastapi's handler return
  Then Pydantic validation should fail in test:unit
  And pre-push hook catches this via test:quick
```

**Story 2: Frontend Developer Consuming API Types**

```gherkin
Feature: Frontend types are auto-generated from contract
  As a frontend developer
  I want generated types with encoders/decoders
  So that my API calls are type-safe

Scenario: Contract change updates frontend types
  Given the OpenAPI contract adds an optional "tags" field to Expense
  When I run nx run demo-fe-ts-nextjs:codegen
  Then the generated types include "tags?: string[]"
  And the openapi-fetch client automatically handles encoding/decoding
  And TypeScript compilation succeeds

Scenario: Frontend code references non-existent field
  Given the generated types do not include a "notes" field on Expense
  When I reference expense.notes in demo-fe-ts-nextjs
  Then tsc should produce a compile error
  And pre-push hook blocks the push via typecheck
```

**Story 3: Contract Change Triggers Regeneration**

```gherkin
Feature: Nx dependency graph triggers codegen cascade
  As a developer
  I want contract changes to regenerate all consumer code
  So that no project silently falls out of compliance

Scenario: Modifying a schema triggers codegen for all apps
  Given I modify specs/apps/demo/contracts/schemas/expense.yaml
  When Nx computes affected projects
  Then demo-contracts:bundle runs first
  Then all demo-be-* and demo-fe-* codegen targets run
  Then typecheck/build/test:quick runs against the new generated code
  And any mismatch fails the PR quality gate
```

**Story 4: Generated Code is Not Committed**

```gherkin
Feature: Generated contracts are gitignored
  As a developer
  I want generated-contracts/ folders to be gitignored
  So that the repo stays clean and the contract is the only source of truth

Scenario: Fresh clone regenerates all contract code
  Given a developer clones the repository
  When they run npm install (which triggers postinstall codegen)
  Then all generated-contracts/ folders are populated
  And typecheck/build succeeds immediately

Scenario: Generated code is excluded from git
  Given apps/demo-be-golang-gin/generated-contracts/ exists locally
  When I run git status
  Then generated-contracts/ should not appear as untracked
```

**Story 5: Product Team Views API Documentation**

```gherkin
Feature: Browsable API documentation from the contract
  As a product manager or stakeholder
  I want to browse the API documentation
  So that I can understand available endpoints without reading code

Scenario: Generate API documentation locally
  Given the OpenAPI contract is valid
  When I run nx run demo-contracts:docs
  Then a browsable HTML page is generated at specs/apps/demo/contracts/generated/docs/index.html
  And it shows all endpoints with request/response schemas
  And it includes example request/response pairs
  And test-only endpoints (/api/v1/test/*) are excluded

Scenario: Documentation reflects latest contract
  Given I add a new "tags" field to the Expense schema
  When I run nx run demo-contracts:docs
  Then the Expense section in the docs shows the new "tags" field
```

## Alternatives Analysis

### Alternative 1: OpenAPI 3.1 (Single YAML) + Language-Specific Validators

**Approach**: Single `openapi.yaml` with runtime validators in each project's tests.

**Pros**: Industry standard, massive tooling, human-readable YAML, JSON Schema 2020-12 compatible

**Cons**: Large single file, runtime-only validation (not compile-time), no generated
encoders/decoders

**Estimated effort**: Medium

---

### Alternative 2: JSON Schema (Standalone) + Test-Time Validation

**Approach**: JSON Schema files per endpoint, validated at test time.

**Pros**: Simpler than OpenAPI, every language has a JSON Schema library

**Cons**: No HTTP semantics (methods, paths, status codes), no code generation, many files

**Estimated effort**: Medium

---

### Alternative 3: TypeScript Types as Source of Truth + Cross-Language Validation

**Approach**: Canonical TypeScript interfaces + `typescript-json-schema` to generate JSON Schemas.

**Pros**: Types already exist, TypeScript is expressive, low authoring friction

**Cons**: TypeScript-centric (wrong for polyglot repo), no HTTP semantics, requires build step

**Estimated effort**: Low-Medium

---

### Alternative 4: Protocol Buffers (Protobuf) + gRPC-Gateway Style

**Approach**: `.proto` files with `protoc` plugins for each language.

**Pros**: Precise types, schema evolution rules, enterprise-grade code generation

**Cons**: Conceptual mismatch with REST/JSON, heavy tooling, no Elixir/F#/Clojure support

**Estimated effort**: High

---

### Alternative 5: Zod Schemas + `zod-to-openapi` Bridge

**Approach**: Zod schemas → OpenAPI spec → language-specific validators.

**Pros**: Zod gives runtime + compile-time safety for TS, OpenAPI output for ecosystem

**Cons**: TypeScript-centric, two layers of abstraction, non-TS devs must read Zod

**Estimated effort**: Medium

---

### Alternative 6: OpenAPI 3.1 (Modular YAML) + Spectral Linting + Code Generation

**Approach**: Modular OpenAPI spec split by domain using `$ref`. Language-specific code generators
produce types + encoders/decoders in each app's `generated-contracts/` folder. Apps import
generated types; compiler catches mismatches. Spectral lints the spec for style.

**Pros**:

- All HTTP semantics in one spec (paths, methods, status codes, body schemas)
- Modular structure mirrors Gherkin domain organization
- Code generation produces compile-time-safe types in all 11 languages
- Generated encoders/decoders handle serialization type-safely
- Spectral linting enforces naming conventions
- `generated-contracts/` gitignored — contract is sole source of truth
- Violations caught by existing pre-push hook and PR quality gate

**Cons**:

- More files than single YAML (but each is small and domain-focused)
- Code generator per language (11 generators to configure)
- Dynamic languages (Elixir, Clojure) enforce at test time rather than compile time

**Estimated effort**: Medium-High

---

## Recommendation Matrix

| Criterion                       | Alt 1: OpenAPI Single | Alt 2: JSON Schema | Alt 3: TS Types | Alt 4: Protobuf | Alt 5: Zod | Alt 6: OpenAPI Modular + Codegen |
| ------------------------------- | --------------------- | ------------------ | --------------- | --------------- | ---------- | -------------------------------- |
| Compile-time enforcement        | No                    | No                 | TS only         | Yes (most)      | TS only    | Yes (all statically-typed)       |
| Generated encoders/decoders     | No                    | No                 | No              | Yes             | TS only    | Yes                              |
| Captures full HTTP semantics    | Yes                   | No                 | Partial         | Partial         | Yes        | Yes                              |
| Language-agnostic authoring     | Yes                   | Yes                | No              | Yes             | No         | Yes                              |
| Tooling maturity (all 11 langs) | High                  | High               | Medium          | Low             | Medium     | High                             |
| Gitignored generated code       | N/A                   | N/A                | Partial         | Yes             | Partial    | Yes                              |
| Works with existing CI          | No (new checks)       | No                 | Partial         | No              | Partial    | Yes (typecheck/test:quick)       |
| Complements existing Gherkin    | Yes                   | Partial            | Partial         | No              | Yes        | Yes                              |

## Recommended Approach: Alternative 6

**Why Alternative 6 — OpenAPI 3.1 Modular + Spectral + Code Generation**:

1. **Compile-time safety** — generated types make it impossible to return wrong shapes in statically
   typed languages. Dynamic languages (Elixir, Clojure, Python) enforce via generated
   schemas/models at test time, caught by `test:quick`.
2. **Encoders/decoders included** — generated code handles JSON serialization/deserialization
   type-safely (Jackson for Java, serde for Rust, Pydantic for Python, etc.)
3. **Zero runtime overhead** — generated types are compile-time-only artifacts. No validation
   middleware in production.
4. **Fits existing CI** — `nx affected -t typecheck` and `test:quick` already run in pre-push hook
   and PR quality gate. No new CI steps needed.
5. **Gitignored** — `generated-contracts/` is not committed. The OpenAPI spec is the sole source of
   truth. Generated code is a build artifact.

## Acceptance Criteria

```gherkin
Feature: API contract enforcement via code generation

  Scenario: Contract spec exists and is valid
    Given the file specs/apps/demo/contracts/openapi.yaml exists
    When Spectral lints the OpenAPI specification
    Then there should be zero errors
    And the spec should cover all endpoints from the Gherkin features

  Scenario: Each app has a codegen target
    Given every demo-be-* and demo-fe-* project has a "codegen" Nx target
    When nx run <app>:codegen runs
    Then a generated-contracts/ folder is created with language-specific types
    And the folder contains encoders and decoders for each schema

  Scenario: Generated folders are gitignored
    Given the root .gitignore includes **/generated-contracts/ and **/generated_contracts/
    When a developer runs git status after codegen
    Then no generated-contracts/ folder appears as untracked

  Scenario: Backend compile-time enforcement (statically typed)
    Given demo-be-golang-gin uses generated Go structs as handler return types
    When the contract changes and codegen re-runs
    Then any handler returning the old shape fails compilation
    And this is caught by nx affected -t test:quick before push

  Scenario: Backend test-time enforcement (dynamically typed)
    Given demo-be-elixir-phoenix uses generated structs with @enforce_keys
    When the contract changes and codegen re-runs
    Then any handler returning the old shape fails in test:unit
    And this is caught by nx affected -t test:quick before push

  Scenario: Frontend compile-time enforcement
    Given demo-fe-ts-nextjs imports generated TypeScript types
    When the contract changes and codegen re-runs
    Then any component using old field names fails tsc
    And this is caught by nx affected -t typecheck before push

  Scenario: PR quality gate catches violations
    Given a PR modifies specs/apps/demo/contracts/schemas/expense.yaml
    When the PR quality gate runs
    Then nx affected -t typecheck runs (catches TS/Dart mismatches)
    And nx affected -t test:quick runs (catches all language mismatches)
    And the PR fails if any app doesn't match the new contract

  Scenario: Fresh clone works after npm install
    Given a developer clones the repository
    When they run npm install
    Then postinstall triggers codegen for all demo apps
    And typecheck/build succeeds immediately

  Scenario: API documentation is generated
    Given the OpenAPI specification is valid
    When nx run demo-contracts:docs runs
    Then a browsable HTML page is generated
    And it shows all endpoints grouped by domain
    And it includes request/response schemas with examples
    And test-only endpoints are excluded from the documentation
```

## Constraints

1. **Must not break existing tests** — contract enforcement is additive
2. **Generated code must be gitignored** — only the OpenAPI spec is committed
3. **Must use existing CI pipeline** — no new GitHub Actions workflows; leverage `typecheck`,
   `lint`, `test:quick` which already run in PR quality gate
4. **Contract lives in `specs/`** — not inside any individual app
5. **Trunk Based Development** — all work on main branch
6. **Generated code must include encoders AND decoders** — not just types but full
   serialization/deserialization support
7. **Strict camelCase** — all JSON field names use camelCase, zero exceptions
8. **Browsable documentation** — the contract must produce HTML documentation viewable by
   non-developers (product, stakeholders, public)

## Out of Scope

1. Replacing Gherkin specs with OpenAPI — they serve different purposes
2. Runtime validation in production (only compile-time/test-time enforcement)
3. Generating full server stubs (only types + encoders/decoders, not routing/handlers)
4. WebSocket or streaming API contracts (REST/JSON only)
