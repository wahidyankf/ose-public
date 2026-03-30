# Requirements: CLI Testing Alignment

## Current State Analysis

### rhino-cli Test Files (14 unit + 13 integration)

**Unit tests** (`cmd/*_test.go` — no build tag):

| File                                   | Gherkin? | Mocking Level                            | Notes                                                                    |
| -------------------------------------- | -------- | ---------------------------------------- | ------------------------------------------------------------------------ |
| `doctor_test.go`                       | No       | Real fs (temp dirs, real tool detection) | Creates temp `.git/`, config files; runs real `cmd.RunE`                 |
| `test_coverage_validate_test.go`       | No       | Real fs (temp coverage files)            | Writes temp coverage data, runs command                                  |
| `agents_sync_test.go`                  | No       | Real fs (temp dirs)                      | Creates `.claude/`/`.opencode/` fixtures                                 |
| `agents_validate_claude_test.go`       | No       | Real fs (temp dirs)                      | Creates YAML fixtures                                                    |
| `agents_validate_sync_test.go`         | No       | Real fs (temp dirs)                      | Creates sync fixtures                                                    |
| `docs_validate_links_test.go`          | No       | Real fs (temp dirs)                      | Creates markdown with links                                              |
| `docs_validate_naming_test.go`         | No       | Real fs (temp dirs)                      | Creates markdown files                                                   |
| `contracts_java_clean_imports_test.go` | No       | Real fs (temp dirs)                      | Creates Java source files                                                |
| `contracts_dart_scaffold_test.go`      | No       | Real fs (temp dirs)                      | Creates Dart source files                                                |
| `java_validate_annotations_test.go`    | No       | Real fs (temp dirs)                      | Creates Java package-info files                                          |
| `spec_coverage_validate_test.go`       | No       | Real fs (temp dirs)                      | Creates feature + test fixtures                                          |
| `git_pre_commit_test.go`               | No       | Real fs (temp dirs)                      | Creates git repo fixtures                                                |
| `root_test.go`                         | No       | None                                     | Tests root command properties                                            |
| `helpers_test.go`                      | No       | None                                     | Tests `writeFormatted()` helper function — no Gherkin; no filesystem I/O |

**Key observation**: Current unit tests use **real filesystem** extensively — they create temp dirs,
write files, run commands, and check output. This violates the unit test isolation principle where
unit = all mocked.

**Integration tests** (`cmd/*.integration_test.go` — `//go:build integration`):

All 13 files use godog + Gherkin. Each creates temp dirs, registers step definitions, and runs
scenarios from `specs/apps/rhino-cli/`. Some tests interact with real tools (e.g., `doctor` checks
real installed tool versions).

**Internal package tests** (`internal/**/*_test.go` — 43 files):

These are already well-isolated unit tests. They test pure functions (parsers, reporters,
validators) with in-memory data or `testdata/` fixtures. **These do NOT need to change** — they
don't map to CLI commands and don't need Gherkin.

## Target State

### Unit Tests (`*_test.go` — no build tag)

| Aspect              | Rule                                                                                                                         |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Gherkin consumption | **Must consume** all specs from `specs/apps/rhino-cli/` via godog                                                            |
| Build tag           | None — runs with standard `go test`                                                                                          |
| Mocking             | **All mocked exclusively** — no real filesystem, no real tool execution, no real HTTP                                        |
| Filesystem          | Mock via interfaces (e.g., `FileSystem` interface with `ReadFile`, `WriteFile`, `MkdirAll`, `Walk`) or use in-memory `fs.FS` |
| Tool execution      | Mock via interfaces (e.g., `CommandRunner` interface wrapping `exec.Command`)                                                |
| Coverage            | Measured here (>=90% line coverage)                                                                                          |
| Extra tests         | Non-BDD tests allowed for logic not covered by Gherkin (pure functions, edge cases, error paths)                             |
| Caching             | `cache: true` (fully deterministic — no real I/O)                                                                            |
| Runs in             | `test:quick` (pre-push gate)                                                                                                 |

**Architecture**:

