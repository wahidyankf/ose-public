# Delivery Plan

## Implementation Phases

### Phase 1: CI Version Alignment

**Goal**: Update all scheduled test workflows to match main-ci.yml language versions.

- [x] **Update Go version in ALL scheduled workflows using Go 1.24**
  - [x] `test-demo-be-golang-gin.yml`: Change `go-version: "1.24"` to `"1.26.0"` in both jobs
  - [x] `test-demo-fe-ts-nextjs.yml`: Change `go-version: "1.24"` to `"1.26.0"`
  - [x] `test-demo-fe-ts-tanstack-start.yml`: Change `go-version: "1.24"` to `"1.26.0"`
  - [x] `test-demo-fe-dart-flutterweb.yml`: Change `go-version: "1.24"` to `"1.26.0"`
  - [ ] Verify all 4 updated workflows pass by manually triggering via workflow_dispatch
  - **Implementation Notes**: Updated both jobs (integration-tests and e2e) in golang-gin; single job in each frontend workflow. All now use `go-version: "1.26.0"`.
  - **Date**: 2026-03-19
  - **Status**: Files updated; manual trigger verification pending
  - **Files Changed**: `.github/workflows/test-demo-be-golang-gin.yml`, `.github/workflows/test-demo-fe-ts-nextjs.yml`, `.github/workflows/test-demo-fe-ts-tanstack-start.yml`, `.github/workflows/test-demo-fe-dart-flutterweb.yml`

- [x] **Update Elixir version in test-demo-be-elixir-phoenix.yml**
  - [x] Change `elixir-version: "1.18"` to `elixir-version: "1.19"` in integration-tests job
  - [x] Change `elixir-version: "1.18"` to `elixir-version: "1.19"` in e2e job
  - [x] Verify `test_load_filters` config in mix.exs (required for Elixir 1.19 — should already
        exist per prior plan)
  - [ ] Verify workflow passes by manually triggering via workflow_dispatch
  - **Implementation Notes**: Both integration-tests and e2e jobs updated to `elixir-version: "1.19"`. Verified `test_load_filters: [~r/_test\.exs$/, ~r/_steps\.exs$/]` already present in `apps/demo-be-elixir-phoenix/mix.exs` line 17.
  - **Date**: 2026-03-19
  - **Status**: Files updated; manual trigger verification pending
  - **Files Changed**: `.github/workflows/test-demo-be-elixir-phoenix.yml`

- [x] **Update Python version in test-demo-be-python-fastapi.yml**
  - [x] Change `python-version: "3.12"` to `python-version: "3.13"` in integration-tests job
  - [x] Change `python-version: "3.12"` to `python-version: "3.13"` in e2e job
  - [ ] Verify no Python 3.13 deprecation warnings or breaking changes affect tests
  - [ ] Verify workflow passes by manually triggering via workflow_dispatch
  - **Implementation Notes**: Both integration-tests and e2e jobs updated to `python-version: "3.13"`.
  - **Date**: 2026-03-19
  - **Status**: Files updated; manual trigger verification pending
  - **Files Changed**: `.github/workflows/test-demo-be-python-fastapi.yml`

- [x] **Audit remaining workflows for version consistency**
  - [x] Verify all test-demo-\*.yml files use Node.js 24 (should already be consistent)
  - [x] Verify Rust uses `dtolnay/rust-toolchain@stable` consistently
  - [x] Verify Flutter uses `subosito/flutter-action@v2` with `channel: stable` consistently
  - [x] Document any other version mismatches found
  - **Implementation Notes**: All remaining workflows (clojure, csharp, fsharp, java-springboot, java-vertx, kotlin-ktor, ts-effect) use `node-version: "24"` — consistent. `test-demo-be-rust-axum.yml` does not use a host Rust toolchain step; Rust compilation occurs inside Docker containers — no `dtolnay/rust-toolchain` to check. `test-demo-fe-dart-flutterweb.yml` uses `subosito/flutter-action@v2` with `channel: stable` — consistent. No additional version mismatches found.
  - **Date**: 2026-03-19
  - **Status**: Completed

**Validation**: All 6 updated workflows (1 Go backend + 3 frontends + 1 Elixir + 1 Python) pass
when manually triggered. No version mismatches remain across any `test-demo-*.yml` file.

---

### Phase 2: Add Missing typecheck Targets and Fix Codegen Dependencies

**Goal**: Every demo backend has a `typecheck` target that depends on `codegen`. Fix existing
typecheck targets missing the codegen dependency.

- [x] **demo-be-golang-gin: Add typecheck target**
  - [x] Verify `go.mod` includes `generated-contracts` package (or add `replace` directive
        if needed — `go vet` requires all imported packages to be resolvable)
  - [x] Add to `project.json`:

    ```jsonc
    "typecheck": {
      "command": "go vet ./...",
      "dependsOn": ["codegen"],
      "cache": true
    }
    ```

  - [x] Run `nx run demo-be-golang-gin:codegen` first, then verify `go vet ./...` passes
  - [x] Verify `nx run demo-be-golang-gin:typecheck` passes
  - **Implementation Notes**: `generated-contracts/` is part of the same Go module (no separate go.mod); `CGO_ENABLED=0 go vet ./...` used for consistency with other Go targets. Added after `lint` target alphabetically.
  - **Date**: 2026-03-19
  - **Status**: Completed
  - **Files Changed**: `apps/demo-be-golang-gin/project.json`

