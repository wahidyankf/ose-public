# Delivery Plan: CLI Testing Alignment

## Phase 1: Infrastructure — Mockable Layer and Helpers

Set up the mocking foundation before touching any command.

- [ ] **1.1** Create `apps/rhino-cli/cmd/testable.go` — package-level function variables for all
      `os.*` and `exec.*` calls used across commands (`osReadFile`, `osWriteFile`, `osStat`,
      `osLstat`, `osGetwd`, `osChdir`, `osMkdirAll`, `osRemoveAll`, `osOpen`, `osCreate`,
      `osReadDir`, `osUserHomeDir`, `execLookPath`, `execCommand`, `walkDir`)
- [ ] **1.2** Create `apps/rhino-cli/cmd/testable_mock_test.go` — reusable mock utilities:
      `mockFileInfo`, `mockFS` struct with `addFile`/`addDir`/`installMocks` methods, `mockCommandRunner`
- [ ] **1.3** Create `apps/rhino-cli/cmd/steps_common_test.go` — shared step text regex constants
      used by both unit and integration tests (e.g., `stepExitsSuccessfully`,
      `stepExitsWithFailure`, `stepOutputIsValidJSON`)
- [ ] **1.4** Verify `go test ./...` still passes with no functional changes (new files are test
      helpers only)

## Phase 2: Migrate Command Files to Mockable Calls

Wire package-level vars into each command's execution path. Most `cmd/*.go` files delegate to
`internal/` packages — the vars listed below reflect where they are needed in the cmd layer (thin
wrapper + helpers) rather than the internal packages. Verify the actual call sites in each file
before replacing; some vars may already live deeper in `internal/`. Each command is a separate
commit.

- [ ] **2.1** Migrate `cmd/helpers.go` — `findGitRoot()` uses `osGetwd`, `osStat`
- [ ] **2.2** Migrate `cmd/doctor.go` — delegates to `internal/doctor.CheckAll()`; wire
      `osGetwd`/`osStat` at the `runDoctor` boundary or pass injectable functions through
      `CheckOptions` so unit tests can intercept I/O without calling the real `internal/` code
- [ ] **2.3** Migrate `cmd/test_coverage_validate.go` — verify call sites; delegates to
      `internal/`; wire `osReadFile`, `osStat` at the cmd or options boundary
- [ ] **2.4** Migrate `cmd/test_coverage_merge.go` — verify call sites; wire `osReadFile`,
      `osWriteFile` at the cmd or options boundary
- [ ] **2.5** Migrate `cmd/test_coverage_diff.go` — verify call sites; wire `osReadFile`,
      `execCommand` at the cmd or options boundary
- [ ] **2.6** Migrate `cmd/agents_sync.go` — verify call sites; wire `osReadFile`, `osWriteFile`,
      `osMkdirAll`, `walkDir`, `osStat` at the cmd or options boundary
- [ ] **2.7** Migrate `cmd/agents_validate_claude.go` — verify call sites; wire `osReadFile`,
      `walkDir`, `osStat` at the cmd or options boundary
- [ ] **2.8** Migrate `cmd/agents_validate_sync.go` — verify call sites; wire `osReadFile`,
      `walkDir`, `osStat` at the cmd or options boundary
- [ ] **2.9** Migrate `cmd/docs_validate_links.go` — verify call sites; wire `osReadFile`,
      `walkDir` at the cmd or options boundary
- [ ] **2.10** Migrate `cmd/docs_validate_naming.go` — verify call sites; wire `osReadFile`,
      `walkDir` at the cmd or options boundary
- [ ] **2.11** Migrate `cmd/contracts_java_clean_imports.go` — verify call sites; wire
      `osReadFile`, `osWriteFile`, `walkDir` at the cmd or options boundary
- [ ] **2.12** Migrate `cmd/contracts_dart_scaffold.go` — verify call sites; wire `osReadFile`,
      `osWriteFile`, `walkDir`, `osMkdirAll` at the cmd or options boundary