```text
Gherkin Step → Cobra RunE (with mocked dependencies injected) → Mocked FileSystem / CommandRunner
```

### Integration Tests (`*.integration_test.go` — `//go:build integration`)

| Aspect              | Rule                                                                                    |
| ------------------- | --------------------------------------------------------------------------------------- |
| Gherkin consumption | **Must consume** all specs from `specs/apps/rhino-cli/` via godog                       |
| Build tag           | `//go:build integration`                                                                |
| Mocking             | **Limited** — only external API calls (HTTP, network) are mocked                        |
| Filesystem          | **Real** — create temp dirs under `/tmp`, write real files, read real output            |
| Tool execution      | **Real** — run actual `go`, `node`, `java` etc. where available (skip if not installed) |
| Coverage            | Not measured at this level                                                              |
| Extra tests         | Not needed — integration tests only run Gherkin scenarios                               |
| Caching             | `cache: true` — deterministic (controlled `/tmp` fixtures, no database)                 |
| Runs in             | `nx run rhino-cli:test:integration`                                                     |

**Architecture**:

```text
Gherkin Step → Cobra RunE (real execution) → Real FileSystem (/tmp fixtures) + Real Tool Calls
```

### What Does NOT Change

- `internal/**/*_test.go` **(43 files)** — These test pure internal functions. They stay as-is.
  They are not command-level tests and don't map to Gherkin specs.
- **Feature files** (`specs/apps/rhino-cli/**/*.feature`) — The Gherkin specs themselves don't
  change. They are the shared contract consumed by both levels.
- **`test:quick` composition** — Still runs `test:unit` + coverage validation. No change.

## Isolation Boundary Summary

| Resource                        | Unit Test                         | Integration Test                |
| ------------------------------- | --------------------------------- | ------------------------------- |
| Gherkin specs                   | Consumed (godog)                  | Consumed (godog)                |
| Filesystem reads                | Mocked                            | Real (`/tmp` fixtures)          |
| Filesystem writes               | Mocked                            | Real (`/tmp` fixtures)          |
| Tool execution (`exec.Command`) | Mocked                            | Real (skip if unavailable)      |
| HTTP/network calls              | Mocked                            | Mocked                          |
| Database                        | N/A (CLI has no DB)               | N/A (CLI has no DB)             |
| Environment variables           | Controlled (mock or set directly) | Controlled (set + restore)      |
| Working directory               | Mocked (never `os.Chdir`)         | Real (`os.Chdir` to `/tmp` dir) |

## Mocking Strategy for Unit Tests

The key challenge: current commands call `os.Chdir`, `os.ReadFile`, `exec.Command`, etc. directly.
To mock these at unit level, we need **dependency injection** via interfaces.

### Option A: Interface Injection (Preferred)

Define interfaces in `internal/` packages and inject them:

```go
type FileSystem interface {
    ReadFile(name string) ([]byte, error)
    WriteFile(name string, data []byte, perm fs.FileMode) error
    MkdirAll(path string, perm fs.FileMode) error
    Stat(name string) (fs.FileInfo, error)
    Lstat(name string) (fs.FileInfo, error)
    WalkDir(root string, fn fs.WalkDirFunc) error
}

type CommandRunner interface {
    Run(name string, args ...string) (stdout string, stderr string, err error)
    LookPath(file string) (string, error)
}
```

Production code uses `RealFileSystem` and `RealCommandRunner`. Unit tests inject mocks.

### Option B: Package-Level Variables (Simpler, Less Clean)

Replace direct calls with package-level functions that can be swapped in tests:

```go
var readFile = os.ReadFile
var writeFile = os.WriteFile
var lookPath = exec.LookPath
```

Tests override these in `TestMain` or per-test setup. This is the pattern already used for
`var osExit = os.Exit` in `cmd/root.go`.

### Recommendation

**Start with Option B** for pragmatism — it requires minimal refactoring and matches the existing
`osExit` pattern. Migrate to Option A in a future refactor if the package-variable approach
becomes unwieldy.

## ayokoding-cli Current State

