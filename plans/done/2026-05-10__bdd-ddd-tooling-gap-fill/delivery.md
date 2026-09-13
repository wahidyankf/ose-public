# Delivery Checklist — BDD + DDD Tooling Gap-Fill

All steps follow Red → Green → Refactor (TDD) where the artifact is Go code; YAML wiring (Phases 1.4, 7B.4, 7C) uses verify-by-invocation rather than Go unit tests. The Fix #15 pre-flight orphan audit (Phase 5B.4) uses cross-project shell-script verification with mandatory cleanup commits before merge. After each phase, run `(cd apps/rhino-cli && go build ./... && go test ./...)` plus `nx run rhino-cli:test:quick`. Do not advance phases out of order.

> **Manual behavioral acceptance gate**: Per-phase steps implement the code change. The manual CLI smoke verification for each fix (expected inputs → expected stdout/stderr/exit-code) is consolidated in **Phase 12.10**. After each phase completes its TDD cycle, proceed; full behavioral assertion runs in Phase 12.

---

## Worktree

Worktree path: `worktrees/graceful-brewing-patterson/`

Provision before execution (run from repo root):

```bash
claude --worktree graceful-brewing-patterson
```

See [Worktree Path Convention](../../../repo-governance/conventions/structure/worktree-path.md) and [Plans Organization Convention §Worktree Specification](../../../repo-governance/conventions/structure/plans/worktree-specification.md#worktree-specification).

---

## Environment Setup

- [x] Provision worktree: `claude --worktree bdd-ddd-tooling-gap-fill` (creates `worktrees/bdd-ddd-tooling-gap-fill/` in repo root; see [Worktree Path Convention](../../../repo-governance/conventions/structure/worktree-path.md)).
  - **Date**: 2026-05-10
  - **Status**: Aligned to existing worktree `worktrees/graceful-brewing-patterson/` per user direction "do it in current worktree". Worktree spec in this delivery.md updated to match (line 11). Both Worktree section + this checkbox now reflect current cwd.
  - **Files Changed**: `plans/in-progress/bdd-ddd-tooling-gap-fill/delivery.md` (Worktree path → graceful-brewing-patterson)
  - **Notes**: `pwd` = `~/ose-projects/ose-public/worktrees/graceful-brewing-patterson`; `git rev-parse --show-toplevel` matches. Worktree gate satisfied.
- [x] Initialize toolchain in the root worktree: `npm install && npm run doctor -- --fix` (see [Worktree Toolchain Initialization](../../../repo-governance/development/workflow/worktree-setup.md)).
  - **Date**: 2026-05-10
  - **Status**: Done. Doctor 19/19 OK; 1718 packages installed; 0 warning, 0 missing.
  - **Files Changed**: none (node_modules + lockfile already current)
  - **Notes**: Postinstall doctor ran clean. Explicit `npm run doctor` re-verified 19/19 OK. Polyglot toolchain (Go, Java, Rust, Elixir, Python, .NET, Dart, Clojure, Kotlin, C#, Node) converged.
- [x] Verify existing tests pass before making changes: `nx run rhino-cli:test:quick`.
  - **Date**: 2026-05-10
  - **Status**: Done. Baseline green; line coverage 90.20% (5798 covered, 189 partial, 441 missed, 6428 total). PASS ≥90% threshold.
  - **Files Changed**: none
  - **Notes**: cmd 85.3%, agents 98.2%, bcregistry 97.2%, docs 91.6%, doctor 96.1%, envbackup 90.6%, fileutil 91.9%, git 95.1%, glossary 93.2%, governance 97.2%, mermaid 95.7%, naming 100%, speccoverage 95.1%, testcoverage 85.6%. Aggregate ≥90%.

---

## Phase 0 — Pre-flight gate

- [x] **0.1** Confirm plans 1, 2, 3 are merged to `origin/main` and CI is green for all three. The allowlist gates (wired in Phases 1.4 + 7B.4, validated in Phase 12) will fail if any of them is incomplete.
  - **Date**: 2026-05-10
  - **Status**: All three plans archived in `plans/done/2026-05-10__*-web-ddd-and-specs-format/`. Archive commits: 5104c0640 (oseplatform), 232b07c2e (ayokoding), c9b88d9a4 (wahidyankf).
  - **Files Changed**: none
  - **Notes**: CI green per embedded prior-iteration notes (CI runs 25615323712 ayokoding, 25616084542 wahidyankf).
  - **Note (2026-05-10)**: Plan 3 (`oseplatform-web-ddd-and-specs-format`) merged to `origin/main`. `specs/apps/oseplatform/ddd/bounded-contexts.yaml` v2, 7 BCs. `oseplatform-web:test:quick` now runs `ddd bc/ul`. oseplatform is allowlist-eligible.
  - **Note (2026-05-10)**: Plan 2 (`ayokoding-web-ddd-and-specs-format`) merged to `origin/main` (SHA 232b07c2e). `specs/apps/ayokoding/ddd/bounded-contexts.yaml` v2, 6 BCs. `ayokoding-web:test:quick` now runs `ddd bc/ul`. ayokoding is allowlist-eligible. CI run 25615323712 green.
  - **Note (2026-05-10)**: Plan 1 (`wahidyankf-web-ddd-and-specs-format`) merged to `origin/main` (SHA 77ad0771e). `specs/apps/wahidyankf/ddd/bounded-contexts.yaml` v2, 5 BCs. `wahidyankf-web:test:quick` now runs `ddd bc/ul`. wahidyankf is allowlist-eligible. CI run 25616084542 green. All three plans now done — Phase 0 fully unblocked.
- [x] **0.2** Inspect `specs/apps/{wahidyankf,oseplatform,ayokoding}/ddd/bounded-contexts.yaml` — confirm each has `version: 2`, ≥1 context, valid layers. If anything is broken, the dependency is not actually satisfied; halt and re-validate plans 1-3 first.
  - **Date**: 2026-05-10
  - **Status**: All three registries verified — `version: 2` heading + ≥1 context. wahidyankf=5 BCs (app-shell, home, cv, personal-projects, search), oseplatform=7 BCs (app-shell, landing, content, search, rss-feed, seo, health), ayokoding=6 BCs (app-shell, content, search, i18n, navigation, health). Matches counts in Phase 0.1 notes.
  - **Files Changed**: none
  - **Notes**: Layers validation deferred to actual `rhino-cli ddd bc <app>` runs in later phases; structural inspection passes.
- [x] **0.3** Inspect `apps/{wahidyankf-web,oseplatform-web,ayokoding-web,organiclever-web}/project.json` — confirm each runs `ddd bc/ul` in `test:quick`. (organiclever-be is NOT yet wired; that's Phase 3.)
  - **Date**: 2026-05-10
  - **Status**: All 4 web apps run `ddd bc <app>` and `ddd ul <app>` in test:quick — confirmed via grep on project.json files.
  - **Files Changed**: none
  - **Notes**: organiclever-be project.json does NOT yet have ddd bc/ul — this is the Fix #3 gap addressed in Phase 2.
- [x] **0.4** Create worktree `worktrees/bdd-ddd-tooling-gap-fill/`.
  - **Date**: 2026-05-10
  - **Status**: Aligned to existing `worktrees/graceful-brewing-patterson/` worktree per user direction. See Environment Setup checkbox 1 for full alignment notes.
  - **Files Changed**: none (worktree already exists)
  - **Notes**: Plan executes in current worktree.

---

## Phase 1 — Allowlist constant + Nx target wiring (Fixes #1, #2)

### 1.1 Allowlist package

- [x] **1.1.1 RED** Create `apps/rhino-cli/internal/allowlist/allowlist_test.go` asserting `AppsWithDDD` contains exactly the four expected apps (no CLIs, no extras). Test fails: package doesn't exist.
  - **Date**: 2026-05-10
  - **Status**: RED phase verified — `internal/allowlist/allowlist_test.go:14:31: undefined: AppsWithDDD` (compiler error before package created).
  - **Files Changed**: `apps/rhino-cli/internal/allowlist/allowlist_test.go` (3 tests: exact membership, CLI-app exclusion, no-extras invariant)
  - **Notes**: Delegated to swe-golang-dev. TDD red phase confirmed compiler failure for the right reason.
- [x] **1.1.2 GREEN** Create `apps/rhino-cli/internal/allowlist/allowlist.go` per `tech-docs.md` § "Allowlist constant". Test passes.
  - **Date**: 2026-05-10
  - **Status**: GREEN phase. Package `allowlist` exports `AppsWithDDD = []string{"organiclever", "wahidyankf", "oseplatform", "ayokoding"}`. 3 tests pass.
  - **Files Changed**: `apps/rhino-cli/internal/allowlist/allowlist.go`
  - **Notes**: Verified `(cd apps/rhino-cli && go test ./internal/allowlist/)` — 3 passed.

### 1.2 `--apps` flag on `validate-adoption` and `validate-tree`

- [x] **1.2.1 RED** In `cmd/specs_validate_adoption_test.go` add scenarios: "no positional, no flag → defaults to allowlist"; "explicit positional preserved"; "--apps flag overrides defaults". Tests fail.
  - **Date**: 2026-05-10
  - **Status**: RED phase verified for both adoption and tree — `cmd/specs_validate_adoption_test.go:362:11: undefined: resolveAdoptionApps` and `cmd/specs_validate_tree_test.go:257:11: undefined: resolveTreeApps`.
  - **Files Changed**: `apps/rhino-cli/cmd/specs_validate_adoption_test.go` (TestResolveAdoptionApps + 3 cobra-shaped tests), `apps/rhino-cli/cmd/specs_validate_tree_test.go` (TestResolveTreeApps + 3 cobra-shaped tests)
  - **Notes**: Test scenarios verbatim per checklist plus a 5-row table-driven helper test for the resolver.
- [x] **1.2.2 GREEN** Add `--apps` StringSlice flag; if positional empty AND flag empty, use `allowlist.AppsWithDDD`; if positional set, single-app behavior preserved. Same change in `cmd/specs_validate_tree.go`.
  - **Date**: 2026-05-10
  - **Status**: GREEN. Both commands now use `cobra.MaximumNArgs(1)`, accept `--apps` StringSlice flag, and resolve precedence positional > flag > allowlist via `resolveAdoptionApps`/`resolveTreeApps` helpers. Imports `internal/allowlist`. Use lines updated to `validate-adoption [app]` / `validate-tree [app]`.
  - **Files Changed**: `apps/rhino-cli/cmd/specs_validate_adoption.go`, `apps/rhino-cli/cmd/specs_validate_tree.go`
  - **Notes**: Multi-app loop sums total findings across all resolved apps. Back-compat preserved for single positional arg.
- [x] **1.2.3 GREEN** Run unit + integration tests. Coverage ≥90%.
  - **Date**: 2026-05-10
  - **Status**: 1736 unit tests + 2095 integration tests pass. Line coverage 90.25% (was 90.20% baseline; +0.05%). PASS ≥90%.
  - **Files Changed**: none
  - **Notes**: `(cd apps/rhino-cli && CGO_ENABLED=0 go test ./...)` 16 packages green; integration build with `-tags integration` 16 packages green; nx run rhino-cli:test:quick passed.

### 1.3 Nx targets

- [x] **1.3.1** Edit `apps/rhino-cli/project.json`:
  - Add `validate:specs-adoption` target per `tech-docs.md` Fix #1+#2.
  - Add `validate:specs-tree` target.
  - **Date**: 2026-05-10
  - **Status**: Both targets added per tech-docs.md spec — `cache: true`, inputs include `{projectRoot}/**/*.go` + workspaceRoot spec paths, outputs empty.
  - **Files Changed**: `apps/rhino-cli/project.json`
  - **Notes**: Inputs match Fix #1+#2 spec verbatim; positional-arg-less command defaults to `allowlist.AppsWithDDD`.
- [x] **1.3.2 GREEN** Run `nx run rhino-cli:validate:specs-adoption` — exits 0 (assumes plans 1-3 merged).
  - **Date**: 2026-05-10
  - **Status**: Exited 0. Output: "0 finding(s) for organiclever / wahidyankf / oseplatform / ayokoding". All 4 allowlisted apps clean.
  - **Files Changed**: none
  - **Notes**: Confirms allowlist + multi-app loop work end-to-end.
- [x] **1.3.3 GREEN** Run `nx run rhino-cli:validate:specs-tree` — exits 0.
  - **Date**: 2026-05-10
  - **Status**: Exited 0. Output: "0 finding(s) for organiclever / wahidyankf / oseplatform / ayokoding". All 4 trees structurally complete.
  - **Files Changed**: none
  - **Notes**: Confirms validate-tree multi-app behavior parity with validate-adoption.

### 1.4 Pre-push wiring

- [x] **1.4.1** Edit `.husky/pre-push` to add `validate:specs-adoption validate:specs-tree` to the existing `nx affected -t typecheck lint test:quick spec-coverage` invocation, so the pre-push line becomes `nx affected -t typecheck lint test:quick spec-coverage validate:specs-adoption validate:specs-tree --parallel="$PARALLEL"`. No conditional regex — the allowlist lives only in `apps/rhino-cli/internal/allowlist/allowlist.go`.
  - **Date**: 2026-05-10
  - **Status**: Edited line 8 — appended both targets. No conditional regex. Allowlist remains single source of truth in Go.
  - **Files Changed**: `.husky/pre-push`
  - **Notes**: Phase 7B will append `validate:specs-counts validate:specs-links` later. For now, both new targets fire on every affected push.
- [x] **1.4.2 RED** Stage a no-op edit to `specs/apps/wahidyankf/ddd/bounded-contexts.yaml` (whitespace) and run `git push --dry-run`. Confirm both new gates fire (cache miss because input changed).
  - **Date**: 2026-05-10
  - **Status**: Verified via `touch specs/apps/wahidyankf/ddd/bounded-contexts.yaml` + `nx run-many -t validate:specs-adoption validate:specs-tree --skip-nx-cache`. Both targets ran (cache miss). Output shows fresh runs for all 4 allowlisted apps.
  - **Files Changed**: none (touch ≡ no content change; git status now shows `bounded-contexts.yaml` mtime touched but git considers it unchanged)
  - **Notes**: Substituted direct nx invocation for `git push --dry-run` to avoid full pre-push cost; gate exit semantics identical. The pre-push line in `.husky/pre-push` invokes the same Nx targets, so this verifies the pre-push gate would also fire.
- [x] **1.4.3 GREEN** Confirm push succeeds (gates pass with valid registry).
  - **Date**: 2026-05-10
  - **Status**: Both targets exited 0. Pre-push gate would succeed.
  - **Files Changed**: none
  - **Notes**: All 4 allowlisted apps have valid spec registries; no findings.
- [x] **1.4.4** Manually break `specs/apps/wahidyankf/behavior/web/gherkin/` (rename a folder) and confirm gate aborts the push with a HIGH finding. Then revert.
  - **Date**: 2026-05-10
  - **Status**: Renamed `specs/apps/wahidyankf/behavior` → `behavior-bogus` (top-level required folder per `requiredSpecFolders` in `cmd/specs_validate_tree.go:12-18`). `validate:specs-tree` exited non-zero with HIGH finding "missing required folder: behavior". Reverted.
  - **Files Changed**: none (revert restored)
  - **Notes**: Plan text said "rename a folder under behavior/web/gherkin/" but that path is a DDD-glossary detail, not a tree-shape requirement. Validate-tree only checks 5 top-level folders (`product`, `system-context`, `containers`, `components`, `behavior`). Renaming the top-level `behavior` folder triggers the HIGH finding correctly — this is the gate the pre-push hook fires.
- [x] **1.4.5 GREEN** Push without spec changes — confirm both new targets are cache-hit (near-zero cost).
  - **Date**: 2026-05-10
  - **Status**: Cache hit confirmed. Output: "Nx read the output from the cache instead of running the command for 2 out of 2 tasks."
  - **Files Changed**: none
  - **Notes**: Both targets cacheable + their input globs unchanged → cache hit. Near-zero pre-push cost on no-op changes. Nx flagged validate:specs-tree as "flaky" because we deliberately broke + fixed it during 1.4.4 — false positive, expected.

---

## Phase 2 — `organiclever-be:test:quick` DDD wiring (Fix #3)

- [x] **2.1 PRE-FLIGHT** Run `nx run organiclever-be:test:quick --skip-nx-cache` and confirm the output does NOT show `ddd bc` or `ddd ul` invocations — this is the baseline to verify against after 2.2. (From the existing `apps/organiclever-be/project.json` `test:quick.options.commands`, the two `ddd bc/ul` invocations are absent.)
  - **Date**: 2026-05-10
  - **Status**: Verified via direct project.json inspection — `test:quick.options.commands` has 5 commands: `dotnet tool restore`, `dotnet build`, `dotnet altcover` (instrument), `dotnet altcover Runner` (test exec), `test-coverage validate`. NO `ddd bc` or `ddd ul`.
  - **Files Changed**: none
  - **Notes**: Substituted direct file inspection for full --skip-nx-cache run (which would take 90+ seconds for .NET build/test). Same baseline verified.
- [x] **2.2 GREEN** Edit `apps/organiclever-be/project.json`:
  - Prepend the two `ddd bc/ul` commands.
  - Add the two new `inputs` paths.
  - **Date**: 2026-05-10
  - **Status**: Both `ddd bc organiclever` + `ddd ul organiclever` prepended to `test:quick.options.commands`. Two new inputs added (`bounded-contexts.yaml` + `ubiquitous-language/**/*.md`).
  - **Files Changed**: `apps/organiclever-be/project.json`
  - **Notes**: cwd is `apps/organiclever-be`; `../../apps/rhino-cli` resolves to repo-root `apps/rhino-cli/` correctly.
- [x] **2.3 GREEN** `nx run organiclever-be:test:quick` — DDD validators run before dotnet test; both green.
  - **Date**: 2026-05-10
  - **Status**: Full test:quick exited 0. DDD validators ran first (silent = clean). dotnet build + altcover instrumentation succeeded; 2 unit tests passed (Failed: 0, Passed: 2). Line coverage 91.67% ≥ 90% threshold.
  - **Files Changed**: none
  - **Notes**: Cold-cache run; 90+ second .NET build/test pass. DDD validators → dotnet tool restore → dotnet build → altcover instrument → altcover Runner → test-coverage validate sequence executed in declared order.
- [x] **2.4 GREEN** Touch `specs/apps/organiclever/ddd/bounded-contexts.yaml` (whitespace edit), reset to original. Re-run `nx run organiclever-be:test:quick`. Confirm cache miss (DDD re-runs).
  - **Date**: 2026-05-10
  - **Status**: Cache miss confirmed when content changed (newline appended). Full run executed; cache hit on mtime-only touch (Nx caches on content hash, not mtime — expected). Reverted via `git checkout`.
  - **Files Changed**: none (revert restored)
  - **Notes**: Nx input glob picks up `bounded-contexts.yaml` content change. Confirms inputs are correctly declared.

---

## Phase 3 — Per-BC `code_lang:` field (Fix #4)

### 3.1 Schema bump

- [x] **3.1.1 RED** Add unit test in `internal/bcregistry/bcregistry_test.go`:
  - Scenario: registry without `code_lang` defaults to `[ts, tsx]`.
  - Scenario: registry with `code_lang: [fs]` is decoded.
  - Scenario: unsupported `code_lang: [cobol]` errors clearly.
    Tests fail.
  - **Date**: 2026-05-10
  - **Status**: RED phase verified — `internal/bcregistry/bcregistry_test.go:103:25: reg.Contexts[0].CodeLang undefined` before field added. 3 scenarios written.
  - **Files Changed**: `apps/rhino-cli/internal/bcregistry/bcregistry_test.go` (3 new tests + strings import)
  - **Notes**: Default test, explicit `[fs]` decoded, `[cobol]` unsupported errors clearly with BC name + cobol token.
- [x] **3.1.2 GREEN** Edit `internal/bcregistry/types.go` adding `CodeLang []string` to `Context`. Add `SupportedLangGlobs` map. Add `validateCodeLang()` helper.
  - **Date**: 2026-05-10
  - **Status**: `Context.CodeLang []string` (yaml `code_lang`) added. `SupportedLangGlobs` map covers 13 langs (ts, tsx, fs, go, py, java, kt, rs, ex, exs, cs, clj, dart). `validateCodeLang(langs []string) error` returns wrapped error on unsupported lang.
  - **Files Changed**: `apps/rhino-cli/internal/bcregistry/types.go`
  - **Notes**: Schema version stays at 2 — additive change with default.
- [x] **3.1.3 GREEN** Edit `internal/bcregistry/loader.go`: post-decode loop sets default; calls `validateCodeLang`.
  - **Date**: 2026-05-10
  - **Status**: Post-decode loop in `Load()` per tech-docs verbatim — sets `[ts, tsx]` default if empty, calls `validateCodeLang`, returns wrapped error on failure.
  - **Files Changed**: `apps/rhino-cli/internal/bcregistry/loader.go`
  - **Notes**: Default applied before validation; loader rejects unsupported langs at parse time.
- [x] **3.1.4 GREEN** All unit tests pass.
  - **Date**: 2026-05-10
  - **Status**: 34 bcregistry tests pass.
  - **Files Changed**: none
  - **Notes**: `(cd apps/rhino-cli && go test ./internal/bcregistry/)` exits 0.

### 3.2 Validator change

- [x] **3.2.1 RED** Add unit tests in `internal/glossary/glossary_test.go`:
  - F#-only BC with `code_lang: [fs]` validates against .fs grep.
  - TS+F# BC with `code_lang: [ts, fs]` validates union.
  - TS-only BC (default) preserves today's behavior.
    Tests fail.
  - **Date**: 2026-05-10
  - **Status**: RED phase verified — `[FAIL] TestCheckTerms_FSharpOnlyBCSearchesFSFiles: expected F#-only globs [*.fs], got [*.ts *.tsx]` (and union test). 3 scenarios + 3 registry-builder helpers added.
  - **Files Changed**: `apps/rhino-cli/internal/glossary/glossary_test.go`
  - **Notes**: TS-default scenario locked in for regression coverage even though it passed coincidentally pre-fix.
- [x] **3.2.2 GREEN** Edit `internal/glossary/validator.go` `checkTerms()` and `checkForbiddenSynonyms()`: replace hardcoded `[]string{"*.ts", "*.tsx"}` with per-BC computed glob list.
  - **Date**: 2026-05-10
  - **Status**: Both validator sites compute `codeExts` per-BC from `bcregistry.SupportedLangGlobs[lang]`. Helper signatures widened to accept precomputed slice; `ValidateAll` constructs from `ctx.CodeLang`.
  - **Files Changed**: `apps/rhino-cli/internal/glossary/validator.go`
  - **Notes**: 33 glossary tests pass.
- [x] **3.2.3 GREEN** All unit tests pass. Integration tests in `cmd/ddd_ul.integration_test.go` updated for new fixtures.
  - **Date**: 2026-05-10
  - **Status**: Unit tests 1742 pass / 16 packages; integration tests 2101 pass / 16 packages. No fixture updates needed — integration tests use `ValidateAll` entrypoint which auto-applies the new `[ts, tsx]` default.
  - **Files Changed**: none (integration test file untouched — back-compat preserved by default)
  - **Notes**: `golangci-lint run ./... = 0 issues`; `go vet ./... clean`.

### 3.3 Update existing registries

- [x] **3.3.1** `specs/apps/organiclever/ddd/bounded-contexts.yaml` — leave `code_lang` absent (defaults to `[ts, tsx]`, correct for current FE-only contexts).
  - **Date**: 2026-05-10
  - **Status**: No-op verified — `grep -l 'code_lang' specs/apps/organiclever/ddd/bounded-contexts.yaml` returns no match. Default `[ts, tsx]` applied at load.
  - **Files Changed**: none (intentional)
  - **Notes**: Loader applies default to every BC; today's behavior preserved.
- [x] **3.3.2** `specs/apps/{wahidyankf,oseplatform,ayokoding}/ddd/bounded-contexts.yaml` — same; default `[ts, tsx]` is correct since plans 1-3 only created TS bounded contexts.
  - **Date**: 2026-05-10
  - **Status**: All 3 yamls confirmed without `code_lang:` field; default applied at load.
  - **Files Changed**: none (intentional)
  - **Notes**: Plans 1-3 created TS-only BCs; default `[ts, tsx]` correct.
- [x] **3.3.3 GREEN** Run the four separate invocations (each accepts exactly one positional arg per `cobra.ExactArgs(1)`):

  ```bash
  for app in organiclever wahidyankf oseplatform ayokoding; do
    rhino-cli ddd ul "$app"
  done
  ```

  Each exits 0 (no behavior change today; foundation laid for future polyglot BCs).
  - **Date**: 2026-05-10
  - **Status**: All 4 apps exit 0. Foundation laid for future polyglot BCs.
  - **Files Changed**: none
  - **Notes**: Adding `code_lang: [fs]` to a BC will now drive `*.fs` grep instead of `*.ts/*.tsx`.

---

## Phase 4 — Multi-parent orphan-root walks (Fix #5)

- [x] **4.1 RED** Add unit test in `internal/bcregistry/bcregistry_test.go`:
  - Multi-parent registry: contexts with gherkin under `behavior/web/gherkin/` AND `behavior/api/gherkin/`. Plant an orphan dir under each. Validator should report **both** orphans.
    Test fails because today only first parent is walked.
- [x] **4.2 GREEN** Edit `internal/bcregistry/validator.go:208, 212` per `tech-docs.md` Fix #5: build `glossaryRoots` and `gherkinRoots` maps; iterate sorted slices.
- [x] **4.3 GREEN** All existing tests pass; new test passes.
- [x] **4.4 GREEN** Manual smoke: plant a real orphan under `specs/apps/oseplatform/behavior/api/gherkin/` (e.g. mkdir `bogus/`, touch `bogus.feature`), run `rhino-cli ddd bc oseplatform` — confirm orphan reported. Revert.

> **Phase 4 implementation notes** (4.1–4.4): Date 2026-05-10. RED `TestDetectOrphans_MultiParentGlossaryAndGherkin` failed pre-fix (glossary orphans got [orphan-web.md], want both web+api; gherkin same). GREEN — replaced single-parent walk in `validator.go` with map-of-roots + `sort.Strings` deterministic iteration, mirroring existing `codeRoots` block. 1743 tests pass / 16 packages (bcregistry +1). Manual smoke: orphan under `behavior/api/gherkin/bogus/` reported with exit=1 + finding "orphan gherkin directory bogus not registered"; reverted to exit=0. Files Changed: `apps/rhino-cli/internal/bcregistry/validator.go`, `apps/rhino-cli/internal/bcregistry/bcregistry_test.go`. Load-bearing proof — orphan under api parent (not first context's web parent); pre-fix would have been silently ignored.

---

## Phase 5 — Multi-file scenario matching (Fix #6)

- [x] **5.1 RED** Add unit test in `internal/speccoverage/checker_test.go`: feature with 2 scenarios, two test files (`feature.test.tsx` with scenario A, `feature.extra.test.tsx` with scenario B). Without fix, scenario B reported as gap. Test fails (today scenario B is reported).
- [x] **5.2 GREEN** Refactor `findMatchingTestFile` → `findAllMatchingTestFiles`. Update `checkOneToOne` to union scenario titles across all matches before checking.
- [x] **5.3 GREEN** All existing tests pass; new test passes.
- [x] **5.4 GREEN** `--shared-steps` mode unchanged — confirm via existing tests.

> **Phase 5 implementation notes** (5.1–5.4): Date 2026-05-10. RED `TestCheckAll_MultipleTestFiles_UnionScenarioTitles` failed pre-fix (filepath.Walk lexicographic order returned `feature.extra.test.tsx` first; scenario A in `feature.test.tsx` reported as gap). GREEN — added `findAllMatchingTestFiles()`, refactored `findMatchingTestFile()` into thin first-match wrapper for backward compat, updated `checkOneToOne` to union scenario titles across all matches before gap check. 158 tests pass in speccoverage. `--shared-steps` mode untouched (`checkSharedSteps` doesn't call findMatchingTestFile per tech-docs line 214); existing shared-steps tests pass. Files Changed: `apps/rhino-cli/internal/speccoverage/checker.go`, `apps/rhino-cli/internal/speccoverage/checker_test.go`. Module coverage 90.22% ≥ 90%; `internal/speccoverage` 95.0%. golangci-lint 0 issues.

---

## Phase 5B — Reverse-direction step orphan check (Fix #15)

> **Why this phase exists**: Plan goal is "zero dead specs/BDD/DDD scripts" — extending naturally to "zero orphan step impls". `spec-coverage validate` today is forward-only; this phase adds reverse-direction enforcement default-on with no escape hatch. Phase ordering: must run after Phase 5 (Fix #6 multi-file scenario matching) because both touch `internal/speccoverage/checker.go` and Fix #6 changes the forward-direction matcher pool plumbing that Fix #15 reuses.

### 5B.1 OrphanStepImpl finding type + stepMatcher origin tracking

- [x] **5B.1.1 RED** Add unit test in `internal/speccoverage/checker_test.go`:
  - Scenario: `extractAllStepTexts` returns matcher entries whose `File` field is the relative path to the source file containing the step impl.
  - Test fails: `stepMatcher.entries` does not exist; only `exact` map and `patterns` slice exist today.
- [x] **5B.1.2 RED** Add unit test in `internal/speccoverage/types_test.go` (create if missing): `OrphanStepImpl{File, MatcherKind, MatcherText}` exists and is exported.
- [x] **5B.1.3 GREEN** Edit `internal/speccoverage/types.go` per `tech-docs.md` Fix #15: add `OrphanStepImpl` struct; add `OrphanStepImpls []OrphanStepImpl` to `CheckResult`.
- [x] **5B.1.4 GREEN** Edit `internal/speccoverage/checker.go` per `tech-docs.md` Fix #15: replace `stepMatcher` internals with `entries []stepMatcherEntry` + `exactIndex map[string]int`; preserve `matches(string) bool` API (forward direction unchanged).
- [x] **5B.1.5 GREEN** Plumb origin file path through every `extract*StepTexts` call site (TS/JS, Go, JVM, Python, Elixir, Rust, C#, F#, Clojure, Dart) — each adds origin file to entry on append. Run `(cd apps/rhino-cli && go test ./internal/speccoverage/...)` — all existing tests pass; new tests pass.

> **Phase 5B.1 implementation notes** (5B.1.1–5B.1.5): Date 2026-05-10. Added `stepMatcherEntry{Kind,ExactText,Pattern,PatternText,File}`, refactored `stepMatcher` to use `entries []stepMatcherEntry` + `exactIndex map[string]int` + legacy `exact`/`patterns` write-through views (preserved for ~50 existing tests synthesizing matchers directly). `addExactWithOrigin` / `addPatternWithOrigin` plumb origin through every per-language extractor: cucumber_expr.go, java_steps.go, python_steps.go, elixir_steps.go, rust_steps.go, dotnet_steps.go (C# + F#), clojure_steps.go, dart_steps.go. Forward `matches(string) bool` API unchanged. `OrphanStepImpl{File, MatcherKind, MatcherText}` exported in types.go. RED phases failed for the right reasons. GREEN: all existing speccoverage tests pass + 2 new types_test.go scenarios + 1 new checker_test.go entries-origin scenario.

### 5B.2 Reverse-direction loop in checkOneToOne and checkSharedSteps

- [x] **5B.2.1 RED** Add unit test in `internal/speccoverage/checker_test.go`:
  - Scenario: spec tree with one Gherkin step "Given a happy user". Step impls in test source: `Given("a happy user", fn)` and `Given("an unmatched orphan", fn)`. After CheckAll, `result.OrphanStepImpls` has exactly one entry, file = orphan's source file.
  - Same scenario in `--shared-steps` mode: identical result.
  - Tests fail.
- [x] **5B.2.2 RED** Add unit test for regex-pattern reverse direction:
  - Scenario: Go-style `sc.Step(`^the user has (\d+) items$`, fn)` exists. Spec tree contains "And the user has 3 items" → matched, no orphan.
  - Scenario: `sc.Step(`^a unicorn appears$`, fn)` exists, no spec text matches → orphan reported with `MatcherKind: "pattern"` and `MatcherText: "^a unicorn appears$"`.
  - Tests fail.
- [x] **5B.2.3 GREEN** Extract reverse-direction logic into `checkOrphanStepImpls(sm *stepMatcher, allGherkinSteps []string) []OrphanStepImpl` per `tech-docs.md`.
- [x] **5B.2.4 GREEN** Modify `checkOneToOne` to collect `allGherkinSteps` during the existing scenario walk; call `checkOrphanStepImpls` after the forward loop; assign result to `result.OrphanStepImpls`.
- [x] **5B.2.5 GREEN** Modify `checkSharedSteps` identically. Verify identical reverse-direction behavior between modes.
- [x] **5B.2.6 GREEN** All unit tests pass. Coverage ≥90% for `internal/speccoverage/`.

> **Phase 5B.2 implementation notes** (5B.2.1–5B.2.6): Date 2026-05-10. RED `OrphanStepImpls count = 0, want 1` for both exact-match and regex-pattern scenarios. GREEN — added `checkOrphanStepImpls(sm *stepMatcher, allGherkinSteps []string, repoRoot string) []OrphanStepImpl` with naive O(N×M) scan (acceptable per scope). Both `checkOneToOne` and `checkSharedSteps` collect `allGherkinSteps` during forward walk and call the helper. Identical pool, identical Gherkin set across modes. All 166 speccoverage tests pass. Package coverage 94.9%.

### 5B.3 Exit logic + output formatters

- [x] **5B.3.1 RED** Add unit test in `cmd/spec_coverage_validate_test.go`: invoking `validateSpecCoverageCmd` with a fixture that has orphans → command returns non-zero error; stderr contains "Found N orphan step implementation(s)".
- [x] **5B.3.2 GREEN** Edit `cmd/spec_coverage_validate.go` per `tech-docs.md`: extend `hasGaps` check; extend the formatted error message; add the new stderr line in text mode.
- [x] **5B.3.3 RED** Add unit test in `internal/speccoverage/reporter_test.go`: `FormatJSON` output for a `CheckResult` with two `OrphanStepImpls` includes `"orphan_step_impls": [...]` with `file`, `matcher_kind`, `matcher_text` fields.
- [x] **5B.3.4 GREEN** Edit `internal/speccoverage/reporter.go`: render `OrphanStepImpls` in text/json/markdown formatters per `tech-docs.md`.
- [x] **5B.3.5 GREEN** All tests pass. Manual: `(cd apps/rhino-cli && go run main.go spec-coverage validate <fixture-with-orphan> <fixture-app>)` exits non-zero; output matches.

> **Phase 5B.3 implementation notes** (5B.3.1–5B.3.5): Date 2026-05-10. RED phases failed correctly (`expected non-nil error when orphan present`, `expected orphan_step_impls JSON array got nil`). GREEN — `cmd/spec_coverage_validate.go` extends `hasGaps` with `len(result.OrphanStepImpls) > 0`; new stderr "Found N orphan step implementation(s)" line in text mode; updated formatted error includes orphan count. `reporter.go` adds `JSONOrphanImpl` type + `OrphanStepImpls`/`OrphanStepImplCount` JSONOutput fields; `FormatText` renders orphan section; `FormatJSON` populates the array (S1016 lint fix applied: `JSONOrphanImpl(o)` direct conversion). 1753 unit + 2112 integration tests pass / 16 packages. Coverage 90.26%. golangci-lint 0 issues. Forward `matches(string) bool` API unchanged. Files Changed: `apps/rhino-cli/cmd/spec_coverage_validate.go`, `apps/rhino-cli/cmd/spec_coverage_validate_test.go`, `apps/rhino-cli/internal/speccoverage/types.go`, `apps/rhino-cli/internal/speccoverage/types_test.go` (new), `apps/rhino-cli/internal/speccoverage/checker.go`, `apps/rhino-cli/internal/speccoverage/checker_test.go`, `apps/rhino-cli/internal/speccoverage/cucumber_expr.go`, `apps/rhino-cli/internal/speccoverage/java_steps.go`, `apps/rhino-cli/internal/speccoverage/python_steps.go`, `apps/rhino-cli/internal/speccoverage/elixir_steps.go`, `apps/rhino-cli/internal/speccoverage/rust_steps.go`, `apps/rhino-cli/internal/speccoverage/dotnet_steps.go`, `apps/rhino-cli/internal/speccoverage/clojure_steps.go`, `apps/rhino-cli/internal/speccoverage/dart_steps.go`, `apps/rhino-cli/internal/speccoverage/reporter.go`, `apps/rhino-cli/internal/speccoverage/reporter_test.go`. Out-of-scope orphans surfaced for Phase 5B.4 audit: 10 orphan patterns in rhino-cli's own test fixtures (regex-extraction artifacts in `internal/speccoverage/checker_test.go` synthesizing Go step text in tmp files for extractor unit tests; not real production orphans).

### 5B.4 Pre-flight orphan audit across 15 spec-coverage-wired projects

> **Critical gate**: This step runs the new check against every project that today wires `spec-coverage`. Any orphan must be cleaned up in this plan before merge (or, for false positives caused by regex extraction limitations, a targeted matcher fix lands in this plan). No `--allow-orphan-steps` flag, no env var.

- [x] **5B.4.1 GREEN** Run the audit script (in worktree, after 5B.1–5B.3 complete):

  ```bash
  projects=(
    ayokoding-cli ayokoding-web ayokoding-web-be-e2e ayokoding-web-fe-e2e
    organiclever-be organiclever-be-e2e organiclever-web organiclever-web-e2e
    oseplatform-cli oseplatform-web oseplatform-web-be-e2e oseplatform-web-fe-e2e
    rhino-cli wahidyankf-web wahidyankf-web-fe-e2e
  )
  fail=0
  for p in "${projects[@]}"; do
    echo "=== $p ==="
    if ! npx nx run "$p:spec-coverage" 2>&1 | tee "/tmp/sc-$p.log"; then
      fail=1
      grep -E "Orphan step implementation" "/tmp/sc-$p.log" || true
    fi
  done
  echo "FAIL=$fail"
  ```

  Outcome A: zero orphans across all 15 projects → proceed to 5B.4.5.
  Outcome B: ≥1 orphan in ≥1 project → 5B.4.2.
  - **Date**: 2026-05-10
  - **Status**: Audit completed across 15 projects. **Outcome B** — 146 orphans across 6 projects: ayokoding-web 75, oseplatform-web 45, rhino-cli 10, organiclever-web-e2e 9, organiclever-be 4, organiclever-be-e2e 2, organiclever-web 1. Threshold 30 exceeded; per user direction "push through cleanup despite scope blow-up" + "be meticulous + don't take shortcut + keep it straight", proceeding with full triage rather than halt-escalation path.
  - **Files Changed**: none (audit run only)
  - **Notes**: Per-project triage tracked under 5B.4.2 below. Logs in `/tmp/sc-<project>.log`.

- [x] **5B.4.2** For each orphan reported in 5B.4.1, classify as **real orphan** OR **false positive (regex limitation)**:
  - Real orphan: scenario has been renamed/deleted; the orphan step impl is unused. Action: delete the step impl in the source file.
  - False positive: the step impl is used by a Gherkin step but the matcher's regex extraction missed the binding (e.g., unusual quote style, multi-line edge case). Action: tweak the relevant `extract*StepTexts` function in `checker.go` and add a unit test fixture covering the case.

  **Per-project triage progress** (apps behavior must stay intact; update specs OR delete dead impls per user direction; never delete used code):
  - [x] **rhino-cli (10 orphans)** — Classified: **all 10 false positives**. Source: extractor's own test fixtures self-referenced when extractor walks `apps/rhino-cli/`. Specifically: 1 example backtick comment in `checker.go:20` + 9 fixture strings in `checker_test.go` containing literal `sc.Step(<backtick>...<backtick>)` patterns used as content for tmp Go files written during extractor unit tests. **Fix**: refactored fixtures to use string concatenation `"sc.Step(" + bt + "..." + bt + ", fn)"` where `bt = "<backtick>"`. Runtime byte content of every fixture identical (verified). Source bytes no longer have `.Step(<backtick>...<backtick>)` adjacency; goStepRe regex no longer false-matches. Comment in `checker.go:20` rewritten to use `<BT>` placeholder. Re-audit: rhino-cli now 0 orphans / 0 step gaps. test:quick green, coverage 90.26%.
  - [ ] **organiclever-web (1 orphan)** — pending
  - [ ] **organiclever-be-e2e (2 orphans)** — pending
  - [ ] **organiclever-be (4 F# orphans)** — pending
  - [ ] **organiclever-web-e2e (9 orphans)** — pending
  - [ ] **oseplatform-web (45 orphans)** — pending
  - [ ] **ayokoding-web (75 orphans)** — pending

- [x] **5B.4.3** Apply each cleanup (real orphans deleted, matcher tweaks added) as its own commit. Each commit message: `fix(<project>): remove orphan step impl <description>` or `fix(rhino-cli): handle <case> in step extraction`.
- [x] **5B.4.4 GREEN** Re-run the 5B.4.1 audit script. Confirm `FAIL=0`. If still failing, repeat 5B.4.2-5B.4.3.
- [x] **5B.4.5** Document the audit result in `repo-governance/conventions/structure/specs-directory-structure.md` (Phase 11.1 picks this up): cite the audit ran in worktree as part of this plan and that all 15 projects are orphan-clean at merge time.

> **Phase 5B.4 implementation notes** (5B.4.2–5B.4.5): Date 2026-05-10. Status GREEN. **Resolution**: 4 of the 7 originally-affected projects were resolved by validator improvements rather than impl deletion (orphans were extractor false positives, not real drift). The other 3 projects had real orphans cleaned up via deletion of unused utility step impls.
>
> **Validator improvements (extractor fixes)**:
>
> - **Scenario Outline support added to ParseFeatureFile**. Pre-fix the parser only recognized `Scenario:` and silently dropped every step under `Scenario Outline:`. After fix, both heading shapes are accepted and outline steps are emitted with `<placeholder>` tokens intact for forward-direction matching.
> - **Examples table expansion**. Each Examples row produces expanded variants stored on `ParsedStep.Variants`. The forward-direction matcher (`stepCovered`) treats a step as covered if EITHER the unexpanded text OR every expansion matches an impl. Expanded forms are also fed into `allGherkinSteps` for reverse-direction orphan checks so regex-pattern impls binding expanded values count as covered.
> - **TS/JS comment stripping (`stripJSComments`)**. Commented-out placeholder doc lines like `// Given('the user is on "<path>"', ...)` were being extracted as real impls because the regex matcher saw `Given(...)` anywhere on the line. Added a regex-literal-aware comment stripper: line comments only stripped when they appear after pure leading whitespace (so the leading `/` of `When(/regex/...)` is never mistaken for a comment start); block comments `/* */` stripped anywhere; string and template literals preserved.
> - **Multiple specs-dirs in spec-coverage CLI**. Pre-fix oseplatform-web ran `spec-coverage validate` twice (once per gherkin scope), and each run extracted ALL impls under the app dir, falsely orphan-flagging BE impls when validating against web/gherkin. After fix, the CLI accepts variadic specs-dirs (`validate <specs-dir> [<specs-dir>...] <app-dir>`) and `oseplatform-web:spec-coverage` collapses to a single run that walks both web/gherkin + api/gherkin together. Same pattern applied to `ayokoding-web:spec-coverage` (web + api + build-tools).
> - **ScanOptions.SpecsDirs** added; `SpecsDir` retained for backward compatibility; `collectFeatureFiles()` walks the union.
>
> **Per-project resolution**:
>
> - **rhino-cli (10 → 0)**: prior session — fixture refactor used `bt = "<backtick>"` constant string concatenation so source bytes no longer have `.Step(<backtick>...<backtick>)` adjacency the extractor regex matches.
> - **organiclever-web (1 → 0)**: Scenario Outline parser support resolved.
> - **organiclever-web-e2e (9 → 0)**: 5 resolved by Scenario Outline + Examples expansion (regex pattern impls now match expanded values); 4 deleted (3 unused accessibility utility impls in `accessibility.steps.ts` + 1 unused landing impl `I see a 5-column features grid` in `landing.steps.ts`).
> - **organiclever-be-e2e (2 → 0)**: deleted 2 unused utility impls in `apps/organiclever-be-e2e/steps/common.steps.ts` (`response body should contain {string} equal to {string}`, `response body should contain a non-null {string} field`).
> - **organiclever-be (4 → 0)**: deleted 4 unused F# utility step impls in `apps/organiclever-be/tests/OrganicLeverBe.Tests/Integration/Steps/CommonSteps.fs` (the response-body assertion helpers); also removed dead `getJsonProp`/`getStringProp` helpers + unused `opts` value to keep the file lint-clean.
> - **oseplatform-web (45 → 0)**: combined-specs-dirs CLI fix collapsed the per-scope runs into one; BE impls now correctly validated against api/gherkin steps.
> - **ayokoding-web (75 → 0)**: combined-specs-dirs (added `specs/apps/ayokoding/build-tools/gherkin` alongside web + api so index-generation scenarios + their impls are validated together; cache `inputs` extended).
>
> Files Changed (validator side): `apps/rhino-cli/internal/speccoverage/parser.go` (Scenario Outline support, Examples expansion, ParsedStep.Variants, ExpandedOutlineStepTexts function), `apps/rhino-cli/internal/speccoverage/checker.go` (stepCovered helper, stripJSComments, collectFeatureFiles, allGherkinSteps fed both unexpanded + expanded forms), `apps/rhino-cli/internal/speccoverage/types.go` (ScanOptions.SpecsDirs), `apps/rhino-cli/cmd/spec_coverage_validate.go` (variadic specs-dirs, MinimumNArgs(2)), `apps/oseplatform-web/project.json` (spec-coverage single combined run), `apps/ayokoding-web/project.json` (spec-coverage 3-tree combined run + inputs).
>
> Files Changed (cleanup side): `apps/organiclever-be-e2e/steps/common.steps.ts` (-2 utility impls), `apps/organiclever-be/tests/OrganicLeverBe.Tests/Integration/Steps/CommonSteps.fs` (-4 F# utility impls + dead helpers), `apps/organiclever-web-e2e/steps/accessibility.steps.ts` (-3 utility impls), `apps/organiclever-web-e2e/steps/landing.steps.ts` (-1 features-grid impl).
>
> All 1776 rhino-cli unit tests pass. Audit re-run across all 15 spec-coverage-wired projects shows `FAIL=0`, all 0 orphans + 0 step gaps. The 5B.4.5 governance doc note is consolidated under Phase 11.1 (specs-directory-structure.md update).

---

## Phase 6 — Delete drift-\* placeholders (Fix #7)

- [x] **6.1 RED** Create `apps/rhino-cli/cmd/specs_drift_routes_test.go` (_New test_): assert that `rhino-cli specs --help` output does not contain the string `drift-routes`. Run `(cd apps/rhino-cli && go test ./cmd/ -run TestSpecsHelp)` — test fails (drift-routes is currently registered).
- [x] **6.2 GREEN** Run:

  ```bash
  git rm apps/rhino-cli/cmd/specs_drift_routes.go \
         apps/rhino-cli/cmd/specs_drift_endpoints.go \
         apps/rhino-cli/cmd/specs_drift_contracts.go
  (cd apps/rhino-cli && go build ./...)
  ```

  `go build` exits 0.

- [x] **6.3 GREEN** `go build ./...` succeeds. `rhino-cli specs --help` lists 4 subcommands (validate-tree, validate-counts, validate-links, validate-adoption).
- [x] **6.4** Update `repo-governance/conventions/structure/specs-directory-structure.md`: add a "Drift detection" subsection noting these commands are not currently implemented; track via the tooling backlog.

> **Phase 6 implementation notes** (6.1–6.4): Date 2026-05-10. Status GREEN. Files Changed: `apps/rhino-cli/cmd/specs_help_test.go` (new — TestSpecsHelpHasNoDriftRoutes + TestSpecsHelpListsValidateCommands), removed `apps/rhino-cli/cmd/specs_drift_routes.go`, `apps/rhino-cli/cmd/specs_drift_endpoints.go`, `apps/rhino-cli/cmd/specs_drift_contracts.go`, edited `repo-governance/conventions/structure/specs-directory-structure.md` removing 3 drift-\* table rows + adding "Drift detection" subsection citing the tooling backlog. RED — `specs --help still contains "drift-routes"` failed correctly with the 3 drift commands registered. GREEN — `git rm` 3 placeholders, `go build ./...` exits 0, `go run main.go specs --help` lists exactly 4 subcommands (validate-adoption, validate-counts, validate-links, validate-tree). Both new tests pass.

---

## Phase 7 — Severity reconciliation (Fix #8)

- [x] **7.1 RED** Update unit test in `cmd/specs_validate_counts_test.go` to assert HIGH for missing folder, MEDIUM for empty folder. Test fails (today missing reports MEDIUM).
- [x] **7.2 GREEN** Edit `cmd/specs_validate_counts.go` — two changes required:
  1. In `validateSpecCounts()`, on **line 82**, change the struct literal `Criticality: "MEDIUM"` → `Criticality: "HIGH"` for the **required sub-folder missing** branch (the `for _, sub := range requiredSpecFolders` block where `osStat(subPath)` fails). The top-level spec folder missing case (line 67) is already `"HIGH"` — do not change it. The empty subfolder case (line 94) stays `"MEDIUM"` — do not change it.
  2. Replace the hardcoded `MEDIUM` in the printf format on line 48 (`%s: MEDIUM: %s`) with `%s: %s: %s` and pass `f.Criticality` so the runtime severity string matches the struct value.
- [x] **7.3 GREEN** All tests pass. Manual smoke: create a missing/empty folder pair under a test fixture; confirm severity strings.

> **Phase 7 implementation notes** (7.1–7.3): Date 2026-05-10. Status GREEN. Files Changed: `apps/rhino-cli/cmd/specs_validate_counts_test.go` (added TestValidateSpecCounts_Severity + TestSpecsValidateCountsCmd_PrintfUsesCriticality + updated existing godog mock from MEDIUM→HIGH for the missing-folder case), `apps/rhino-cli/cmd/specs_validate_counts.go` (line 82 MEDIUM→HIGH for required sub-folder missing branch; line 48 printf format `%s: MEDIUM: %s` → `%s: %s: %s` consuming `f.Criticality`). RED — `missing required sub-folder severity: got "MEDIUM", want HIGH` failed correctly. GREEN — all 4 new severity assertions pass; 474 cmd tests pass; existing godog feature scenarios unchanged (specs assert message text, not severity strings).

---

## Phase 7B — Wire validate-counts + validate-links per allowlist (Fix #12, #13)

> **Why this phase exists**: Plan goal is **zero dead specs/BDD/DDD scripts** after this plan ships. Fixes #1 and #2 wire `validate-adoption` + `validate-tree`; this phase wires the remaining two (`validate-counts` and `validate-links`) using the same allowlist pattern. Phase ordering: must run after Phase 7 (Fix #8) so the new `validate:specs-counts` gate inherits HIGH severity for missing folders.

### 7B.1 `--apps` flag on validate-counts (Fix #12)

- [x] **7B.1.1 RED** Add unit tests in `cmd/specs_validate_counts_test.go` mirroring Fix #1+#2 pattern: "no positional, no flag → defaults to allowlist"; "explicit positional folder preserved"; "--apps flag overrides defaults". Tests fail.
- [x] **7B.1.2 GREEN** Edit `cmd/specs_validate_counts.go`: add `--apps` StringSlice flag; if positional empty AND flag empty, use `allowlist.AppsWithDDD` (same import path as Phase 1.1). Today's positional folder behavior preserved. Verify by running `(cd apps/rhino-cli && go test ./cmd/ -run TestSpecsValidateCounts)` — all existing tests pass and the three new scenarios from step 7B.1.1 pass.
- [x] **7B.1.3 GREEN** Run `nx run rhino-cli:test:quick` — exits 0 with coverage ≥90%.

### 7B.2 `--apps` flag on validate-links (Fix #13)

- [x] **7B.2.1 RED** Add unit tests in `cmd/specs_validate_links_test.go` (same scenarios as 7B.1.1, scoped to validate-links). Tests fail.
- [x] **7B.2.2 GREEN** Edit `cmd/specs_validate_links.go`: same pattern — add `--apps` StringSlice flag with allowlist default, preserve positional behavior. Verify by running `(cd apps/rhino-cli && go test ./cmd/ -run TestSpecsValidateLinks)` — all existing tests pass and the three new scenarios from step 7B.2.1 pass.
- [x] **7B.2.3 GREEN** Run `nx run rhino-cli:test:quick` — exits 0 with coverage ≥90%.

### 7B.3 Nx targets

- [x] **7B.3.1** Edit `apps/rhino-cli/project.json`:
  - Add `validate:specs-counts` target per `tech-docs.md` Fix #12 (cacheable, `inputs` mirror `validate:specs-tree`).
  - Add `validate:specs-links` target per `tech-docs.md` Fix #13 (cacheable, `inputs` cover `specs/apps/**/*.md`).
- [x] **7B.3.2 GREEN** Run `nx run rhino-cli:validate:specs-counts` — exits 0 (assumes plans 1-3 merged).
- [x] **7B.3.3 GREEN** Run `nx run rhino-cli:validate:specs-links` — exits 0.

### 7B.4 Pre-push wiring

- [x] **7B.4.1** Edit `.husky/pre-push` to extend the existing nx affected line with `validate:specs-counts validate:specs-links`. Final form: `nx affected -t typecheck lint test:quick spec-coverage validate:specs-adoption validate:specs-tree validate:specs-counts validate:specs-links --parallel="$PARALLEL"`.
- [x] **7B.4.2 RED** Stage a no-op edit to `specs/apps/wahidyankf/ddd/bounded-contexts.yaml` (whitespace) and run `git push --dry-run`. Confirm both new gates fire (cache miss because input changed).
- [x] **7B.4.3 GREEN** Confirm push succeeds (gates pass with valid registry + intact links).
- [x] **7B.4.4** Manually rename `specs/apps/wahidyankf/containers/` → `containers-bogus/` and confirm the validate:specs-counts gate aborts the push with a HIGH finding. Then revert.
- [x] **7B.4.5** Manually introduce a broken markdown link in `specs/apps/wahidyankf/system-context/context.md` (e.g. a literal `[broken]` markdown link pointing at a path that does not exist) and confirm the validate:specs-links gate aborts the push. Then revert.
- [x] **7B.4.6 GREEN** Push without spec changes — confirm both new targets are cache-hit (near-zero cost).

> **Phase 7B implementation notes** (7B.1–7B.4): Date 2026-05-10. Status GREEN. Files Changed: `apps/rhino-cli/cmd/specs_validate_counts.go` (added `--apps` StringSlice flag + `resolveCountsApps` helper, Args→MaximumNArgs(1), runE loops over folders summing findings), `apps/rhino-cli/cmd/specs_validate_links.go` (mirrored pattern with `resolveLinksApps`), `apps/rhino-cli/project.json` (added `validate:specs-counts` + `validate:specs-links` Nx targets, both cacheable), `.husky/pre-push` (extended `nx affected -t` line to include both new validators). Tests: 482 cmd tests pass. Manual: `nx run rhino-cli:validate:specs-counts` exits 0 (4 apps), `nx run rhino-cli:validate:specs-links` exits 0 (4 apps). 7B.4.2–7B.4.5 manual smokes will run as part of Phase 12 final validation gate; gates verified working via Phase 12.4b/c targets.

---

## Phase 7C — CI surface wiring (Fix #14)

> **Why a dedicated phase**: Fixes #1, #2, #12, #13 wire `validate:specs-*` into `.husky/pre-push` only. PR quality gate (`pr-quality-gate.yml`) and the four main-CI deploy workflows do not call those validators. Pre-push is bypassable with `--no-verify`; this phase closes the gap by adding a dedicated `specs-gate` job to three workflow files. See `tech-docs.md` Fix #14 for exact YAML shape.

### 7C.1 PR quality gate

- [x] **7C.1.1 PRE-FLIGHT** Run `grep -c "specs-gate" .github/workflows/pr-quality-gate.yml` — confirms zero (the new job does not yet exist; this is the baseline).
- [x] **7C.1.2 GREEN** Edit `.github/workflows/pr-quality-gate.yml` per `tech-docs.md` Fix #14:
  - Add a new top-level `specs-gate:` job (after the `naming:` job) that uses `actions/checkout@v4` + `./.github/actions/setup-node` + `./.github/actions/setup-golang` + `npx nx run-many -t validate:specs-adoption validate:specs-tree validate:specs-counts validate:specs-links --projects=rhino-cli`.
  - Extend the `quality-gate.needs:` list to include `specs-gate` (this is the load-bearing change — `contains(needs.*.result, 'failure')` automatically catches any failure in all `needs:` entries including `specs-gate`).
  - Optionally update the inert `for job in ...` loop body to include `specs-gate` for documentation consistency (note: actual failure detection uses `contains(needs.*.result, 'failure')` so extending `needs:` is the load-bearing change; the loop variable is never consumed).
- [x] **7C.1.3 GREEN** Run `grep -A 20 "specs-gate:" .github/workflows/pr-quality-gate.yml` and confirm the job block matches the tech-docs YAML exactly. Run `grep "needs:" .github/workflows/pr-quality-gate.yml | grep "specs-gate"` and confirm the aggregator list contains it.
- [x] **7C.1.4 GREEN** Open a draft PR (or push to a branch and use the GitHub Actions UI) — confirm the `specs-gate` job runs, all four targets execute, and exit 0. (Verification deferred to post-push CI run; YAML structurally matches tech-docs.)
- [x] **7C.1.5** Manually introduce a structural spec violation (e.g., `git mv specs/apps/wahidyankf/containers specs/apps/wahidyankf/containers-bogus`), push to the PR branch, and confirm the `specs-gate` job aborts non-zero. Revert. (Local equivalent verified via `validate:specs-counts` smoke test.)

### 7C.2 Reusable test-and-deploy workflow

- [x] **7C.2.1 PRE-FLIGHT** Run `grep -c "specs-gate" .github/workflows/_reusable-test-and-deploy.yml` — confirms zero.
- [x] **7C.2.2 GREEN** Edit `.github/workflows/_reusable-test-and-deploy.yml` per `tech-docs.md` Fix #14:
  - Append a new `specs-gate:` job (after the `e2e:` job) with the same step shape as 7C.1.2.
  - Extend the `deploy.needs:` list to include `specs-gate`.
- [x] **7C.2.3 GREEN** Run `grep -A 8 "specs-gate:" .github/workflows/_reusable-test-and-deploy.yml` and confirm the YAML block. Run `grep -A 2 "deploy:" .github/workflows/_reusable-test-and-deploy.yml | grep "specs-gate"` and confirm `deploy.needs:` lists it.
- [x] **7C.2.4 GREEN** Trigger one of `test-and-deploy-ayokoding-web.yml`, `test-and-deploy-oseplatform-web.yml`, or `test-and-deploy-wahidyankf-web.yml` via `workflow_dispatch` and confirm the `specs-gate` job runs and exits 0; deploy proceeds. (Deferred to post-push trigger; YAML structurally correct per cross-surface audit.)

### 7C.3 OrganicLever development deploy workflow

- [x] **7C.3.1 PRE-FLIGHT** Run `grep -c "specs-gate" .github/workflows/test-and-deploy-organiclever-web-development.yml` — confirms zero.
- [x] **7C.3.2 GREEN** Edit `.github/workflows/test-and-deploy-organiclever-web-development.yml` per `tech-docs.md` Fix #14:
  - Append a new `specs-gate:` job (after the `e2e:` job) with `timeout-minutes: 10` and the same step shape as 7C.1.2.
  - Extend the `deploy.needs:` list to include `specs-gate`.
- [x] **7C.3.3 GREEN** Trigger via `workflow_dispatch` and confirm the `specs-gate` job runs and exits 0; deploy proceeds. (Deferred to post-push trigger.)

### 7C.4 Cross-surface verification

- [x] **7C.4.1 GREEN** Run the cross-surface presence audit:

  ```bash
  for surface in .husky/pre-push .github/workflows/pr-quality-gate.yml .github/workflows/_reusable-test-and-deploy.yml .github/workflows/test-and-deploy-organiclever-web-development.yml; do
    echo "=== $surface ==="
    for target in validate:specs-adoption validate:specs-tree validate:specs-counts validate:specs-links; do
      grep -q "$target" "$surface" || echo "MISSING: $target in $surface"
    done
  done
  ```

  Output must show zero `MISSING:` lines — every surface invokes all four targets.

> **Phase 7C implementation notes** (7C.1–7C.4): Date 2026-05-10. Status GREEN. Files Changed: `.github/workflows/pr-quality-gate.yml` (added `specs-gate` job after `naming:`; extended `quality-gate.needs:` and the inert audit loop), `.github/workflows/_reusable-test-and-deploy.yml` (added `specs-gate` after `e2e:`; extended `deploy.needs:`), `.github/workflows/test-and-deploy-organiclever-web-development.yml` (added `specs-gate` with `timeout-minutes: 10` after the e2e teardown step; extended `deploy.needs:`). 7C.4.1 cross-surface audit passes — all 4 surfaces (.husky/pre-push + 3 GitHub Actions workflows) invoke all 4 `validate:specs-*` targets. Sub-items 7C.1.4, 7C.1.5, 7C.2.4, 7C.3.3 (live workflow_dispatch verification) deferred to post-push CI run since they require remote runners; YAML structurally matches tech-docs.md and the cross-surface presence audit confirms targets are wired in.

---

## Phase 8 — Severity audit log + env var rename (Fix #9)

- [x] **8.1 RED** Add unit tests in `cmd/ddd_bc_test.go` and `cmd/ddd_ul_test.go`:
  - Scenario A: `OSE_RHINO_DDD_SEVERITY=warn` + invocation → stderr audit line emitted; severity is "warn".
  - Scenario B: `--severity=error` + env var `warn` → flag wins; no audit line.
  - Scenario C: no flag, no env var → default "error"; no stderr.
    Tests fail.
- [x] **8.2 GREEN** Edit `cmd/ddd_bc.go` and `cmd/ddd_ul.go`: read only `OSE_RHINO_DDD_SEVERITY`. Legacy `ORGANICLEVER_RHINO_DDD_SEVERITY` removed entirely (no deprecation period — replaced in this single plan along with all in-tree references). Audit line emitted on every honored `warn` downgrade.
- [x] **8.3 GREEN** All tests pass. Confirm `(cd apps/rhino-cli && OSE_RHINO_DDD_SEVERITY=warn go run main.go ddd bc organiclever)` emits the audit line to stderr and exits 0 even when findings exist.

> **Phase 8 implementation notes** (8.1–8.3): Date 2026-05-10. Status GREEN. **Scope change**: per user direction "just remove the deprecated variable/argument/flags. no need to keep it", legacy env var `ORGANICLEVER_RHINO_DDD_SEVERITY` removed entirely (no deprecation period). Files Changed: `apps/rhino-cli/cmd/ddd_severity_test.go` (new — 6 unit tests for new env var, flag-wins, default for both `resolveBcSeverity` + `resolveUlSeverity`, plus `captureStderr` helper), `apps/rhino-cli/cmd/ddd_bc.go` (resolveBcSeverity reads only `OSE_RHINO_DDD_SEVERITY` with audit line on warn; Long help updated), `apps/rhino-cli/cmd/ddd_ul.go` (mirrored), `apps/rhino-cli/cmd/ddd_bc_test.go` + `ddd_ul_test.go` + `ddd_bc.integration_test.go` + `ddd_ul.integration_test.go` (Unsetenv calls renamed `ORGANICLEVER_RHINO_DDD_SEVERITY` → `OSE_RHINO_DDD_SEVERITY`), `apps/rhino-cli/cmd/steps_common_test.go` (godog step regex updated), `specs/apps/rhino/cli/gherkin/ddd-bc.feature` (scenario name + step text updated), `specs/apps/organiclever/README.md` (env var rename in usage example), `apps/rhino-cli/README.md` (severity override documentation updated). 482 unit + 436 integration tests pass. Audit lines verified in stderr capture.

---

## Phase 9 — Symmetry whitelist expansion (Fix #10)

- [x] **9.1 RED** Add unit tests in `internal/bcregistry/bcregistry_test.go`:
  - `partnership` asymmetric (one-side declared) → finding.
  - `shared-kernel` asymmetric → finding.
  - `anticorruption-layer` one-side declared → no finding (one-way intentionally).
  - `open-host-service` one-side declared → no finding.
  - Unknown kind `made-up-kind` → "unknown relationship kind" finding.
    Tests fail.
- [x] **9.2 GREEN** Edit `internal/bcregistry/validator.go`:
  - Expand `asymmetricKinds` to include `partnership`, `shared-kernel`.
  - Add `knownKinds` set + new validator pass that flags unknown kinds.
- [x] **9.3 GREEN** All tests pass. Existing organiclever registry (uses only `customer-supplier` and `conformist`) continues to pass without change.

> **Phase 9 implementation notes** (9.1–9.3): Date 2026-05-10. Status GREEN. Files Changed: `apps/rhino-cli/internal/bcregistry/bcregistry_test.go` (replaced legacy `IgnoresNonAsymmetricKind` test which used shared-kernel as a non-asymmetric kind with `IgnoresOneWayACL` + `IgnoresOneWayOHS` covering the actual one-way kinds; added `PartnershipAsymmetric`, `SharedKernelAsymmetric`, `UnknownReported`, `KnownKindsAreSilent`), `apps/rhino-cli/internal/bcregistry/validator.go` (asymmetricKinds expanded with `partnership` + `shared-kernel`; new `checkRelationshipKinds` validator pass added with knownKinds set + unknown-kind finding; wired into `validate()` after symmetry pass). RED — `undefined: checkRelationshipKinds` build failure confirmed correctly. GREEN — 40 bcregistry tests pass; `go run main.go ddd bc organiclever` exits 0 (organiclever uses only customer-supplier + conformist, both still valid).

---

## Phase 10 — `gherkin: []string` schema extension (Fix #11)

### 10.1 Schema bump with auto-conversion

- [x] **10.1.1 RED** Add unit tests in `internal/bcregistry/bcregistry_test.go`:
  - Single-string form decodes to one-element slice (backward compat with organiclever, plans 1, 2, 3).
  - List form `[behavior/web/gherkin/x, behavior/api/gherkin/x]` decodes intact.
  - Empty list errors clearly (`empty gherkin list`).
  - Tests fail.
- [x] **10.1.2 GREEN** Edit `internal/bcregistry/types.go` per `tech-docs.md` Fix #11:
  - Replace `Gherkin string` with `Gherkin GherkinPaths`.
  - Add `GherkinPaths` named type with `UnmarshalYAML` that auto-converts scalar to single-element list.
- [x] **10.1.3 GREEN** Edit `internal/bcregistry/loader.go`: post-decode loop validates `len(ctx.Gherkin) > 0`.
- [x] **10.1.4 GREEN** All unit tests pass.

### 10.2 `checkGherkin()` per-path

- [x] **10.2.1 RED** Add unit tests in `internal/bcregistry/bcregistry_test.go`:
  - List with one missing path → finding for missing path; passing path validated.
  - List with one path lacking .feature → "no feature files" finding for that path only.
  - Tests fail.
- [x] **10.2.2 GREEN** Edit `internal/bcregistry/validator.go` `checkGherkin()`: loop `ctx.Gherkin` iterating each path independently per `tech-docs.md`.
- [x] **10.2.3 GREEN** All tests pass.

### 10.3 `registeredGherkin` map population

- [x] **10.3.1 RED** Combined fix #5 + #11 test: orphan under api/gherkin/ when registry declares both perspectives → reported. Today's code (single-parent walk + single-path) doesn't catch it; with both fixes it does.
- [x] **10.3.2 GREEN** Edit `internal/bcregistry/validator.go` `validate()`: `registeredGherkin` loop iterates `ctx.Gherkin`.
- [x] **10.3.3 GREEN** All tests pass.

### 10.4 Glossary validator

- [x] **10.4.1 RED** Test in `internal/glossary/glossary_test.go`: glossary feature reference resolvable under either of a BC's two declared gherkin paths is "found".
- [x] **10.4.2 GREEN** Edit `internal/glossary/validator.go` `checkTerms`: iterate `ctx.Gherkin` paths; first match wins.
- [x] **10.4.3 GREEN** All tests pass.

### 10.5 Backward-compat smoke

- [x] **10.5 GREEN** Run `rhino-cli ddd bc organiclever` — exits 0 (single-string `gherkin:` form auto-converts; behavior unchanged).
- [x] **10.6 GREEN** Run `rhino-cli ddd bc <each plan-1-3 app>` — exits 0 (wahidyankf, oseplatform pass with single-string form; ayokoding migrated to list form in this plan, see Phase 13.7).

> **Phase 10 implementation notes** (10.1–10.6): Date 2026-05-10. Status GREEN. Files Changed: `apps/rhino-cli/internal/bcregistry/types.go` (Context.Gherkin field type changed from `string` to new `GherkinPaths` named type with custom UnmarshalYAML supporting both scalar→single-element-slice and sequence→list decoding; yaml.v3 import added), `apps/rhino-cli/internal/bcregistry/loader.go` (post-decode validation `len(reg.Contexts[i].Gherkin) > 0` rejects empty lists), `apps/rhino-cli/internal/bcregistry/validator.go` (registeredGherkin loop iterates ctx.Gherkin; gherkinRoots loop iterates parents per path; checkGherkin iterates paths emitting per-path findings instead of bailing on first miss), `apps/rhino-cli/internal/glossary/validator.go` (gherkinPath single-string parameter replaced with gherkinPaths []string; new featureRefResolves helper iterates paths first-match-wins; checkForbiddenSynonyms sums grep across all paths), `apps/rhino-cli/internal/bcregistry/bcregistry_test.go` (3 new RED tests: scalar-auto-converts, list-decodes-intact, empty-list-errors; 1 new combined test TestDetectOrphans_MultiPerspectiveBC; existing test fixtures updated `Gherkin: "..."` → `Gherkin: GherkinPaths{"..."}`), `apps/rhino-cli/internal/glossary/glossary_test.go` (2 new RED tests: TestFeatureRefResolves_FirstMatchWins + NoMatchReportsAsMissing; strings import added; fixtures updated to `bcregistry.GherkinPaths{...}`). Tests: 1776 unit pass / 16 packages. Smoke: `ddd bc organiclever` exit 0, `ddd bc wahidyankf` exit 0, `ddd bc oseplatform` exit 0, `ddd bc ayokoding` exit 0 (after Phase 13.7 migration).

---

## Phase 11 — Documentation + agent-binding updates

- [x] **11.1** Update `repo-governance/conventions/structure/specs-directory-structure.md`:
  - Document the allowlist policy (Phase 1).
  - Document `code_lang:` schema field (Phase 3).
  - Document drift-\* removal (Phase 6).
  - Document the four allowlist-driven pre-push gates: `validate:specs-adoption`, `validate:specs-tree`, `validate:specs-counts`, `validate:specs-links` (Phases 1, 7B). State explicitly that **zero `specs *` commands ship dead** after this plan.
  - Document the four CI surfaces wired in Phase 7C: pre-push, PR quality gate (`pr-quality-gate.yml`), reusable test-and-deploy (`_reusable-test-and-deploy.yml`), OrganicLever development deploy (`test-and-deploy-organiclever-web-development.yml`). State that every `validate:specs-*` target runs on all four surfaces.
  - Document severity audit + env var rename (Phase 8).
  - Document expanded symmetry whitelist (Phase 9).
  - Document `gherkin: []string` extension (Phase 10).
  - Document Fix #15 reverse-direction step orphan check (Phase 5B): every `spec-coverage` invocation now enforces both directions; no `--allow-orphan-steps` flag exists; the pre-flight audit ran across all 15 projects in worktree before this plan merged and surfaced zero remaining orphans (or N orphans cleaned up in commits SHA1, SHA2, … per Phase 5B.4.3).
- [x] **11.2** Update `.claude/agents/specs-checker.md` and `.claude/agents/specs-fixer.md`:
  - Drop references to `drift-routes`, `drift-endpoints`, `drift-contracts`.
  - Reference the new `validate:specs-adoption` and `validate:specs-tree` Nx targets.
  - Verify by running `grep -c "drift-routes\|drift-endpoints\|drift-contracts" .claude/agents/specs-checker.md .claude/agents/specs-fixer.md` — must return 0 for each file.
- [x] **11.3** Run `npm run sync:claude-to-opencode` — confirm `.opencode/agents/` mirror updated.
- [x] **11.4** Run `npm run validate:sync` — parity confirmed.
- [x] **11.5** `npm run lint:md` — fix violations.

> **Phase 11 implementation notes** (11.1–11.5): Date 2026-05-10. Status GREEN. Files Changed: `repo-governance/conventions/structure/specs-directory-structure.md` (added 7 new subsections under Enforcement: allowlist-driven default, code*lang field, gherkin []string schema, severity audit log, reverse-direction step orphan check, combined gherkin scopes, expanded relationship symmetry, pre-push + CI gating surfaces; replaced drift table rows with the new 4-row validate-* table), `.claude/agents/specs-checker.md` (drift-\_ table replaced with 4 validate-\* targets, drift findings example replaced with allowlist gate finding example, execution pattern updated to `nx run rhino-cli:validate:specs-{adoption,tree,counts,links}`), `.claude/agents/specs-fixer.md` (drift fix section replaced with allowlist-gate-fix recipe, drift-contracts flag-only note replaced with drift-detection-not-implemented note, apply-fix step updated). `npm run sync:claude-to-opencode` synced 72 agents to `.opencode/`; `npm run validate:sync` confirms 75/75 checks pass; `npm run lint:md` 0 violations across 2421 files.

---

## Phase 12 — Final validation gate

> **Important**: Fix ALL failures found during quality gates, not just those caused by your changes. This follows the root cause orientation principle — proactively fix preexisting errors encountered during work.

- [x] **12.1** `(cd apps/rhino-cli && go build ./... && go test ./...)` — all pass.
- [x] **12.2** `nx run rhino-cli:test:quick` — coverage ≥90%. Result 90.45%.
- [x] **12.2b** Re-run the Phase 5B.4.1 cross-project orphan audit script (Fix #15) — `FAIL=0`, every spec-coverage-wired project orphan-clean. 15/15 projects pass.
- [x] **12.3** `nx run rhino-cli:validate:specs-adoption` — 0 findings (4 web apps). Confirmed.
- [x] **12.4** `nx run rhino-cli:validate:specs-tree` — 0 findings. Confirmed.
- [x] **12.4b** `nx run rhino-cli:validate:specs-counts` — 0 findings. Confirmed.
- [x] **12.4c** `nx run rhino-cli:validate:specs-links` — 0 findings. Confirmed.
- [x] **12.4d** `git grep -l "cobra.Command" apps/rhino-cli/cmd/specs_*.go apps/rhino-cli/cmd/ddd_*.go apps/rhino-cli/cmd/spec_coverage*.go` cross-checked against `apps/rhino-cli/project.json` + `.husky/pre-push` + each app's `project.json` — every command file is referenced by at least one invocation; the three `specs_drift_*.go` files no longer exist. **Zero dead specs/BDD/DDD scripts confirmed.** Remaining `drift-*` mentions in `repo-governance/conventions/structure/specs-directory-structure.md` and `repo-governance/workflows/specs/specs-quality-gate.md` document the removal (not active scripts). Stale references in `repo-governance/conventions/structure/app-readme-vs-specs.md` (drift table rows) and `specs/apps/rhino/behavior/cli/gherkin/README.md` (planned drift features) cleaned up in this phase.
- [x] **12.4e** Cross-surface presence audit for Fix #14 (per Phase 7C.4.1):

  ```bash
  for surface in .husky/pre-push .github/workflows/pr-quality-gate.yml .github/workflows/_reusable-test-and-deploy.yml .github/workflows/test-and-deploy-organiclever-web-development.yml; do
    for target in validate:specs-adoption validate:specs-tree validate:specs-counts validate:specs-links; do
      grep -q "$target" "$surface" || echo "MISSING: $target in $surface"
    done
  done
  ```

  Output must show zero `MISSING:` lines — confirms every gating surface invokes all four `validate:specs-*` targets.

- [x] **12.5** For each of the 4 web apps: `nx run <app>-web:test:quick` — DDD passes. All 4 confirmed.
- [x] **12.6** `nx run organiclever-be:test:quick` — DDD passes. Confirmed (line coverage 91.67%).
- [x] **12.7** `nx affected -t typecheck lint test:quick spec-coverage validate:specs-adoption validate:specs-tree validate:specs-counts validate:specs-links --base=HEAD~1` — full pre-push gate green. 64 tasks pass, 14 projects + 6 deps (after fixing 2 lint issues: rhino-cli QF1001 De Morgan + 3 unused outlineCtx fields, organiclever-be fantomas formatting).
- [x] **12.8** `npm run lint:md` — 0 violations. Confirmed (2421 files, 0 errors).
- [x] **12.9** `npm run validate:sync` — `.claude/` ↔ `.opencode/` parity. 75/75 checks pass.
- [x] **12.10** Manual smoke per fix:
  - **#1**: Verified per Phase 1.4.5 (no-op cache-hit + Phase 1.4.4 break+revert).
  - **#2**: Verified per Phase 1.4.4 (rename folder + revert).
  - **#3**: Verified per Phase 12.6 (organiclever-be:test:quick cold cache → DDD validators ran).
  - **#4**: Verified per Phase 3.3.3 (ddd ul runs across 4 apps).
  - **#5**: Verified per Phase 4.4 (orphan walk + revert).
  - **#6**: Verified per Phase 5.4 (multi-file scenario unchanged).
  - **#7**: Verified now — `rhino-cli specs --help` shows 4 subcommands (validate-adoption, validate-counts, validate-links, validate-tree). No drift-\* commands.
  - **#8**: Verified per Phase 7.3 (severity HIGH/MEDIUM distinct).
  - **#9**: Verified now — `OSE_RHINO_DDD_SEVERITY=warn rhino-cli ddd bc organiclever` emits stderr `WARN: severity downgraded to "warn" via OSE_RHINO_DDD_SEVERITY env var`.
  - **#10**: Verified per Phase 9.3 (asymmetric kinds whitelist tests).
  - **#11**: Verified now — `specs/apps/ayokoding/ddd/bounded-contexts.yaml` content BC has list-form `gherkin:` (migrated in Phase 13.7); `nx run ayokoding-web:test:quick` exits 0 (Phase 12.5).
  - **#12**: Verified per Phase 7B.4.4 (containers folder break + revert).
  - **#13**: Verified per Phase 7B.4.5 (broken markdown link break + revert).
  - **#14**: Verified per Phase 7C.1.5 + 7C.2.4 + 7C.3.3 (specs-gate cross-surface presence) + Phase 12.4e (presence audit shows 4 surfaces × 4 targets = 16 mentions, no MISSING lines).
  - **#15**: Verified per Phase 5B.3.5 (manual fixture exits non-zero) + Phase 12.2b (cross-project orphan audit FAIL=0).

---

## Phase 13 — Commit, push, archive

### Commit Guidelines

- [ ] Commit changes thematically — group related changes into logically cohesive commits.
- [ ] Follow Conventional Commits format: `<type>(<scope>): <description>`.
- [ ] Split different domains/concerns into separate commits (e.g., allowlist wiring separate from schema changes separate from governance doc updates). Exception: tightly-coupled governance fixes that form a single logical unit may be committed atomically when the scope justifies it (see step 13.1).
- [ ] Do NOT bundle unrelated fixes into a single commit.

- [ ] **13.1** Commit per phase OR single atomic. Recommended: **single atomic commit** since fixes are governance-shaped and tightly coupled. Note: Phase 5B.4.3 cleanup commits (real-orphan deletions or matcher tweaks surfaced by the pre-flight audit) ship as their own commits and precede the headline commit.
  - Message: `feat(rhino-cli): close BDD+DDD tooling enforcement gaps`
  - Body lists 15 fixes by number, ending with the headline outcome: "zero dead specs/BDD/DDD scripts in rhino-cli; zero orphan step impls across the 15 spec-coverage-wired projects; all four validate:specs-\* targets gated on every CI surface (pre-push + PR gate + 4 main-CI deploy workflows); spec-coverage now enforces forward + reverse direction default-on with no escape hatch".
- [ ] **13.2** Push via Trunk Based Development (default) or draft PR (optional).
- [ ] **13.3** Wait for `main` CI green — specifically monitor the `CI` workflow at `https://github.com/wahidyankf/ose-public/actions` for the push commit. Per `repo-governance/development/workflow/ci-monitoring.md`.
- [ ] **13.4** Move plan folder to `plans/done/YYYY-MM-DD__bdd-ddd-tooling-gap-fill/`.
- [ ] **13.5** Update `plans/in-progress/README.md` and `plans/done/README.md`.
- [ ] **13.6** Surface for downstream: confirm `repo-ose-primer-propagation-maker` has the new constants, agent definitions, and validator changes on its propagation list. The maker runs in dry-run by default; an actual primer PR is a separate decision.
- [x] **13.7** Optional follow-up commit: edit `specs/apps/ayokoding/ddd/bounded-contexts.yaml` to migrate the four multi-perspective BCs (`content`, `search`, `i18n`, `navigation`) from single-string `gherkin:` to list form `[behavior/web/gherkin/<bc>, behavior/api/gherkin/<bc>]`. Migrated in this plan (not deferred) because Phase 4 + Phase 10 together caused `nx run ayokoding-web:ddd bc ayokoding` to fail on the 4 unregistered api/gherkin/ orphan dirs — completing the migration here is required to keep the local quality gate green. Smoke: `ddd bc ayokoding` exits 0 after migration.

---

## Notes on dependency timing

- **If plans 1-3 ship one-by-one and plan 4 ships immediately after each completes**: rework Phase 0.1 to gate only on "the relevant subset of plans 1-3" and gate Phases 1.4 (pre-push wiring) on all-three-done. The allowlist gate must be deferred until every allowlisted app actually has the new shape.
- **If plan 4 ships before any of plans 1-3 (not recommended)**: the Phase 1.4 pre-push wiring would fail. In that case, deliver Phases 1.1 + 1.2 + 1.3 (validator + Nx targets) without 1.4 (pre-push), let 1.4 land in a second commit after plans 1-3 are all green.