- [ ] **2.13** Migrate `cmd/java_validate_annotations.go` — verify call sites; wire `osReadFile`,
      `walkDir` at the cmd or options boundary
- [ ] **2.14** Migrate `cmd/spec_coverage_validate.go` — verify call sites; wire `osReadFile`,
      `walkDir`, `osStat` at the cmd or options boundary
- [ ] **2.15** Migrate `cmd/git_pre_commit.go` — verify call sites; wire `osReadFile`,
      `execCommand`, `osGetwd` at the cmd or options boundary
- [ ] **2.16** Run `nx run rhino-cli:test:quick` — verify all existing tests still pass (migration
      is a refactor, no behavior change)
- [ ] **2.17** Run `nx run rhino-cli:test:integration` — verify integration tests still pass

## Phase 3: Rewrite Unit Tests to Consume Gherkin

For each command, rewrite `*_test.go` to use godog + mocks. Keep non-BDD tests where they cover
logic beyond Gherkin scenarios.

- [ ] **3.1** Rewrite `cmd/doctor_test.go` — godog consuming `doctor.feature` with mocked
      filesystem and tool detection; keep `TestDoctorCommand_Initialization` as non-BDD
- [ ] **3.2** Rewrite `cmd/test_coverage_validate_test.go` — godog consuming
      `test-coverage-validate.feature` with mocked coverage file reads
- [ ] **3.3** Create `cmd/test_coverage_merge_test.go` — godog consuming
      `test-coverage-merge.feature` with mocked file reads/writes (file did not exist before)
- [ ] **3.4** Create `cmd/test_coverage_diff_test.go` — godog consuming
      `test-coverage-diff.feature` with mocked file reads and git diff (file did not exist before)
- [ ] **3.5** Rewrite `cmd/agents_sync_test.go` — godog consuming `agents-sync.feature` with
      mocked filesystem for `.claude/`/`.opencode/` directories
- [ ] **3.6** Rewrite `cmd/agents_validate_claude_test.go` — godog consuming
      `agents-validate-claude.feature` with mocked YAML file reads
- [ ] **3.7** Rewrite `cmd/agents_validate_sync_test.go` — godog consuming
      `agents-validate-sync.feature` with mocked directory walks
- [ ] **3.8** Rewrite `cmd/docs_validate_links_test.go` — godog consuming
      `docs-validate-links.feature` with mocked markdown file reads
- [ ] **3.9** Rewrite `cmd/docs_validate_naming_test.go` — godog consuming
      `docs-validate-naming.feature` with mocked file listings
- [ ] **3.10** Rewrite `cmd/contracts_java_clean_imports_test.go` — godog consuming
      `contracts-java-clean-imports.feature` with mocked Java source reads/writes
- [ ] **3.11** Rewrite `cmd/contracts_dart_scaffold_test.go` — godog consuming
      `contracts-dart-scaffold.feature` with mocked Dart source reads/writes
- [ ] **3.12** Rewrite `cmd/java_validate_annotations_test.go` — godog consuming
      `java-validate-annotations.feature` with mocked package-info reads
- [ ] **3.13** Rewrite `cmd/spec_coverage_validate_test.go` — godog consuming
      `spec-coverage-validate.feature` with mocked feature file + test file reads
- [ ] **3.14** Rewrite `cmd/git_pre_commit_test.go` — godog consuming `git-pre-commit.feature`
      with mocked git operations and staged file reads
- [ ] **3.15** Verify `cmd/root_test.go` and `cmd/helpers_test.go` — keep as non-BDD (no
      Gherkin specs for root/helpers); update to use mocked filesystem where applicable
- [ ] **3.16** Run `nx run rhino-cli:test:quick` — all unit tests pass with >=90% coverage

## Phase 4: Verify Integration Tests

Integration tests should already be correct. Verify and adjust if needed.