**Version**: 0.5.0 | **Commands**: 1 (`links check`) | **Specs**: `specs/apps/ayokoding-cli/links/links-check.feature` (4 scenarios)

**Unit tests** (`cmd/*_test.go`):

| File                  | Gherkin? | Mocking Level                         | Notes                                                   |
| --------------------- | -------- | ------------------------------------- | ------------------------------------------------------- |
| `root_test.go`        | No       | Partial (mocks `osExit`)              | Tests help output and error exit                        |
| `links_check_test.go` | No       | Real fs (temp dirs via `t.TempDir()`) | 7 tests: valid/broken links, JSON, markdown, quiet mode |

**Integration test** (`cmd/links-check.integration_test.go`):

- Consumes `@links-check-ayokoding` tag from `links-check.feature`
- 4 scenarios: valid links, broken links, external URLs skipped, JSON output
- Uses `os.MkdirTemp` + real filesystem + pipe-captured stdout

**Key difference from rhino-cli**: No `internal/` package — all logic delegated to `libs/hugo-commons`.
The `links_check.go` command file calls `links.CheckLinks()` from hugo-commons directly.

## oseplatform-cli Current State

**Version**: 0.1.0 | **Commands**: 1 (`links check`) | **Specs**: `specs/apps/oseplatform-cli/links/links-check.feature` (4 scenarios)

**Unit tests** (`cmd/*_test.go`):

| File                  | Gherkin? | Mocking Level                      | Notes                                                 |
| --------------------- | -------- | ---------------------------------- | ----------------------------------------------------- |
| `root_test.go`        | No       | Partial (mocks `osExit`)           | 4 tests: initialization, flags, help, error           |
| `links_check_test.go` | No       | Real fs + mock `outputLinksJSONFn` | 8 tests: same as ayokoding-cli + JSON error injection |

**Integration test** (`cmd/links-check.integration_test.go`):

- Consumes `@links-check-oseplatform` tag from `links-check.feature`
- 4 scenarios: identical structure to ayokoding-cli
- Uses `os.MkdirTemp` + real filesystem + pipe-captured stdout
- Also resets `outputLinksJSONFn = links.OutputLinksJSON` in before hook

**Key difference from ayokoding-cli**: Already has `outputLinksJSONFn` as a package-level injectable
variable — a partial implementation of the Option B mocking pattern.

## Spec README Updates Required

| File                                   | What Changes                                                                                                                                                         |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `specs/apps/rhino-cli/README.md`       | Add "Dual Consumption" section explaining unit + integration; update "Adding New Specs" to include unit test step; update "Running the Tests" with unit test example |
| `specs/apps/ayokoding-cli/README.md`   | Add "Dual Consumption" section; update testing instructions to show both `test:unit` (godog + mocks) and `test:integration` (godog + real fs)                        |
| `specs/apps/oseplatform-cli/README.md` | Same as ayokoding-cli README update                                                                                                                                  |

## Documentation Updates Required

| File                                                             | What Changes                                                                                                                                                                                                                                         |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `governance/development/quality/three-level-testing-standard.md` | Line 194: CLI row changes from "Go test mocks" (unit) to "Go test mocks + Gherkin (godog)". Line 204: Update CLI key rules to mention Gherkin at unit level                                                                                          |
| `governance/development/infra/bdd-spec-test-mapping.md`          | Line 20-21: Update description. Lines 37-153: CLI section needs unit-level Gherkin guidance. Line 98: "Integration Test to Tag" becomes "Unit & Integration Test to Tag". Lines 147-153: "Adding a New Command" adds step 4 for unit test with godog |
| `governance/development/infra/nx-targets.md`                     | Line 105: Update `test:unit` description for CLI. Line 214: CLI row in mandatory targets table. Line 334: In-process mocking row update. Lines 338-346: Go CLIs integration description                                                              |
| `CLAUDE.md`                                                      | Line ~231: Update three-level testing description for CLI apps. Line ~225: Update `test:integration` caching description                                                                                                                             |
| `specs/apps/rhino-cli/README.md`                                 | Update "Running the Tests" section to describe dual consumption. Update "Adding New Specs" to include unit test step                                                                                                                                 |
| `apps/rhino-cli/README.md`                                       | Update testing section to describe new architecture                                                                                                                                                                                                  |