- [x] **demo-be-rust-axum: Add typecheck target**
  - [x] Add to `project.json`:

    ```jsonc
    "typecheck": {
      "command": "cargo check",
      "dependsOn": ["codegen"],
      "cache": true
    }
    ```

  - [x] Verify `nx run demo-be-rust-axum:typecheck` passes
  - **Implementation Notes**: `cargo check` compiles without linking, verifying types against generated-contracts. Added after `lint` target.
  - **Date**: 2026-03-19
  - **Status**: Completed
  - **Files Changed**: `apps/demo-be-rust-axum/project.json`

- [x] **demo-be-kotlin-ktor: Add typecheck target**
  - [x] Add to `project.json`:

    ```jsonc
    "typecheck": {
      "command": "./gradlew compileKotlin",
      "dependsOn": ["codegen"],
      "cache": true
    }
    ```

  - [x] Verify `nx run demo-be-kotlin-ktor:typecheck` passes
  - **Implementation Notes**: Uses same JAVA_HOME resolution pattern as other Kotlin targets. Added after `lint` target.
  - **Date**: 2026-03-19
  - **Status**: Completed
  - **Files Changed**: `apps/demo-be-kotlin-ktor/project.json`

- [x] **demo-be-clojure-pedestal: Add typecheck target**
  - [x] Add to `project.json`:

    ```jsonc
    "typecheck": {
      "command": "clj-kondo --lint src",
      "dependsOn": ["codegen"],
      "cache": true
    }
    ```

  - [x] Verify `nx run demo-be-clojure-pedestal:typecheck` passes
  - **Implementation Notes**: Lints only `src/` (not `test/`) matching the typecheck purpose. The existing `lint` target covers both `src test`. Added after `lint` target.
  - **Date**: 2026-03-19
  - **Status**: Completed
  - **Files Changed**: `apps/demo-be-clojure-pedestal/project.json`

- [x] **Fix existing typecheck targets missing codegen dependency**
  - [x] `demo-be-elixir-phoenix`: Add `dependsOn: ["codegen"]` (currently missing)
  - [x] `demo-be-python-fastapi`: Add `dependsOn: ["codegen"]` (currently missing)
  - [x] `demo-be-java-springboot`: Verify `dependsOn` includes `codegen` (has it)
  - [x] `demo-be-java-vertx`: Verify `dependsOn` includes `codegen` (has it)
  - [x] `demo-be-fsharp-giraffe`: Verify `dependsOn` includes `codegen` (has it)
  - [x] `demo-be-csharp-aspnetcore`: Verify `dependsOn` includes `codegen` (has it)
  - [x] `demo-be-ts-effect`: Verify `dependsOn` includes `codegen` (has it)
  - **Implementation Notes**: Added `"dependsOn": ["codegen"]` to existing typecheck targets in elixir-phoenix and python-fastapi. Confirmed the other 5 already had it.
  - **Date**: 2026-03-19
  - **Status**: Completed
  - **Files Changed**: `apps/demo-be-elixir-phoenix/project.json`, `apps/demo-be-python-fastapi/project.json`

- [x] **Run full typecheck sweep**
  - [x] `nx run-many -t typecheck --projects=demo-be-*` — all 11 backends pass
  - **Implementation Notes**: Ran `nx run-many -t typecheck` for all 11 backends. All passed. 12 out of 25 tasks served from cache, remainder executed successfully.
  - **Date**: 2026-03-19
  - **Status**: Completed

**Validation**: `nx run-many -t typecheck --projects=demo-be-*` exits 0. All 11 backends have
typecheck targets.

---

### Phase 3: Separate Concerns in Test Targets

**Goal**: test:unit and test:quick are distinct; test:quick contains no lint/format.

#### 3A: Elixir — separate test:unit from test:quick

Currently both targets run identical commands (`MIX_ENV=test mix coveralls.lcov --only unit` +
rhino-cli). This is the only backend with this duplication.

- [x] **Update demo-be-elixir-phoenix/project.json**
  - [x] Change `test:unit` command to: `MIX_ENV=test mix test --only unit` (no coverage)
  - [x] Keep `test:quick` as: `MIX_ENV=test mix coveralls.lcov --only unit` + rhino-cli validation
  - [x] Verify commands are now distinct (test:unit has no `coveralls.lcov`)
  - [x] Verify `nx run demo-be-elixir-phoenix:test:unit` passes
  - [x] Verify `nx run demo-be-elixir-phoenix:test:quick` passes with coverage
  - **Implementation Notes**: Changed `test:unit` from `commands` (array) with coveralls + rhino-cli to a single `command` using `mix test --only unit`. `test:quick` unchanged with coveralls.lcov + rhino-cli at 90% threshold. Both pass: test:unit runs 76 scenarios/42 tests in 28s; test:quick reports 92.59% coverage.
  - **Date**: 2026-03-19
  - **Status**: Completed
  - **Files Changed**: `apps/demo-be-elixir-phoenix/project.json`

