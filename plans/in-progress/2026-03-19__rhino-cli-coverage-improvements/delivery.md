# Delivery Checklist

## Phase 1: Cobertura XML Format Support (R1)

- [ ] Create `internal/testcoverage/cobertura_coverage.go` with XML struct parsing
- [ ] Implement Codecov-compatible line classification (covered/partial/missed)
- [ ] Parse `condition-coverage` attribute for branch classification
- [ ] Update `detect.go` to detect Cobertura XML (filename + content-based)
- [ ] Distinguish Cobertura (`<coverage>`) from JaCoCo (`<report>`) in content detection
- [ ] Add "cobertura" format name to `reporter.go` output
- [ ] Write unit tests (`cobertura_coverage_test.go`) with fixture files
- [ ] Write detection tests in `detect_test.go`
- [ ] Write BDD integration test (`cmd/test_coverage_validate.integration_test.go`)
- [ ] Add Gherkin feature file to `specs/apps/rhino-cli/`
- [ ] Verify: `nx run rhino-cli:test:quick` passes with >=90% coverage

## Phase 2: Per-File Coverage Reporting (R2)

- [ ] Add `FileResult` type and extend `Result` with `Files []FileResult` in types
- [ ] Refactor Go parser to return per-file data (it already groups internally)
- [ ] Refactor LCOV parser to return per-file data
- [ ] Refactor JaCoCo parser to return per-file data
- [ ] Wire Cobertura parser to return per-file data
- [ ] Add `--per-file` and `--below-threshold` flags to `test-coverage validate` command
- [ ] Implement per-file text rendering in `reporter.go` (sorted ascending by %)
- [ ] Implement per-file JSON rendering (files array in output)
- [ ] Implement per-file markdown rendering (table with highlighting)
- [ ] Write unit tests for per-file aggregation and rendering
- [ ] Write BDD integration test for `--per-file` flag
- [ ] Add Gherkin feature file
- [ ] Verify: existing `test-coverage validate` output unchanged without `--per-file`
- [ ] Verify: `nx run rhino-cli:test:quick` passes

## Phase 3: File Exclusion Patterns (R5)

- [ ] Create `internal/testcoverage/exclude.go` with glob-based file filtering
- [ ] Support `filepath.Match` patterns (single-segment globs; `**` deferred to future version)
- [ ] Add `--exclude` flag (repeatable) to `test-coverage validate` command
- [ ] Apply exclusion post-parse, pre-aggregate in validate flow
- [ ] Ensure exclusion works with `--per-file` (excluded files hidden)
- [ ] Write unit tests for exclusion logic
- [ ] Write BDD integration test
- [ ] Add Gherkin feature file
- [ ] Verify: `nx run rhino-cli:test:quick` passes

## Phase 4: Coverage Merging (R3)

- [ ] Create `internal/testcoverage/merge.go` with format-agnostic merge logic
- [ ] Implement `CoverageMap` type for normalized per-line data
- [ ] Add parsers to return `CoverageMap` from each format
- [ ] Implement max-hit-count merge for overlapping files/lines
- [ ] Implement branch data union with per-branch max counts
- [ ] Implement LCOV output writer for merged data
- [ ] Create `cmd/test_coverage_merge.go` subcommand
- [ ] Add `--out-file` flag for output file path
- [ ] Add `--validate` flag for optional threshold check
- [ ] Add `--exclude` flag support
- [ ] Write unit tests for merge logic (same format, cross-format, overlapping)
- [ ] Write BDD integration test
- [ ] Add Gherkin feature file to `specs/apps/rhino-cli/`
- [ ] Verify: `nx run rhino-cli:test:quick` passes

## Phase 5: Diff Coverage (R4)

- [ ] Create `internal/testcoverage/gitdiff.go` with unified diff parser
- [ ] Parse `@@ -a,b +c,d @@` hunk headers to extract changed line ranges
- [ ] Map changed lines to file paths from diff output
- [ ] Create `internal/testcoverage/diff.go` with diff coverage logic
- [ ] Cross-reference changed lines with coverage data
- [ ] Calculate diff coverage: `covered_changed / total_changed`
- [ ] Handle edge cases: renamed files, binary files, missing coverage data
- [ ] Create `cmd/test_coverage_diff.go` subcommand
- [ ] Add `--base`, `--threshold`, `--staged`, `--per-file`, `--exclude` flags
- [ ] Implement text/JSON/markdown output for diff coverage
- [ ] Write unit tests for git diff parsing
- [ ] Write unit tests for diff coverage calculation
- [ ] Write BDD integration test (requires git fixtures)
- [ ] Add Gherkin feature file
- [ ] Verify: `nx run rhino-cli:test:quick` passes

## Phase 6: spec-coverage Multi-Language Support (R6)

### 6A: File Matching Layer

