# Technical Documentation

## Contract File Structure

```
specs/apps/demo/contracts/
├── README.md                 # Purpose, usage, how to add/modify
├── openapi.yaml              # Root OpenAPI 3.1 document
├── .spectral.yaml            # Spectral linting rules
├── project.json              # Nx project: demo-contracts (lint, bundle targets)
├── paths/
│   ├── health.yaml           # GET /health
│   ├── auth.yaml             # POST /api/v1/auth/{login,register,refresh,logout,logout-all}
│   ├── users.yaml            # GET/PATCH /api/v1/users/me, POST password/deactivate
│   ├── expenses.yaml         # CRUD /api/v1/expenses, summary
│   ├── attachments.yaml      # /api/v1/expenses/{id}/attachments
│   ├── reports.yaml          # GET /api/v1/reports/pl
│   ├── admin.yaml            # /api/v1/admin/users/*
│   ├── tokens.yaml           # GET /api/v1/tokens/claims, /.well-known/jwks.json
│   └── test-support.yaml     # POST /api/v1/test/{reset-db,promote-admin}
├── schemas/
│   ├── auth.yaml             # LoginRequest, LoginResponse, RegisterRequest, etc.
│   ├── user.yaml             # User, UpdateProfileRequest, ChangePasswordRequest
│   ├── expense.yaml          # Expense, CreateExpenseRequest, UpdateExpenseRequest
│   ├── expense-list.yaml     # ExpenseListResponse (uses pagination.yaml)
│   ├── report.yaml           # PLReport, CategoryBreakdown, ExpenseSummary
│   ├── attachment.yaml       # Attachment
│   ├── token.yaml            # TokenClaims, JwksResponse, JwkKey
│   ├── admin.yaml            # DisableRequest, PasswordResetResponse, UserListResponse
│   ├── pagination.yaml       # Reusable pagination envelope
│   ├── error.yaml            # Standardized error response
│   └── health.yaml           # HealthResponse
├── redocly.yaml              # Redocly config (docs theme, x-test-only filtering)
├── generated/                # Bundled spec + docs output (gitignored)
│   ├── openapi-bundled.yaml  # Single resolved file for code generators
│   ├── openapi-bundled.json  # JSON variant for ajv validation in E2E tests
│   └── docs/
│       └── index.html        # Browsable API documentation (Redoc)
└── examples/
    ├── auth-login.yaml       # Example request/response pairs
    └── expense-create.yaml   # Example expense creation
```

## Generated Code in Each App

Every demo app gets a `generated-contracts/` folder that is:

- **Auto-generated** from `specs/apps/demo/contracts/generated/openapi-bundled.yaml`
- **Gitignored** — not committed; regenerated via `nx run <app>:codegen`
- **Imported by app code** — handlers/controllers use generated types for request/response
- **Contains encoders/decoders** — type-safe JSON serialization/deserialization

### Generated Folder Layout (per app)

```
apps/demo-be-golang-gin/
├── generated-contracts/      # gitignored via root **/generated-contracts/
│   ├── types.gen.go          # Go structs matching OpenAPI schemas
│   ├── server.gen.go         # Server interface (strict mode)
│   └── spec.gen.go           # Embedded OpenAPI spec
└── internal/
    ├── handler/              # Handlers implement generated interface
    └── ...

apps/demo-fe-ts-nextjs/
├── src/
│   ├── generated-contracts/  # gitignored via root **/generated-contracts/
│   │   └── api.d.ts          # Generated TypeScript types
│   └── lib/api/
│       ├── client.ts         # Uses openapi-fetch with generated types
│       └── types.ts          # Re-exports from generated (or removed)
└── ...
```

## Code Generation Strategy Per Language

### Statically Typed Languages (compile-time enforcement)

These languages catch contract violations at compile time via `typecheck` or `build` targets.

