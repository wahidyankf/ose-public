# Delivery Checklist

## Phase 1: Cobertura XML Format Support (R1)

- [x] Create `internal/testcoverage/cobertura_coverage.go` with XML struct parsing
- [x] Implement Codecov-compatible line classification (covered/partial/missed)
- [x] Parse `condition-coverage` attribute for branch classification
- [x] Update `detect.go` to detect Cobertura XML (filename + content-based)
- [x] Distinguish Cobertura (`<coverage>`) from JaCoCo (`<report>`) in content detection
- [x] Add "cobertura" format name to `reporter.go` output
- [x] Write unit tests (`cobertura_coverage_test.go`) with fixture files
- [x] Write detection tests in `detect_test.go`
- [x] Write BDD integration test (`cmd/test_coverage_validate.integration_test.go`)
- [x] Add Gherkin feature file to `specs/apps/rhino-cli/`
- [x] Verify: `nx run rhino-cli:test:quick` passes with >=90% coverage

## Phase 2: Per-File Coverage Reporting (R2)

- [x] Add `FileResult` type and extend `Result` with `Files []FileResult` in types
- [x] Refactor Go parser to return per-file data (it already groups internally)
- [x] Refactor LCOV parser to return per-file data
- [x] Refactor JaCoCo parser to return per-file data
- [x] Wire Cobertura parser to return per-file data
- [x] Add `--per-file` flag to `test-coverage validate` command
- [x] Add `--below-threshold` flag to `test-coverage validate` command
- [x] Implement per-file text rendering in `reporter.go` (sorted ascending by %)
- [x] Implement per-file JSON rendering (files array in output)
- [x] Implement per-file markdown rendering (table with highlighting)
- [x] Write unit tests for per-file aggregation and rendering
- [x] Write BDD integration test for `--per-file` flag
- [x] Add Gherkin feature file
- [x] Verify: existing `test-coverage validate` output unchanged without `--per-file`
- [x] Verify: `nx run rhino-cli:test:quick` passes

## Phase 3: File Exclusion Patterns (R5)

- [x] Create `internal/testcoverage/exclude.go` with glob-based file filtering
- [x] Support `filepath.Match` patterns (single-segment globs; `**` deferred to future version)
- [x] Add `--exclude` flag (repeatable) to `test-coverage validate` command
- [x] Apply exclusion post-parse, pre-aggregate in validate flow
- [x] Ensure exclusion works with `--per-file` (excluded files hidden)
- [x] Write unit tests for exclusion logic
- [x] Write BDD integration test
- [x] Add Gherkin feature file
- [x] Verify: `nx run rhino-cli:test:quick` passes

## Phase 4: Coverage Merging (R3)

- [x] Create `internal/testcoverage/merge.go` with format-agnostic merge logic
- [x] Implement `CoverageMap` type for normalized per-line data
- [x] Add parsers to return `CoverageMap` from each format
- [x] Implement max-hit-count merge for overlapping files/lines
- [x] Implement branch data union with per-branch max counts
- [x] Implement LCOV output writer for merged data
- [x] Create `cmd/test_coverage_merge.go` subcommand
- [x] Add `--out-file` flag for output file path
- [x] Add `--validate` flag for optional threshold check
- [x] Add `--exclude` flag support
- [x] Write unit tests for merge logic (same format, cross-format, overlapping)
- [x] Write BDD integration test
- [x] Add Gherkin feature file to `specs/apps/rhino-cli/`
- [x] Verify: `nx run rhino-cli:test:quick` passes

## Phase 5: Diff Coverage (R4)

- [x] Create `internal/testcoverage/gitdiff.go` with unified diff parser
- [x] Parse `@@ -a,b +c,d @@` hunk headers to extract changed line ranges
- [x] Map changed lines to file paths from diff output
- [x] Create `internal/testcoverage/diff.go` with diff coverage logic
- [x] Cross-reference changed lines with coverage data
- [x] Calculate diff coverage using Codecov 3-state algorithm: `covered / (covered + partial + missed)`
- [x] Handle edge case: renamed files (match by new filename)
- [x] Handle edge case: binary files (skip, no coverage data)
- [x] Handle edge case: files not in coverage report (count as 0% for changed lines)
- [x] Create `cmd/test_coverage_diff.go` subcommand
- [x] Add `--base` flag (git ref to diff against, default: main)
- [x] Add `--threshold` flag (fail if diff coverage below threshold)
- [x] Add `--staged` flag (diff staged changes instead of branch diff)
- [x] Add `--per-file` flag (show per-file diff coverage breakdown)
- [x] Add `--exclude` flag (exclude files matching glob, repeatable)
- [x] Implement text/JSON/markdown output for diff coverage
- [x] Write unit tests for git diff parsing
- [x] Write unit tests for diff coverage calculation
- [x] Write BDD integration test (requires git fixtures)
- [x] Add Gherkin feature file
- [x] Verify: `nx run rhino-cli:test:quick` passes

