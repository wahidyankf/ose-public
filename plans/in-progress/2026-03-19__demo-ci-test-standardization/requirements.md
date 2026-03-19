# Requirements

## Objectives

1. **Eliminate version drift** — All CI pipelines use the same language versions, eliminating the
   risk of tests passing in one environment but failing in another
2. **Complete Nx target coverage** — Every demo backend has all mandatory targets (`codegen`,
   `typecheck`, `lint`, `build`, `test:unit`, `test:quick`, `test:integration`) with correct
   semantics per the three-level testing standard
3. **Enforce target separation** — `test:quick` = `test:unit` + coverage validation only; `lint` and
   `typecheck` are separate targets; no bundling of concerns
4. **Standardize caching** — Every target has explicit cache settings, inputs, and outputs so Nx
   caching works correctly and predictably
5. **Standardize Docker infrastructure** — Consistent health check approach, timeout rationale, and
   database naming across all backends
6. **Document the standard** — Codify the canonical target configuration in governance so new apps
   can be created correctly from the start

## User Stories

### Story 1: Version consistency across CI pipelines

```gherkin
Scenario: Language versions match between main CI and scheduled workflows
  Given main-ci.yml uses Go 1.26.0, Elixir 1.19, and Python 3.13
  And test-demo-be-golang-gin.yml uses Go 1.24
  And test-demo-be-elixir-phoenix.yml uses Elixir 1.18
  And test-demo-be-python-fastapi.yml uses Python 3.12
  When the CI standardization is complete
  Then all scheduled workflows use Go 1.26.0
  And all scheduled workflows use Elixir 1.19
  And all scheduled workflows use Python 3.13
  And tests produce the same results in main CI and scheduled workflows
```

### Story 2: Missing typecheck targets added

```gherkin
Scenario: All backends have a typecheck target
  Given demo-be-golang-gin has no typecheck target
  And demo-be-rust-axum has no typecheck target
  And demo-be-kotlin-ktor has no typecheck target
  And demo-be-clojure-pedestal has no typecheck target
  When the CI standardization is complete
  Then demo-be-golang-gin has a typecheck target running "go vet ./..."
  And demo-be-rust-axum has a typecheck target running "cargo check"
  And demo-be-kotlin-ktor has a typecheck target running "./gradlew compileKotlin"
  And demo-be-clojure-pedestal has a typecheck target running "clj-kondo --lint src"
  And all typecheck targets depend on codegen
  And nx affected -t typecheck includes all 11 backends
```

### Story 3: Existing typecheck targets get codegen dependency

```gherkin
Scenario: Existing typecheck targets depend on codegen
  Given demo-be-elixir-phoenix has typecheck but no dependsOn: ["codegen"]
  And demo-be-python-fastapi has typecheck but no dependsOn: ["codegen"]
  When the CI standardization is complete
  Then demo-be-elixir-phoenix typecheck depends on codegen
  And demo-be-python-fastapi typecheck depends on codegen
  And typecheck catches contract mismatches at compile time
```

### Story 4: test:quick and test:unit are distinct

```gherkin
Scenario: Elixir backend separates test:unit from test:quick
  Given demo-be-elixir-phoenix test:unit and test:quick run identical commands
  And both run "MIX_ENV=test mix coveralls.lcov --only unit" + rhino-cli validation
  When the CI standardization is complete
  Then test:unit runs "MIX_ENV=test mix test --only unit" without coverage measurement
  And test:quick runs unit tests WITH coverage measurement + rhino-cli validation
  And the two targets are not identical
```

### Story 5: F# and Flutter test:quick do not include lint/format

```gherkin
Scenario: F# backend separates lint from test:quick
  Given demo-be-fsharp-giraffe test:quick runs fantomas + fsharplint + tests + coverage
  When the CI standardization is complete
  Then test:quick runs tests + coverage validation only
  And lint target runs fantomas --check + dotnet fsharplint
  And the pre-push hook runs typecheck, lint, and test:quick as separate targets

Scenario: Flutter frontend separates lint from test:quick
  Given demo-fe-dart-flutterweb test:quick runs "dart analyze --fatal-infos && flutter test"
  And "dart analyze" is a lint concern, not a test concern
  When the CI standardization is complete
  Then test:quick runs flutter test with coverage + rhino-cli validation only
  And lint target runs "dart analyze --fatal-infos"
  And test:quick does not include dart analyze
```

### Story 6: Flutter frontend has coverage enforcement

```gherkin
Scenario: Flutter frontend enforces coverage threshold
  Given demo-fe-dart-flutterweb test:quick runs "dart analyze && flutter test"
  And there is no coverage measurement or rhino-cli validation
  When the CI standardization is complete
  Then test:quick runs flutter test with coverage + rhino-cli validation at 70% threshold
  And coverage is measured in LCOV format
  And the coverage file path follows the convention: coverage/lcov.info
```

