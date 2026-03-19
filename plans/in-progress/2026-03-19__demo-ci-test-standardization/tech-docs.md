# Technical Documentation

## Version Matrix (Target State)

All CI pipelines must use these exact versions:

| Tool          | Version | Source of Truth                             |
| ------------- | ------- | ------------------------------------------- |
| Node.js       | 24      | Volta in `package.json`                     |
| Go            | 1.26.0  | `main-ci.yml` setup-go action               |
| Java          | 21 + 25 | 21 for Gradle (detekt <=24), 25 for Maven   |
| Elixir        | 1.19    | `main-ci.yml` erlef/setup-beam              |
| OTP           | 27      | `main-ci.yml` erlef/setup-beam              |
| .NET          | 10.0.x  | `main-ci.yml` setup-dotnet                  |
| Python        | 3.13    | `main-ci.yml` setup-python                  |
| Rust          | stable  | `main-ci.yml` dtolnay/rust-toolchain        |
| Flutter       | stable  | `main-ci.yml` subosito/flutter-action       |
| Hugo          | 0.156.0 | `main-ci.yml` peaceiris/actions-hugo        |
| golangci-lint | v2.10.1 | `main-ci.yml` golangci/golangci-lint-action |

### Version Update Locations

When a version changes, update ALL of these files:

| Tool    | Files to Update                                                                                                                                                             |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Go      | `main-ci.yml`, `pr-quality-gate.yml`, `test-demo-be-golang-gin.yml`, `test-demo-fe-ts-nextjs.yml`, `test-demo-fe-ts-tanstack-start.yml`, `test-demo-fe-dart-flutterweb.yml` |
| Elixir  | `main-ci.yml`, `test-demo-be-elixir-phoenix.yml`                                                                                                                            |
| Python  | `main-ci.yml`, `test-demo-be-python-fastapi.yml`                                                                                                                            |
| Rust    | `main-ci.yml`, `test-demo-be-rust-axum.yml` (uses Docker, not direct setup)                                                                                                 |
| .NET    | `main-ci.yml` (scheduled workflows use Docker, no direct setup)                                                                                                             |
| Java    | `main-ci.yml`, `pr-quality-gate.yml`, `test-demo-be-clojure-pedestal.yml` (Clojure needs Java 21)                                                                           |
| Flutter | `main-ci.yml`, `pr-quality-gate.yml`, `test-demo-fe-dart-flutterweb.yml`                                                                                                    |

## Canonical Nx Target Definitions

### Demo Backend Targets (Mandatory)

Every `demo-be-*` app must have these 7 targets in its `project.json`:

#### 1. codegen

Generates types from the OpenAPI spec.

```jsonc
{
  "codegen": {
    "command": "<language-specific codegen command>",
    "dependsOn": ["demo-contracts:bundle"],
    "cache": true,
    "inputs": [
      "{workspaceRoot}/specs/apps/demo/contracts/generated/openapi-bundled.yaml",
      // Plus language-specific codegen tool sources if custom (Elixir, Clojure)
    ],
    "outputs": ["{projectRoot}/generated-contracts/"],
  },
}
```

#### 2. typecheck

Static type checking / compilation check. Must catch contract mismatches at compile time.

```jsonc
{
  "typecheck": {
    "command": "<language-specific typecheck command>",
    "dependsOn": ["codegen"],
    "cache": true,
  },
}
```

**Language-specific commands:**

| Language      | Command                                                   | Notes                                  |
| ------------- | --------------------------------------------------------- | -------------------------------------- |
| Go            | `go vet ./...`                                            | Catches type errors and issues         |
| Java (Maven)  | `mvn compile -Pnullcheck`                                 | NullAway profile                       |
| Java (Gradle) | N/A — use `mvn compile` equivalent                        |                                        |
| Kotlin        | `./gradlew compileKotlin`                                 | Gradle compile check                   |
| Rust          | `cargo check`                                             | Fast type check without codegen        |
| TypeScript    | `tsc --noEmit`                                            | Standard TS check                      |
| Python        | `pyright`                                                 | Type checker                           |
| Elixir        | `mix compile --warnings-as-errors`                        | Already exists                         |
| F#            | `dotnet build --no-restore /p:TreatWarningsAsErrors=true` | Already exists                         |
| C#            | `dotnet build /p:TreatWarningsAsErrors=true --no-restore` | Already exists                         |
| Clojure       | `clj-kondo --lint src`                                    | Static analysis (closest to typecheck) |

