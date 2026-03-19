# Delivery Plan

## Implementation Phases

### Phase 1: CI Version Alignment

**Goal**: Update all scheduled test workflows to match main-ci.yml language versions.

- [ ] **Update Go version in ALL scheduled workflows using Go 1.24**
  - [ ] `test-demo-be-golang-gin.yml`: Change `go-version: "1.24"` to `"1.26.0"` in both jobs
  - [ ] `test-demo-fe-ts-nextjs.yml`: Change `go-version: "1.24"` to `"1.26.0"`
  - [ ] `test-demo-fe-ts-tanstack-start.yml`: Change `go-version: "1.24"` to `"1.26.0"`
  - [ ] `test-demo-fe-dart-flutterweb.yml`: Change `go-version: "1.24"` to `"1.26.0"`
  - [ ] Verify all 4 updated workflows pass by manually triggering via workflow_dispatch

- [ ] **Update Elixir version in test-demo-be-elixir-phoenix.yml**
  - [ ] Change `elixir-version: "1.18"` to `elixir-version: "1.19"` in integration-tests job
  - [ ] Change `elixir-version: "1.18"` to `elixir-version: "1.19"` in e2e job
  - [ ] Verify `test_load_filters` config in mix.exs (required for Elixir 1.19 — should already
        exist per prior plan)
  - [ ] Verify workflow passes by manually triggering via workflow_dispatch

- [ ] **Update Python version in test-demo-be-python-fastapi.yml**
  - [ ] Change `python-version: "3.12"` to `python-version: "3.13"` in integration-tests job
  - [ ] Change `python-version: "3.12"` to `python-version: "3.13"` in e2e job
  - [ ] Verify no Python 3.13 deprecation warnings or breaking changes affect tests
  - [ ] Verify workflow passes by manually triggering via workflow_dispatch

- [ ] **Audit remaining workflows for version consistency**
  - [ ] Verify all test-demo-\*.yml files use Node.js 24 (should already be consistent)
  - [ ] Verify Rust uses `dtolnay/rust-toolchain@stable` consistently
  - [ ] Verify Flutter uses `subosito/flutter-action@v2` with `channel: stable` consistently
  - [ ] Document any other version mismatches found

**Validation**: All 6 updated workflows (1 Go backend + 3 frontends + 1 Elixir + 1 Python) pass
when manually triggered. No version mismatches remain across any `test-demo-*.yml` file.

---

### Phase 2: Add Missing typecheck Targets and Fix Codegen Dependencies

**Goal**: Every demo backend has a `typecheck` target that depends on `codegen`. Fix existing
typecheck targets missing the codegen dependency.

- [ ] **demo-be-golang-gin: Add typecheck target**
  - [ ] Add to `project.json`:

    ```jsonc
    "typecheck": {
      "command": "go vet ./...",
      "dependsOn": ["codegen"],
      "cache": true
    }
    ```

  - [ ] Verify `nx run demo-be-golang-gin:typecheck` passes

- [ ] **demo-be-rust-axum: Add typecheck target**
  - [ ] Add to `project.json`:

    ```jsonc
    "typecheck": {
      "command": "cargo check",
      "dependsOn": ["codegen"],
      "cache": true
    }
    ```

  - [ ] Verify `nx run demo-be-rust-axum:typecheck` passes

- [ ] **demo-be-kotlin-ktor: Add typecheck target**
  - [ ] Add to `project.json`:

    ```jsonc
    "typecheck": {
      "command": "./gradlew compileKotlin",
      "dependsOn": ["codegen"],
      "cache": true
    }
    ```

  - [ ] Verify `nx run demo-be-kotlin-ktor:typecheck` passes

- [ ] **demo-be-clojure-pedestal: Add typecheck target**
  - [ ] Add to `project.json`:

    ```jsonc
    "typecheck": {
      "command": "clj-kondo --lint src",
      "dependsOn": ["codegen"],
      "cache": true
    }
    ```

  - [ ] Verify `nx run demo-be-clojure-pedestal:typecheck` passes

