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

- [x] Remove Hugo `toolDef` entry from `buildToolDefs()` in `apps/rhino-cli/internal/doctor/tools.go`
- [x] Remove `vercelJSONPath` variable from `buildToolDefs()` (no longer referenced)
- [x] Remove `vercelJSON` struct from `apps/rhino-cli/internal/doctor/checker.go`
- [x] Remove `readHugoVersion` function from `checker.go`
- [x] Remove `parseHugoVersion` function from `checker.go` (line ~322, not in `tools.go`)
- [x] Remove Hugo-related test cases from `apps/rhino-cli/internal/doctor/checker_test.go`:
  - [x] Remove `TestParseHugoVersion` and `TestReadHugoVersion` functions
  - [x] Remove `"hugo"` entry from fake runner map in `TestCheckAll_WithFakeRunner` (line ~674),
        update `OKCount` and `len(Checks)` assertions from 19 to 18
  - [x] Remove `"hugo"` entry from fake runner map in `TestCheckAll_WithWarningStatus` (line ~815)
  - [x] Remove Hugo mock filesystem entries (vercel.json with HUGO_VERSION)
- [x] Update `apps/rhino-cli/internal/doctor/reporter_test.go`: remove Hugo `ToolCheck` entry
      from `allOKChecks` slice, remove "hugo" from the name list in `TestFormatMarkdown`, update
      tool count from 19 to 18
- [x] Update `apps/rhino-cli/cmd/doctor_test.go`:
  - [x] Remove "hugo" from `makeAllOKChecks()` name list
  - [x] Update hardcoded count 19 → 18 in `theJSONListsEveryCheckedToolWithItsStatus()`
  - [x] In `aRequiredDevelopmentToolIsNotFoundInTheSystemPATH()`: change hardcoded
        `Name: "hugo", Binary: "hugo"` to a different tool (e.g., `Name: "golang", Binary: "go"`)
        — do NOT delete this step implementation (it backs the generic Gherkin scenario)
  - [x] Verify `aRequiredDevelopmentToolIsInstalledWithANonMatchingVersion()` uses `"node"`
        (not `"hugo"`) — no change needed if already correct
- [x] Update `cmd/doctor.go` Long help string — remove Hugo from the tool list
- [x] Remove Phase 11 (Hugo) from `governance/workflows/infra/development-environment-setup.md`
- [x] Remove Hugo row from Tool Inventory table in the workflow doc (row 8)
- [x] Renumber subsequent tool rows in the inventory table
- [x] Update minimal scope table in workflow doc if Hugo was listed
- [x] Update the workflow doc's YAML frontmatter `inputs` description if it references "19 tools"
      (currently says "full: all 19 tools for all projects")
- [x] Update `governance/development/workflow/native-first-toolchain.md` opening paragraph
      "19 toolchains" → "18 toolchains" (or remove hardcoded count)
- [x] Run `nx run rhino-cli:test:quick` — verify all tests pass
- [x] Run `npm run doctor` — verify 18/18 tools OK, no Hugo in output
- [x] Commit: `refactor(rhino-cli): remove legacy Hugo check from doctor`

### Phase 7: Fix Postinstall Caching

**Goal**: Remove unnecessary `--skip-nx-cache` from doctor npm script.

- [x] Edit `package.json`: change `"doctor"` script from
      `"nx run rhino-cli:build --skip-nx-cache && ..."` to `"nx run rhino-cli:build && ..."`
- [x] Run `npm install` twice — verify second run uses Nx cache for rhino-cli build
- [x] Commit: `fix(infra): allow Nx cache for rhino-cli build in doctor script`

### Phase 5: Add Brewfile

**Goal**: Create declarative Homebrew dependency manifest.

- [x] Create `Brewfile` at repository root with Homebrew-installable tools: `brew` formulas
      (go, jq, dotnet, pyenv, asdf, clojure/tools/clojure) and `cask` (flutter)
- [x] Add `Brewfile.lock.json` to `.gitignore`
- [x] Verify `brew info dotnet` to confirm correct formula name (may be `dotnet@10`)
- [x] Verify `brew bundle check` passes on current machine
- [x] Update `governance/workflows/infra/development-environment-setup.md` Phase 1 to mention
      `brew bundle` as alternative to individual installs