| Language      | App                       | Generator                    | Generated Output                     | Encoder/Decoder                    |
| ------------- | ------------------------- | ---------------------------- | ------------------------------------ | ---------------------------------- |
| Go            | demo-be-golang-gin        | `oapi-codegen` (strict)      | Go structs + strict server interface | `encoding/json` via generated code |
| Java (Spring) | demo-be-java-springboot   | `openapi-generator` (spring) | Java DTOs with Jackson annotations   | Jackson `@JsonProperty`            |
| Java (Vert.x) | demo-be-java-vertx        | `openapi-generator` (java)   | Java DTOs with Jackson annotations   | Jackson `@JsonProperty`            |
| Kotlin        | demo-be-kotlin-ktor       | `openapi-generator` (kotlin) | Kotlin data classes                  | kotlinx.serialization              |
| Rust          | demo-be-rust-axum         | `openapi-generator` (rust)   | Rust structs with serde derive       | `serde::Serialize/Deserialize`     |
| F#            | demo-be-fsharp-giraffe    | `NSwag` CLI                  | F# record types                      | System.Text.Json                   |
| C#            | demo-be-csharp-aspnetcore | `NSwag` CLI                  | C# classes with JsonProperty         | System.Text.Json / Newtonsoft      |
| TypeScript    | demo-be-ts-effect         | `openapi-typescript`         | TypeScript types                     | Effect Schema encode/decode        |
| TypeScript    | demo-fe-ts-nextjs         | `openapi-typescript`         | TypeScript types                     | `openapi-fetch` type-safe client   |
| TypeScript    | demo-fe-ts-tanstack-start | `openapi-typescript`         | TypeScript types                     | `openapi-fetch` type-safe client   |
| Dart          | demo-fe-dart-flutterweb   | `openapi-generator` (dart)   | Dart classes with json_serializable  | `toJson()` / `fromJson()`          |

**Library verification** (web-researched 2026-03-17):

- **oapi-codegen** — Generates Go types + strict server interfaces from OpenAPI 3.x. Strict mode
  auto-parses request bodies and encodes responses, forcing handler code to comply with schema.
  Supports Gin, Chi, Echo, Fiber, Iris.
- **openapi-generator** — Multi-language generator supporting Java (Spring, Vert.x), Kotlin
  (kotlinx.serialization), Rust (serde), Dart (json_serializable). Generates DTOs with full
  encoder/decoder annotations.
- **NSwag** — .NET toolchain generating C# classes and F# types from OpenAPI specs with
  System.Text.Json serialization. Generates strongly-typed HTTP clients and models.
- **openapi-typescript** — Generates TypeScript types from OpenAPI 3.0/3.1 in milliseconds.
  Runtime-free types. Pairs with `openapi-fetch` for type-safe HTTP client.
- **openapi-fetch** — Type-safe fetch client (6kb) that uses `openapi-typescript` generated types.
  Provides compile-time checked request/response types with zero runtime overhead.

### Dynamically Typed Languages (test-time enforcement)

These languages lack static type systems, so enforcement happens at test time via generated
schemas/structs validated in `test:unit`. This is caught by `test:quick` in pre-push hook and PR
quality gate.

| Language | App                      | Generator                             | Generated Output                    | Encoder/Decoder                       |
| -------- | ------------------------ | ------------------------------------- | ----------------------------------- | ------------------------------------- |
| Python   | demo-be-python-fastapi   | `datamodel-code-generator` (Pydantic) | Pydantic v2 models                  | `.model_dump()` / `.model_validate()` |
| Elixir   | demo-be-elixir-phoenix   | Custom script + `open_api_spex`       | Elixir structs with `@enforce_keys` | Jason encode + CastAndValidate        |
| Clojure  | demo-be-clojure-pedestal | Custom script → Malli schemas         | Malli schema definitions            | `m/encode` / `m/decode`               |

**Library verification** (web-researched 2026-03-17):

- **datamodel-code-generator** — Python tool (v0.45.0, Dec 2025) generating Pydantic v2 models
  from OpenAPI/JSON Schema. 274k weekly downloads. Pydantic provides runtime validation +
  serialization via `.model_dump()` and `.model_validate()`.