- [ ] **Fix existing typecheck targets missing codegen dependency**
  - [ ] `demo-be-elixir-phoenix`: Add `dependsOn: ["codegen"]` (currently missing)
  - [ ] `demo-be-python-fastapi`: Add `dependsOn: ["codegen"]` (currently missing)
  - [ ] `demo-be-java-springboot`: Verify `dependsOn` includes `codegen` (has it)
  - [ ] `demo-be-java-vertx`: Verify `dependsOn` includes `codegen` (has it)
  - [ ] `demo-be-fsharp-giraffe`: Verify `dependsOn` includes `codegen` (has it)
  - [ ] `demo-be-csharp-aspnetcore`: Verify `dependsOn` includes `codegen` (has it)
  - [ ] `demo-be-ts-effect`: Verify `dependsOn` includes `codegen` (has it)

- [ ] **Run full typecheck sweep**
  - [ ] `nx run-many -t typecheck --projects=demo-be-*` — all 11 backends pass

**Validation**: `nx run-many -t typecheck --projects=demo-be-*` exits 0. All 11 backends have
typecheck targets.

---

### Phase 3: Separate Concerns in Test Targets

**Goal**: test:unit and test:quick are distinct; test:quick contains no lint/format.

#### 3A: Elixir — separate test:unit from test:quick

Currently both targets run identical commands (`MIX_ENV=test mix coveralls.lcov --only unit` +
rhino-cli). This is the only backend with this duplication.

- [ ] **Update demo-be-elixir-phoenix/project.json**
  - [ ] Change `test:unit` command to: `MIX_ENV=test mix test --only unit` (no coverage)
  - [ ] Keep `test:quick` as: `MIX_ENV=test mix coveralls.lcov --only unit` + rhino-cli validation
  - [ ] Verify commands are now distinct (test:unit has no `coveralls.lcov`)
  - [ ] Verify `nx run demo-be-elixir-phoenix:test:unit` passes
  - [ ] Verify `nx run demo-be-elixir-phoenix:test:quick` passes with coverage

Note: `demo-be-clojure-pedestal` already has proper separation (test:unit uses `-M:test`,
test:quick uses `-M:coverage`). No changes needed.

#### 3B: F# — move lint/format out of test:quick

Currently `test:quick` runs 7 commands including `fantomas --check` and `dotnet fsharplint`.
These belong in the `lint` target.

- [ ] **Update demo-be-fsharp-giraffe/project.json**
  - [ ] Remove `fantomas --check src/ tests/` from `test:quick` commands
  - [ ] Remove `dotnet fsharplint lint` from `test:quick` commands
  - [ ] Verify existing `lint` target already runs `dotnet fsharplint`; add `fantomas --check`
        if not present
  - [ ] Verify `test:quick` retains only: tool restore, build tests, AltCover instrument,
        AltCover run, rhino-cli validate (5 commands)
  - [ ] Verify `nx run demo-be-fsharp-giraffe:test:quick` passes
  - [ ] Verify `nx run demo-be-fsharp-giraffe:lint` passes

#### 3C: Flutter — remove lint from test:quick and add coverage enforcement

Currently `test:quick` runs `dart analyze --fatal-infos && flutter test test/unit`. This bundles
lint (`dart analyze`) with testing, and has no coverage enforcement.

- [ ] **Update demo-fe-dart-flutterweb/project.json**
  - [ ] Change `test:quick` command to:
        `flutter test test/unit --coverage && (cd ../../apps/rhino-cli && CGO_ENABLED=0 go run main.go test-coverage validate apps/demo-fe-dart-flutterweb/coverage/lcov.info 70)`
  - [ ] Verify `lint` target already runs `dart analyze --fatal-infos` (it does — confirmed in
        project.json)
  - [ ] Add `outputs` to `test:quick`: `["{projectRoot}/coverage/"]`
  - [ ] Verify `nx run demo-fe-dart-flutterweb:test:quick` passes with coverage at >= 70%
  - [ ] If coverage is below 70%, add tests to reach threshold before proceeding

**Validation**: Elixir test:unit and test:quick are distinct. F# test:quick has no lint/format.
Flutter test:quick enforces coverage at 70% and does not include `dart analyze`.

---

### Phase 4: Standardize Cache, Inputs, and Outputs

**Goal**: Every demo app has explicit, consistent cache/inputs/outputs declarations.

- [ ] **Define canonical inputs per language** (reference for all updates below):
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