- [x] Commit: `feat(infra): add Brewfile for declarative Homebrew dependencies`

### Phase 3: `rhino-cli env init`

**Goal**: Add command to bootstrap `.env` files from `.env.example` templates.

- [x] Create `apps/rhino-cli/cmd/env_init.go` with `env init` subcommand
- [x] Implement `.env.example` discovery: walk `infra/dev/` for `.env.example` files
- [x] Implement copy logic: `.env.example` → `.env` in the same directory
- [x] Add `--force` flag for overwriting existing `.env` files
- [x] Print summary: created count, skipped count
- [x] Write unit tests in `apps/rhino-cli/cmd/env_init_test.go` — mock filesystem
- [x] Create `specs/apps/rhino/cli/gherkin/env-init.feature` with `@env-init` tag and Gherkin
      scenarios (bootstrap from examples, skip existing, force overwrite, empty infra/dev)
- [x] Run `nx run rhino-cli:test:quick` — verify tests pass
- [x] Test manually: remove one `.env` file, run `env init`, verify it's created
- [x] Test manually: run `env init` again, verify existing file is skipped
- [x] Test manually: run `env init --force`, verify file is overwritten
- [x] Update Phase 12.3 in `governance/workflows/infra/development-environment-setup.md` to
      mention `env init` as fallback when no backup exists
- [x] Commit: `feat(rhino-cli): add env init command to bootstrap .env from .env.example`

### Phase 4: Add Playwright to Doctor

**Goal**: Add Playwright browser check to doctor output.

- [x] Add `playwright` `toolDef` entry to `buildToolDefs()` in `tools.go`
  - binary: `npx`, args: `["playwright", "--version"]`
  - parseVer: custom `parsePlaywrightVersion` (output is `"Version 1.58.2"`, not bare version)
- [x] Implement `checkPlaywrightBrowsers()` function in `checker.go` — check for chromium
      directory in platform-specific cache (macOS: `~/Library/Caches/ms-playwright/`,
      Linux: `~/.cache/ms-playwright/`)
- [x] Implement custom compare function `comparePlaywright()` that returns `StatusWarning`
      with note `"browsers not installed — run: npx playwright install"` when CLI works but
      browsers are missing
- [x] Add Playwright test cases to `checker_test.go` — mock both CLI and browser cache
- [x] Update `reporter_test.go`: add Playwright `ToolCheck` entry to `allOKChecks` slice,
      add "playwright" to the name list in `TestFormatMarkdown`, update tool count
- [x] Update `cmd/doctor_test.go`: add "playwright" to `makeAllOKChecks()` name list,
      update hardcoded count in `theJSONListsEveryCheckedToolWithItsStatus()`
- [x] Add Playwright row to Tool Inventory table in workflow doc
- [x] Update Phase 13 in workflow doc to note that doctor now checks for Playwright
- [x] Run `nx run rhino-cli:test:quick` — verify tests pass
- [x] Run `npm run doctor` — verify playwright appears in output with correct status
- [x] Commit: `feat(rhino-cli): add Playwright browser check to doctor`

### Phase 8: Pin Rust and Flutter Versions

**Goal**: Add version requirements for Rust and Flutter.

- [x] Add `rust-version = "1.80"` (MSRV) to `apps/a-demo-be-rust-axum/Cargo.toml` `[package]`
      section (currently has `edition = "2021"` but no MSRV)
- [x] Implement `readRustVersion()` function in `checker.go` — read `rust-version` from
      `Cargo.toml`
- [x] Add `cargoTomlPath` variable to `buildToolDefs()` in `tools.go`
      (`filepath.Join(repoRoot, "apps", "a-demo-be-rust-axum", "Cargo.toml")`)
- [x] Update Rust `toolDef` in `tools.go`: change `readReq` to use `readRustVersion(cargoTomlPath)`,
      change `compare` from `compareExact` to `compareGTE`
- [x] Add `flutter: ">=3.41.0"` to `apps/a-demo-fe-dart-flutterweb/pubspec.yaml`
      `environment:` section (currently has only `sdk: ^3.11.1`, no flutter constraint)