## Phase 6: spec-coverage Multi-Language and Multi-Project Support (R6)

### 6A: Shared Steps Mode

- [x] Create `internal/speccoverage/shared_steps.go` with `checkSharedSteps` function
- [x] Implement step-only validation: collect all steps from features, check against all
      step definitions across ALL source files (no 1:1 file mapping)
- [x] Add `--shared-steps` flag to `cmd/spec_coverage_validate.go`
- [x] Report uncovered steps with feature file + scenario context
- [x] Write unit tests for shared-steps logic
- [x] Write BDD integration test for `--shared-steps` mode

### 6B: File Matching Layer

- [x] Add `toSnakeCase` and `toPascalCase` string helpers
- [x] Rewrite `findMatchingTestFile` to use `matchesStem` with underscore+PascalCase+test\_ patterns
- [x] Add test file recognition for new extensions:
  - [x] `.java`, `.kt` — test if in `test/` or `tests/` ancestor directory
  - [x] `.py` — test if `test_` prefix, `_test.py` suffix, or in `tests/` directory
  - [x] `.exs` — test if `_test.exs` or `_steps.exs` suffix
  - [x] `.rs` — test if `_test.rs` suffix or in `tests/` directory
  - [x] `.fs`, `.cs` — test if in `Tests` project directory or `Steps`/`Tests` suffix
  - [x] `.clj` — test if `_test.clj` or `_steps.clj` suffix
  - [x] `.dart` — test if `_test.dart` suffix or in `test/` directory
- [x] Expand `skipDirs` with `target`, `_build`, `deps`, `bin`, `obj`, `__pycache__`,
      `.pytest_cache`, `.venv`, `generated-contracts`, `generated_contracts`,
      `.dart_tool`, `.features-gen`
- [x] Write unit tests for each language file matching pattern
- [x] Verify: existing CLI app matching still works (backward compat)

### 6C: Step Extraction Layer

- [x] Create `internal/speccoverage/java_steps.go` — JVM `@Given/@When/@Then` annotation regex
- [x] Create `internal/speccoverage/python_steps.go` — Python `@given/@when/@then` decorator regex
- [x] Create `internal/speccoverage/elixir_steps.go` — Elixir `defgiven/defwhen/defthen ~r/...$/`
      regex (extract as compiled patterns, like Go)
- [x] Create `internal/speccoverage/rust_steps.go` — Rust `#[given("...")]` attribute regex
- [x] Create `internal/speccoverage/dotnet_steps.go` — C# `[Given("...")]` and F#
      `[<Given>]`text` ` backtick method regex
- [x] Create `internal/speccoverage/clojure_steps.go` — Clojure `(Given "..." ...)` form regex
- [x] Create `internal/speccoverage/dart_steps.go` — placeholder (deferred: no runtime BDD
      framework for Flutter; `bdd_widget_test` is code-gen only)
- [x] Extend `extractAllStepTexts` switch statement with `.java`, `.kt`, `.py`, `.ex`, `.exs`,
      `.rs`, `.fs`, `.cs`, `.clj`, `.dart` cases dispatching to new extractors
- [x] Verify: existing TS/JS regex already handles playwright-bdd `Given("text", fn)` (no
      new regex needed — syntax identical to Cucumber.js)
- [x] Write unit tests for each language step extraction (with real-world fixture snippets)

### 6D: Scenario Extraction Layer

- [x] Extend `extractScenarioTitles` to dispatch by extension:
  - [x] `.java`, `.kt`, `.cs`, `.rs` — reuse Go `// Scenario: Title` comment pattern
  - [x] `.py` — add `@scenario("file.feature", "Title")` decorator regex
  - [x] `.exs`, `.fs`, `.clj` — skip scenario extraction (auto-bind frameworks)
  - [x] `.dart` — skip or use `// Scenario:` comment pattern