## Acceptance Criteria

```gherkin
Feature: CLI testing alignment with three-level standard

  Scenario: Unit tests consume all Gherkin specs
    Given the rhino-cli project
    When I run test:unit
    Then all Gherkin scenarios in specs/apps/rhino-cli/ are executed via godog
    And all step definitions use mocked filesystem and command runner
    And no real files are created outside the test process memory
    And coverage is measured at >=90%

  Scenario: Integration tests consume all Gherkin specs with real I/O
    Given the rhino-cli project
    When I run test:integration
    Then all Gherkin scenarios in specs/apps/rhino-cli/ are executed via godog
    And step definitions create real files in /tmp directories
    And step definitions run real tool commands where available
    And no external HTTP calls are made

  Scenario: Both test levels pass the same Gherkin scenarios
    Given a Gherkin scenario in specs/apps/rhino-cli/
    Then it has step definitions in both the unit test file and the integration test file
    And the unit step definitions use mocked dependencies
    And the integration step definitions use real filesystem

  Scenario: test:quick includes unit-level Gherkin consumption
    Given the pre-push gate runs test:quick
    When a Gherkin spec changes
    Then the Nx cache invalidates for test:unit
    And the changed scenario runs in the unit test suite

  Scenario: Internal package tests are unchanged
    Given the 43 internal/**/*_test.go files in rhino-cli
    Then they remain as standard Go unit tests
    And they do not consume Gherkin specs

  Scenario: ayokoding-cli unit tests consume Gherkin specs
    Given the ayokoding-cli project with 1 command (links check)
    When I run test:unit
    Then all 4 Gherkin scenarios in specs/apps/ayokoding-cli/ are executed via godog
    And step definitions use mocked filesystem (no real file I/O)
    And coverage is measured at >=90%

  Scenario: oseplatform-cli unit tests consume Gherkin specs
    Given the oseplatform-cli project with 1 command (links check)
    When I run test:unit
    Then all 4 Gherkin scenarios in specs/apps/oseplatform-cli/ are executed via godog
    And step definitions use mocked filesystem (no real file I/O)
    And coverage is measured at >=90%

  Scenario: All three CLI specs READMEs document dual consumption
    Given specs/apps/rhino-cli/README.md
    And specs/apps/ayokoding-cli/README.md
    And specs/apps/oseplatform-cli/README.md
    Then each describes that both unit and integration tests consume the Gherkin specs
    And each explains the isolation boundary difference (mocked vs real I/O)

  Scenario: Documentation reflects the new testing architecture
    Given the governance documentation
    Then the three-level-testing-standard.md describes CLI Gherkin consumption at unit level
    And bdd-spec-test-mapping.md describes dual consumption for CLI apps
    And nx-targets.md reflects the updated CLI test definitions
    And CLAUDE.md reflects the updated CLI test descriptions
```

## Risk Assessment

| Risk                                                              | Likelihood | Impact | Mitigation                                                                              |
| ----------------------------------------------------------------- | ---------- | ------ | --------------------------------------------------------------------------------------- |
| Unit tests become slow due to godog overhead                      | Low        | Medium | godog is lightweight; 13 feature files with ~60 total scenarios should run in seconds   |
| Mocking filesystem is complex for some commands                   | Medium     | Medium | Start with Option B (package-level vars); refactor to interfaces later                  |
| Coverage may initially drop during refactoring                    | Medium     | Low    | Temporary — add mock-based tests incrementally; keep old tests until replacements pass  |
| Step definitions diverge between unit and integration             | Medium     | Medium | Extract shared step text matching into helper functions; only mock wiring differs       |
| ayokoding/oseplatform-cli need hugo-commons mocking at unit level | Medium     | Medium | Mock `links.CheckLinks()` call; oseplatform-cli already has `outputLinksJSONFn` pattern |
| Three specs READMEs need consistent dual-consumption docs         | Low        | Low    | Template from rhino-cli README update; apply to smaller CLIs                            |