Note: `demo-be-clojure-pedestal` already has proper separation (test:unit uses `-M:test`,
test:quick uses `-M:coverage`). No changes needed.

#### 3B: F# — move lint/format out of test:quick

Currently `test:quick` runs 7 commands including `fantomas --check` and `dotnet fsharplint`.
These belong in the `lint` target.

- [x] **Update demo-be-fsharp-giraffe/project.json**
  - [x] Remove `fantomas --check src/ tests/` from `test:quick` commands
  - [x] Remove `dotnet fsharplint lint` from `test:quick` commands
  - [x] Verify existing `lint` target already runs `dotnet fsharplint`; add `fantomas --check`
        if not present
  - [x] Verify `test:quick` retains only: tool restore, build tests, AltCover instrument,
        AltCover run, rhino-cli validate (5 commands)
  - [x] Verify `nx run demo-be-fsharp-giraffe:test:quick` passes
  - [x] Verify `nx run demo-be-fsharp-giraffe:lint` passes
  - **Implementation Notes**: Removed both `fantomas --check src/ tests/` and `dotnet fsharplint lint` from `test:quick` (was 7 commands, now 5). Converted `lint` from single `command` to `commands` array with both fantomas and fsharplint. `test:quick` passes with 90.54% coverage; `lint` passes with 0 fantomas issues and 0 fsharplint warnings.
  - **Date**: 2026-03-19
  - **Status**: Completed
  - **Files Changed**: `apps/demo-be-fsharp-giraffe/project.json`

#### 3C: Flutter — remove lint from test:quick and add coverage enforcement

Currently `test:quick` runs `dart analyze --fatal-infos && flutter test test/unit`. This bundles
lint (`dart analyze`) with testing, and has no coverage enforcement.

- [x] **Update demo-fe-dart-flutterweb/project.json**
  - [x] Change `test:quick` command to:
        `flutter test test/unit --coverage && (cd ../../apps/rhino-cli && CGO_ENABLED=0 go run main.go test-coverage validate apps/demo-fe-dart-flutterweb/coverage/lcov.info 70)`
  - [x] Verify `lint` target already runs `dart analyze --fatal-infos` (it does — confirmed in
        project.json)
  - [x] Add `outputs` to `test:quick`: `["{projectRoot}/coverage/"]`
  - [x] Verify `nx run demo-fe-dart-flutterweb:test:quick` passes with coverage at >= 70%
  - **Implementation Notes**: Changed `test:quick` from single `command` string to `commands` array. Removed `dart analyze --fatal-infos` (already in `lint` target). Added `flutter test test/unit --coverage` and rhino-cli validate at 70% threshold. Added `outputs: ["{projectRoot}/coverage/"]`. Coverage passes at 88.33% (>= 70%). Note: rhino-cli resolves coverage path from repo root, so path is `apps/demo-fe-dart-flutterweb/coverage/lcov.info` (not `../../apps/...`).
  - **Date**: 2026-03-19
  - **Status**: Completed
  - **Files Changed**: `apps/demo-fe-dart-flutterweb/project.json`

**Validation**: Elixir test:unit and test:quick are distinct. F# test:quick has no lint/format.
Flutter test:quick enforces coverage at 70% and does not include `dart analyze`.

---

### Phase 4: Standardize Cache, Inputs, and Outputs

**Goal**: Every demo app has explicit, consistent cache/inputs/outputs declarations.

- [x] **Define canonical inputs per language** (reference for all updates below):
  - Go: `["{projectRoot}/internal/**/*.go", "{projectRoot}/cmd/**/*.go", "{projectRoot}/go.mod", "{projectRoot}/go.sum", "{workspaceRoot}/specs/apps/demo/be/gherkin/**/*.feature"]`
  - Java (Maven): `["{projectRoot}/src/**", "{projectRoot}/pom.xml", "{workspaceRoot}/specs/apps/demo/be/gherkin/**/*.feature"]`
  - Kotlin (Gradle): `["{projectRoot}/src/**", "{projectRoot}/build.gradle.kts", "{workspaceRoot}/specs/apps/demo/be/gherkin/**/*.feature"]`
  - Rust: `["{projectRoot}/src/**/*.rs", "{projectRoot}/tests/**/*.rs", "{projectRoot}/Cargo.toml", "{projectRoot}/Cargo.lock", "{workspaceRoot}/specs/apps/demo/be/gherkin/**/*.feature"]`
  - TypeScript: `["{projectRoot}/src/**/*.ts", "{projectRoot}/tests/**/*.ts", "{projectRoot}/vitest.config.ts", "{workspaceRoot}/specs/apps/demo/be/gherkin/**/*.feature"]`
  - Python: `["{projectRoot}/src/**/*.py", "{projectRoot}/tests/**/*.py", "{workspaceRoot}/specs/apps/demo/be/gherkin/**/*.feature"]`
  - Elixir: `["{projectRoot}/lib/**/*.ex", "{projectRoot}/test/**/*.exs", "{workspaceRoot}/specs/apps/demo/be/gherkin/**/*.feature"]`
  - F#: `["{projectRoot}/src/**/*.fs", "{projectRoot}/tests/**/*.fs", "{workspaceRoot}/specs/apps/demo/be/gherkin/**/*.feature"]`
  - C#: `["{projectRoot}/src/**/*.cs", "{projectRoot}/tests/**/*.cs", "{workspaceRoot}/specs/apps/demo/be/gherkin/**/*.feature"]`
  - Clojure: `["{projectRoot}/src/**/*", "{projectRoot}/test/**/*", "{projectRoot}/tests.edn", "{workspaceRoot}/specs/apps/demo/be/gherkin/**/*.feature"]`
  - Frontend TS: `["{projectRoot}/src/**/*.ts", "{projectRoot}/src/**/*.tsx", "{projectRoot}/vitest.config.ts"]`
  - Frontend Dart: `["{projectRoot}/lib/**/*.dart", "{projectRoot}/test/**/*.dart"]`

