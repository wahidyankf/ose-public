# Delivery Plan

## Implementation Phases

### Phase 1: Contract Authoring + Infrastructure

**Goal**: Write the OpenAPI 3.1 modular spec, set up Spectral linting, bundling, and gitignore.

**Implementation Steps**:

- [ ] Create `specs/apps/demo/contracts/` directory structure (paths/, schemas/, examples/)
- [ ] Write `README.md` with purpose, usage guide, and contribution rules
- [ ] Write root `openapi.yaml` with server config, security schemes, and `$ref` path mappings
- [ ] Write all schema files:
  - [ ] `schemas/auth.yaml` — LoginRequest, RegisterRequest, RefreshRequest, AuthTokens
  - [ ] `schemas/user.yaml` — User, UpdateProfileRequest, ChangePasswordRequest
  - [ ] `schemas/expense.yaml` — Expense, CreateExpenseRequest, UpdateExpenseRequest
  - [ ] `schemas/expense-list.yaml` — ExpenseListResponse (uses pagination.yaml)
  - [ ] `schemas/report.yaml` — PLReport, CategoryBreakdown, ExpenseSummary
  - [ ] `schemas/attachment.yaml` — Attachment
  - [ ] `schemas/token.yaml` — TokenClaims, JwksResponse, JwkKey
  - [ ] `schemas/admin.yaml` — DisableRequest, PasswordResetResponse, UserListResponse
  - [ ] `schemas/pagination.yaml` — reusable pagination envelope
  - [ ] `schemas/error.yaml` — standardized error response
  - [ ] `schemas/health.yaml` — HealthResponse
- [ ] Write all path files:
  - [ ] `paths/health.yaml` — GET /health
  - [ ] `paths/auth.yaml` — POST login, register, refresh, logout, logout-all
  - [ ] `paths/users.yaml` — GET/PATCH /me, POST password, POST deactivate
  - [ ] `paths/expenses.yaml` — CRUD + summary
  - [ ] `paths/attachments.yaml` — POST/GET/DELETE attachments
  - [ ] `paths/reports.yaml` — GET /api/v1/reports/pl
  - [ ] `paths/admin.yaml` — GET users, POST disable/enable/unlock/force-password-reset
  - [ ] `paths/tokens.yaml` — GET claims, GET /.well-known/jwks.json
  - [ ] `paths/test-support.yaml` — POST reset-db, POST promote-admin
- [ ] Write `.spectral.yaml` with strict camelCase (zero exceptions), description, and example
      rules
- [ ] Write `redocly.yaml` with docs theme config and `x-test-only` filtering
- [ ] Add `demo-contracts` as Nx project (`project.json`) with `lint`, `bundle`, and `docs` targets
- [ ] Add `**/generated-contracts/`, `**/generated_contracts/` (Python), and
      `specs/apps/demo/contracts/generated/` to root `.gitignore`
- [ ] Ensure ALL schema fields use camelCase (e.g., `tokenType` not `token_type`)
- [ ] Verify Spectral lint passes with zero errors and zero camelCase violations
- [ ] Verify Redocly CLI bundle resolves all `$ref`s into `generated/openapi-bundled.yaml` and
      `generated/openapi-bundled.json` (JSON needed for ajv in E2E tests)
- [ ] Verify Redocly CLI `build-docs` generates browsable HTML at `generated/docs/index.html`
- [ ] Verify test-only endpoints (`/api/v1/test/*`) are excluded from generated docs
- [ ] Write example files for major endpoints

**Validation**:

- `npx @stoplight/spectral-cli lint openapi.yaml` exits 0 with zero camelCase errors
- `npx @redocly/cli bundle openapi.yaml` produces valid bundled output (YAML + JSON)
- `npx @redocly/cli build-docs` produces browsable HTML documentation
- All endpoints from Gherkin specs are covered
- `.gitignore` patterns correctly exclude generated folders
- Generated docs show all public endpoints grouped by domain, with schemas and examples

---

### Phase 1b: camelCase Migration (Prerequisite)

**Goal**: Migrate existing `token_type` (snake_case) to `tokenType` (camelCase) across all backends,
frontends, Gherkin specs, and E2E tests before the contract enforces strict camelCase.

**Implementation Steps**:

- [ ] Update Gherkin spec: `specs/apps/demo/be/gherkin/authentication/password-login.feature`
      (`"token_type"` → `"tokenType"`)
- [ ] Update all 11 backend implementations to return `tokenType` instead of `token_type` in auth
      login and refresh responses
- [ ] Update frontend API clients to read `tokenType` (or verify they only use `accessToken` and
      `refreshToken` fields)
- [ ] Update E2E test assertions that check for `token_type`
- [ ] Run `nx affected -t test:quick` — verify all pass with the new field name
- [ ] Run `nx run demo-be-e2e:test:e2e` — verify E2E passes

**Validation**:

- `grep -r "token_type" specs/apps/demo/` returns zero results
- All `test:quick` and `test:e2e` pass with `tokenType`

---

### Phase 2: Code Generation for Statically Typed Apps