- [ ] **demo-be-golang-gin** (Go)
  - [ ] test:unit: Add `cache: true`; add `inputs` with Go source + Gherkin specs + contracts
  - [ ] test:unit: Add `{projectRoot}/generated-contracts/**/*` to inputs (currently missing)
  - [ ] test:unit: Add `{workspaceRoot}/specs/apps/demo/be/gherkin/**/*.feature` to inputs (currently missing)
  - [ ] test:quick: Add `{projectRoot}/generated-contracts/**/*` to inputs (currently missing)
  - [ ] test:quick: Add `rhino-cli spec-coverage validate` command after coverage validation
  - [ ] test:integration: Verify `cache: false` is explicit
  - [ ] Verify `nx run demo-be-golang-gin:test:quick` passes (including spec-coverage)

- [ ] **demo-be-java-springboot** (Java/Maven)
  - [ ] test:unit: Add `cache: true`; add `{projectRoot}/generated-contracts/**/*` to inputs
  - [ ] test:quick: Add `cache: true`; add `{projectRoot}/generated-contracts/**/*` to inputs
  - [ ] test:quick: Add `outputs` for coverage files
  - [ ] test:quick: Add `rhino-cli spec-coverage validate` command after coverage validation
  - [ ] test:integration: Verify `cache: false` is explicit
  - [ ] Verify `nx run demo-be-java-springboot:test:quick` passes (including spec-coverage)

- [ ] **demo-be-java-vertx** (Java/Maven)
  - [ ] test:unit: Add `cache: true`; add `{projectRoot}/generated-contracts/**/*` to inputs
  - [ ] test:quick: Add `cache: true`; add `{projectRoot}/generated-contracts/**/*` to inputs
  - [ ] test:quick: Add `outputs` for coverage files
  - [ ] test:quick: Add `rhino-cli spec-coverage validate` command after coverage validation
  - [ ] test:integration: Verify `cache: false` is explicit
  - [ ] Verify `nx run demo-be-java-vertx:test:quick` passes (including spec-coverage)

- [ ] **demo-be-elixir-phoenix** (Elixir)
  - [ ] test:unit: Add `cache: true`; add `{projectRoot}/generated-contracts/**/*` to inputs
  - [ ] test:quick: Add `cache: true`; add `{projectRoot}/generated-contracts/**/*` to inputs
  - [ ] test:quick: Add `outputs` for coverage files (`cover/lcov.info`)
  - [ ] test:quick: Add `rhino-cli spec-coverage validate` command after coverage validation
  - [ ] test:integration: Verify `cache: false` is explicit
  - [ ] Verify `nx run demo-be-elixir-phoenix:test:quick` passes (including spec-coverage)

- [ ] **demo-be-python-fastapi** (Python)
  - [ ] test:unit: Add `cache: true`; add `{projectRoot}/generated_contracts/**/*` to inputs
        (note: Python uses underscore `generated_contracts/`)
  - [ ] test:quick: Add `cache: true`; add `{projectRoot}/generated_contracts/**/*` to inputs
  - [ ] test:quick: Add `outputs` for coverage files (`coverage/lcov.info`)
  - [ ] test:quick: Add `rhino-cli spec-coverage validate` command after coverage validation
  - [ ] test:integration: Verify `cache: false` is explicit
  - [ ] Verify `nx run demo-be-python-fastapi:test:quick` passes (including spec-coverage)

- [ ] **demo-be-rust-axum** (Rust)
  - [ ] test:unit: Add `{projectRoot}/generated-contracts/**/*` to inputs (has cache+inputs but
        missing contracts)
  - [ ] test:quick: Add `{projectRoot}/generated-contracts/**/*` to inputs (has cache+inputs+outputs
        but missing contracts)
  - [ ] test:quick: Add `rhino-cli spec-coverage validate` command after coverage validation
  - [ ] test:integration: Verify `cache: false` is explicit
  - [ ] Verify `nx run demo-be-rust-axum:test:quick` passes (including spec-coverage)