### Story 7: Consistent cache and inputs across backends

```gherkin
Scenario: All backend project.json files have explicit cache settings
  Given some backends rely on nx.json defaults for cache settings
  And some backends specify inputs while others omit them
  When the CI standardization is complete
  Then every test:quick target has explicit cache: true
  And every test:unit target has explicit cache: true
  And every test:integration target has explicit cache: false
  And every codegen target has explicit cache: true with inputs and outputs
  And every test:quick target specifies inputs including source files and Gherkin specs
  And every test:quick target specifies outputs including coverage files
```

### Story 8: Docker health checks are standardized

```gherkin
Scenario: All backend Docker health checks use the same approach
  Given some backends use wget and others use curl for health checks
  And start periods range from 30s to 300s with no documented rationale
  When the CI standardization is complete
  Then all backend health checks use curl -f http://localhost:8201/health
  And start periods are set based on documented cold-start benchmarks
  And E2E wait timeouts are proportional to start periods
```

### Story 9: Codegen is a dependency of typecheck and build

```gherkin
Scenario: Codegen dependency chain is consistent
  Given some backends have codegen in dependsOn for typecheck/build and some do not
  When the CI standardization is complete
  Then every backend typecheck target has dependsOn: [codegen]
  And every backend build target has dependsOn: [codegen]
  And test:unit does NOT depend on codegen directly (codegen runs via typecheck/build chain)
  And test:quick does NOT depend on codegen directly
```

## Functional Requirements

### FR-1: CI version alignment

All 14 scheduled test workflows (`test-demo-be-*.yml`, `test-demo-fe-*.yml`) must use the same
language/tool versions as `main-ci.yml`. Specifically:

- Go: 1.26.0 (currently 1.24 in `test-demo-be-golang-gin.yml`)
- Elixir: 1.19 (currently 1.18 in `test-demo-be-elixir-phoenix.yml`)
- Python: 3.13 (currently 3.12 in `test-demo-be-python-fastapi.yml`)

### FR-2: Missing typecheck targets

Add `typecheck` Nx targets to:

- `demo-be-golang-gin`: `go vet ./...` (depends on codegen)
- `demo-be-rust-axum`: `cargo check` (depends on codegen)
- `demo-be-kotlin-ktor`: `./gradlew compileKotlin` (depends on codegen)
- `demo-be-clojure-pedestal`: `clj-kondo --lint src` (depends on codegen)

Verify existing typecheck targets in other backends depend on codegen.

### FR-3: Fix existing typecheck codegen dependencies

Add `dependsOn: ["codegen"]` to existing typecheck targets:

- `demo-be-elixir-phoenix`: typecheck exists but lacks codegen dependency
- `demo-be-python-fastapi`: typecheck exists but lacks codegen dependency

### FR-4: Separate test:unit from test:quick (Elixir)

For `demo-be-elixir-phoenix` (the only backend where test:unit and test:quick are identical):

- `test:unit`: Run unit tests only (`MIX_ENV=test mix test --only unit`) — no coverage
- `test:quick`: Run unit tests with coverage (`MIX_ENV=test mix coveralls.lcov --only unit`) +
  rhino-cli validation

Note: `demo-be-clojure-pedestal` already has proper separation (test:unit uses `-M:test`,
test:quick uses `-M:coverage`).

### FR-5: Remove lint/format from test:quick

For `demo-be-fsharp-giraffe`:

- Move `fantomas --check` and `dotnet fsharplint` from `test:quick` to `lint` target
- `test:quick` retains only: build tests, run coverage, validate coverage

For `demo-fe-dart-flutterweb`:

- Move `dart analyze --fatal-infos` from `test:quick` to `lint` target (which already has it)
- `test:quick` retains only: flutter test with coverage + rhino-cli validation

### FR-6: Flutter frontend coverage enforcement

For `demo-fe-dart-flutterweb`:

- `test:quick`: Run `flutter test test/unit --coverage` + `rhino-cli test-coverage validate
apps/demo-fe-dart-flutterweb/coverage/lcov.info 70`
- Coverage threshold: 70% (matching other frontend apps)
- Remove `dart analyze --fatal-infos` from test:quick (it belongs in `lint`)

### FR-7: Gherkin spec inputs at all test levels

Every demo backend's `test:unit`, `test:quick`, and `test:integration` inputs must include
`{workspaceRoot}/specs/apps/demo/be/gherkin/**/*.feature`. This ensures Nx cache invalidation
when Gherkin specs change. Currently missing from `test:unit` inputs in: demo-be-golang-gin,
demo-be-fsharp-giraffe, demo-be-kotlin-ktor, demo-be-csharp-aspnetcore.

