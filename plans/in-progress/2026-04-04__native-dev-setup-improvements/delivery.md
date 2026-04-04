# Delivery Plan: Native Dev Setup Improvements

## Overview

**Delivery Type**: Direct commits to `main` (small, independent changes)

**Git Workflow**: Trunk Based Development — each phase is one commit

**Phase Independence**: Phases 2-8 are fully independent and can be delivered in any order.
Phase 1 (`doctor --fix`) should be done last since it depends on the final tool list (after
Hugo removal and Playwright/version additions).

**Recommended Order**: 2, 7, 5, 3, 4, 8, 6, 1

## Implementation Phases

### Phase 2: Remove Hugo from Doctor

**Goal**: Remove the legacy Hugo tool check. Simplest change, reduces tool count from 19 to 18.

- [ ] Remove Hugo `toolDef` entry from `buildToolDefs()` in `apps/rhino-cli/internal/doctor/tools.go`
- [ ] Remove `vercelJSONPath` variable from `buildToolDefs()` (no longer referenced)
- [ ] Remove `vercelJSON` struct from `apps/rhino-cli/internal/doctor/checker.go`
- [ ] Remove `readHugoVersion` function from `checker.go`
- [ ] Remove `parseHugoVersion` function from `checker.go` (line ~322, not in `tools.go`)
- [ ] Remove Hugo-related test cases from `apps/rhino-cli/internal/doctor/checker_test.go`
      (`TestParseHugoVersion`, `TestReadHugoVersion`, Hugo entries in mock data)
- [ ] Update `apps/rhino-cli/internal/doctor/reporter_test.go`: remove Hugo `ToolCheck` entry
      from `allOKChecks` slice, remove "hugo" from the name list in `TestFormatMarkdown`, update
      tool count from 19 to 18
- [ ] Update `apps/rhino-cli/cmd/doctor_test.go`: remove "hugo" from `makeAllOKChecks()` name
      list, update hardcoded count 19 → 18 in `theJSONListsEveryCheckedToolWithItsStatus()`,
      remove Hugo-specific test scenarios (missing hugo, warning hugo)
- [ ] Update `cmd/doctor.go` Long help string — remove Hugo from the tool list
- [ ] Remove Phase 11 (Hugo) from `governance/workflows/infra/development-environment-setup.md`
- [ ] Remove Hugo row from Tool Inventory table in the workflow doc (row 8)
- [ ] Renumber subsequent tool rows in the inventory table
- [ ] Update minimal scope table in workflow doc if Hugo was listed
- [ ] Update the workflow doc's YAML frontmatter `inputs` description if it references "19 tools"
      (currently says "full: all 19 tools for all projects")
- [ ] Run `nx run rhino-cli:test:quick` — verify all tests pass
- [ ] Run `npm run doctor` — verify 18/18 tools OK, no Hugo in output
- [ ] Commit: `refactor(rhino-cli): remove legacy Hugo check from doctor`

### Phase 7: Fix Postinstall Caching

**Goal**: Remove unnecessary `--skip-nx-cache` from doctor npm script.

- [ ] Edit `package.json`: change `"doctor"` script from
      `"nx run rhino-cli:build --skip-nx-cache && ..."` to `"nx run rhino-cli:build && ..."`
- [ ] Run `npm install` twice — verify second run uses Nx cache for rhino-cli build
- [ ] Commit: `fix(infra): allow Nx cache for rhino-cli build in doctor script`

### Phase 5: Add Brewfile

**Goal**: Create declarative Homebrew dependency manifest.

- [ ] Create `Brewfile` at repository root with Homebrew-installable tools: `brew` formulas
      (go, jq, dotnet, pyenv, asdf, clojure/tools/clojure) and `cask` (flutter)
- [ ] Add `Brewfile.lock.json` to `.gitignore`
- [ ] Verify `brew bundle check` passes on current machine
- [ ] Update `governance/workflows/infra/development-environment-setup.md` Phase 1 to mention
      `brew bundle` as alternative to individual installs
- [ ] Commit: `feat(infra): add Brewfile for declarative Homebrew dependencies`

### Phase 3: `rhino-cli env init`

**Goal**: Add command to bootstrap `.env` files from `.env.example` templates.

- [ ] Create `apps/rhino-cli/cmd/env_init.go` with `env init` subcommand
- [ ] Implement `.env.example` discovery: walk `infra/dev/` for `.env.example` files
- [ ] Implement copy logic: `.env.example` → `.env` in the same directory
- [ ] Add `--force` flag for overwriting existing `.env` files
- [ ] Print summary: created count, skipped count
- [ ] Write unit tests in `apps/rhino-cli/cmd/env_init_test.go` — mock filesystem
- [ ] Create `specs/apps/rhino/cli/gherkin/env-init.feature` with Gherkin scenarios
      (bootstrap from examples, skip existing, force overwrite, empty infra/dev)