- [ ] **demo-be-fsharp-giraffe** (F#)
  - [ ] test:unit: Add `cache: true`; add `{projectRoot}/generated-contracts/**/*` to inputs;
        add `{workspaceRoot}/specs/apps/demo/be/gherkin/**/*.feature` to inputs (currently missing
        from test:unit)
  - [ ] test:quick: Add `{projectRoot}/generated-contracts/**/*` to inputs (has cache+inputs but
        missing contracts)
  - [ ] test:quick: Add `outputs` for coverage files (`coverage/altcov.info`)
  - [ ] test:quick: Add `rhino-cli spec-coverage validate` command after coverage validation
  - [ ] test:integration: Verify `cache: false` is explicit
  - [ ] Verify `nx run demo-be-fsharp-giraffe:test:quick` passes (including spec-coverage)

- [ ] **demo-be-ts-effect** (TypeScript)
  - [ ] test:unit: Add `{projectRoot}/generated-contracts/**/*` to inputs (has cache+inputs but
        missing contracts)
  - [ ] test:quick: Add `{projectRoot}/generated-contracts/**/*` to inputs; add `outputs` for
        coverage files
  - [ ] test:quick: Add `rhino-cli spec-coverage validate` command after coverage validation
  - [ ] test:integration: Verify `cache: false` is explicit
  - [ ] Verify `nx run demo-be-ts-effect:test:quick` passes (including spec-coverage)

- [ ] **demo-be-kotlin-ktor** (Kotlin/Gradle)
  - [ ] test:unit: Add `cache: true`; add `{projectRoot}/generated-contracts/**/*` to inputs;
        add `{workspaceRoot}/specs/apps/demo/be/gherkin/**/*.feature` to inputs (currently missing
        from test:unit)
  - [ ] test:quick: Add `cache: true`; add `{projectRoot}/generated-contracts/**/*` to inputs;
        add `outputs` for coverage files
  - [ ] test:quick: Add `rhino-cli spec-coverage validate` command after coverage validation
  - [ ] test:integration: Verify `cache: false` is explicit
  - [ ] Verify `nx run demo-be-kotlin-ktor:test:quick` passes (including spec-coverage)

- [ ] **demo-be-csharp-aspnetcore** (C#)
  - [ ] test:unit: Add `cache: true`; add `{projectRoot}/generated-contracts/**/*` to inputs;
        add `{workspaceRoot}/specs/apps/demo/be/gherkin/**/*.feature` to inputs (currently missing
        from test:unit)
  - [ ] test:quick: Add `cache: true`; add `{projectRoot}/generated-contracts/**/*` to inputs;
        add `outputs` for coverage files
  - [ ] test:quick: Add `rhino-cli spec-coverage validate` command after coverage validation
  - [ ] test:integration: Verify `cache: false` is explicit
  - [ ] Verify `nx run demo-be-csharp-aspnetcore:test:quick` passes (including spec-coverage)

- [ ] **demo-be-clojure-pedestal** (Clojure)
  - [ ] test:unit: Add `{projectRoot}/generated_contracts/**/*` to inputs (note: Clojure uses
        underscore `generated_contracts/`)
  - [ ] test:quick: Add `{projectRoot}/generated_contracts/**/*` to inputs (has inputs+outputs
        but missing contracts)
  - [ ] test:quick: Add `rhino-cli spec-coverage validate` command after coverage validation
  - [ ] test:integration: Verify `cache: false` is explicit
  - [ ] Verify `nx run demo-be-clojure-pedestal:test:quick` passes (including spec-coverage)

- [ ] **demo-fe-ts-nextjs** (TypeScript/Next.js)
  - [ ] test:unit: Add `cache: true`, `inputs` with source + contracts
  - [ ] test:unit: Add `{projectRoot}/src/generated-contracts/**/*` to inputs
  - [ ] test:quick: Add `cache: true`, `inputs` with source + contracts, `outputs` with coverage
  - [ ] Verify `nx run demo-fe-ts-nextjs:test:quick` passes

- [ ] **demo-fe-ts-tanstack-start** (TypeScript/TanStack)
  - [ ] test:unit: Add `cache: true`, `inputs` with source + contracts
  - [ ] test:unit: Add `{projectRoot}/src/generated-contracts/**/*` to inputs
  - [ ] test:quick: Add `cache: true`, `inputs` with source + contracts, `outputs` with coverage
  - [ ] Verify `nx run demo-fe-ts-tanstack-start:test:quick` passes

- [ ] **demo-fe-dart-flutterweb** (Dart/Flutter)
  - [ ] test:unit: Add `cache: true`, `inputs` with source + contracts
  - [ ] test:unit: Add `{projectRoot}/generated-contracts/**/*` to inputs
  - [ ] test:quick: Add `cache: true`, `inputs` with source + contracts, `outputs` with coverage
  - [ ] Verify `nx run demo-fe-dart-flutterweb:test:quick` passes

- [ ] **Add codegen dependency to build targets** (currently missing in 10 backends)
  - [ ] demo-be-golang-gin: Add `dependsOn: ["codegen"]` to `build`
  - [ ] demo-be-java-springboot: Change `dependsOn: []` to `dependsOn: ["codegen"]` on `build`
  - [ ] demo-be-java-vertx: Change `dependsOn: []` to `dependsOn: ["codegen"]` on `build`
  - [ ] demo-be-elixir-phoenix: Add `dependsOn: ["codegen"]` to `build`
  - [ ] demo-be-python-fastapi: Add `dependsOn: ["codegen"]` to `build`
  - [ ] demo-be-fsharp-giraffe: Add `dependsOn: ["codegen"]` to `build`
  - [ ] demo-be-ts-effect: Add `dependsOn: ["codegen"]` to `build`
  - [ ] demo-be-kotlin-ktor: Add `dependsOn: ["codegen"]` to `build`
  - [ ] demo-be-csharp-aspnetcore: Add `dependsOn: ["codegen"]` to `build`
  - [ ] demo-be-clojure-pedestal: Add `dependsOn: ["codegen"]` to `build`
  - [ ] demo-be-rust-axum: Already has it — verify
  - [ ] demo-fe-dart-flutterweb: Already has it — verify

- [ ] **Verify full codegen dependsOn chain**
  - [ ] Every backend `typecheck` has `dependsOn: ["codegen"]`
  - [ ] Every backend `build` has `dependsOn: ["codegen"]`
  - [ ] `test:unit` and `test:quick` do NOT directly depend on `codegen`

- [ ] **Run full test sweep**
  - [ ] `nx run-many -t test:quick --projects=demo-*` — all pass
  - [ ] Verify Nx caching works: run twice, second run hits cache for all targets

**Validation**:

- All 16 apps have explicit cache/inputs/outputs
- All 11 backends include Gherkin specs in test:unit and test:quick inputs
- All 16 apps include generated-contracts in test:unit and test:quick inputs
- All 11 backends run `rhino-cli spec-coverage validate` in test:quick
- Second `test:quick` run is instant (all cache hits)
- No target regressions

---

### Phase 5: Docker Health Check Standardization

**Goal**: Uniform health check commands and rational timeouts.

- [ ] **Benchmark cold-start times** (one-time measurement)
  - [ ] For each backend, time from `docker compose up` to first successful `/health` response
  - [ ] Record p95 cold-start time for each backend
  - [ ] Set start_period = 2x p95, rounded up to nearest 30s
  - [ ] Document results in tech-docs.md

- [ ] **Update docker-compose.yml health checks** (infra/dev/demo-be-\*)
  - [ ] demo-be-golang-gin: Change wget to `curl -f http://localhost:8201/health`
  - [ ] demo-be-java-springboot: Change wget to `curl -f http://localhost:8201/health`
  - [ ] demo-be-java-vertx: Change `wget -q -O /dev/null` to `curl -f http://localhost:8201/health`;
        normalize interval from 15s to 30s, retries from 5 to 3
  - [ ] demo-be-kotlin-ktor: Change wget to `curl -f http://localhost:8201/health`
  - [ ] demo-be-clojure-pedestal: Change `wget -q -O /dev/null` to
        `curl -f http://localhost:8201/health`
  - [ ] Verify curl is available in each backend's Docker image (install if needed for Go, Java,
        Kotlin, Clojure images)
  - [ ] Verify all backends start and pass health checks after the change
  - [ ] Note: Elixir, Python, Rust, F#, TS/Effect, C# already use curl — no changes needed

- [ ] **Update docker-compose.integration.yml health checks** (apps/demo-be-\*)
  - [ ] Apply same curl standardization to integration test PostgreSQL health checks (these use
        `pg_isready` which is fine — only change backend health checks if present)

- [ ] **Update E2E wait timeouts in CI workflows**
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

- [ ] **governance/development/infra/nx-targets.md**
  - [ ] Update "Mandatory Targets by Project Type" matrix to include `typecheck` for all
        backends (Go, Rust, Kotlin, Clojure were missing)
  - [ ] Update `test:quick` composition to include `rhino-cli spec-coverage validate` for
        demo backends
  - [ ] Add/update "Cache and Inputs Convention" section with per-language canonical inputs
        including Gherkin specs and generated-contracts
  - [ ] Add "Codegen Dependency Chain" section: codegen → typecheck, codegen → build
  - [ ] Update coverage output paths table if any changed
  - [ ] Document that test:unit inputs must include specs + contracts for cache invalidation

- [ ] **governance/development/quality/three-level-testing-standard.md**
  - [ ] Update to state that `test:quick` must include `rhino-cli spec-coverage validate`
  - [ ] Add requirement that all test target `inputs` must include Gherkin spec paths and
        generated-contracts paths for Nx cache invalidation
  - [ ] Update anti-patterns section: missing spec-coverage validation is an anti-pattern
  - [ ] Verify three-level descriptions match current implementation

- [ ] **governance/development/infra/bdd-spec-test-mapping.md**
  - [ ] Update to reference spec-coverage enforcement via `rhino-cli spec-coverage validate`
  - [ ] Document that spec-coverage is now enforced in test:quick (not just aspirational)

- [ ] **governance/development/infra/github-actions-workflow-naming.md**
  - [ ] Update workflow reference table with any version changes
  - [ ] Add "Version Alignment Policy" section: `main-ci.yml` is the source of truth;
        all scheduled workflows must match
  - [ ] Document that frontend workflows install Go for codegen (not obvious)

- [ ] **governance/development/quality/code.md**
  - [ ] Update pre-push hook description if test:quick composition changed

#### 6B: Reference and how-to docs

- [ ] **docs/reference/system-architecture/re-syar\_\_ci-cd.md**
  - [ ] Update CI/CD pipeline documentation to reflect standardized versions
  - [ ] Update health check documentation (curl standardization)
  - [ ] Update test target descriptions if any changed

- [ ] **docs/how-to/hoto\_\_add-new-app.md**
  - [ ] Update mandatory target checklist: new demo apps must include all 7 targets
  - [ ] Add spec-coverage validation requirement for new demo backends
  - [ ] Add canonical inputs template (specs + contracts)
  - [ ] Add codegen dependsOn requirement for typecheck and build

- [ ] **docs/reference/re\_\_nx-configuration.md**
  - [ ] Update Nx target configuration examples if any patterns changed

#### 6C: CLAUDE.md (root project instructions)

- [ ] **CLAUDE.md**
  - [ ] Add note that all demo backends must have 7 mandatory Nx targets
  - [ ] Add note about spec-coverage validation in test:quick
  - [ ] Update test:quick description to mention spec-coverage
  - [ ] Add note about codegen dependency on typecheck and build
  - [ ] Verify coverage threshold documentation is accurate

#### 6D: Per-app README files (16 apps)

- [ ] **apps/demo-be-golang-gin/README.md**
  - [ ] Document new `typecheck` target (`go vet ./...`)
  - [ ] Document spec-coverage validation in test:quick
  - [ ] Update test target table with current commands
- [ ] **apps/demo-be-java-springboot/README.md**
  - [ ] Document spec-coverage validation in test:quick
  - [ ] Verify test target documentation matches project.json
- [ ] **apps/demo-be-java-vertx/README.md**
  - [ ] Document spec-coverage validation in test:quick
  - [ ] Verify test target documentation matches project.json
- [ ] **apps/demo-be-elixir-phoenix/README.md**
  - [ ] Document separated test:unit vs test:quick
  - [ ] Document spec-coverage validation in test:quick
  - [ ] Verify test target documentation matches project.json
- [ ] **apps/demo-be-python-fastapi/README.md**
  - [ ] Document spec-coverage validation in test:quick
  - [ ] Verify test target documentation matches project.json
- [ ] **apps/demo-be-rust-axum/README.md**
  - [ ] Document new `typecheck` target (`cargo check`)
  - [ ] Document spec-coverage validation in test:quick
- [ ] **apps/demo-be-fsharp-giraffe/README.md**
  - [ ] Document lint separation (fantomas/fsharplint moved out of test:quick)
  - [ ] Document spec-coverage validation in test:quick
- [ ] **apps/demo-be-ts-effect/README.md**
  - [ ] Document spec-coverage validation in test:quick
  - [ ] Verify test target documentation matches project.json
- [ ] **apps/demo-be-kotlin-ktor/README.md**
  - [ ] Document new `typecheck` target (`./gradlew compileKotlin`)
  - [ ] Document spec-coverage validation in test:quick
- [ ] **apps/demo-be-csharp-aspnetcore/README.md**
  - [ ] Document spec-coverage validation in test:quick
  - [ ] Verify test target documentation matches project.json
- [ ] **apps/demo-be-clojure-pedestal/README.md**
  - [ ] Document new `typecheck` target (`clj-kondo --lint src`)
  - [ ] Document spec-coverage validation in test:quick
- [ ] **apps/demo-fe-ts-nextjs/README.md**
  - [ ] Verify test target documentation matches project.json
  - [ ] Document contract inputs in cache configuration
- [ ] **apps/demo-fe-ts-tanstack-start/README.md**
  - [ ] Verify test target documentation matches project.json
  - [ ] Document contract inputs in cache configuration
- [ ] **apps/demo-fe-dart-flutterweb/README.md**
  - [ ] Document coverage enforcement in test:quick (70% threshold)
  - [ ] Document lint separation (dart analyze moved to lint target only)
  - [ ] Document contract inputs in cache configuration
- [ ] **apps/demo-be-e2e/README.md**
  - [ ] Verify test:quick semantics documentation (typecheck + lint, not unit tests)
- [ ] **apps/demo-fe-e2e/README.md**
  - [ ] Verify test:quick semantics documentation (typecheck + lint, not unit tests)

#### 6E: Specs and contracts docs

- [ ] **specs/apps/demo/README.md**
  - [ ] Update to reference spec-coverage enforcement across all backends
- [ ] **specs/apps/demo/be/README.md**
  - [ ] Document that all 11 backends consume specs at all 3 test levels
  - [ ] Document spec-coverage validation enforcement
- [ ] **specs/apps/demo/contracts/README.md**
  - [ ] Document that generated-contracts are in test target inputs for cache invalidation
  - [ ] Verify adoption status is accurate

**Validation**: All documentation is consistent with implementation. A developer adding a new demo
backend can follow the documented patterns without guessing.

---

### Phase 7: End-to-End Verification

**Goal**: Verify everything works together across local tests, main CI, and all scheduled E2E
workflows. No regressions anywhere.

#### 7A: Local verification

- [ ] **Run full local target sweep**
  - [ ] `nx reset` — clear stale cache
  - [ ] `nx run-many -t typecheck --all` — all pass (including 4 new typecheck targets)
  - [ ] `nx run-many -t lint --all` — all pass (including separated F# lint)
  - [ ] `nx run-many -t test:quick --all` — all pass with coverage + spec-coverage
  - [ ] Verify Nx caching: run `nx run-many -t test:quick --all` again — all hit cache
  - [ ] Verify cache invalidation: modify a `.feature` file, run test:quick for one backend —
        cache miss (re-runs). Revert the change.
  - [ ] Verify cache invalidation: modify a file in `generated-contracts/` for one backend,
        run test:quick — cache miss (re-runs). Revert the change.

- [ ] **Verify pre-push hook**
  - [ ] Make a trivial change to one demo backend (e.g., add a comment)
  - [ ] `git push` — verify pre-push hook runs `typecheck`, `lint`, `test:quick` for the
        affected project and all three pass
  - [ ] Verify spec-coverage validation ran as part of test:quick (check output)

#### 7B: Main CI verification (push to main)

- [ ] **Push all changes to main** (commits from Phases 1-6)
  - [ ] Verify `main-ci.yml` triggers automatically on push
  - [ ] Monitor `main-ci.yml` run — all pass:
    - [ ] `nx run-many -t typecheck --all` passes (4 new typecheck targets included)
    - [ ] `nx run-many -t lint --all` passes
    - [ ] `nx run-many -t test:quick --all` passes (spec-coverage included)
    - [ ] Coverage uploads succeed for all projects
  - [ ] Note the run URL for reference

#### 7C: Trigger ALL scheduled E2E workflows

All scheduled workflows have `workflow_dispatch`. Trigger all 15 and verify each passes.

- [ ] **Trigger all 11 backend E2E workflows**
  - [ ] `gh workflow run "Test - Demo BE (Go/Gin)"` — monitor → passes
  - [ ] `gh workflow run "Test - Demo BE (Java/Spring Boot)"` — monitor → passes
  - [ ] `gh workflow run "Test - Demo BE (Java/Vert.x)"` — monitor → passes
  - [ ] `gh workflow run "Test - Demo BE (Elixir/Phoenix)"` — monitor → passes
  - [ ] `gh workflow run "Test - Demo BE (Python/FastAPI)"` — monitor → passes
  - [ ] `gh workflow run "Test - Demo BE (Rust/Axum)"` — monitor → passes
  - [ ] `gh workflow run "Test - Demo BE (F#/Giraffe)"` — monitor → passes
  - [ ] `gh workflow run "Test - Demo BE (Kotlin/Ktor)"` — monitor → passes
  - [ ] `gh workflow run "Test - Demo BE (TypeScript/Effect)"` — monitor → passes
  - [ ] `gh workflow run "Test - Demo BE (C#/ASP.NET Core)"` — monitor → passes
  - [ ] `gh workflow run "Test - Demo BE (Clojure/Pedestal)"` — monitor → passes

- [ ] **Trigger all 3 frontend E2E workflows**
  - [ ] `gh workflow run "Test - Demo FE (TypeScript/Next.js)"` — monitor → passes
  - [ ] `gh workflow run "Test - Demo FE (TypeScript/TanStack Start)"` — monitor → passes
  - [ ] `gh workflow run "Test - Demo FE (Dart/Flutter Web)"` — monitor → passes

- [ ] **Trigger OrganicLever Web workflow**
  - [ ] `gh workflow run "Test - OrganicLever Web"` — monitor → passes

- [ ] **Verify all workflow results**
  - [ ] `gh run list --limit 15` — all 15 triggered runs show "completed" with "success"
  - [ ] Check Playwright report artifacts uploaded correctly for each workflow
  - [ ] No workflow failures related to version changes, health checks, or test targets

#### 7D: Integration test spot-checks (local Docker)

- [ ] **Run integration tests for representative backends**
  - [ ] `nx run demo-be-golang-gin:test:integration` — passes (fast start, Go)
  - [ ] `nx run demo-be-java-springboot:test:integration` — passes (JVM, Maven)
  - [ ] `nx run demo-be-elixir-phoenix:test:integration` — passes (BEAM)
  - [ ] `nx run demo-be-ts-effect:test:integration` — passes (Node.js)
  - [ ] Verify Docker health checks use curl (inspect running containers)

#### 7E: Final documentation consistency check

- [ ] **Cross-reference all updated docs**
  - [ ] CLAUDE.md matches governance/development/infra/nx-targets.md
  - [ ] Per-app READMEs match their project.json targets
  - [ ] governance/development/quality/three-level-testing-standard.md matches implementation
  - [ ] docs/how-to/hoto\_\_add-new-app.md has current mandatory target list
  - [ ] No stale version numbers remain in any documentation

**Validation**: Main CI passes. All 15 scheduled workflows pass. Integration tests pass locally.
Documentation is consistent across all files. Zero regressions.

---

## Risks and Mitigations

| Risk                                                         | Impact | Mitigation                                                      |
| ------------------------------------------------------------ | ------ | --------------------------------------------------------------- |
| Go 1.26 introduces breaking changes not in 1.24              | High   | Run full test suite against Go 1.26 before updating CI          |
| Elixir 1.19 breaks scheduled workflow (1.18 had workarounds) | High   | Verify test_load_filters and ExUnit changes are already handled |
| Python 3.13 deprecations affect FastAPI tests                | Medium | Run tests locally with 3.13 first; check deprecation warnings   |
| curl not available in Go/Java/Kotlin/Clojure Docker images   | Medium | Add `apk add curl` or equivalent to affected Dockerfiles        |
| F# lint separation breaks AltCover instrumentation           | Medium | Test separately: lint first, then test:quick                    |
| Flutter coverage below 70% threshold                         | Medium | Add tests before enabling enforcement                           |
| spec-coverage validate fails for backends with missing steps | High   | Run locally first; add missing step definitions before enabling |
| Adding codegen to 10 build targets may slow builds           | Low    | codegen is cached; only runs when OpenAPI spec changes          |
| Nx cache invalidation after inputs/outputs changes           | Low    | Run `nx reset` to clear stale cache entries                     |

---

## Completion Status

- [ ] Phase 1: CI Version Alignment
- [ ] Phase 2: Add Missing typecheck Targets + Fix Codegen Dependencies
- [ ] Phase 3: Separate Concerns in Test Targets
- [ ] Phase 4: Standardize Cache, Inputs, Outputs, Specs, Contracts, and Spec-Coverage
- [ ] Phase 5: Docker Health Check Standardization
- [ ] Phase 6: Update Related Documentation (governance, reference, per-app READMEs, specs)
- [ ] Phase 7: End-to-End Verification (local + main CI + all 15 E2E workflows + docs check)