#### 3. lint

Code style and quality checks. Separate from typecheck and test:quick.

```jsonc
{
  "lint": {
    "command": "<language-specific lint command>",
    "cache": true,
  },
}
```

**Language-specific commands:**

| Language      | Command                                        | Notes                              |
| ------------- | ---------------------------------------------- | ---------------------------------- |
| Go            | `golangci-lint run`                            | Already exists                     |
| Java (Maven)  | `mvn checkstyle:check` or similar              | Already exists                     |
| Java (Gradle) | N/A                                            |                                    |
| Kotlin        | `./gradlew detekt`                             | Currently missing as Nx target     |
| Rust          | `cargo clippy -- -D warnings`                  | Already exists                     |
| TypeScript    | `oxlint` or `eslint`                           | Already exists                     |
| Python        | `ruff check` or similar                        | Already exists                     |
| Elixir        | `mix credo --strict`                           | Already exists                     |
| F#            | `fantomas --check . && dotnet fsharplint lint` | Currently inside test:quick        |
| C#            | `dotnet build /p:TreatWarningsAsErrors=true`   | Already exists (same as typecheck) |
| Clojure       | `clj-kondo --lint src test`                    | Already exists                     |

#### 4. build

Produces a deployable artifact.

```jsonc
{
  "build": {
    "command": "<language-specific build command>",
    "dependsOn": ["codegen"],
    "cache": true,
  },
}
```

#### 5. test:unit

Unit tests only. No coverage measurement. No Docker. Fast feedback.

```jsonc
{
  "test:unit": {
    "command": "<language-specific test command>",
    "cache": true,
    "inputs": [
      "{projectRoot}/src/**/*",
      "{projectRoot}/tests/**/*",
      "{projectRoot}/generated-contracts/**/*",
      "{workspaceRoot}/specs/apps/demo/be/gherkin/**/*.feature",
    ],
  },
}
```

**Key rules**:

- Must NOT include coverage measurement, lint, or format checks
- Must include `generated-contracts/` in inputs so Nx cache invalidates when contracts change
- Must include Gherkin specs in inputs so Nx cache invalidates when specs change

#### 6. test:quick

Unit tests + coverage measurement + coverage validation + spec-coverage validation. This is the
pre-push quality gate.

```jsonc
{
  "test:quick": {
    "commands": [
      "<run tests with coverage>",
      "rhino-cli test-coverage validate <coverage-file> 90",
      "rhino-cli spec-coverage validate specs/apps/demo/be/gherkin apps/demo-be-<name>",
    ],
    "parallel": false,
    "cache": true,
    "inputs": [
      "{projectRoot}/src/**/*",
      "{projectRoot}/tests/**/*",
      "{projectRoot}/generated-contracts/**/*",
      "{workspaceRoot}/specs/apps/demo/be/gherkin/**/*.feature",
    ],
    "outputs": ["{projectRoot}/<coverage-output-path>"],
  },
}
```

**Key rules**:

- Must NOT include lint, format, typecheck, or any non-test concern
- Must include `generated-contracts/` in inputs for cache invalidation
- Must include Gherkin specs in inputs for cache invalidation
- Must run `rhino-cli spec-coverage validate` after tests to ensure all Gherkin scenarios have
  matching test implementations

**Coverage output paths by language:**

| Language     | Coverage File                    | Format |
| ------------ | -------------------------------- | ------ |
| Go           | `cover.out`                      | Go     |
| Java (Maven) | `target/site/jacoco/jacoco.xml`  | JaCoCo |
| Kotlin       | `build/reports/kover/report.xml` | JaCoCo |
| Rust         | `coverage/lcov.info`             | LCOV   |
| TypeScript   | `coverage/lcov.info`             | LCOV   |
| Python       | `coverage/lcov.info`             | LCOV   |
| Elixir       | `cover/lcov.info`                | LCOV   |
| F#           | `coverage/altcov.info`           | LCOV   |
| C#           | `coverage/**/coverage.info`      | LCOV   |
| Clojure      | `coverage/lcov.info`             | LCOV   |

#### 7. test:integration

Integration tests with real PostgreSQL. Never cached.

```jsonc
{
  "test:integration": {
    "command": "docker compose -f docker-compose.integration.yml up --abort-on-container-exit --build && docker compose -f docker-compose.integration.yml down -v",
    "cache": false,
  },
}
```