- [x] Implement `readFlutterVersion()` function in `checker.go` — read `environment.flutter`
      from `pubspec.yaml`
- [x] Update Flutter `toolDef` in `tools.go`: change `readReq` to use `readFlutterVersion()`,
      change `compare` from `compareExact` to `compareGTE`
- [x] Add test cases for `readRustVersion()` and `readFlutterVersion()` in `checker_test.go`
- [x] Run `nx run rhino-cli:test:quick` — verify tests pass
- [x] Run `npm run doctor` — verify rust and flutter show `required: >=X.Y` instead of
      `(no version requirement)`
- [x] Commit: `feat(rhino-cli): pin Rust and Flutter version requirements in doctor`

### Phase 6: `doctor --scope minimal`

**Goal**: Add scope filtering to doctor.

- [x] Define `Scope` type and `minimalTools` set in `checker.go`
- [x] Add `Scope` field to `CheckOptions` struct
- [x] Filter `buildToolDefs()` output based on scope before running checks
- [x] Add `--scope` flag to `doctor` cobra command in `cmd/doctor.go`
- [x] Update reporter to include scope in summary line when scope is not `full`
- [x] Add unit test cases: verify minimal scope checks only 7 tools
- [x] Add unit test cases: verify full scope checks all tools (default behavior unchanged)
- [x] Add Gherkin scenarios to `specs/apps/rhino/cli/gherkin/doctor.feature` for scope
      (minimal scope checks subset, full scope is default)
- [x] Add new step constants to `apps/rhino-cli/cmd/steps_common_test.go` for scope scenarios
- [x] Register new step implementations in `apps/rhino-cli/cmd/doctor_test.go`
      `InitializeScenario` function
- [x] Run `nx run rhino-cli:test:quick` — verify tests pass
- [x] Run `npm run doctor -- --scope minimal` — verify only 7 tools checked
- [x] Run `npm run doctor` — verify all tools checked (backward compatible)
- [x] Update `governance/workflows/infra/development-environment-setup.md` minimal scope
      section to reference `doctor --scope minimal`
- [x] Commit: `feat(rhino-cli): add --scope flag to doctor for minimal tool checks`

### Phase 1: `doctor --fix` (auto-install)

**Goal**: Add auto-install capability to doctor. Done last because it depends on the final tool
list.

- [x] Create `apps/rhino-cli/internal/doctor/fixer.go` with `installStep` type and fix logic
- [x] Add `installCmd` field to `toolDef` struct in `tools.go` (takes `platform string` param)
- [x] Add platform detection: `runtime.GOOS` → `"darwin"` (macOS) or `"linux"` (Ubuntu)
- [x] Implement install commands for each tool with platform branching (see tech-docs.md table)
  - [x] git: `xcode-select --install`
  - [x] volta: `curl https://get.volta.sh | bash`
  - [x] node: `volta install node@{required}`
  - [x] npm: `volta install npm@{required}`
  - [x] java: `sdk install java {required}-tem`
  - [x] maven: `sdk install maven`
  - [x] golang: `brew install go`
  - [x] python: `brew install pyenv && pyenv install {required} && pyenv global {required}`
  - [x] rust: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y`
        (must use `-y` for non-interactive install — bare `rustup-init` prompts interactively)
  - [x] cargo-llvm-cov: `cargo install cargo-llvm-cov`
  - [x] elixir: `asdf plugin add elixir && asdf install elixir {required}`
  - [x] erlang: `asdf plugin add erlang && asdf install erlang {required}`
  - [x] dotnet: `brew install dotnet`
  - [x] clojure: `brew install clojure/tools/clojure`
  - [x] dart/flutter: `brew install --cask flutter`
  - [x] docker: print manual install URL
  - [x] jq: `brew install jq`
  - [x] playwright: `npx playwright install` (macOS) / `npx playwright install && npx playwright install-deps` (Linux)
- [x] Implement Linux-specific install commands for each tool:
- [x] Linux — git: `sudo apt-get install -y git`
- [x] Linux — golang: download tarball from go.dev (apt `golang-go` is too old)
- [x] Linux — jq: `sudo apt-get install -y jq`
- [x] Linux — docker: `sudo apt-get install -y docker.io docker-compose-v2`
- [x] Linux — dotnet: `sudo snap install dotnet-sdk --classic --channel=10.0`
- [x] Linux — flutter: `sudo snap install flutter --classic`
- [x] Linux — clojure: `curl -L -O https://github.com/clojure/brew-install/releases/latest/download/linux-install.sh && chmod +x linux-install.sh && sudo ./linux-install.sh`
- [x] Linux — pyenv: install build deps + `curl https://pyenv.run | bash`
- [x] Linux — erlang (asdf): install build deps (`build-essential autoconf libncurses-dev
libssl-dev ...`) before `asdf install erlang`
- [x] Linux — playwright: `npx playwright install && npx playwright install-deps`
- [x] Add `--fix` flag to `doctor` cobra command in `cmd/doctor.go`
- [x] Add `--dry-run` flag to `doctor` cobra command (only effective with `--fix`)
- [x] Implement dry-run mode: print "Would install: {tool} via {command}" without executing
- [x] Implement fix loop: iterate missing tools, execute install commands, re-check after install
- [x] After installing Volta/SDKMAN/rustup, source the relevant shell init script so subsequent
      installs (node via volta, java via sdk, cargo-llvm-cov via cargo) can find the binary