- [ ] **4.1** Create `cmd/test_coverage_diff.integration_test.go` — godog consuming
      `test-coverage-diff.feature` with real filesystem (this integration test does not exist yet)
- [ ] **4.2** Audit all `*.integration_test.go` files (now 14) — confirm they use real filesystem
      (`os.MkdirTemp`, `os.WriteFile`, etc.) and NOT the mocked package-level vars
- [ ] **4.3** Ensure integration tests use `os.MkdirTemp("", "rhino-*")` consistently for
      `/tmp` fixture creation
- [ ] **4.4** Verify integration test `Before` hooks do NOT install mocks (leave `osReadFile` etc.
      pointing to real `os.ReadFile`)
- [ ] **4.5** Run `nx run rhino-cli:test:integration` — all integration tests pass

## Phase 5: Update Nx Configuration

- [ ] **5.1** Update `apps/rhino-cli/project.json` — add `specs/apps/rhino-cli/**/*.feature` to
      `test:unit` and `test:quick` inputs (ensures cache invalidation on spec changes)
- [ ] **5.2** Verify `test:quick` command does not need changes (already runs `go test ./...` which
      picks up godog in unit tests automatically)
- [ ] **5.3** Run full quality gate: `nx affected -t typecheck lint test:quick` — passes

## Phase 6: Documentation Updates

Update all governance docs and project docs to reflect the new architecture.

- [ ] **6.1** Update `governance/development/quality/three-level-testing-standard.md`:
  - Line 194 (CLI row in applicability table): Change "Go test mocks" to
    "Go test mocks + Gherkin (godog)" for unit column
  - Line 204 (CLI key rules): Update to "Unit + integration mandatory; both consume Gherkin
    specs via Godog; unit uses all-mocked dependencies; integration uses real filesystem with
    `/tmp` fixtures; cacheable"
  - Add CLI-specific subsection under "Per-Backend Implementation Pattern" explaining the
    dual-consumption architecture with mocked vs real I/O
- [ ] **6.2** Update `governance/development/infra/bdd-spec-test-mapping.md`:
  - Lines 20-21 (description): Update to mention CLI unit-level Gherkin consumption
  - Line 98 (section title): Rename "Integration Test to Tag" to "Unit & Integration Test
    to Tag"
  - Lines 100-113: Update code example to show both unit and integration consuming same tag
  - Lines 147-153 ("Adding a New Command"): Add step for creating unit test with godog +
    mocks alongside integration test
  - Add new subsection "CLI Apps: Dual-Level Spec Consumption" explaining how both levels
    consume the same Gherkin with different step implementations
- [ ] **6.3** Update `governance/development/infra/nx-targets.md`:
  - Line 105 (`test:unit` description): Add note about CLI unit tests consuming Gherkin
  - Line 214 (CLI row in mandatory targets table): Update to reflect Gherkin at unit level
  - Line 334 (in-process mocking row): Update description to mention both unit and
    integration use godog
  - Lines 338-346 (Go CLIs section): Rewrite to describe both levels consuming Gherkin
  - Add `specs/apps/rhino-cli/**/*.feature` to the CLI `test:unit` inputs example
- [ ] **6.4** Update `CLAUDE.md`:
  - Line ~231: Update "Three-level testing standard" section to describe CLI Gherkin
    consumption at unit level
  - Line ~225: Update `test:integration` caching description to clarify CLI uses godog at
    both levels
  - Update "test:quick" description to note it now includes Gherkin-consuming unit tests
- [ ] **6.5** Update `specs/apps/rhino-cli/README.md`:
  - Update "Running the Tests" section to describe both unit and integration consuming specs
  - Add unit test example: `go test -v -run TestUnitDoctor ./cmd/...`
  - Update "Adding New Specs" section to include unit test step with mocked dependencies
  - Add "Dual Consumption" section with table: Level | Test File Pattern | Step Implementation