### Demo Frontend Targets (Mandatory)

Every `demo-fe-*` app must have these targets:

- `codegen` — same pattern as backends
- `typecheck` — `tsc --noEmit` or `dart analyze`
- `lint` — language-specific linter
- `build` — production build, `dependsOn: ["codegen"]`
- `test:unit` — unit tests only
- `test:quick` — unit tests + coverage + rhino-cli validation at **70%** threshold

Frontend apps do NOT have `test:integration` — they use MSW for API mocking in unit tests.

### E2E App Targets

`demo-be-e2e` and `demo-fe-e2e` are special — they contain only Playwright E2E tests:

- `test:quick` — typecheck + lint only (no unit tests exist). This is intentional and documented.
- `test:e2e` — Playwright test run
- `test:e2e:no-test-api` — Playwright excluding test-support scenarios
- `test:e2e:ui` — Playwright UI mode (interactive)

## Docker Health Check Standardization

### Command Standard

All health checks must use curl (not wget) for consistency:

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8201/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: <per-backend>
```

### Start Period Rationale

Start periods should reflect actual cold-start time. Current values are sometimes arbitrary.
Recommended baseline:

| Category                      | Start Period | Rationale                                 |
| ----------------------------- | ------------ | ----------------------------------------- |
| Fast start (Go, Rust, Elixir) | 30s          | Compiled/native, minimal startup          |
| Medium start (Python, TS)     | 60s          | Interpreter startup + dependency loading  |
| Slow start (Java, Kotlin, C#) | 120s         | JVM/CLR warmup, framework initialization  |
| Very slow start (F#, Clojure) | 180s         | Additional compilation/class loading time |

**Action**: Benchmark actual cold-start times during implementation. Adjust start periods to
2x the measured p95 cold-start time. Document results.

### E2E Wait Timeout

The CI workflow wait loop (`for i in $(seq 1 N); do curl ... && break; sleep 10; done`) timeout
should be `start_period * 2` rounded up to the nearest minute, with a minimum of 4 minutes.

## Design Decisions

### Decision 1: Explicit over implicit cache settings

**Decision**: Every target in every `project.json` must have an explicit `cache` setting, even when
it matches the `nx.json` default.

**Rationale**: Implicit defaults require knowing what `nx.json` says. Explicit settings make each
`project.json` self-documenting. When debugging cache issues, explicit settings eliminate one
variable. The cost is minor verbosity.

### Decision 2: test:quick = tests + coverage only

**Decision**: Remove lint and format checks from `test:quick` in all apps. The pre-push hook runs
`typecheck`, `lint`, and `test:quick` as three separate `nx affected` calls.

**Rationale**: Bundling lint in `test:quick` means lint failures block coverage reporting, and lint
runs redundantly when `nx affected -t lint` already runs first. Separation allows independent
caching and clearer error messages.

### Decision 3: curl over wget for health checks

**Decision**: Standardize on `curl -f` for all Docker health checks.

**Rationale**: curl is more universally available in minimal Docker images (Alpine includes it in
most language base images). The `-f` flag returns exit code 22 on HTTP errors, which Docker
interprets as unhealthy. Using one tool avoids cognitive overhead of remembering which backends
use which.

### Decision 4: Go typecheck = go vet, not go build

**Decision**: Use `go vet ./...` as the typecheck target for Go backends, not `go build`.

**Rationale**: `go vet` catches type errors AND common mistakes (unused variables, unreachable code,
incorrect format strings). `go build` only catches compilation errors. `go vet` is the Go
community's standard static analysis baseline. The `build` target already runs `go build`.

### Decision 5: Clojure typecheck = clj-kondo

**Decision**: Use `clj-kondo --lint src` as the typecheck target for Clojure backends.

**Rationale**: Clojure is dynamically typed — there is no compiler typecheck. clj-kondo is the
standard static analyzer that catches type-like errors (wrong arity, undefined vars, unused
imports). It is already installed in main-ci.yml.

### Decision 6: Kotlin lint = detekt

**Decision**: Use `./gradlew detekt` as the lint target for Kotlin.

**Rationale**: detekt is already configured in the project (`detekt.yml` exists) but was never
exposed as an Nx target. It is the Kotlin community standard for code quality analysis.

### Decision 7: Frontend coverage at 70%, not 90%

**Decision**: Maintain 70% coverage threshold for all frontend apps, including Flutter.

**Rationale**: Documented in CLAUDE.md — frontend unit tests mock API/auth/queries layers by design.
Full coverage of these layers happens in E2E tests. 70% covers component logic and rendering
without forcing artificial mocking depth.

### Decision 8: No test:integration for frontends

**Decision**: Frontend apps (`demo-fe-*`) do not need a `test:integration` target.

**Rationale**: Frontend integration testing uses MSW (Mock Service Worker) in unit tests, which runs
in-process without Docker. The E2E suite (`demo-fe-e2e`) provides real backend integration testing.
Adding a separate `test:integration` with Docker for frontends would duplicate E2E coverage without
adding value.

### Decision 9: E2E apps keep non-standard test:quick

**Decision**: `demo-be-e2e` and `demo-fe-e2e` keep their current `test:quick` semantics
(typecheck + lint, no unit tests).

**Rationale**: E2E apps contain only Playwright step definitions — they have no unit-testable code.
Their `test:quick` serves a different purpose: validating that step definitions compile and conform
to code style. This is the correct behavior for test-only projects.

### Decision 10: Database naming — keep current convention

**Decision**: Do not change database names in Docker Compose files. Each backend already uses a
unique name derived from the app name.

**Rationale**: Changing database names would require updating environment variables, connection
strings, and potentially migration scripts in every backend. The current naming is functional
even if not perfectly uniform. The risk/reward ratio does not justify the change. Document the
pattern instead.

## Testing Strategy

### Verification Approach

After each phase, run the full affected target chain to verify no regressions:

```bash
# After CI version changes (Phase 1):
# Manually trigger updated scheduled workflows and verify they pass