- **open_api_spex** — Elixir library (v3.22.2) for OpenAPI schema definition, casting, and
  validation. `CastAndValidate` plug validates request/response against schemas.
- **Malli** — Clojure data validation library supporting OpenAPI schema generation. `m/encode`
  and `m/decode` provide type-safe serialization with coercion.

### E2E Tests — Additional Runtime Validation

Both `demo-be-e2e` and `demo-fe-e2e` (Playwright/TypeScript) add an `ajv`-based response validator
as a safety net. This catches drift that might bypass compile-time checks (e.g., a backend returns
extra fields not in the schema).

```typescript
// demo-be-e2e/tests/utils/contract-validator.ts
import Ajv from "ajv";
import { readFileSync } from "fs";

const spec = JSON.parse(readFileSync("specs/apps/demo/contracts/generated/openapi-bundled.json", "utf-8"));
const ajv = new Ajv({ allErrors: true });

export function validateResponse(path: string, method: string, statusCode: number, body: unknown): void {
  const schema = spec.paths[path]?.[method]?.responses?.[statusCode]?.content?.["application/json"]?.schema;
  if (!schema) throw new Error(`No schema for ${method.toUpperCase()} ${path} ${statusCode}`);
  const valid = ajv.validate(schema, body);
  if (!valid) throw new Error(`Contract violation: ${ajv.errorsText()}`);
}
```

## Nx Integration

### Dependency Chain

```
demo-contracts:lint → demo-contracts:bundle → <app>:codegen → <app>:typecheck/build/test:unit
```

Every demo app's `codegen` target depends on `demo-contracts:bundle`. Every `typecheck`, `build`,
and `test:unit` target depends on `codegen`. This ensures:

1. Contract changes trigger re-bundling
2. Re-bundling triggers code regeneration in all affected apps
3. Regenerated code triggers recompilation/type checking
4. Any mismatch fails the chain

### New Nx Project: `demo-contracts`

```json
{
  "name": "demo-contracts",
  "root": "specs/apps/demo/contracts",
  "targets": {
    "lint": {
      "command": "npx @stoplight/spectral-cli lint specs/apps/demo/contracts/openapi.yaml --ruleset specs/apps/demo/contracts/.spectral.yaml",
      "cache": true,
      "inputs": ["specs/apps/demo/contracts/**/*.yaml"]
    },
    "bundle": {
      "command": "npx @redocly/cli bundle specs/apps/demo/contracts/openapi.yaml -o specs/apps/demo/contracts/generated/openapi-bundled.yaml && npx @redocly/cli bundle specs/apps/demo/contracts/openapi.yaml -o specs/apps/demo/contracts/generated/openapi-bundled.json",
      "dependsOn": ["lint"],
      "cache": true,
      "inputs": ["specs/apps/demo/contracts/**/*.yaml"],
      "outputs": ["specs/apps/demo/contracts/generated/"]
    },
    "docs": {
      "command": "npx @redocly/cli build-docs specs/apps/demo/contracts/generated/openapi-bundled.yaml -o specs/apps/demo/contracts/generated/docs/index.html --config specs/apps/demo/contracts/redocly.yaml",
      "dependsOn": ["bundle"],
      "cache": true,
      "inputs": ["specs/apps/demo/contracts/generated/openapi-bundled.yaml"],
      "outputs": ["specs/apps/demo/contracts/generated/docs/"]
    }
  }
}
```

### Per-App Codegen Target (example: Go)

```json
{
  "codegen": {
    "command": "oapi-codegen -config oapi-codegen.yaml ../../specs/apps/demo/contracts/generated/openapi-bundled.yaml",
    "dependsOn": ["demo-contracts:bundle"],
    "cache": true,
    "inputs": ["specs/apps/demo/contracts/generated/openapi-bundled.yaml"],
    "outputs": ["apps/demo-be-golang-gin/generated-contracts/"]
  },
  "typecheck": {
    "dependsOn": ["codegen"]
  },
  "build": {
    "dependsOn": ["codegen"]
  },
  "test:unit": {
    "dependsOn": ["codegen"]
  }
}
```