- [ ] Run `nx run rhino-cli:test:quick` — verify tests pass
- [ ] Test manually: remove one `.env` file, run `env init`, verify it's created
- [ ] Test manually: run `env init` again, verify existing file is skipped
- [ ] Test manually: run `env init --force`, verify file is overwritten
- [ ] Update Phase 12.3 in `governance/workflows/infra/development-environment-setup.md` to
      mention `env init` as fallback when no backup exists
- [ ] Commit: `feat(rhino-cli): add env init command to bootstrap .env from .env.example`

### Phase 4: Add Playwright to Doctor

**Goal**: Add Playwright browser check to doctor output.

- [ ] Add `playwright` `toolDef` entry to `buildToolDefs()` in `tools.go`
  - binary: `npx`, args: `["playwright", "--version"]`
  - parseVer: custom `parsePlaywrightVersion` (output is `"Version 1.58.2"`, not bare version)
- [ ] Implement `checkPlaywrightBrowsers()` function in `checker.go` — check for chromium
      directory in `~/Library/Caches/ms-playwright/`
- [ ] Implement custom compare function `comparePlaywright()` that returns `StatusWarning`
      with note `"browsers not installed — run: npx playwright install"` when CLI works but
      browsers are missing
- [ ] Add Playwright test cases to `checker_test.go` — mock both CLI and browser cache
- [ ] Update `reporter_test.go`: add Playwright `ToolCheck` entry to `allOKChecks` slice,
      add "playwright" to the name list in `TestFormatMarkdown`, update tool count
- [ ] Update `cmd/doctor_test.go`: add "playwright" to `makeAllOKChecks()` name list,
      update hardcoded count in `theJSONListsEveryCheckedToolWithItsStatus()`
- [ ] Add Playwright row to Tool Inventory table in workflow doc
- [ ] Update Phase 13 in workflow doc to note that doctor now checks for Playwright
- [ ] Run `nx run rhino-cli:test:quick` — verify tests pass
- [ ] Run `npm run doctor` — verify playwright appears in output with correct status
- [ ] Commit: `feat(rhino-cli): add Playwright browser check to doctor`

### Phase 8: Pin Rust and Flutter Versions

**Goal**: Add version requirements for Rust and Flutter.

- [ ] Add `rust-version = "1.80"` (MSRV) to `apps/a-demo-be-rust-axum/Cargo.toml` `[package]`
      section (currently has `edition = "2021"` but no MSRV)
- [ ] Implement `readRustVersion()` function in `checker.go` — read `rust-version` from
      `Cargo.toml`
- [ ] Add `cargoTomlPath` variable to `buildToolDefs()` in `tools.go`
      (`filepath.Join(repoRoot, "apps", "a-demo-be-rust-axum", "Cargo.toml")`)
- [ ] Update Rust `toolDef` in `tools.go`: change `readReq` to use `readRustVersion(cargoTomlPath)`,
      change `compare` from `compareExact` to `compareGTE`
- [ ] Add `flutter: ">=3.41.0"` to `apps/a-demo-fe-dart-flutterweb/pubspec.yaml`
      `environment:` section (currently has only `sdk: ^3.11.1`, no flutter constraint)
- [ ] Implement `readFlutterVersion()` function in `checker.go` — read `environment.flutter`
      from `pubspec.yaml`
- [ ] Update Flutter `toolDef` in `tools.go`: change `readReq` to use `readFlutterVersion()`,
      change `compare` from `compareExact` to `compareGTE`
- [ ] Add test cases for `readRustVersion()` and `readFlutterVersion()` in `checker_test.go`
- [ ] Run `nx run rhino-cli:test:quick` — verify tests pass
- [ ] Run `npm run doctor` — verify rust and flutter show `required: >=X.Y` instead of
      `(no version requirement)`
- [ ] Commit: `feat(rhino-cli): pin Rust and Flutter version requirements in doctor`

### Phase 6: `doctor --scope minimal`

**Goal**: Add scope filtering to doctor.

- [ ] Define `Scope` type and `minimalTools` set in `checker.go` (or new `scope.go`)
- [ ] Add `Scope` field to `CheckOptions` struct
- [ ] Filter `buildToolDefs()` output based on scope before running checks
- [ ] Add `--scope` flag to `doctor` cobra command in `cmd/doctor.go`
- [ ] Update reporter to include scope in summary line when scope is not `full`
- [ ] Add unit test cases: verify minimal scope checks only 7 tools
- [ ] Add unit test cases: verify full scope checks all tools (default behavior unchanged)
- [ ] Add Gherkin scenarios to `specs/apps/rhino/cli/gherkin/doctor.feature` for scope
      (minimal scope checks subset, full scope is default)
- [ ] Run `nx run rhino-cli:test:quick` — verify tests pass
- [ ] Run `npm run doctor -- --scope minimal` — verify only 7 tools checked
- [ ] Run `npm run doctor` — verify all tools checked (backward compatible)
- [ ] Update `governance/workflows/infra/development-environment-setup.md` minimal scope
      section to reference `doctor --scope minimal`