# After Nx target changes (Phases 2-5):
nx affected -t typecheck
nx affected -t lint
nx affected -t test:quick

# After Docker changes (Phase 6):
# Run integration tests for affected backends:
nx run demo-be-<affected>:test:integration
```

### Smoke Tests

After all phases:

1. Run `nx run-many -t typecheck --all` — verify all 11 backends and 3 frontends pass
2. Run `nx run-many -t lint --all` — verify all apps pass
3. Run `nx run-many -t test:quick --all` — verify all apps pass with coverage
4. Trigger one scheduled workflow per language family — verify scheduled CI passes

## Framework-Specific Notes

### Go: go vet requires compiled code

`go vet ./...` requires that all dependencies are available. It should depend on `codegen` so that
generated contract types are present. The `go.mod` must include the `generated-contracts` package.

### Kotlin: Gradle task naming

Kotlin uses Gradle tasks, not Maven goals. The typecheck command is `./gradlew compileKotlin`
(Kotlin compilation only, no tests). The lint command is `./gradlew detekt`. Both should use the
Gradle wrapper (`./gradlew`) to ensure version consistency.

### F#: AltCover separation

Currently, the F# `test:quick` runs 7 commands including `fantomas` and `fsharplint`. After
separation:

- `lint`: `fantomas --check . && dotnet fsharplint lint {projectRoot}/src`
- `test:quick`: `dotnet tool restore && dotnet build tests/** && dotnet altcover <instrument> &&
dotnet altcover Runner <run> && rhino-cli test-coverage validate <file> 90`

The `dotnet tool restore` is needed for AltCover and should stay in `test:quick` (it is a test
dependency, not a lint dependency).

### Clojure: classpath for clj-kondo

`clj-kondo --lint src` needs the classpath to resolve namespaces. If clj-kondo fails to resolve
generated contract namespaces, add `--classpath $(clojure -Spath)` to the command.

### Elixir: coveralls.lcov vs mix test

The current Elixir `test:unit` runs `MIX_ENV=test mix coveralls.lcov --only unit`, which includes
coverage. After separation:

- `test:unit`: `MIX_ENV=test mix test --only unit`
- `test:quick`: `MIX_ENV=test mix coveralls.lcov --only unit` (coverage) +
  `rhino-cli test-coverage validate cover/lcov.info 90`

### Flutter: coverage output

Flutter's `--coverage` flag outputs to `coverage/lcov.info` by default. The rhino-cli command:

```bash
flutter test test/unit --coverage && rhino-cli test-coverage validate apps/demo-fe-dart-flutterweb/coverage/lcov.info 70
```