- [ ] Add `toSnakeCase` and `toPascalCase` string helpers
- [ ] Rewrite `findMatchingTestFile` to use `matchesStem` with underscore+PascalCase+test\_ patterns
- [ ] Add test file recognition for new extensions:
  - [ ] `.java`, `.kt` — test if in `test/` or `tests/` ancestor directory
  - [ ] `.py` — test if `test_` prefix, `_test.py` suffix, or in `tests/` directory
  - [ ] `.exs` — test if `_test.exs` or `_steps.exs` suffix
  - [ ] `.rs` — test if `_test.rs` suffix or in `tests/` directory
  - [ ] `.fs`, `.cs` — test if in `Tests` project directory or `Steps`/`Tests` suffix
  - [ ] `.clj` — test if `_test.clj` or `_steps.clj` suffix
- [ ] Expand `skipDirs` with `target`, `_build`, `deps`, `bin`, `obj`, `__pycache__`,
      `.pytest_cache`, `.venv`, `generated-contracts`, `generated_contracts`
- [ ] Write unit tests for each language file matching pattern
- [ ] Verify: existing CLI app matching still works (backward compat)

### 6B: Step Extraction Layer

- [ ] Create `internal/speccoverage/java_steps.go` — JVM `@Given/@When/@Then` annotation regex
- [ ] Create `internal/speccoverage/python_steps.go` — Python `@given/@when/@then` decorator regex
- [ ] Create `internal/speccoverage/elixir_steps.go` — Elixir `defgiven/defwhen/defthen ~r/...$/`
      regex (extract as compiled patterns, like Go)
- [ ] Create `internal/speccoverage/rust_steps.go` — Rust `#[given("...")]` attribute regex
- [ ] Create `internal/speccoverage/dotnet_steps.go` — C# `[Given("...")]` and F#
      `[<Given>]`text` ` backtick method regex
- [ ] Create `internal/speccoverage/clojure_steps.go` — Clojure `(Given "..." ...)` form regex
- [ ] Extend `extractAllStepTexts` switch statement with `.java`, `.kt`, `.py`, `.ex`, `.exs`,
      `.rs`, `.fs`, `.cs`, `.clj` cases dispatching to new extractors
- [ ] Write unit tests for each language step extraction (with real-world fixture snippets)

### 6C: Scenario Extraction Layer

- [ ] Extend `extractScenarioTitles` to dispatch by extension:
  - [ ] `.java`, `.kt`, `.cs`, `.rs` — reuse Go `// Scenario: Title` comment pattern
  - [ ] `.py` — add `@scenario("file.feature", "Title")` decorator regex
  - [ ] `.exs`, `.fs`, `.clj` — skip scenario extraction (auto-bind frameworks)
- [ ] Write unit tests for each language scenario extraction

### 6D: Integration and Verification

- [ ] Write BDD integration test with multi-language fixture files
- [ ] Add Gherkin feature file to `specs/apps/rhino-cli/`
- [ ] Smoke test: run against actual demo-be-golang-gin test files
- [ ] Smoke test: run against actual demo-be-java-springboot test files
- [ ] Smoke test: run against actual demo-be-elixir-phoenix test files
- [ ] Smoke test: run against actual demo-be-ts-effect test files
- [ ] Verify: existing spec-coverage for organiclever-web still works
- [ ] Verify: `nx run rhino-cli:test:quick` passes with >=90% coverage

## Phase 7: Documentation and Version Bump

- [ ] Bump version in `cmd/root.go` from `0.12.0` to `0.13.0`
- [ ] Update `README.md` with new commands, flags, and examples
- [ ] Add Cobertura XML to format support table
- [ ] Document `--per-file` and `--below-threshold` flags
- [ ] Document `--exclude` flag
- [ ] Document `test-coverage merge` command with examples
- [ ] Document `test-coverage diff` command with examples
- [ ] Document spec-coverage multi-language support
- [ ] Add version history entry for v0.13.0

## Phase 8: End-to-End Verification

- [ ] Run `nx run rhino-cli:test:quick` -- all tests pass, >=90% coverage
- [ ] Run `nx run rhino-cli:test:integration` -- all BDD scenarios pass
- [ ] Run `nx run rhino-cli:lint` -- no golangci-lint violations
- [ ] Verify backward compatibility: existing project.json commands unchanged
- [ ] Smoke test: run `test-coverage validate` against actual project coverage files
- [ ] Smoke test: run `test-coverage merge` with two real coverage files
- [ ] Smoke test: run `test-coverage diff` against actual git changes

## Success Criteria

- All 4 coverage formats detected and validated correctly (Go, LCOV, JaCoCo, Cobertura)
- Kover `report.xml` (no "jacoco" in filename) correctly detected as JaCoCo via content
- Per-file reporting shows file breakdown in text/JSON/markdown formats
- Coverage merging produces correct LCOV output from mixed-format inputs
- Diff coverage correctly identifies changed lines and their coverage status
- File exclusion works across validate, merge, and diff commands
- spec-coverage file matching works for all 10 backend languages (Go, TS/JS, Java, Kotlin,
  Python, Elixir, Rust, F#, C#, Clojure)
- spec-coverage step extraction works for all 10 backend languages with framework-specific
  regex patterns
- spec-coverage scenario extraction works for languages with explicit scenario markers
- Backward compatibility: existing organiclever-web and CLI app spec-coverage unchanged
- All existing tests still pass (zero regressions)
- Coverage >=90% maintained across all packages
- No new golangci-lint violations