- [ ] Commit: `feat(rhino-cli): add --scope flag to doctor for minimal tool checks`

### Phase 1: `doctor --fix` (auto-install)

**Goal**: Add auto-install capability to doctor. Done last because it depends on the final tool
list.

- [ ] Create `apps/rhino-cli/internal/doctor/fixer.go` with `installStep` type and fix logic
- [ ] Add `installCmd` field to `toolDef` struct in `tools.go`
- [ ] Implement install commands for each tool (see tech-docs.md table)
  - [ ] git: `xcode-select --install`
  - [ ] volta: `curl https://get.volta.sh | bash`
  - [ ] node: `volta install node@{required}`
  - [ ] npm: `volta install npm@{required}`
  - [ ] java: `sdk install java {required}-tem`
  - [ ] maven: `sdk install maven`
  - [ ] golang: `brew install go`
  - [ ] python: `brew install pyenv && pyenv install {required} && pyenv global {required}`
  - [ ] rust: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y`
        (must use `-y` for non-interactive install — bare `rustup-init` prompts interactively)
  - [ ] cargo-llvm-cov: `cargo install cargo-llvm-cov`
  - [ ] elixir: `asdf plugin add elixir && asdf install elixir {required}`
  - [ ] erlang: `asdf plugin add erlang && asdf install erlang {required}`
  - [ ] dotnet: `brew install dotnet`
  - [ ] clojure: `brew install clojure/tools/clojure`
  - [ ] dart/flutter: `brew install --cask flutter`
  - [ ] docker: print manual install URL
  - [ ] jq: `brew install jq`
  - [ ] playwright: `npx playwright install`
- [ ] Add `--fix` flag to `doctor` cobra command in `cmd/doctor.go`
- [ ] Add `--dry-run` flag to `doctor` cobra command (only effective with `--fix`)
- [ ] Implement dry-run mode: print "Would install: {tool} via {command}" without executing
- [ ] Implement fix loop: iterate missing tools, execute install commands, re-check after install
- [ ] After installing Volta/SDKMAN/rustup, source the relevant shell init script so subsequent
      installs (node via volta, java via sdk, cargo-llvm-cov via cargo) can find the binary
- [ ] Print progress: `Installing golang via brew install go...`
- [ ] Print summary: `Fixed: 3, Failed: 1, Already OK: 15`
- [ ] Return exit code 1 if any tools remain missing after fix
- [ ] Create `apps/rhino-cli/internal/doctor/fixer_test.go` with mock tests
  - [ ] Test: all tools OK → no install commands run
  - [ ] Test: one tool missing → correct install command generated
  - [ ] Test: install fails → error logged, continues to next tool
  - [ ] Test: dependency ordering (volta before node)
- [ ] Add Gherkin scenarios to `specs/apps/rhino/cli/gherkin/doctor.feature` for fix
      (fix missing tool, skip already-installed, fix failure handling)
- [ ] Run `nx run rhino-cli:test:quick` — verify all tests pass
- [ ] Test manually: run `doctor --fix` with all tools installed — verify "nothing to fix"
- [ ] Test manually: run `doctor --fix --dry-run` — verify it prints what would be installed
      without executing any commands
- [ ] Update `governance/workflows/infra/development-environment-setup.md` to add `doctor --fix`
      as the recommended setup path
- [ ] Update `docs/how-to/hoto__setup-development-environment.md` to mention `doctor --fix`
- [ ] Commit: `feat(rhino-cli): add doctor --fix for auto-installing missing tools`

## Post-Delivery

### Documentation updates (single commit after all phases)

- [ ] Update CLAUDE.md "Common Development Commands" section to add `npm run doctor -- --fix`
      and `npm run doctor -- --scope minimal`
- [ ] Update CLAUDE.md tool count if it mentions "19 tools"
- [ ] Verify `governance/workflows/infra/development-environment-setup.md` is consistent with
      all changes
- [ ] Run `npm run lint:md` — verify all markdown passes linting
- [ ] Commit: `docs: update setup documentation for doctor improvements`

## Validation

After all phases are complete:

- [ ] `npm run doctor` shows correct tool count (no Hugo, with Playwright)
- [ ] `npm run doctor -- --fix` with all tools installed reports "nothing to fix"
- [ ] `npm run doctor -- --fix --dry-run` previews actions without executing
- [ ] `npm run doctor -- --scope minimal` checks only 7 tools
- [ ] `rhino-cli env init` creates `.env` files from templates
- [ ] `brew bundle check` passes with the new Brewfile
- [ ] Rust and Flutter show version requirements in doctor output
- [ ] `npm install` uses Nx cache for rhino-cli build on second run
- [ ] `nx run rhino-cli:test:quick` passes
- [ ] Pre-push hook passes