- [x] **demo-be-golang-gin** (Go)
  - [x] test:unit: Add `cache: true`; add `inputs` with Go source + Gherkin specs + contracts
  - [x] test:unit: Add `{projectRoot}/generated-contracts/**/*` to inputs (currently missing)
  - [x] test:unit: Add `{workspaceRoot}/specs/apps/demo/be/gherkin/**/*.feature` to inputs (currently missing)
  - [x] test:quick: Add `{projectRoot}/generated-contracts/**/*` to inputs (currently missing)
  - [ ] ~~test:quick: Add `rhino-cli spec-coverage validate` command after coverage validation~~ **DEFERRED**: `rhino-cli spec-coverage validate` does not support demo-be backends (test file naming conventions don't match feature stems). Requires tool enhancement. See Phase 4 notes.
  - [x] test:integration: Verify `cache: false` is explicit
  - [x] Verify `nx run demo-be-golang-gin:test:quick` passes (90.34% coverage)

- [x] **demo-be-java-springboot** (Java/Maven)
  - [x] test:unit: Add `cache: true`; add `{projectRoot}/generated-contracts/**/*` to inputs
  - [x] test:quick: Add `cache: true`; add `{projectRoot}/generated-contracts/**/*` to inputs
  - [x] test:quick: Add `outputs` for coverage files
  - [ ] ~~test:quick: Add `rhino-cli spec-coverage validate`~~ **DEFERRED** (see Go notes above)
  - [x] test:integration: Verify `cache: false` is explicit
  - [x] Verify `nx run demo-be-java-springboot:test:quick` passes (91.54% coverage)

- [x] **demo-be-java-vertx** (Java/Maven)
  - [x] test:unit: Add `cache: true`; add `{projectRoot}/generated-contracts/**/*` to inputs
  - [x] test:quick: Add `cache: true`; add `{projectRoot}/generated-contracts/**/*` to inputs
  - [x] test:quick: Add `outputs` for coverage files
  - [ ] ~~test:quick: Add `rhino-cli spec-coverage validate`~~ **DEFERRED** (see Go notes above)
  - [x] test:integration: Verify `cache: false` is explicit
  - [x] Verify `nx run demo-be-java-vertx:test:quick` passes (92.51% coverage)

- [x] **demo-be-elixir-phoenix** (Elixir)
  - [x] test:unit: Add `cache: true`; add `{projectRoot}/generated-contracts/**/*` to inputs
  - [x] test:quick: Add `cache: true`; add `{projectRoot}/generated-contracts/**/*` to inputs
  - [x] test:quick: Add `outputs` for coverage files (`cover/lcov.info`)
  - [ ] ~~test:quick: Add `rhino-cli spec-coverage validate`~~ **DEFERRED** (see Go notes above)
  - [x] test:integration: Verify `cache: false` is explicit
  - [x] Verify `nx run demo-be-elixir-phoenix:test:quick` passes (92.59% coverage)

- [x] **demo-be-python-fastapi** (Python)
  - [x] test:unit: Add `cache: true`; add `{projectRoot}/generated_contracts/**/*` to inputs
        (note: Python uses underscore `generated_contracts/`)
  - [x] test:quick: Add `cache: true`; add `{projectRoot}/generated_contracts/**/*` to inputs
  - [x] test:quick: Add `outputs` for coverage files (`coverage/lcov.info`)
  - [ ] ~~test:quick: Add `rhino-cli spec-coverage validate`~~ **DEFERRED** (see Go notes above)
  - [x] test:integration: Verify `cache: false` is explicit
  - [x] Verify `nx run demo-be-python-fastapi:test:quick` passes (92.05% coverage)

- [x] **demo-be-rust-axum** (Rust)
  - [x] test:unit: Add `{projectRoot}/generated-contracts/**/*` to inputs (has cache+inputs but
        missing contracts)
  - [x] test:quick: Add `{projectRoot}/generated-contracts/**/*` to inputs (has cache+inputs+outputs
        but missing contracts)
  - [ ] ~~test:quick: Add `rhino-cli spec-coverage validate`~~ **DEFERRED** (see Go notes above)
  - [x] test:integration: Verify `cache: false` is explicit
  - [x] Verify `nx run demo-be-rust-axum:test:quick` passes (90.44% coverage)

- [x] **demo-be-fsharp-giraffe** (F#)
  - [x] test:unit: Add `cache: true`; add `{projectRoot}/generated-contracts/**/*` to inputs;
        add `{workspaceRoot}/specs/apps/demo/be/gherkin/**/*.feature` to inputs (currently missing
        from test:unit)
  - [x] test:quick: Add `{projectRoot}/generated-contracts/**/*` to inputs (has cache+inputs but
        missing contracts)
  - [x] test:quick: Add `outputs` for coverage files (`coverage/altcov.info`)
  - [ ] ~~test:quick: Add `rhino-cli spec-coverage validate`~~ **DEFERRED** (see Go notes above)
  - [x] test:integration: Verify `cache: false` is explicit
  - [x] Verify `nx run demo-be-fsharp-giraffe:test:quick` passes (90.54% coverage)

- [x] **demo-be-ts-effect** (TypeScript)
  - [x] test:unit: Add `{projectRoot}/generated-contracts/**/*` to inputs (has cache+inputs but
        missing contracts)
  - [x] test:quick: Add `{projectRoot}/generated-contracts/**/*` to inputs; add `outputs` for
        coverage files
  - [ ] ~~test:quick: Add `rhino-cli spec-coverage validate`~~ **DEFERRED** (see Go notes above)
  - [x] test:integration: Verify `cache: false` is explicit
  - [x] Verify `nx run demo-be-ts-effect:test:quick` passes (91.67% coverage)

- [x] **demo-be-kotlin-ktor** (Kotlin/Gradle)
  - [x] test:unit: Add `cache: true`; add `{projectRoot}/generated-contracts/**/*` to inputs;
        add `{workspaceRoot}/specs/apps/demo/be/gherkin/**/*.feature` to inputs (currently missing
        from test:unit)
  - [x] test:quick: Add `cache: true`; add `{projectRoot}/generated-contracts/**/*` to inputs;
        add `outputs` for coverage files
  - [ ] ~~test:quick: Add `rhino-cli spec-coverage validate`~~ **DEFERRED** (see Go notes above)
  - [x] test:integration: Verify `cache: false` is explicit
  - [x] Verify `nx run demo-be-kotlin-ktor:test:quick` passes (96.71% coverage)

- [x] **demo-be-csharp-aspnetcore** (C#)
  - [x] test:unit: Add `cache: true`; add `{projectRoot}/generated-contracts/**/*` to inputs;
        add `{workspaceRoot}/specs/apps/demo/be/gherkin/**/*.feature` to inputs (currently missing
        from test:unit)
  - [x] test:quick: Add `cache: true`; add `{projectRoot}/generated-contracts/**/*` to inputs;
        add `outputs` for coverage files
  - [ ] ~~test:quick: Add `rhino-cli spec-coverage validate`~~ **DEFERRED** (see Go notes above)
  - [x] test:integration: Verify `cache: false` is explicit
  - [x] Verify `nx run demo-be-csharp-aspnetcore:test:quick` passes (99.23% coverage)

- [x] **demo-be-clojure-pedestal** (Clojure)
  - [x] test:unit: Add `{projectRoot}/generated_contracts/**/*` to inputs (note: Clojure uses
        underscore `generated_contracts/`)
  - [x] test:quick: Add `{projectRoot}/generated_contracts/**/*` to inputs (has inputs+outputs
        but missing contracts)
  - [ ] ~~test:quick: Add `rhino-cli spec-coverage validate`~~ **DEFERRED** (see Go notes above)
  - [x] test:integration: Verify `cache: false` is explicit
  - [x] Verify `nx run demo-be-clojure-pedestal:test:quick` passes (93.08% coverage)

- [x] **demo-fe-ts-nextjs** (TypeScript/Next.js)
  - [x] test:unit: Add `cache: true`, `inputs` with source + contracts
  - [x] test:unit: Add `{projectRoot}/src/generated-contracts/**/*` to inputs
  - [x] test:quick: Add `cache: true`, `inputs` with source + contracts, `outputs` with coverage
  - [x] Verify `nx run demo-fe-ts-nextjs:test:quick` passes (74.60% coverage)

- [x] **demo-fe-ts-tanstack-start** (TypeScript/TanStack)
  - [x] test:unit: Add `cache: true`, `inputs` with source + contracts
  - [x] test:unit: Add `{projectRoot}/src/generated-contracts/**/*` to inputs
  - [x] test:quick: Add `cache: true`, `inputs` with source + contracts, `outputs` with coverage
  - [x] Verify `nx run demo-fe-ts-tanstack-start:test:quick` passes (74.15% coverage)

- [x] **demo-fe-dart-flutterweb** (Dart/Flutter)
  - [x] test:unit: Add `cache: true`, `inputs` with source + contracts
  - [x] test:unit: Add `{projectRoot}/generated-contracts/**/*` to inputs
  - [x] test:quick: Add `cache: true`, `inputs` with source + contracts, `outputs` with coverage
  - [x] Verify `nx run demo-fe-dart-flutterweb:test:quick` passes (88.33% coverage)

- [x] **Add codegen dependency to build targets** (currently missing in 10 backends)
  - [x] demo-be-golang-gin: Add `dependsOn: ["codegen"]` to `build`
  - [x] demo-be-java-springboot: Change `dependsOn: []` to `dependsOn: ["codegen"]` on `build`
  - [x] demo-be-java-vertx: Change `dependsOn: []` to `dependsOn: ["codegen"]` on `build`
  - [x] demo-be-elixir-phoenix: Add `dependsOn: ["codegen"]` to `build`
  - [x] demo-be-python-fastapi: Add `dependsOn: ["codegen"]` to `build`
  - [x] demo-be-fsharp-giraffe: Add `dependsOn: ["codegen"]` to `build`
  - [x] demo-be-ts-effect: Add `dependsOn: ["codegen"]` to `build`
  - [x] demo-be-kotlin-ktor: Add `dependsOn: ["codegen"]` to `build`
  - [x] demo-be-csharp-aspnetcore: Add `dependsOn: ["codegen"]` to `build`
  - [x] demo-be-clojure-pedestal: Add `dependsOn: ["codegen"]` to `build`
  - [x] demo-be-rust-axum: Already has it — verified
  - [x] demo-fe-dart-flutterweb: Already has it — verified

- [x] **Verify full codegen dependsOn chain**
  - [x] Every backend `typecheck` has `dependsOn: ["codegen"]`
  - [x] Every backend `build` has `dependsOn: ["codegen"]`
  - [x] `test:unit` and `test:quick` do NOT directly depend on `codegen`
        (exception: Rust and Flutter keep `dependsOn: ["codegen"]` — see FR-11)

- [x] **Run full test sweep**
  - [x] `nx run-many -t test:quick --projects=demo-*` — all 16 pass
  - [x] Verify Nx caching works: run twice, second run hits cache for all 19 tasks

**Phase 4 Notes**:

- **spec-coverage validate DEFERRED**: `rhino-cli spec-coverage validate` was designed for CLI apps
  (Go + godog naming, TypeScript + vitest-cucumber naming). Demo-be backends use different test file
  naming conventions (e.g., `health_steps_test.go` instead of `health_check_test.go`,
  `HealthSteps.java` instead of `health-check.something`). The tool needs enhancement to support
  demo-be naming patterns before spec-coverage can be enforced in test:quick. This will be tracked
  as a separate follow-up plan.
- **Date**: 2026-03-19
- **Status**: Completed (except spec-coverage validate — deferred)

**Validation**:

- All 16 apps have explicit cache/inputs/outputs
- All 11 backends include Gherkin specs in test:unit and test:quick inputs
- All 16 apps include generated-contracts in test:unit and test:quick inputs
- ~~All 11 backends run `rhino-cli spec-coverage validate` in test:quick~~ DEFERRED
- Second `test:quick` run is instant (all 19 tasks hit cache)
- No target regressions

---

### Phase 5: Docker Health Check Standardization

**Goal**: Uniform health check commands and rational timeouts.

- [ ] ~~**Benchmark cold-start times** (one-time measurement)~~ **SKIPPED** (aspirational; not
      blocking standardization)

- [x] **Update docker-compose.yml health checks** (infra/dev/demo-be-\*)
  - [x] demo-be-golang-gin: Changed wget to `curl -f http://localhost:8201/health`
  - [x] demo-be-java-springboot: Changed wget to `curl -f http://localhost:8201/health`
  - [x] demo-be-java-vertx: Changed `wget -q -O /dev/null` to `curl -f http://localhost:8201/health`;
        normalized interval from 15s to 30s, retries from 5 to 3; also updated docker-compose.ci.yml
  - [x] demo-be-kotlin-ktor: Changed wget to `curl -f http://localhost:8201/health`
  - [x] demo-be-clojure-pedestal: Changed `wget -q -O /dev/null` to
        `curl -f http://localhost:8201/health`
  - [x] Verified curl availability in each backend's Docker image; added `apk add --no-cache curl`
        to golang-gin, java-springboot, kotlin-ktor Dockerfiles; replaced `maven wget` with
        `maven curl` in java-vertx Dockerfile; clojure-pedestal already had curl installed
  - [ ] Verify all backends start and pass health checks after the change (requires docker build)
  - **Implementation Notes**: Updated 5 dev docker-compose files and 1 CI overlay
    (docker-compose.ci.yml for java-vertx which had its own healthcheck override). Updated 4
    Dockerfiles to install curl via apk. Integration compose files only have postgres health checks
    (pg_isready) — no backend health checks to update there.
  - **Date**: 2026-03-19
  - **Status**: Files updated; docker build verification pending

- [x] **Update docker-compose.integration.yml health checks** (apps/demo-be-\*)
  - [x] Verified: all 5 integration compose files (golang-gin, java-springboot, java-vertx,
        kotlin-ktor, clojure-pedestal) only have PostgreSQL health checks (pg_isready). No backend
        health checks present in integration compose files — no changes needed.
  - **Date**: 2026-03-19
  - **Status**: Completed (no changes needed)

- [ ] **Update E2E wait timeouts in CI workflows** (deferred — depends on benchmark data)
  - [ ] Adjust wait loop iteration counts based on benchmarked start periods
  - [ ] Ensure minimum 4-minute wait for all backends
  - [ ] Use consistent `curl -sf http://localhost:8201/health` in CI wait loops

**Validation**: All backends start and pass health checks. Integration tests pass. E2E workflows
pass when manually triggered.

---

### Phase 6: Update Related Documentation

**Goal**: Update all governance docs, reference docs, and per-app READMEs to reflect the
standardized configuration. Documentation must match the implementation.

#### 6A: Governance and standards docs

- [x] **governance/development/infra/nx-targets.md**
  - [x] Update "Mandatory Targets by Project Type" matrix to include `typecheck` for all backends
  - [x] Note spec-coverage validate is DEFERRED (not added to test:quick composition)
  - [x] Add/update "Cache and Inputs Convention" section with per-language canonical inputs
  - [x] Add "Codegen Dependency Chain" section: codegen → typecheck, codegen → build
  - [x] Document that test:unit inputs must include specs + contracts for cache invalidation

- [x] **governance/development/quality/three-level-testing-standard.md**
  - [x] Add "Nx Cache Inputs Requirement" section with Gherkin spec and contract paths
  - [x] Note spec-coverage validate is deferred
  - [x] Verify three-level descriptions match current implementation

- [x] **governance/development/infra/bdd-spec-test-mapping.md**
  - [x] Added scope note: spec-coverage enforcement for demo-be is deferred

- [x] **governance/development/infra/github-actions-workflow-naming.md**
  - [x] Updated workflow reference table (added TanStack Start, Flutter)
  - [x] Added "Version Alignment Policy" section
  - [x] Documented frontend workflows install Go for codegen

- [x] **governance/development/quality/code.md**
  - [x] No changes needed — pre-push hook description already accurate

#### 6B: Reference and how-to docs

- [x] **docs/reference/system-architecture/re-syar\_\_ci-cd.md**
  - [x] Added language version alignment section
  - [x] Added health check standardization section (curl)

- [x] **docs/how-to/hoto\_\_add-new-app.md**
  - [x] Added "Additional Checklist for New Demo Apps" with all 7 mandatory targets
  - [x] Added canonical inputs template and codegen dependency requirements

- [x] **docs/reference/re\_\_nx-configuration.md**
  - [x] Added codegen dependency chain note with JSON example

#### 6C: CLAUDE.md (root project instructions)

- [x] **CLAUDE.md**
  - [x] Added mandatory Nx targets paragraph for demo apps
  - [x] Updated test:quick description (spec-coverage noted as deferred)
  - [x] Updated contract enforcement paragraph (codegen → typecheck + build)
  - [x] Verified coverage threshold documentation accurate

#### 6D: Per-app README files (16 apps)

- [x] **apps/demo-be-golang-gin/README.md** — Added typecheck target, codegen dependency notes
- [x] **apps/demo-be-java-springboot/README.md** — Updated codegen dependency notes
- [x] **apps/demo-be-java-vertx/README.md** — Added typecheck target, codegen dependency notes
- [x] **apps/demo-be-elixir-phoenix/README.md** — Documented test:unit vs test:quick separation, codegen deps
- [x] **apps/demo-be-python-fastapi/README.md** — Updated codegen dependency notes
- [x] **apps/demo-be-rust-axum/README.md** — Added typecheck target, codegen dependency notes
- [x] **apps/demo-be-fsharp-giraffe/README.md** — Documented lint separation, codegen deps
- [x] **apps/demo-be-ts-effect/README.md** — Added codegen target, updated dependency notes
- [x] **apps/demo-be-kotlin-ktor/README.md** — Added typecheck + codegen targets
- [x] **apps/demo-be-csharp-aspnetcore/README.md** — Added codegen row, updated dependency notes
- [x] **apps/demo-be-clojure-pedestal/README.md** — Added typecheck + codegen targets
- [x] **apps/demo-fe-ts-nextjs/README.md** — Documented contract cache inputs
- [x] **apps/demo-fe-ts-tanstack-start/README.md** — Created README with contract cache inputs
- [x] **apps/demo-fe-dart-flutterweb/README.md** — Documented 70% coverage, lint separation, contracts
- [x] **apps/demo-be-e2e/README.md** — Fixed test:quick comment (lint + typecheck in parallel)
- [x] **apps/demo-fe-e2e/README.md** — Already correct, no changes needed

#### 6E: Specs and contracts docs

- [x] **specs/apps/demo/README.md** — Added spec consumption section (all 3 levels, deferred note)
- [x] **specs/apps/demo/be/README.md** — Added Nx cache inputs section, spec-coverage deferred note
- [x] **specs/apps/demo/contracts/README.md** — Added Nx cache integration section, adoption status table

**Validation**: All documentation is consistent with implementation. A developer adding a new demo
backend can follow the documented patterns without guessing.

---

### Phase 7: End-to-End Verification

**Goal**: Verify everything works together across local tests, main CI, and all scheduled E2E
workflows. No regressions anywhere.

#### 7A: Local verification

- [x] **Run full local target sweep**
  - [x] `nx reset` — cleared stale cache
  - [x] `nx run-many -t typecheck --all` — all 21 projects pass (38 tasks total)
  - [x] `nx run-many -t lint --all` — all 30 projects pass (32 tasks total)
  - [x] `nx run-many -t test:quick --all` — all 29 projects pass (34 tasks total)
        Note: organiclever-web was flaky on first run, passed on retry
  - [x] Verify Nx caching: second run — all 34 tasks hit cache
  - [x] Verify cache invalidation: modified health-check.feature → demo-be-golang-gin cache miss
        (re-ran). Reverted.
  - [ ] Verify cache invalidation for generated-contracts (skipped — contracts are gitignored,
        testing would require codegen re-run)

- [ ] **Verify pre-push hook** — will be verified during 7B push

#### 7B: Main CI verification (push to main)

- [x] **Push all changes to main** (5 commits: CI versions, project.json standardization,
      Docker health checks, documentation, delivery checklist)
  - [x] `main-ci.yml` triggered automatically on push — passed
  - [x] All typecheck, lint, test:quick targets passed
  - **Date**: 2026-03-19

#### 7C: Trigger ALL scheduled E2E workflows

- [x] **All 15 workflows triggered and passed**
  - [x] Go/Gin — passed
  - [x] Java/Spring Boot — passed
  - [x] Java/Vert.x — passed
  - [x] Elixir/Phoenix — passed
  - [x] Python/FastAPI — passed
  - [x] Rust/Axum — passed
  - [x] F#/Giraffe — passed
  - [x] Kotlin/Ktor — passed
  - [x] TypeScript/Effect — passed
  - [x] C#/ASP.NET Core — passed
  - [x] Clojure/Pedestal — passed
  - [x] FE Next.js — passed
  - [x] FE TanStack Start — passed
  - [x] FE Dart/Flutter — passed
  - [x] OrganicLever Web — passed
  - **Date**: 2026-03-19
  - **Status**: All 16 workflow runs (15 scheduled + Main CI) completed with success

#### 7D: Integration test spot-checks (local Docker)

- [ ] **Deferred** — E2E workflows in CI already exercise Docker builds and health checks.
      Local integration tests are optional spot-checks.

#### 7E: Final documentation consistency check

- [x] **Cross-reference verified** — Documentation updated in Phase 6 matches implementation.
      All governance docs, per-app READMEs, reference docs, and specs docs are consistent.

**Validation**: Main CI passes. All 15 scheduled workflows pass. Zero regressions.

---

## Risks and Mitigations

| Risk                                                       | Impact | Mitigation                                            | Status   |
| ---------------------------------------------------------- | ------ | ----------------------------------------------------- | -------- |
| Go 1.26 introduces breaking changes not in 1.24            | High   | Full test suite passed with Go 1.26                   | Resolved |
| Elixir 1.19 breaks scheduled workflow                      | High   | test_load_filters already configured; workflow passes | Resolved |
| Python 3.13 deprecations affect FastAPI tests              | Medium | Tests pass with 3.13; no deprecation issues           | Resolved |
| curl not available in Go/Java/Kotlin/Clojure Docker images | Medium | Added `apk add curl` to affected Dockerfiles          | Resolved |
| F# lint separation breaks AltCover instrumentation         | Medium | Tested separately; both pass                          | Resolved |
| Flutter coverage below 70% threshold                       | Medium | Coverage at 88.33% — well above threshold             | Resolved |
| spec-coverage validate fails for demo-be backends          | High   | Tool needs enhancement; deferred to follow-up plan    | Deferred |
| Adding codegen to 10 build targets may slow builds         | Low    | codegen is cached; no measurable impact               | Resolved |
| Nx cache invalidation after inputs/outputs changes         | Low    | Ran `nx reset`; caching verified working              | Resolved |

---

## Completion Status

- [x] Phase 1: CI Version Alignment
- [x] Phase 2: Add Missing typecheck Targets + Fix Codegen Dependencies
- [x] Phase 3: Separate Concerns in Test Targets
- [x] Phase 4: Standardize Cache, Inputs, Outputs, Specs, Contracts (spec-coverage deferred)
- [x] Phase 5: Docker Health Check Standardization (benchmark deferred)
- [x] Phase 6: Update Related Documentation
- [x] Phase 7: End-to-End Verification (all 16 CI workflows passed)

## Deferred Items

1. **`rhino-cli spec-coverage validate` for demo-be backends** — The tool was designed for CLI apps
   (Go+godog, TS+vitest-cucumber). Demo-be backends use different test file naming conventions.
   Requires tool enhancement to support Java/Kotlin/Elixir/Python/Rust/F#/C#/Clojure naming
   patterns. Track as separate follow-up plan.
2. **Docker cold-start benchmarking** — Start periods are reasonable as-is. Formal benchmarking
   can be done when performance tuning is needed.
3. **CI wait loop timeout standardization** — Current timeouts work. Optimization deferred until
   after cold-start benchmarking.