### Implicit Dependencies

All demo apps declare implicit dependency on `demo-contracts` in `nx.json` so that `nx affected`
detects contract changes:

```json
{
  "namedInputs": {
    "contract": ["specs/apps/demo/contracts/**/*.yaml"]
  }
}
```

### Postinstall Hook

`package.json` includes a postinstall script that runs codegen for all demo apps, ensuring a fresh
clone is immediately buildable:

```json
{
  "scripts": {
    "postinstall": "npx nx run-many -t codegen --projects=demo-*"
  }
}
```

## Gitignore Setup

### Root `.gitignore` Addition

```gitignore
# Generated contract code (regenerated by nx run <app>:codegen)
**/generated-contracts/
# Python variant (Python packages use underscores, not hyphens)
**/generated_contracts/
# Bundled OpenAPI spec
specs/apps/demo/contracts/generated/
```

These root-level patterns cover all apps including Python (which uses underscores for valid
package names). No per-app `.gitignore` changes needed.

## Spectral Rules

```yaml
# specs/apps/demo/contracts/.spectral.yaml
extends: ["spectral:oas"]
rules:
  # Enforce camelCase for all schema properties
  oas3-schema-properties-camelCase:
    severity: error
    given: "$.components.schemas..properties.*~"
    then:
      function: casing
      functionOptions:
        type: camel

  # Require descriptions on all schemas
  oas3-schema-description:
    severity: warn
    given: "$.components.schemas.*"
    then:
      field: description
      function: truthy

  # Require examples on endpoints
  oas3-operation-examples:
    severity: warn
    given: "$.paths.*.*.responses.*.content.application/json"
    then:
      field: example
      function: truthy
```

**Strict camelCase, zero exceptions**: All JSON fields must be camelCase. The OAuth2-standard
`token_type` field is renamed to `tokenType` in our contract. This requires migrating existing
backends and Gherkin specs that use `token_type`. Consistency across all fields takes priority
over OAuth2 convention compliance.

## Existing CI Integration

The existing PR quality gate (`.github/workflows/pr-quality-gate.yml`) already runs:

```yaml
- name: Typecheck (affected)
  run: npx nx affected -t typecheck

- name: Lint (affected)
  run: npx nx affected -t lint

- name: Test quick (affected)
  run: npx nx affected -t test:quick
```

Since `codegen` is a dependency of `typecheck`/`build`/`test:unit` (and `test:unit` is part of
`test:quick`), **no changes to the PR quality gate are needed**. Contract violations are
automatically caught.

The pre-push hook (`.husky/pre-push`) runs the same commands, providing local enforcement.

## API Surface Summary

The contract covers all endpoints from the existing Gherkin specs:

### Authentication & Token Management

| Method | Path                    | Request Body    | Success Code | Response Body |
| ------ | ----------------------- | --------------- | ------------ | ------------- |
| POST   | /api/v1/auth/register   | RegisterRequest | 201          | User          |
| POST   | /api/v1/auth/login      | LoginRequest    | 200          | AuthTokens    |
| POST   | /api/v1/auth/refresh    | RefreshRequest  | 200          | AuthTokens    |
| POST   | /api/v1/auth/logout     | —               | 200          | —             |
| POST   | /api/v1/auth/logout-all | —               | 200          | —             |

### User Account Management

| Method | Path                        | Request Body          | Success Code | Response Body |
| ------ | --------------------------- | --------------------- | ------------ | ------------- |
| GET    | /api/v1/users/me            | —                     | 200          | User          |
| PATCH  | /api/v1/users/me            | UpdateProfileRequest  | 200          | User          |
| POST   | /api/v1/users/me/password   | ChangePasswordRequest | 200          | —             |
| POST   | /api/v1/users/me/deactivate | —                     | 200          | —             |

### Expense Management

