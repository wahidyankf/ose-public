# Requirements

## Codecov Compatibility Guarantee

All `test-coverage` calculations (validate, merge, diff, per-file) MUST produce results
identical to Codecov's algorithm. This is a cross-cutting requirement for R1-R5.

**Algorithm**: Three-state line classification (covered / partial / missed):

- **Covered**: Line executed AND all branches taken (or no branches)
- **Partial**: Line executed BUT some branches not taken
- **Missed**: Line not executed
- **Formula**: `coverage% = covered / (covered + partial + missed)`
- **Partial lines count as NOT covered** (matching Codecov's badge/status check calculation)

This applies to:

- **R1 (Cobertura)**: Same algorithm applied to Cobertura XML `hits` + `condition-coverage`
- **R2 (Per-file)**: Each file's percentage uses the same 3-state formula
- **R3 (Merge)**: Merged data preserves hit counts and branch data; validation uses same formula
- **R4 (Diff)**: Changed lines classified as covered/partial/missed using same 3-state formula
- **R5 (Exclude)**: Excluded files removed before aggregation; remaining use same formula

The existing Go cover.out, LCOV, and JaCoCo parsers already implement this algorithm.
Cobertura (R1) must match it exactly.

---

## R1: Cobertura XML Format Support

### Description

Add parsing support for Cobertura XML coverage reports. Cobertura XML is the second most widely
adopted coverage format after LCOV. It is the default output of Python's `coverage xml`, .NET
Coverlet's default format, GitLab CI's standard for inline MR annotations, and is supported by
gcovr (C/C++), Istanbul/nyc (JS/TS), and many other tools.

### Acceptance Criteria

```gherkin
Feature: Cobertura XML coverage validation

  Background:
    Given rhino-cli is built and available

  Scenario: Validate Cobertura XML with passing threshold
    Given a Cobertura XML file with 95% line coverage
    When I run "rhino-cli test-coverage validate coverage.xml 90"
    Then the exit code is 0
    And the output contains "PASS"
    And the output contains "95"
    And the detected format is "cobertura"

  Scenario: Validate Cobertura XML with failing threshold
    Given a Cobertura XML file with 70% line coverage
    When I run "rhino-cli test-coverage validate coverage.xml 90"
    Then the exit code is 1
    And the output contains "FAIL"

  Scenario: Auto-detect Cobertura XML by content
    Given an XML file with <coverage> root element and line-rate attribute
    When I run "rhino-cli test-coverage validate report.xml 80"
    Then the format is detected as "cobertura"
    And coverage is calculated correctly

  Scenario: Distinguish Cobertura from JaCoCo XML
    Given a JaCoCo XML file with <report> root element
    When I run "rhino-cli test-coverage validate jacoco.xml 80"
    Then the format is detected as "jacoco"
    And it is NOT detected as "cobertura"

  Scenario: Handle Cobertura with branch coverage
    Given a Cobertura XML file with branch data (condition-coverage attributes)
    When I run "rhino-cli test-coverage validate coverage.xml 80"
    Then lines with partial branch coverage are counted as partial
    And lines with full branch coverage are counted as covered

  Scenario: JSON and markdown output for Cobertura
    Given a Cobertura XML file with coverage data
    When I run "rhino-cli test-coverage validate coverage.xml 80 -o json"
    Then the JSON output contains "format": "cobertura"
    When I run "rhino-cli test-coverage validate coverage.xml 80 -o markdown"
    Then the markdown table includes format and metrics
```

### Cobertura XML Structure Reference

```xml
<?xml version="1.0" ?>
<coverage version="5.5" timestamp="1234567890" lines-valid="100"
          lines-covered="85" line-rate="0.85" branches-valid="20"
          branches-covered="15" branch-rate="0.75" complexity="0">
  <packages>
    <package name="mypackage" line-rate="0.85" branch-rate="0.75">
      <classes>
        <class name="MyClass" filename="src/myclass.py"
               line-rate="0.85" branch-rate="0.75">
          <lines>
            <line number="1" hits="5"/>
            <line number="5" hits="0"/>
            <line number="10" hits="3" branch="true"
                  condition-coverage="50% (1/2)"/>
          </lines>
        </class>
      </classes>
    </package>
  </packages>
</coverage>
```

### Line Classification (Codecov Algorithm)

- **Covered**: `hits > 0` AND (no branch OR `condition-coverage = 100%`)
- **Partial**: `hits > 0` AND `branch="true"` AND `condition-coverage < 100%`
- **Missed**: `hits == 0`
- **Formula**: `covered / (covered + partial + missed)`

---

## R2: Per-File Coverage Reporting

### Description

Add a `--per-file` flag to `test-coverage validate` that shows file-level coverage breakdown.
This helps developers identify which files have the weakest coverage and need attention.

### Acceptance Criteria

```gherkin
Feature: Per-file coverage reporting

  Background:
    Given rhino-cli is built and available

  Scenario: Show per-file breakdown with --per-file flag
    Given a coverage file covering multiple source files
    When I run "rhino-cli test-coverage validate coverage.info 80 --per-file"
    Then the output shows a table with per-file coverage
    And files are sorted by coverage percentage ascending (worst first)
    And each row shows filename, covered, partial, missed, total, and percentage
    And the aggregate summary is still shown at the bottom

  Scenario: Per-file with --per-file and -o json
    Given a coverage file covering multiple source files
    When I run "rhino-cli test-coverage validate coverage.info 80 --per-file -o json"
    Then the JSON output contains a "files" array
    And each file entry has path, covered, partial, missed, total, and pct fields
    And the top-level aggregate metrics are still present

  Scenario: Per-file with --per-file and -o markdown
    Given a coverage file covering multiple source files
    When I run "rhino-cli test-coverage validate coverage.info 80 --per-file -o markdown"
    Then a markdown table with per-file breakdown is shown
    And files below threshold are highlighted

  Scenario: Per-file with --below-threshold flag
    Given a coverage file where some files are below 80% and some above
    When I run "rhino-cli test-coverage validate coverage.info 80 --per-file --below-threshold"
    Then only files below 80% coverage are shown
    And files at or above 80% are omitted from the per-file table

  Scenario: Per-file works with all formats
    Given coverage files in Go, LCOV, JaCoCo, and Cobertura formats
    When I run "rhino-cli test-coverage validate <file> 80 --per-file" for each
    Then per-file breakdown is shown for all formats

  Scenario: Without --per-file flag behavior unchanged
    Given a coverage file covering multiple source files
    When I run "rhino-cli test-coverage validate coverage.info 80"
    Then only the aggregate summary is shown (no per-file table)
    And output is identical to current behavior
```

---

## R3: Coverage Merging

### Description

Add a `test-coverage merge` subcommand that combines multiple coverage files (same or different
formats) into a unified coverage report. This is useful for combining unit + integration coverage,
or combining coverage from parallel test runs.

### Acceptance Criteria

```gherkin
Feature: Coverage merging

  Background:
    Given rhino-cli is built and available

  Scenario: Merge two LCOV files
    Given two LCOV files covering different source files
    When I run "rhino-cli test-coverage merge --out-file merged.info file1.info file2.info"
    Then merged.info is created in LCOV format
    And it contains coverage data from both input files

  Scenario: Merge overlapping coverage files
    Given two coverage files covering the same source file with different line hits
    When I run "rhino-cli test-coverage merge --out-file merged.info unit.info integration.info"
    Then overlapping lines take the maximum hit count
    And the merged file has higher coverage than either input alone

  Scenario: Merge files in different formats
    Given a Go cover.out file and an LCOV file
    When I run "rhino-cli test-coverage merge --out-file merged.info cover.out vitest.info"
    Then the output is written in LCOV format (default output format)
    And coverage from both inputs is included

  Scenario: Merge with threshold validation
    Given two coverage files
    When I run "rhino-cli test-coverage merge --validate 90 --out-file merged.info f1.info f2.info"
    Then the merged coverage is validated against the 90% threshold
    And exit code is 0 if merged coverage >= 90%, 1 otherwise

  Scenario: Merge with JSON output
    Given two coverage files
    When I run "rhino-cli test-coverage merge --out-file merged.info -o json f1.info f2.info"
    Then the merge summary is printed in JSON format
    And the merged file is still written as LCOV

  Scenario: Merge with no output file (dry run)
    Given two coverage files
    When I run "rhino-cli test-coverage merge f1.info f2.info"
    Then merged coverage summary is printed to stdout
    And no output file is written

  Scenario: Error on invalid input file
    Given one valid and one nonexistent coverage file
    When I run "rhino-cli test-coverage merge valid.info missing.info"
    Then the exit code is 1
    And the error message identifies the missing file
```

### Merge Algorithm

- Parse each input file into per-file, per-line coverage data
- For overlapping files+lines: take `max(hit_count_a, hit_count_b)`
- For branch data: union branches, take max per branch
- Write output in LCOV format (most universal)

---

## R4: Diff Coverage

### Description

Add a `test-coverage diff` subcommand that reports coverage only for lines changed in a git diff.
This enables PR quality gates that ensure new/changed code meets coverage standards, without
penalizing existing uncovered code.

### Acceptance Criteria

```gherkin
Feature: Diff coverage

  Background:
    Given rhino-cli is built and available
    And the current directory is a git repository

  Scenario: Diff coverage against main branch
    Given a coverage file and committed changes on current branch vs main
    When I run "rhino-cli test-coverage diff coverage.info --base main"
    Then only lines added or modified vs main are evaluated
    And the output shows "Diff coverage: X%" for changed lines only
    And exit code is 0

  Scenario: Diff coverage with threshold
    Given a coverage file and changes where only 60% of new lines are covered
    When I run "rhino-cli test-coverage diff coverage.info --base main --threshold 80"
    Then the exit code is 1
    And the output shows "FAIL: 60% < 80% threshold"

  Scenario: Diff coverage with per-file breakdown
    Given a coverage file and changes across multiple files
    When I run "rhino-cli test-coverage diff coverage.info --base main --per-file"
    Then per-file diff coverage is shown for each changed file
    And only files with changed lines appear

  Scenario: Diff coverage against specific commit
    Given a coverage file
    When I run "rhino-cli test-coverage diff coverage.info --base abc123"
    Then diff is computed against commit abc123
    And only lines changed since that commit are evaluated

  Scenario: Diff coverage with staged changes
    Given a coverage file and staged changes
    When I run "rhino-cli test-coverage diff coverage.info --staged"
    Then only staged (added/modified) lines are evaluated

  Scenario: No changed lines
    Given a coverage file and no changes vs main
    When I run "rhino-cli test-coverage diff coverage.info --base main"
    Then the output shows "No changed lines to evaluate"
    And exit code is 0

  Scenario: JSON output for diff coverage
    Given a coverage file and changes
    When I run "rhino-cli test-coverage diff coverage.info --base main -o json"
    Then JSON output contains covered, partial, missed, total, diff_pct fields
    And a files array with per-file diff coverage
```

---

## R5: File Exclusion Patterns

### Description

Add `--exclude` flag to `test-coverage validate` (and `merge`, `diff`) that excludes files
matching glob patterns from coverage calculation. This is useful for excluding generated code,
test utilities, and vendor directories.

Several projects already do manual exclusion outside rhino-cli:

- **demo-be-golang-gin**: `grep -v 'gorm_store|internal/server|cmd/server|generated-contracts'`
- **demo-be-rust-axum**: `cargo llvm-cov --ignore-filename-regex 'test_api'`
- **demo-be-clojure-pedestal**: `--cov-ns-exclude-regex 'demo-be-cjpd\\.(main|routes|...)'`
- **demo-be-fsharp-giraffe**: AltCover `--assemblyExcludeFilter` + `--fileFilter`

The `--exclude` flag provides a standardized alternative. Go projects could replace the `grep -v`
pipeline with `--exclude` patterns. Other projects' tool-specific flags run before rhino-cli
receives the data, so they remain as-is.

### Acceptance Criteria

```gherkin
Feature: File exclusion patterns

  Background:
    Given rhino-cli is built and available

  Scenario: Exclude files by glob pattern
    Given a coverage file covering source and generated files
    When I run "rhino-cli test-coverage validate cov.info 90 --exclude 'generated_*'"
    Then files matching "generated_*" are excluded from coverage calculation
    And only non-excluded files contribute to the percentage

  Scenario: Multiple exclude patterns
    Given a coverage file covering various directories
    When I run "rhino-cli test-coverage validate cov.info 90 --exclude 'generated_*' --exclude 'vendor/*'"
    Then both patterns are applied
    And matching files are excluded from coverage

  Scenario: Exclude with per-file reporting
    Given a coverage file with excluded and included files
    When I run "rhino-cli test-coverage validate cov.info 90 --exclude 'gen/*' --per-file"
    Then excluded files do not appear in per-file table
    And aggregate metrics exclude those files

  Scenario: Exclude pattern matches no files
    Given a coverage file
    When I run "rhino-cli test-coverage validate cov.info 90 --exclude 'nonexistent/*'"
    Then no files are excluded
    And coverage is calculated normally
    And no warning is emitted

  Scenario: Exclude works with merge command
    Given two coverage files
    When I run "rhino-cli test-coverage merge --exclude 'gen/*' --out-file out.info f1.info f2.info"
    Then excluded files are omitted from the merged output

  Scenario: Exclude works with diff command
    Given a coverage file and changes in source and generated files
    When I run "rhino-cli test-coverage diff coverage.info --base main --exclude 'gen/*'"
    Then excluded files are omitted from diff coverage calculation
```

---

## R6: spec-coverage Multi-Language and Multi-Project Support

### Description

Extend `spec-coverage validate` to support **all demo projects**: 11 demo-be backends, 3 demo-fe
frontends, and 2 E2E test suites. Every Gherkin spec (feature and scenario) must be implemented
without exception across all project types.

The current implementation has **three layers** that each only support Go and TS/JS:

1. **File matching** (`findMatchingTestFile`): Only matches `HasPrefix(base, stem+".")` -- misses
   underscore-separated Go files, PascalCase Java/Kotlin/C#/F# files, `test_` prefix Python files
2. **Scenario extraction** (`extractScenarioTitles`): Only parses Go `// Scenario:` comments and
   TS/JS `Scenario("title")` calls -- no Java/Kotlin annotations, Python decorators, Elixir macros
3. **Step extraction** (`extractAllStepTexts`): Only processes `.go` and `.ts/.tsx/.js/.jsx` files
   -- no `.java`, `.kt`, `.py`, `.ex/.exs`, `.rs`, `.fs`, `.cs`, `.clj`, `.dart` support

Additionally, a **fundamental architecture limitation** exists: the current tool assumes 1:1
feature-to-test-file mapping, which does not work for E2E projects (playwright-bdd) or shared
step libraries where multiple features share step files like `common.steps.ts`.

### Project Scope

| Project Type         | Projects                                                              | Specs Dir                                                  | Step Pattern                        |
| -------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------- | ----------------------------------- |
| **Backends (unit)**  | 11 demo-be-\* apps                                                    | `specs/apps/demo/be/gherkin/` (14 features, 152 scenarios) | 1:1 file mapping, language-specific |
| **Frontends (unit)** | demo-fe-ts-nextjs, demo-fe-ts-tanstack-start, demo-fe-dart-flutterweb | `specs/apps/demo/fe/gherkin/` (15 features, 92 scenarios)  | 1:1 or shared steps                 |
| **Backend E2E**      | demo-be-e2e                                                           | `specs/apps/demo/be/gherkin/` (same 14 features)           | Shared steps (playwright-bdd)       |
| **Frontend E2E**     | demo-fe-e2e                                                           | `specs/apps/demo/fe/gherkin/` (same 15 features)           | Shared steps (playwright-bdd)       |

### Current Support Gap

| Language              | File Matching             | Scenario Extraction  | Step Extraction           |
| --------------------- | ------------------------- | -------------------- | ------------------------- |
| Go                    | Partial (dot-prefix only) | Yes (`// Scenario:`) | Yes (`sc.Step`)           |
| TypeScript/JS         | Yes (`.test.`, `.spec.`)  | Yes (`Scenario()`)   | Yes (`Given/When/Then()`) |
| Java                  | No                        | No                   | No                        |
| Kotlin                | No                        | No                   | No                        |
| Python                | No                        | No                   | No                        |
| Elixir                | No                        | No                   | No                        |
| Rust                  | No                        | No                   | No                        |
| F#                    | No                        | No                   | No                        |
| C#                    | No                        | No                   | No                        |
| Clojure               | No                        | No                   | No                        |
| Dart                  | No                        | No                   | No                        |
| **Shared steps mode** | **N/A (not supported)**   | **N/A**              | **N/A**                   |

### Step Definition Patterns Per Language

| Language | Framework       | Step Pattern                                       | Example                                                    |
| -------- | --------------- | -------------------------------------------------- | ---------------------------------------------------------- |
| Go       | godog           | `sc.Step(\`^text$\`, fn)`                          | `sc.Step(\`^the system is running$\`, theSystemIsRunning)` |
| TS/JS    | Cucumber.js     | `Given("text", fn)`                                | `Given("the system is running", async () => { ... })`      |
| Java     | Cucumber-JVM    | `@Given("text")`                                   | `@Given("the system is running")`                          |
| Kotlin   | Cucumber-JVM    | `@Given("text")`                                   | `@Given("the system is running")`                          |
| Python   | pytest-bdd      | `@given("text")` / `@given(parsers.parse("text"))` | `@given("the system is running")`                          |
| Elixir   | Cabbage         | `defgiven ~r/^text$/`                              | `defgiven ~r/^the system is running$/, _vars, state do`    |
| Rust     | cucumber-rs     | `#[given("text")]`                                 | `#[given("the system is running")]`                        |
| F#       | TickSpec        | `let [<Given>] \`\`text\`\` ()`                    | `let [<Given>] \`\`the system is running\`\` () =`         |
| C#       | Reqnroll        | `[Given("text")]`                                  | `[Given("the system is running")]`                         |
| Clojure  | kaocha-cucumber | `(Given "text" [state] ...)`                       | `(Given "the system is running" [state] ...)`              |
| TS/JS    | playwright-bdd  | `Given("text", fn)` (via `createBdd()`)            | `Given("the API is running", async () => { ... })`         |
| Dart     | bdd_widget_test | `given("text", fn)` / `when("text", fn)`           | `given("the app is running", () { ... })`                  |

### Scenario Title Extraction Per Language

| Language       | Pattern                                               | Example                                                   |
| -------------- | ----------------------------------------------------- | --------------------------------------------------------- |
| Go             | `// Scenario: Title` comment                          | `// Scenario: User logs in successfully`                  |
| TS/JS          | `Scenario("Title", fn)` call                          | `Scenario("User logs in successfully", () => {})`         |
| Java/Kotlin/C# | `// Scenario: Title` comment (Cucumber convention)    | `// Scenario: User logs in successfully`                  |
| Python         | `@scenario("file.feature", "Title")` decorator        | `@scenario("login.feature", "User logs in successfully")` |
| Elixir         | Cabbage auto-loads feature file -- scenarios implicit | N/A (match by step coverage)                              |
| Rust           | `// Scenario: Title` comment                          | `// Scenario: User logs in successfully`                  |
| F#             | TickSpec auto-binds from feature file                 | N/A (match by step coverage)                              |
| Clojure        | kaocha-cucumber auto-loads from feature file          | N/A (match by step coverage)                              |

### Acceptance Criteria

```gherkin
Feature: spec-coverage multi-language support

  Background:
    Given rhino-cli is built and available

  Scenario: Match Go BDD step files (underscore pattern)
    Given specs with "health-check.feature"
    And a Go test file "health_check_steps_test.go" containing sc.Step definitions
    When I run "rhino-cli spec-coverage validate specs-dir app-dir"
    Then "health-check.feature" is matched to "health_check_steps_test.go"
    And step definitions from sc.Step are extracted

  Scenario: Match and extract Java Cucumber steps
    Given specs with "health-check.feature"
    And a Java file "HealthCheckSteps.java" with @Given/@When/@Then annotations
    When I run "rhino-cli spec-coverage validate specs-dir app-dir"
    Then "health-check.feature" is matched to "HealthCheckSteps.java"
    And step texts from @Given/@When/@Then annotations are extracted
    And scenario titles from "// Scenario:" comments are extracted

  Scenario: Match and extract Kotlin Cucumber steps
    Given specs with "health-check.feature"
    And a Kotlin file "HealthCheckSteps.kt" with @Given/@When/@Then annotations
    When I run "rhino-cli spec-coverage validate specs-dir app-dir"
    Then the feature is matched and steps are extracted

  Scenario: Match and extract Python pytest-bdd steps
    Given specs with "health-check.feature"
    And a Python file "test_health_check.py" with @given/@when/@then decorators
    When I run "rhino-cli spec-coverage validate specs-dir app-dir"
    Then "health-check.feature" is matched to "test_health_check.py"
    And step texts from @given/@when/@then decorators are extracted

  Scenario: Match and extract Elixir Cabbage steps
    Given specs with "health-check.feature"
    And an Elixir file "health_check_steps.exs" with defgiven/defwhen/defthen macros
    When I run "rhino-cli spec-coverage validate specs-dir app-dir"
    Then the feature is matched and step definitions are extracted

  Scenario: Match and extract Rust cucumber-rs steps
    Given specs with "health-check.feature"
    And a Rust file containing #[given("...")] attributes
    When I run "rhino-cli spec-coverage validate specs-dir app-dir"
    Then step texts from #[given/when/then] attributes are extracted

  Scenario: Match and extract F# TickSpec steps
    Given specs with "health-check.feature"
    And an F# file "HealthCheckTests.fs" with [<Given>] attributes
    When I run "rhino-cli spec-coverage validate specs-dir app-dir"
    Then step texts from [<Given>]/[<When>]/[<Then>] backtick methods are extracted

  Scenario: Match and extract C# Reqnroll steps
    Given specs with "health-check.feature"
    And a C# file "HealthCheckSteps.cs" with [Given("...")] attributes
    When I run "rhino-cli spec-coverage validate specs-dir app-dir"
    Then step texts from [Given]/[When]/[Then] attributes are extracted

  Scenario: Match and extract Clojure kaocha-cucumber steps
    Given specs with "health-check.feature"
    And a Clojure file "health_check_steps.clj" with (Given "..." ...) forms
    When I run "rhino-cli spec-coverage validate specs-dir app-dir"
    Then step texts from (Given/When/Then "text" ...) forms are extracted

  Scenario: Match and extract Dart step definitions
    Given specs with "health-check.feature"
    And a Dart file with given/when/then step definitions
    When I run "rhino-cli spec-coverage validate specs-dir app-dir"
    Then step texts from Dart given/when/then functions are extracted

  Scenario: Shared steps mode for E2E projects (playwright-bdd)
    Given BE specs at specs/apps/demo/be/gherkin/ with 14 feature files
    And demo-be-e2e has shared step files in tests/steps/ (e.g., common.steps.ts)
    When I run "rhino-cli spec-coverage validate specs-dir app-dir --shared-steps"
    Then file-level matching is skipped (no 1:1 feature→test file requirement)
    And step-level coverage is checked across ALL step files in app-dir
    And every step text from every feature is checked against extracted steps
    And missing steps are reported as gaps

  Scenario: Shared steps mode reports uncovered steps
    Given specs with steps "A", "B", "C" across multiple features
    And step files only define steps "A" and "B"
    When I run "rhino-cli spec-coverage validate specs-dir app-dir --shared-steps"
    Then the output reports step "C" as uncovered
    And the exit code is 1

  Scenario: Shared steps mode for FE E2E (demo-fe-e2e)
    Given FE specs at specs/apps/demo/fe/gherkin/ with 15 feature files
    And demo-fe-e2e has shared step files in tests/steps/
    When I run "rhino-cli spec-coverage validate specs-dir app-dir --shared-steps"
    Then all FE spec steps are checked against extracted step definitions

  Scenario: Shared steps mode for FE unit tests
    Given FE specs at specs/apps/demo/fe/gherkin/
    And demo-fe-ts-nextjs has BDD step files in test/unit/
    When I run "rhino-cli spec-coverage validate specs-dir app-dir --shared-steps"
    Then step coverage is validated across all unit step files

  Scenario: Without --shared-steps flag uses 1:1 matching (default)
    Given specs and test files following 1:1 naming conventions
    When I run "rhino-cli spec-coverage validate specs-dir app-dir"
    Then 1:1 file matching is used (existing behavior)
    And --shared-steps is NOT implied

  Scenario: Backward compatibility with CLI apps
    Given specs and test files following existing CLI naming conventions
    When I run "rhino-cli spec-coverage validate specs-dir app-dir"
    Then existing CLI app matching still works unchanged
    And existing Go and TS/JS step extraction still works unchanged
```

### File Matching Strategy

Expand `findMatchingTestFile` to check multiple patterns per feature stem:

1. **Current (keep)**: `HasPrefix(base, stem+".")` and `HasPrefix(base, underscoreStem+".")`
2. **New underscore prefix**: `HasPrefix(base, stem+"_")` and `HasPrefix(base, underscoreStem+"_")`
3. **New `test_` prefix (Python)**: `HasPrefix(base, "test_"+underscoreStem)`
4. **New PascalCase (Java/Kotlin/C#/F#)**: `HasPrefix(base, PascalCase(stem))`
5. **New extensions to recognize**: `.java`, `.kt`, `.py`, `.ex`, `.exs`, `.rs`, `.fs`, `.cs`, `.clj`, `.dart`

### Step Extraction Strategy

Extend `extractAllStepTexts` switch statement with new cases:

| Extension           | Extraction Method                                                                 |
| ------------------- | --------------------------------------------------------------------------------- |
| `.go`               | Existing: `sc.Step(\`^pattern$\`)` → compile as regex                             |
| `.ts/.tsx/.js/.jsx` | Existing: `Given/When/Then("text")` → exact text                                  |
| `.java`, `.kt`      | New: `@Given("text")` / `@When("text")` / `@Then("text")` annotation regex        |
| `.py`               | New: `@given("text")` / `@when("text")` / `@then("text")` decorator regex         |
| `.ex`, `.exs`       | New: `defgiven ~r/^text$/` / `defwhen` / `defthen` macro regex                    |
| `.rs`               | New: `#[given("text")]` / `#[when("text")]` / `#[then("text")]` attribute regex   |
| `.fs`               | New: `let [<Given>]`text` ` backtick method regex                                 |
| `.cs`               | New: `[Given("text")]` / `[When("text")]` / `[Then("text")]` attribute regex      |
| `.clj`              | New: `(Given "text" ...)` / `(When "text" ...)` / `(Then "text" ...)` form regex  |
| `.dart`             | New: `given("text", fn)` / `when("text", fn)` / `then("text", fn)` function regex |