- [x] Write unit tests for each language scenario extraction

### 6E: Integration and Verification

- [x] Write BDD integration test with multi-language fixture files
- [x] Write BDD integration test for shared-steps mode
- [x] Add Gherkin feature file to `specs/apps/rhino-cli/`
- [x] Smoke test: run against actual demo-be-golang-gin test files
- [x] Smoke test: run against actual demo-be-java-springboot test files
- [x] Smoke test: run against actual demo-be-elixir-phoenix test files
- [x] Smoke test: run against actual demo-be-ts-effect test files
- [x] Smoke test: run `--shared-steps` against actual demo-be-e2e step files
- [x] Smoke test: run `--shared-steps` against actual demo-fe-e2e step files
- [x] Smoke test: run against actual demo-fe-dart-flutterweb test files
- [x] Verify: existing spec-coverage for organiclever-fe still works
- [x] Verify: `nx run rhino-cli:test:quick` passes with >=90% coverage

## Phase 7: Documentation and Version Bump

- [x] Bump version in `cmd/root.go` from `0.12.0` to `0.13.0`
- [x] Update `README.md` with new commands, flags, and examples
- [x] Add Cobertura XML to format support table
- [x] Document `--per-file` and `--below-threshold` flags
- [x] Document `--exclude` flag
- [x] Document `test-coverage merge` command with examples
- [x] Document `test-coverage diff` command with examples
- [x] Document spec-coverage multi-language support
- [x] Document `--shared-steps` mode with E2E/frontend examples
- [x] Add version history entry for v0.13.0

## Phase 8: End-to-End Verification

- [x] Run `nx run rhino-cli:test:quick` -- all tests pass, >=90% coverage
- [x] Run `nx run rhino-cli:test:integration` -- all BDD scenarios pass
- [x] Run `nx run rhino-cli:lint` -- no golangci-lint violations
- [x] Verify backward compatibility: existing project.json commands unchanged
- [x] Smoke test: run `test-coverage validate` against actual project coverage files
  - [x] Verify all demo-be-\* coverage files (Go cover.out, LCOV, JaCoCo XML)
  - [x] Verify all demo-fe-\* coverage files (LCOV from Vitest, Flutter)
  - [x] Verify all lib coverage files (Go cover.out, LCOV)
- [x] Smoke test: run `test-coverage merge` with two real coverage files
- [x] Smoke test: run `test-coverage diff` against actual git changes
- [x] Smoke test: run `spec-coverage validate` against demo-be backends (1:1 mode)
- [x] Smoke test: run `spec-coverage validate --shared-steps` against E2E projects

## Success Criteria

- **Codecov compatibility**: All formats produce identical results to Codecov's algorithm
  (`covered / (covered + partial + missed)`; partial = NOT covered). Validate, merge, diff,
  and per-file all use the same 3-state formula.
- All 4 coverage formats detected and validated correctly (Go, LCOV, JaCoCo, Cobertura)
- Kover `report.xml` (no "jacoco" in filename) correctly detected as JaCoCo via content
- test-coverage works for ALL project stacks: Go, TS, Java, Kotlin, Python, Elixir, Rust,
  F#, C#, Clojure, Dart (all use already-supported formats: Go cover.out, LCOV, JaCoCo XML)
- Per-file reporting shows file breakdown in text/JSON/markdown formats
- Coverage merging produces correct LCOV output from mixed-format inputs
- Diff coverage correctly identifies changed lines and their coverage status
- File exclusion works across validate, merge, and diff commands
- spec-coverage file matching works for all 11 languages (Go, TS/JS, Java, Kotlin, Python,
  Elixir, Rust, F#, C#, Clojure, Dart)
- spec-coverage step extraction works for 10 languages with framework-specific regex
  (Dart deferred pending BDD framework adoption)
- spec-coverage `--shared-steps` mode validates E2E projects (demo-be-e2e, demo-fe-e2e)
- spec-coverage `--shared-steps` mode validates frontend projects (demo-fe-\*)
- spec-coverage scenario extraction works for languages with explicit scenario markers
- Every Gherkin spec (feature and scenario) is implementable without exception
- Backward compatibility: existing organiclever-fe and CLI app spec-coverage unchanged
- All existing tests still pass (zero regressions)
- Coverage >=90% maintained across all packages
- No new golangci-lint violations