| Method | Path                     | Request Body         | Success Code | Response Body       |
| ------ | ------------------------ | -------------------- | ------------ | ------------------- |
| POST   | /api/v1/expenses         | CreateExpenseRequest | 201          | Expense             |
| GET    | /api/v1/expenses         | —                    | 200          | ExpenseListResponse |
| GET    | /api/v1/expenses/{id}    | —                    | 200          | Expense             |
| PUT    | /api/v1/expenses/{id}    | UpdateExpenseRequest | 200          | Expense             |
| DELETE | /api/v1/expenses/{id}    | —                    | 204          | —                   |
| GET    | /api/v1/expenses/summary | —                    | 200          | ExpenseSummary[]    |

### Attachments

| Method | Path                                    | Request Body   | Success Code | Response Body |
| ------ | --------------------------------------- | -------------- | ------------ | ------------- |
| POST   | /api/v1/expenses/{id}/attachments       | multipart/form | 201          | Attachment    |
| GET    | /api/v1/expenses/{id}/attachments       | —              | 200          | Attachment[]  |
| DELETE | /api/v1/expenses/{id}/attachments/{aid} | —              | 204          | —             |

### Reporting, Admin, Token, Health, Test Support

| Method | Path                                          | Success Code | Response Body         |
| ------ | --------------------------------------------- | ------------ | --------------------- |
| GET    | /api/v1/reports/pl                            | 200          | PLReport              |
| GET    | /api/v1/admin/users                           | 200          | UserListResponse      |
| POST   | /api/v1/admin/users/{id}/disable              | 200          | —                     |
| POST   | /api/v1/admin/users/{id}/enable               | 200          | —                     |
| POST   | /api/v1/admin/users/{id}/unlock               | 200          | —                     |
| POST   | /api/v1/admin/users/{id}/force-password-reset | 200          | PasswordResetResponse |
| GET    | /health                                       | 200          | HealthResponse        |
| GET    | /.well-known/jwks.json                        | 200          | JwksResponse          |
| GET    | /api/v1/tokens/claims                         | 200          | TokenClaims           |
| POST   | /api/v1/test/reset-db                         | 200          | —                     |
| POST   | /api/v1/test/promote-admin                    | 200          | —                     |

## Schema Definitions

Based on the canonical types from `demo-fe-ts-nextjs/src/lib/api/types.ts` and Gherkin specs:

**AuthTokens**: `{ accessToken: string, refreshToken: string, tokenType: string }`

**User**: `{ id: string, username: string, email: string, displayName: string, status: string, roles: string[], createdAt: string, updatedAt: string }`

**Expense**: `{ id: string, amount: string, currency: string, category: string, description: string, date: string, type: string, quantity?: number, unit?: string, userId: string, createdAt: string, updatedAt: string }`

**ExpenseSummary**: `{ currency: string, totalIncome: string, totalExpense: string, net: string, categories: CategoryBreakdown[] }`

**Pagination Envelope**: `{ content: T[], totalElements: number, totalPages: number, page: number, size: number }`

**Request schemas**: RegisterRequest, LoginRequest, RefreshRequest, CreateExpenseRequest,
UpdateExpenseRequest, UpdateProfileRequest, ChangePasswordRequest, DisableRequest

**Response-only schemas**: PLReport, CategoryBreakdown, Attachment, TokenClaims, JwksResponse,
JwkKey, HealthResponse, PasswordResetResponse, ErrorResponse

## Design Decisions

### Decision 1: Code Generation Over Runtime Validation

**Context**: Contract enforcement can use runtime validators (check JSON at test time) or code
generation (produce typed code that fails compilation on mismatch).

**Decision**: Use code generation. Each app gets auto-generated types with encoders/decoders.

**Rationale**:

- Compile-time errors are faster feedback than test failures
- Generated encoders/decoders guarantee serialization matches the contract
- No runtime dependencies in production (generated code is just types + annotations)
- Developers get IDE autocomplete for all API types