For frontend apps, `test:unit` and `test:quick` inputs must include
`{workspaceRoot}/specs/apps/demo/fe/gherkin/**/*.feature` if the frontend consumes specs.
Frontend unit tests currently don't consume Gherkin specs directly (FE specs are consumed by
`demo-fe-e2e` via playwright-bdd), so this applies only to cache invalidation of E2E-related
targets.

### FR-8: Generated contract inputs at all test levels

Every demo backend's `test:unit` and `test:quick` inputs must include
`{projectRoot}/generated-contracts/**/*` (or `generated_contracts/` for Python/Clojure). This
ensures Nx cache invalidation when generated contracts change. Currently **no** backend includes
contracts in test target inputs.

### FR-9: Spec-coverage validation in test:quick

Every demo backend's `test:quick` must run `rhino-cli spec-coverage validate` after test execution
to verify that all Gherkin scenarios from `specs/apps/demo/be/gherkin/` have matching test
implementations. Currently **0 of 11** demo backends run this validation.

Command pattern:
`(cd ../../apps/rhino-cli && CGO_ENABLED=0 go run main.go spec-coverage validate
specs/apps/demo/be/gherkin apps/demo-be-<name>)`

### FR-10: Explicit cache settings

Every demo app's `project.json` must have explicit cache settings for all test targets:

- `codegen`: `cache: true`, with `inputs` (openapi-bundled.yaml) and `outputs` (generated-contracts/)
- `typecheck`: `cache: true`, `dependsOn: ["codegen"]`
- `lint`: `cache: true`
- `build`: `cache: true`, `dependsOn: ["codegen"]`
- `test:unit`: `cache: true`, with `inputs` (source + specs + contracts)
- `test:quick`: `cache: true`, with `inputs` (source + specs + contracts) and `outputs` (coverage)
- `test:integration`: `cache: false`

### FR-11: Consistent codegen dependsOn

Every backend `typecheck` and `build` target must have `dependsOn: ["codegen"]`.

Currently missing `dependsOn: ["codegen"]` on `typecheck`:

- demo-be-elixir-phoenix, demo-be-python-fastapi (plus 4 new targets from FR-2)

Currently missing `dependsOn: ["codegen"]` on `build`:

- demo-be-golang-gin, demo-be-java-springboot, demo-be-java-vertx, demo-be-elixir-phoenix,
  demo-be-python-fastapi, demo-be-fsharp-giraffe, demo-be-ts-effect, demo-be-kotlin-ktor,
  demo-be-csharp-aspnetcore, demo-be-clojure-pedestal (only demo-be-rust-axum and
  demo-fe-dart-flutterweb have it)

The `test:unit` and `test:quick` targets do NOT directly depend on codegen — they rely on the
pre-push hook running `typecheck` before `test:quick`.

### FR-12: Docker health check standardization

All backend Docker health checks (in `docker-compose.yml` and `docker-compose.integration.yml`)
must use `curl -f http://localhost:8201/health || exit 1` as the health check command. The `wget`
variants must be replaced with `curl` for consistency.

Start periods and E2E wait timeouts must be reviewed and adjusted based on actual cold-start
behavior, with a rationale documented in tech-docs.md.

### FR-13: Update all related documentation

All documentation must be updated to reflect the standardized configuration:

**Governance docs** (authoritative standards):

- `governance/development/infra/nx-targets.md` — canonical target definitions, mandatory targets
  matrix, cache/inputs convention, codegen dependency chain, spec-coverage requirement
- `governance/development/quality/three-level-testing-standard.md` — spec-coverage enforcement,
  input requirements for cache invalidation
- `governance/development/infra/bdd-spec-test-mapping.md` — spec-coverage enforcement reference
- `governance/development/infra/github-actions-workflow-naming.md` — version alignment policy,
  workflow language installation documentation
- `governance/development/quality/code.md` — pre-push hook description if changed

**Reference and how-to docs**:

- `docs/reference/system-architecture/re-syar__ci-cd.md` — CI/CD pipeline, health checks, versions
- `docs/how-to/hoto__add-new-app.md` — mandatory target checklist, spec-coverage, canonical inputs
- `docs/reference/re__nx-configuration.md` — Nx target examples if changed

**Project-level**:

- `CLAUDE.md` — mandatory targets, spec-coverage, codegen dependency chain

**Per-app READMEs** (16 apps):

- All `apps/demo-be-*/README.md` — test targets, new typecheck targets, spec-coverage
- All `apps/demo-fe-*/README.md` — coverage enforcement, contract inputs
- Both `apps/demo-*-e2e/README.md` — test:quick semantics

**Specs docs**:

- `specs/apps/demo/README.md` — spec-coverage enforcement
- `specs/apps/demo/be/README.md` — all backends consume at all 3 levels
- `specs/apps/demo/contracts/README.md` — cache invalidation via inputs

### FR-14: Final CI validation

All changes must be validated against the full CI pipeline:

- `main-ci.yml` must pass after pushing to main (typecheck, lint, test:quick for all projects)
- All 11 backend E2E workflows must pass when manually triggered via `gh workflow run`
- All 3 frontend E2E workflows must pass when manually triggered
- `test-organiclever-web.yml` must pass when manually triggered
- Total: 15 scheduled workflows + 1 main CI = 16 CI runs must pass

## Non-Functional Requirements

### NFR-1: No test regressions

All existing tests must continue to pass after standardization. `nx run-many -t test:quick --all`
must exit 0.

### NFR-2: No CI workflow disruption

Scheduled workflows must continue to run on their existing schedule. Changes to version numbers
must not break the workflows.

### NFR-3: Nx caching correctness

After standardization, Nx caching must correctly detect when targets need to re-run. Incorrect
cache hits (stale results) or unnecessary cache misses must not occur.

### NFR-4: Backward-compatible target names

No existing Nx target names change. Only new targets are added or existing target configurations
are modified. Scripts, hooks, and CI pipelines that reference existing target names continue to work.

## Acceptance Criteria

```gherkin
Scenario: All CI versions are aligned
  Given the CI standardization is complete
  When I compare tool versions across main-ci.yml and all test-demo-*.yml files
  Then every language/tool version matches exactly
  And no scheduled workflow uses an older version than main-ci.yml

Scenario: All backends have mandatory targets
  Given the CI standardization is complete
  When I run nx show project demo-be-<any-backend>
  Then the project has targets: codegen, typecheck, lint, build, test:unit, test:quick, test:integration
  And typecheck depends on codegen
  And build depends on codegen
  And test:quick has cache: true with inputs and outputs
  And test:integration has cache: false

Scenario: test:quick is pure (no lint/format)
  Given the CI standardization is complete
  When I inspect test:quick commands for any demo-be app
  Then the commands include only: run tests, measure coverage, validate coverage
  And the commands do NOT include: lint, format check, static analysis

Scenario: Flutter frontend enforces coverage
  Given the CI standardization is complete
  When I run nx run demo-fe-dart-flutterweb:test:quick
  Then coverage is measured and validated at 70% threshold
  And the coverage report is in LCOV format at coverage/lcov.info

Scenario: Docker health checks are uniform
  Given the CI standardization is complete
  When I grep for healthcheck commands across all docker-compose files
  Then all backend health checks use curl (not wget)
  And all health checks target http://localhost:8201/health

Scenario: All test targets include specs and contracts in inputs
  Given the CI standardization is complete
  When I inspect test:unit and test:quick inputs for any demo-be app
  Then inputs include specs/apps/demo/be/gherkin/**/*.feature
  And inputs include {projectRoot}/generated-contracts/**/*
  And modifying a .feature file invalidates the Nx cache for test:unit and test:quick
  And modifying a generated contract file invalidates the Nx cache for test:unit and test:quick

Scenario: Spec-coverage validation runs in test:quick
  Given the CI standardization is complete
  When I run nx run demo-be-<any-backend>:test:quick
  Then rhino-cli spec-coverage validate runs after tests
  And all Gherkin scenarios have matching test implementations
  And a missing step definition causes test:quick to fail

Scenario: All tests pass after standardization
  Given the CI standardization is complete
  When I run nx run-many -t typecheck --all && nx run-many -t lint --all && nx run-many -t test:quick --all
  Then all targets pass with exit code 0
  And no coverage thresholds are violated

Scenario: Documentation matches implementation
  Given the CI standardization is complete
  When I compare governance docs to actual project.json configurations
  Then nx-targets.md describes all 7 mandatory backend targets
  And three-level-testing-standard.md requires spec-coverage in test:quick
  And each app README documents its actual test targets and commands
  And CLAUDE.md references the mandatory target standard
  And hoto__add-new-app.md includes the full checklist for new demo apps

Scenario: Main CI passes after push
  Given all standardization changes are committed and pushed to main
  When main-ci.yml runs automatically
  Then typecheck passes for all projects (including 4 new targets)
  And lint passes for all projects
  And test:quick passes for all projects (including spec-coverage)
  And coverage uploads succeed

Scenario: All 15 scheduled E2E workflows pass
  Given all standardization changes are on main
  When all 11 backend + 3 frontend + 1 organiclever workflows are triggered
  Then all 15 workflows complete with success status
  And integration tests pass with real PostgreSQL
  And E2E tests pass with Playwright
  And no workflow fails due to version mismatches or health check timeouts
```