- [ ] **6.6** Update `specs/apps/ayokoding-cli/README.md`:
  - Add "Dual Consumption" section matching rhino-cli specs README pattern
  - Update "Running the Tests" to show both `test:unit` (godog + mocks) and
    `test:integration` (godog + real fs)
  - Update "Adding New Specs" to include unit test with mocked dependencies
- [ ] **6.7** Update `specs/apps/oseplatform-cli/README.md`:
  - Same updates as ayokoding-cli specs README
- [ ] **6.8** Update `apps/rhino-cli/README.md`:
  - Update testing section to describe new dual-consumption architecture
  - Add table showing unit (mocked) vs integration (real) step implementations
- [ ] **6.9** Update `apps/ayokoding-cli/README.md`:
  - Update testing section to describe dual-consumption architecture
- [ ] **6.10** Update `apps/oseplatform-cli/README.md`:
  - Update testing section to describe dual-consumption architecture

## Phase 7: ayokoding-cli Alignment

Apply the same pattern to ayokoding-cli (1 command: `links check`, 4 Gherkin scenarios).

- [ ] **7.1** Create `apps/ayokoding-cli/cmd/testable.go` — package-level vars: `checkLinksFn`
      (wrapping `links.CheckLinks`), `osGetwd`, `osStat`, `osChdir`, plus any other direct
      `os.*` calls in `links_check.go`
- [ ] **7.2** Create `apps/ayokoding-cli/cmd/testable_mock_test.go` — mock helpers for mocked
      link check results and filesystem operations
- [ ] **7.3** Migrate `apps/ayokoding-cli/cmd/links_check.go` — replace `links.CheckLinks()`
      with `checkLinksFn()`, replace direct `os.*` calls with package-level vars
- [ ] **7.4** Verify existing tests still pass: `nx run ayokoding-cli:test:quick`
- [ ] **7.5** Rewrite `apps/ayokoding-cli/cmd/links_check_test.go` — godog consuming
      `links-check.feature` with `@links-check-ayokoding` tag, mocked `checkLinksFn` returning
      canned results; keep non-BDD tests for edge cases not in Gherkin
- [ ] **7.6** Verify `apps/ayokoding-cli/cmd/root_test.go` — keep as non-BDD (no Gherkin
      specs for root command); update to use mocked `osExit` consistently
- [ ] **7.7** Audit `apps/ayokoding-cli/cmd/links-check.integration_test.go` — confirm it
      uses real filesystem and does NOT install mocks; adjust if needed
- [ ] **7.8** Update `apps/ayokoding-cli/project.json` — add
      `{workspaceRoot}/specs/apps/ayokoding-cli/**/*.feature` to `test:unit` and `test:quick`
      inputs
- [ ] **7.9** Run `nx run ayokoding-cli:test:quick` — unit tests pass with >=90% coverage
- [ ] **7.10** Run `nx run ayokoding-cli:test:integration` — integration tests pass

## Phase 8: oseplatform-cli Alignment

Apply the same pattern to oseplatform-cli (1 command: `links check`, 4 Gherkin scenarios).
Note: oseplatform-cli already has `outputLinksJSONFn` as an injectable var — extend the pattern.

- [ ] **8.1** Create `apps/oseplatform-cli/cmd/testable.go` — package-level vars: `checkLinksFn`
      (wrapping `links.CheckLinks`), keep existing `outputLinksJSONFn`, add `osGetwd`, `osStat`,
      `osChdir`, plus any other direct `os.*` calls
- [ ] **8.2** Create `apps/oseplatform-cli/cmd/testable_mock_test.go` — mock helpers
- [ ] **8.3** Migrate `apps/oseplatform-cli/cmd/links_check.go` — replace `links.CheckLinks()`
      with `checkLinksFn()`, replace direct `os.*` calls with package-level vars; preserve
      existing `outputLinksJSONFn` injection
- [ ] **8.4** Verify existing tests still pass: `nx run oseplatform-cli:test:quick`
- [ ] **8.5** Rewrite `apps/oseplatform-cli/cmd/links_check_test.go` — godog consuming
      `links-check.feature` with `@links-check-oseplatform` tag, mocked `checkLinksFn`; keep
      non-BDD tests for JSON error injection and other edge cases