**Goal**: Set up `codegen` Nx targets producing types + encoders/decoders in `generated-contracts/`
for all statically typed apps. Wire `codegen` as dependency of `typecheck`/`build`/`test:unit`.

**Implementation Steps**:

- [ ] **demo-be-golang-gin**: Install `oapi-codegen`, create config (`oapi-codegen.yaml` with
      strict-server + gin output), add `codegen` target, update handlers to implement generated
      strict server interface, verify `go build` passes
- [ ] **demo-be-java-springboot**: Add `openapi-generator-maven-plugin` to `pom.xml`, configure
      Spring generator, add `codegen` target, update controllers to use generated DTOs with Jackson
      annotations, verify `mvn compile` passes
- [ ] **demo-be-java-vertx**: Add `openapi-generator-maven-plugin`, configure Java generator, add
      `codegen` target, update handlers to use generated DTOs, verify `mvn compile` passes
- [ ] **demo-be-kotlin-ktor**: Add `openapi-generator-gradle-plugin` to `build.gradle.kts`,
      configure Kotlin generator with kotlinx.serialization, add `codegen` target, update routes to
      use generated data classes, verify `./gradlew build` passes
- [ ] **demo-be-rust-axum**: Add `openapi-generator` Rust generator via build script, add `codegen`
      target, update handlers to use generated serde structs, verify `cargo build` passes
- [ ] **demo-be-fsharp-giraffe**: Add `NSwag.MSBuild` NuGet package, configure F# type generation,
      add `codegen` target, update handlers to use generated record types, verify `dotnet build` passes
- [ ] **demo-be-csharp-aspnetcore**: Add `NSwag.MSBuild` NuGet package, configure C# class
      generation, add `codegen` target, update controllers to use generated classes, verify
      `dotnet build` passes
- [ ] **demo-be-ts-effect**: Add `openapi-typescript` dev dependency, add `codegen` target, update
      handlers to use generated types with Effect Schema encode/decode, verify `tsc` passes
- [ ] **demo-fe-ts-nextjs**: Add `openapi-typescript` + `openapi-fetch` dev dependencies, add
      `codegen` target, replace hand-written `types.ts` with imports from generated types, update API
      client to use `openapi-fetch` `createClient`, verify `tsc` passes
- [ ] **demo-fe-ts-tanstack-start**: Same as demo-fe-ts-nextjs — `openapi-typescript` +
      `openapi-fetch`, add `codegen` target, replace types, verify `tsc` passes
- [ ] **demo-fe-dart-flutterweb**: Add `openapi-generator` Dart generator, add `codegen` target,
      replace hand-written models with generated classes using `json_serializable`, verify
      `dart analyze` passes
- [ ] Wire `codegen` as dependency of `typecheck`/`build`/`test:unit` in each app's `project.json`
- [ ] Verify `nx run-many -t typecheck --projects=demo-fe-*` passes
- [ ] Verify `nx run-many -t build --projects=demo-be-golang-gin,demo-be-rust-axum` passes

**Validation**:

- Each statically typed app's `generated-contracts/` is populated by `codegen`
- `nx affected -t typecheck` catches TS/Dart mismatches
- `nx affected -t build` catches Go/Java/Kotlin/Rust/F#/C# mismatches
- Intentionally breaking a field name in the contract and re-running codegen causes compile failure

---

### Phase 3: Code Generation for Dynamically Typed Apps

**Goal**: Set up `codegen` Nx targets for Python, Elixir, and Clojure producing typed
schemas/models. Enforcement via `test:unit` (part of `test:quick`).

**Implementation Steps**:

- [ ] **demo-be-python-fastapi**: Add `datamodel-code-generator` dev dependency, add `codegen`
      target generating Pydantic v2 models into `generated_contracts/`, update FastAPI route handlers
      to use generated models as `response_model`, verify `pytest` passes
- [ ] **demo-be-elixir-phoenix**: Create custom codegen script that reads bundled OpenAPI and
      generates Elixir structs with `@enforce_keys` + `@type` typespecs, add `codegen` target, update
      controllers to return generated structs, verify `mix test` passes
- [ ] **demo-be-clojure-pedestal**: Create custom codegen script generating Malli schemas from
      bundled OpenAPI, add `codegen` target, add middleware validating responses against Malli schemas,
      verify `lein test` passes
- [ ] Wire `codegen` as dependency of `test:unit` in each app's `project.json`
- [ ] Verify `nx run-many -t test:quick --projects=demo-be-python-fastapi,demo-be-elixir-phoenix,demo-be-clojure-pedestal` passes

**Validation**:

- Each dynamically typed app's `generated-contracts/` (or `generated_contracts/`) is populated
- `test:unit` validates responses against generated schemas/models
- `nx affected -t test:quick` catches violations before push
- Intentionally removing a required field causes `test:unit` failure

---

### Phase 4: E2E Runtime Validation (Safety Net)

**Goal**: Add `ajv`-based response validation to E2E tests as an additional safety layer.

**Implementation Steps**:

- [ ] Add `ajv` + `@apidevtools/json-schema-ref-parser` to `demo-be-e2e` dev dependencies
- [ ] Create `demo-be-e2e/tests/utils/contract-validator.ts`
- [ ] Integrate validator into existing backend E2E step definitions
- [ ] Add same validator to `demo-fe-e2e` test utilities
- [ ] Run full E2E suites — fix any discovered drift

**Validation**:

- `nx run demo-be-e2e:test:e2e` passes with contract validation enabled
- `nx run demo-fe-e2e:test:e2e` passes with contract validation enabled

---

### Phase 5: Documentation + Postinstall

**Goal**: Update documentation, add postinstall hook, verify end-to-end workflow.

**Implementation Steps**:

- [ ] Add postinstall script to `package.json`: `npx nx run-many -t codegen --projects=demo-*`
- [ ] Verify root `.gitignore` has `**/generated-contracts/` and `**/generated_contracts/` patterns
- [ ] Update `specs/apps/demo/README.md` — add contracts section with link to
      `specs/apps/demo/contracts/README.md`
- [ ] Update `specs/apps/demo/contracts/README.md` — document codegen workflow, how to modify
      contract, how generated code flows to each app, how to generate/view docs
- [ ] Update `CLAUDE.md`:
  - Add `demo-contracts` to Current Apps list
  - Document `codegen` and `docs` Nx targets and dependency chain
  - Document `generated-contracts/` gitignore pattern
  - Document strict camelCase convention for all API JSON fields
  - Add note about contract enforcement in Three-Level Testing section
- [ ] Update `governance/development/infra/nx-targets.md` — add `codegen` and `docs` as standard
      targets for demo apps
- [ ] Verify fresh clone workflow: `git clone` → `npm install` → `nx affected -t typecheck` passes
- [ ] Verify contract change workflow: modify schema → `nx affected -t typecheck` catches all apps
- [ ] Verify docs workflow: `nx run demo-contracts:docs` → open `generated/docs/index.html` in
      browser → verify all endpoints visible, test-only excluded

**Validation**:

- Fresh clone: `npm install` triggers codegen, `typecheck`/`build` succeeds
- Contract change: `nx affected` shows all demo apps, codegen re-runs, compile catches mismatches
- Pre-push: `git push` triggers `typecheck` + `lint` + `test:quick`, all pass
- PR: quality gate runs same checks, all pass
- Docs: `nx run demo-contracts:docs` produces browsable HTML with all public endpoints
- camelCase: zero snake_case or kebab-case fields in any schema

---

## Open Questions

1. **Should `codegen` be cacheable?**
   Yes — if the bundled spec hasn't changed, the generated code is identical. Nx caching skips
   redundant regeneration. Cache key includes `openapi-bundled.yaml` hash.

2. **What if a code generator doesn't support all OpenAPI features?**
   Fall back to simpler generation (e.g., just types without full server interface) and add
   runtime validation for unsupported features. Document per-language limitations.

3. **~~How to handle the `token_type` (snake_case) exception?~~** **Resolved**: No exceptions.
   All fields use camelCase. `token_type` → `tokenType`. Phase 1b handles migration.

4. **Should the postinstall codegen run on CI?**
   Yes — `npm ci` in CI triggers postinstall, which runs codegen. This ensures CI has all
   generated code before running typecheck/build/test.

5. **What about custom codegen scripts for Elixir/Clojure?**
   Write them as small scripts in `tools/codegen/` (e.g., `tools/codegen/elixir-codegen.exs`,
   `tools/codegen/clojure-codegen.clj`). These read the bundled YAML and emit language-specific
   code. Keep them simple — just type/schema generation, not full framework code.

---

## Risks and Mitigations

| Risk                                                          | Impact | Mitigation                                                             |
| ------------------------------------------------------------- | ------ | ---------------------------------------------------------------------- |
| Code generator produces incompatible output                   | High   | Test each generator against existing app code before migrating         |
| Custom codegen scripts for Elixir/Clojure are fragile         | Medium | Keep scripts minimal; generate only structs/schemas, not handlers      |
| Postinstall codegen slows npm install                         | Low    | Nx caching ensures codegen only runs when spec changes                 |
| oapi-codegen strict mode conflicts with existing Gin handlers | Medium | Incremental migration: generate types first, then strict interface     |
| Generated code has merge conflicts across branches            | N/A    | Generated code is gitignored — no merge conflicts possible             |
| Fresh clone fails if codegen tool not installed               | Medium | All generators are npm/Go/Maven dependencies, installed by npm install |

---

## Dependencies

- **npm packages**: `@stoplight/spectral-cli`, `@redocly/cli`, `openapi-typescript`,
  `openapi-fetch`, `ajv`
- **Go**: `oapi-codegen` (go install)
- **Java/Kotlin**: `openapi-generator-maven-plugin` / `openapi-generator-gradle-plugin`
- **Python**: `datamodel-code-generator` (pip)
- **Rust**: `openapi-generator` CLI or `progenitor` crate
- **.NET**: `NSwag.MSBuild` NuGet package
- **Dart**: `openapi-generator` CLI (via Java)
- **Elixir/Clojure**: Custom scripts (no external dependencies beyond YAML parsing)