### Decision 2: Gitignored Generated Code

**Context**: Generated code can be committed or gitignored.

**Decision**: Gitignore all `generated-contracts/` folders. Only the OpenAPI spec is committed.

**Rationale**:

- Single source of truth (the YAML spec), not N+1 sources
- No merge conflicts in generated files
- Generated code is a build artifact, like compiled binaries
- Postinstall hook ensures fresh clones work immediately

### Decision 3: Codegen as Nx Target Dependency

**Context**: How to ensure codegen runs before compilation.

**Decision**: Each app's `typecheck`/`build`/`test:unit` depends on `codegen`. `codegen` depends
on `demo-contracts:bundle`.

**Rationale**:

- Nx handles the dependency chain automatically
- `nx affected` correctly identifies which apps need re-codegen when contract changes
- Cacheable — Nx skips codegen if inputs haven't changed
- No manual steps required

### Decision 4: Dynamic Languages Use Test-Time Enforcement

**Context**: Elixir, Clojure, and (partially) Python lack compile-time type checking.

**Decision**: Generate typed schemas/models for these languages. Enforcement happens at `test:unit`
via Pydantic validation (Python), struct enforcement (Elixir), and Malli validation (Clojure).

**Rationale**:

- `test:unit` is part of `test:quick`, which runs in pre-push hook and PR quality gate
- Pydantic models provide both type hints (mypy) AND runtime validation
- Elixir `@enforce_keys` catches missing fields at struct creation
- Malli `m/decode` with `:strip-extra-keys` catches schema violations
- This matches each language's idiom rather than fighting it

### Decision 5: Strict camelCase, Zero Exceptions

**Context**: OAuth2 RFC 6749 uses `token_type` (snake_case). Our API currently follows this.

**Decision**: All JSON fields use camelCase with zero exceptions. `token_type` becomes `tokenType`.

**Rationale**:

- Consistency across all fields is more valuable than OAuth2 convention compliance
- Spectral can enforce a single rule with no exceptions — simpler, no edge cases
- Code generators produce consistent field names across all languages
- Consumers of the API (frontends, E2E tests) never see mixed casing

**Migration required**:

- Update Gherkin spec: `specs/apps/demo/be/gherkin/authentication/password-login.feature`
  (`token_type` → `tokenType`)
- Update all 11 backend implementations to return `tokenType` instead of `token_type`
- Update frontend API clients to read `tokenType`
- Update E2E test assertions

### Decision 6: Test-Only Endpoints Use OpenAPI Extension

**Context**: `/api/v1/test/*` endpoints exist only for testing.

**Decision**: Mark with `x-test-only: true`. Code generators include them. Documentation generators
filter them out.

### Decision 7: Browsable API Documentation via Redoc

**Context**: Product managers, stakeholders, and external teams need to understand the API without
reading code or YAML.

**Decision**: Generate static HTML documentation using `@redocly/cli build-docs`. Served locally
via `nx run demo-contracts:docs` and optionally deployable to a public URL.

**Rationale**:

- Redoc produces beautiful, responsive, single-page HTML documentation
- Generated from the same OpenAPI spec that drives code generation — always in sync
- No hosting infrastructure needed — static HTML file can be opened directly
- `x-test-only` endpoints are excluded via Redocly's `x-tagGroups` or `remove-x-internal` config
- `@redocly/cli` is already a dependency (used for bundling)

**Documentation features**:

- Grouped by domain (Authentication, Users, Expenses, Admin, etc.)
- Request/response schemas with types and descriptions
- Example request/response pairs inline
- Try-it-out panel (when served with a running backend)
- Search across all endpoints
- Mobile-responsive layout

**Redocly configuration** (`specs/apps/demo/contracts/redocly.yaml`):

```yaml
apis:
  demo:
    root: openapi.yaml
theme:
  openapi:
    hideDownloadButton: false
    disableSearch: false
    expandResponses: "200,201"
decorators:
  remove-x-internal:
    internalFlagProperty: x-test-only
```