- [x] Print progress: `Installing golang via brew install go...`
- [x] Print summary: `Fixed: 3, Failed: 1, Already OK: 15`
- [x] Return exit code 1 if any tools remain missing after fix
- [x] Create `apps/rhino-cli/internal/doctor/fixer_test.go` with mock tests
  - [x] Test: all tools OK → no install commands run
  - [x] Test: one tool missing → correct install command generated
  - [x] Test: install fails → error logged, continues to next tool
  - [x] Test: dependency ordering (volta before node)
- [x] Add Gherkin scenarios to `specs/apps/rhino/cli/gherkin/doctor.feature` for fix
      (fix missing tool, skip already-installed, fix failure handling, dry-run preview)
- [x] Add new step constants to `apps/rhino-cli/cmd/steps_common_test.go` for fix/dry-run
      scenarios (follows existing pattern: `stepDeveloperRunsDoctorCommand` etc.)
- [x] Register new step implementations in `apps/rhino-cli/cmd/doctor_test.go`
      `InitializeScenario` function (godog loads all `.feature` files — unregistered steps fail)
- [x] Run `nx run rhino-cli:test:quick` — verify all tests pass
- [x] Test manually: run `doctor --fix` with all tools installed — verify "nothing to fix"
- [x] Test manually: run `doctor --fix --dry-run` — verify it prints what would be installed
      without executing any commands
- [x] Update `governance/workflows/infra/development-environment-setup.md` to add `doctor --fix`
      as the recommended setup path
- [x] Update `docs/how-to/hoto__setup-development-environment.md` to mention `doctor --fix`
- [ ] Commit: `feat(rhino-cli): add doctor --fix for auto-installing missing tools`

## Post-Delivery

### Documentation updates (single commit after all phases)

- [ ] Update CLAUDE.md "Common Development Commands" section to add `npm run doctor -- --fix`
      and `npm run doctor -- --scope minimal`
- [ ] Update CLAUDE.md tool count if it mentions "19 tools"
- [ ] Update this plan's own `README.md` "checks 19 tools" in Current State section
- [ ] Verify `governance/workflows/infra/development-environment-setup.md` is consistent with
      all changes — specifically:
  - [ ] Quick Start section exists referencing `doctor --fix` and `doctor --fix --dry-run`
  - [ ] Phase 11 (Hugo) removed, tool inventory renumbered
  - [ ] Phase 1 mentions `brew bundle` as alternative
  - [ ] Phase 12.3 mentions `env init` as fallback for fresh setups
  - [ ] Phase 13 notes that doctor now checks Playwright browsers
  - [ ] Minimal scope table references `doctor --scope minimal`
  - [ ] YAML frontmatter `inputs` description updated (no "19 tools")
  - [ ] Notes section mentions git worktree compatibility
  - [ ] Ubuntu/Linux install commands are accurate (go.dev tarball for Go, snap for
        dotnet/flutter, linux-install.sh for Clojure)
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