- [ ] **8.6** Verify `apps/oseplatform-cli/cmd/root_test.go` — keep as non-BDD; update to
      use mocked `osExit` consistently
- [ ] **8.7** Audit `apps/oseplatform-cli/cmd/links-check.integration_test.go` — confirm
      real filesystem usage; ensure `checkLinksFn` and `outputLinksJSONFn` are reset to real
      implementations in `before` hook
- [ ] **8.8** Update `apps/oseplatform-cli/project.json` — add
      `{workspaceRoot}/specs/apps/oseplatform-cli/**/*.feature` to `test:unit` and `test:quick`
      inputs
- [ ] **8.9** Run `nx run oseplatform-cli:test:quick` — unit tests pass with >=90% coverage
- [ ] **8.10** Run `nx run oseplatform-cli:test:integration` — integration tests pass

## Phase 9: Cross-App Validation

- [ ] **9.1** Run full quality gate for all three CLI apps:
      `nx run-many -t test:quick test:integration -p rhino-cli ayokoding-cli oseplatform-cli`
- [ ] **9.2** Run `nx affected -t typecheck lint test:quick` — all affected projects pass
- [ ] **9.3** Verify spec-coverage for all three apps:
      `rhino-cli spec-coverage validate specs/apps/rhino-cli apps/rhino-cli` (and equivalents)

## Validation Checklist

### Functional

- [ ] All Gherkin scenarios pass at unit level (godog, mocked deps)
- [ ] All Gherkin scenarios pass at integration level (godog, real fs)
- [ ] Unit test coverage >=90% for rhino-cli
- [ ] No real filesystem I/O in unit tests (verified by code review — no `os.MkdirTemp`,
      `os.WriteFile`, `os.Chdir` in `*_test.go` step definitions)
- [ ] Integration tests use real filesystem (`/tmp` fixtures)
- [ ] Integration tests skip gracefully when optional tools are unavailable
- [ ] `test:quick` passes (includes unit-level Gherkin)
- [ ] `test:integration` passes
- [ ] `nx affected -t typecheck lint test:quick` passes

### Configuration

- [ ] `project.json` `test:unit` inputs include `specs/apps/rhino-cli/**/*.feature`
- [ ] `project.json` `test:quick` inputs include `specs/apps/rhino-cli/**/*.feature`
- [ ] Cache invalidates when Gherkin specs change (verified by modifying a `.feature` file
      and confirming `test:unit` re-runs)

### Documentation

- [ ] `three-level-testing-standard.md` CLI row updated
- [ ] `bdd-spec-test-mapping.md` CLI section updated for dual consumption
- [ ] `nx-targets.md` CLI targets and inputs updated
- [ ] `CLAUDE.md` CLI testing descriptions updated
- [ ] `specs/apps/rhino-cli/README.md` dual consumption documented
- [ ] `specs/apps/ayokoding-cli/README.md` dual consumption documented
- [ ] `specs/apps/oseplatform-cli/README.md` dual consumption documented
- [ ] `apps/rhino-cli/README.md` testing section updated
- [ ] `apps/ayokoding-cli/README.md` testing section updated
- [ ] `apps/oseplatform-cli/README.md` testing section updated

### All CLI Apps

- [ ] `ayokoding-cli` unit tests consume Gherkin with mocked `checkLinksFn`
- [ ] `ayokoding-cli` integration tests use real filesystem
- [ ] `ayokoding-cli` coverage >=90%
- [ ] `oseplatform-cli` unit tests consume Gherkin with mocked `checkLinksFn`
- [ ] `oseplatform-cli` integration tests use real filesystem
- [ ] `oseplatform-cli` coverage >=90%
- [ ] All three CLI apps pass:
      `nx run-many -t test:quick test:integration -p rhino-cli ayokoding-cli oseplatform-cli`
